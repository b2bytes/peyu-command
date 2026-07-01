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
          const up = await base44.integrations.Core.UploadFile({ file });
          if (up?.file_url) logoUrl = up.file_url;
        }
      } catch (_) { /* seguimos con la URL original */ }
    }

    const r = await base44.asServiceRole.functions.invoke('generateMockup', {
      productName: producto.nombre,
      productCategory: producto.categoria,
      productImageUrl,
      logoUrl,
      text: texto || '',
      color: color || '',
      sku,
    });
    const d = r?.data ?? r;
    if (!d?.mockup_url) {
      return Response.json({ error: d?.error || 'No se pudo generar el mockup. Intenta de nuevo o escala al equipo.' }, { status: 500 });
    }

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