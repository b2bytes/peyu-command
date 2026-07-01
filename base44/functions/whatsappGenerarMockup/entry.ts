// ============================================================================
// whatsappGenerarMockup — Prototipo de grabado láser desde WhatsApp.
// ----------------------------------------------------------------------------
// El cliente envía su foto/logo por WhatsApp; el agente llama esta función con
// la URL del archivo y el SKU. Genera el mockup real (motor generateMockup, el
// mismo del personalizador web) y devuelve la URL para enviarla al cliente.
// Si se pasa numero_pedido, adjunta el arte + mockup al PedidoWeb (producción
// lo recibe automáticamente, sin emails).
// Payload: { sku, imagen_url?, texto?, color?, numero_pedido? }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { sku, imagen_url, texto, color, numero_pedido } = await req.json();

    if (!sku) return Response.json({ error: 'Falta sku del producto' }, { status: 400 });
    if (!imagen_url && !texto) {
      return Response.json({ error: 'Falta imagen_url (la foto que envió el cliente por WhatsApp) o texto a grabar' }, { status: 400 });
    }

    const productos = await base44.asServiceRole.entities.Producto.filter({ sku });
    const producto = productos?.[0];
    if (!producto) return Response.json({ error: `SKU "${sku}" no encontrado en el catálogo` }, { status: 404 });

    // Foto base: preferir la variante del color elegido.
    let productImageUrl = producto.imagen_base_limpia_url || producto.imagen_url;
    if (color && producto.imagenes_por_color && producto.imagenes_por_color[color]) {
      productImageUrl = producto.imagenes_por_color[color];
    }

    // Re-hospedar la imagen del cliente con extensión conocida: las URLs de
    // adjuntos de WhatsApp a veces no terminan en .jpg/.png y el motor de
    // mockups las descartaría.
    let logoUrl = imagen_url || null;
    if (logoUrl && !/\.(png|jpe?g|webp|svg)(\?|$)/i.test(logoUrl)) {
      try {
        const res = await fetch(logoUrl);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const ct = res.headers.get('content-type') || 'image/jpeg';
          const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg';
          const file = new File([buf], `cliente-arte.${ext}`, { type: ct });
          const up = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          if (up?.file_url) logoUrl = up.file_url;
        }
      } catch (_) { /* seguimos con la URL original */ }
    }

    // Generación directa (mismo estilo de prompt que el motor generateMockup;
    // el invoke entre funciones falla con 403 para callers anónimos de WhatsApp).
    const c = String(color || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const esOscuro = /(negr|azul|marin|oscur|caf|marron|violeta|morado)/.test(c);
    const laserTone = ` 🔦 CRITICAL LASER RULE — ALWAYS GREYSCALE: The engraving MUST be a single monochrome GREY tone. NEVER reproduce the customer's art in color — convert it to ONE grey tone. Real UV laser engraving on recycled plastic is always monochrome. NO color fills, NO gradients.` +
      (esOscuro
        ? ` The product color is DARK ("${color}"), so the engraving must be a LIGHT smoky-grey / off-white tone (#e8e8e8) clearly visible against the dark surface.`
        : ` The product surface is light/neutral, so the engraving must be a DARK charcoal-grey tone (#2a2a2a) clearly visible against it.`);

    const base = `⚠️ ABSOLUTE CRITICAL RULE: The FIRST reference image IS the exact product the customer chose from our e-commerce. You MUST use it as the base. DO NOT change the product shape, color, material, angle, lighting, background, or framing. Product: "${producto.nombre}" (${producto.categoria || ''}) — Peyu Chile, made from 100% recycled plastic. `;
    const prompt = logoUrl
      ? base + `⚠️ SECOND CRITICAL RULE: The SECOND reference image IS the customer's EXACT art/photo. Reproduce it LITERALLY — same shapes, letters, proportions. DO NOT redesign or substitute. Treat it as a stencil to be burned. TASK: Add a UV laser engraving that is a faithful 1:1 reproduction of the SECOND reference image onto the primary flat visible surface of the product. It MUST look PHYSICALLY ENGRAVED into the recycled plastic: monochrome single tone, micro depth, subtle darkening, follows curvature and marbled texture. NO floating stickers, NO flat overlay, NO glow. Keep it proportional (~30-40% of the visible flat surface), centered.` + laserTone + ` Final output: photorealistic, identical background/framing/angle/lighting to the first reference.`
      : base + `⚠️ The customer's text is "${texto}". Engrave it LITERALLY, character-by-character. TASK: UV laser engraving of "${texto}" onto the product surface. Clean sans-serif, micro depth, subtle darkening inside strokes, follows curvature, blends with the marbled recycled plastic. NO stickers, NO glow. Centered on the engraving zone.` + laserTone + ` Final output: photorealistic, identical to the first reference image with the engraving added physically.`;

    const refs = [productImageUrl];
    if (logoUrl) refs.push(logoUrl);
    let gen = null;
    for (let i = 0; i < 2 && !gen?.url; i++) {
      gen = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt, existing_image_urls: refs }).catch((e) => {
        console.error(`GenerateImage intento ${i + 1} falló:`, e?.message || e);
        return null;
      });
    }
    if (!gen?.url) {
      return Response.json({ error: 'No se pudo generar el mockup. Intenta de nuevo o escala al equipo.' }, { status: 500 });
    }
    const d = { mockup_url: gen.url };

    // Adjuntar el arte al pedido si ya existe (fuente de verdad para producción).
    if (numero_pedido) {
      const pedidos = await base44.asServiceRole.entities.PedidoWeb.filter({ numero_pedido });
      const pedido = pedidos?.[0];
      if (pedido) {
        const itemsDet = Array.isArray(pedido.items_detalle)
          ? pedido.items_detalle.map((it) => it.sku === sku
              ? { ...it, logo_url: logoUrl || it.logo_url || '', mockup_url: d.mockup_url, tipo_personalizacion: logoUrl ? 'archivo' : (it.tipo_personalizacion || 'frase') }
              : it)
          : pedido.items_detalle;
        await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
          logo_url: logoUrl || pedido.logo_url || '',
          mockup_url: d.mockup_url,
          logo_recibido: !!logoUrl,
          requiere_personalizacion: true,
          items_detalle: itemsDet,
        }).catch(() => {});
      }
    }

    return Response.json({
      ok: true,
      mockup_url: d.mockup_url,
      logo_url: logoUrl || null,
      adjuntado_a_pedido: !!numero_pedido,
      mensaje_whatsapp: `¡Aquí está el prototipo de tu *${producto.nombre}*${color ? ` (${color})` : ''} con tu diseño grabado! 🎨\n${d.mockup_url}\n\nEs una referencia visual — el equipo revisa tu archivo antes de producir para que el grabado quede perfecto ✅`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});