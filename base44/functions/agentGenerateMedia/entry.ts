// ============================================================================
// agentGenerateMedia · Generación de imagen/video IA desde las FOTOS REALES
// de los productos PEYU, con efectos pedidos por el founder (Agent OS).
// ----------------------------------------------------------------------------
// payload: {
//   tipo: 'imagen' | 'video',
//   sku?: string,            // o
//   producto?: string,       // nombre (búsqueda parcial)
//   efecto?: string,         // estilo/efecto libre pedido por el founder
//   formato?: 'cuadrado' | 'historia' | 'horizontal',
//   duracion?: 4 | 6 | 8,    // solo video
//   red_social?: string,     // default Instagram
// }
// El resultado se guarda como ContentPost Borrador en Social Studio.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: solo founders/admin' }, { status: 403 });

    const {
      tipo = 'imagen',
      sku,
      producto: nombreQuery,
      efecto = '',
      formato = 'cuadrado',
      duracion = 6,
      red_social = 'Instagram',
    } = await req.json();

    const svc = base44.asServiceRole;

    // 1 · Resolver el producto (por SKU exacto o nombre parcial)
    let prod = null;
    if (sku) prod = (await svc.entities.Producto.filter({ sku }))[0] || null;
    if (!prod && nombreQuery) {
      const all = await svc.entities.Producto.filter({ activo: true }, '-updated_date', 300);
      const q = String(nombreQuery).toLowerCase();
      prod = all.find((p) => p.nombre?.toLowerCase().includes(q)) || null;
    }
    if (!prod) throw new Error('Producto no encontrado. Indica el SKU o el nombre exacto.');

    // 2 · Fotos REALES del producto (fuente de verdad visual)
    const fotos = [prod.imagen_url, ...(Array.isArray(prod.galeria_urls) ? prod.galeria_urls : [])]
      .filter((u) => typeof u === 'string' && u.startsWith('http'))
      .slice(0, 4);
    if (!fotos.length) throw new Error(`${prod.nombre} no tiene fotos reales cargadas en el catálogo.`);

    const estiloDefault = tipo === 'video'
      ? 'Slow cinematic camera orbit, soft natural light, warm sustainable aesthetic, shallow depth of field'
      : 'Estilo editorial cálido, luz natural suave, fondo minimalista en tonos tierra/crema, sombras suaves';

    let url;
    let tipo_post;

    if (tipo === 'video') {
      // 2a · Visión IA describe el producto real para que el video sea fiel a la foto
      const descripcion = await svc.integrations.Core.InvokeLLM({
        prompt: 'Describe in English, with maximum visual detail (exact shape, colors, marbled recycled-plastic texture, material, proportions), the product shown in the photos, so the description can be used as a video-generation prompt that reproduces it EXACTLY. The product must never be redesigned or replaced. Output ONLY the description.',
        file_urls: fotos.slice(0, 2),
      });
      const res = await svc.integrations.Core.GenerateVideo({
        prompt: `Cinematic social media product video. Product (must look EXACTLY like this): ${descripcion}. Visual effect/style requested: ${efecto || estiloDefault}. Premium eco-brand vibe (PEYU Chile, products made from 100% recycled plastic bottle caps), earthy warm tones, no text overlays, no logos.`,
        aspect_ratio: formato === 'horizontal' ? '16:9' : '9:16',
        duration: [4, 6, 8].includes(Number(duracion)) ? Number(duracion) : 6,
      });
      url = res.url;
      tipo_post = 'Reel';
    } else {
      // 2b · Imagen IA usando las fotos reales como referencia exacta
      const res = await svc.integrations.Core.GenerateImage({
        prompt: `Foto publicitaria profesional para ${red_social} del producto EXACTO de las imágenes de referencia: "${prod.nombre}".

═══ REGLA SAGRADA (NO NEGOCIABLE) ═══
El producto de las fotos de referencia es el héroe y debe aparecer IDÉNTICO:
• Misma forma, silueta, proporciones, colores y la textura marmolada característica del plástico reciclado PEYU.
• PROHIBIDO inventar, rediseñar, recolorear, deformar o sustituir el producto por otro distinto.
• Solo se REMEZCLA la ESCENA alrededor (fondo, luz, ambiente, props naturales) — nunca el producto.
Trátalo como fotografía de producto de alta gama: el producto es sagrado.

═══ ESCENA / EFECTO ═══
${efecto || estiloDefault}

═══ MARCA ═══
PEYU Chile, productos sustentables hechos con plástico 100% reciclado de tapitas. Paleta cálida tierra/verde esmeralda/crema. SIN textos, SIN logos, SIN marcas de agua sobre la imagen.

═══ COMPOSICIÓN ═══
Formato ${formato === 'historia' ? 'vertical 9:16 (story/reel)' : formato === 'horizontal' ? 'horizontal 16:9 (banner LinkedIn)' : 'cuadrado 1:1 (feed)'}, luz natural suave, calidad fotorrealista 4K, estética de campaña premium.`,
        existing_image_urls: fotos,
      });
      url = res.url;
      tipo_post = 'Post Imagen';
    }

    // 3 · Guardar en la GALERÍA de Social Studio (ContentAsset)
    await svc.entities.ContentAsset.create({
      nombre: `${tipo === 'video' ? 'Video' : 'Imagen'} IA · ${prod.nombre}`,
      tipo: tipo === 'video' ? 'Video' : 'Imagen',
      url,
      formato: formato === 'historia' ? 'Story 9:16' : formato === 'horizontal' ? 'Horizontal 16:9' : 'Cuadrado 1:1',
      generado_por_ia: true,
      prompt_ia: efecto || estiloDefault,
      categoria: 'Producto',
      producto_sku: prod.sku,
      notas: 'Generado por el agente desde las fotos reales del producto',
    });

    // 4 · Guardar como borrador en el calendario de Social Studio
    const post = await svc.entities.ContentPost.create({
      titulo: `${tipo === 'video' ? 'Video' : 'Imagen'} IA · ${prod.nombre}`,
      red_social,
      tipo_post,
      estado: 'Borrador',
      imagen_url: url,
      producto_relacionado_sku: prod.sku,
      pillar_contenido: 'Producto',
      generado_por_ia: true,
      agente_creador: 'AgentOS',
      notas: efecto ? `Efecto pedido por founder: ${efecto}` : 'Generado desde Agent OS con las fotos reales del producto',
    });

    return Response.json({
      ok: true,
      url,
      tipo,
      producto: prod.nombre,
      post_id: post.id,
      message: `${tipo === 'video' ? 'Video' : 'Imagen'} de "${prod.nombre}" generado ✓ — guardado como Borrador en Social Studio`,
    });
  } catch (error) {
    console.error('agentGenerateMedia error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});