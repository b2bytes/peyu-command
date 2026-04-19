import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Solo admin puede generar posts' }, { status: 403 });
    }

    const body = await req.json();
    const topic = body.topic;
    const categoria = body.categoria || 'Reciclaje y Medio Ambiente';
    const useWebContext = body.useWebContext !== false;
    const images = body.images || [];

    if (!topic) return Response.json({ error: 'Falta topic' }, { status: 400 });

    const prompt = 'Eres el editor del blog de PEYU Chile (empresa chilena que fabrica productos 100% con plastico reciclado: Pack Escritorio, Posavasos, Maceteros, Cachos, Paletas, Lamparas. Tiendas en Providencia y Macul, Santiago. Personalizacion laser UV desde 10 unidades. 6 anos de trayectoria, salio en Emol).\n\nEscribe un articulo de blog sobre: "' + topic + '"\nCategoria: ' + categoria + '\n\nResponde SOLO con JSON con: titulo (max 80 chars), excerpt (max 200 chars), contenido_md (Markdown min 600 palabras con ##, listas, **negritas**, estilo cercano chileno, datos reales, puede usar [[ACTION:cotizar_b2b]] al final), tags (array 3-5), tiempo_lectura_min (numero), seo_description (150 chars).';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: useWebContext,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          excerpt: { type: 'string' },
          contenido_md: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          tiempo_lectura_min: { type: 'number' },
          seo_description: { type: 'string' },
        },
        required: ['titulo', 'excerpt', 'contenido_md'],
      },
    });

    const slug = slugify(response.titulo) + '-' + Date.now().toString(36);
    const imagenPortada = images[0] || 'https://media.base44.com/images/public/69d99b9d61f699701129c103/679dffb7d_clouds.jpg';

    const post = await base44.asServiceRole.entities.BlogPost.create({
      titulo: response.titulo,
      slug: slug,
      excerpt: response.excerpt,
      contenido_md: response.contenido_md,
      categoria: categoria,
      tags: response.tags || [],
      imagen_portada: imagenPortada,
      imagenes_galeria: images,
      autor: 'Equipo PEYU',
      fecha_publicacion: new Date().toISOString().slice(0, 10),
      tiempo_lectura_min: response.tiempo_lectura_min || 5,
      publicado: true,
      generado_por_ia: true,
      seo_description: response.seo_description || response.excerpt,
    });

    return Response.json({ success: true, post: post, slug: slug });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});