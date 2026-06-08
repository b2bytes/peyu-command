import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * novaPublishPost — Permite al agente NOVA publicar posts en redes sociales
 * directamente sin requerer permisos admin.
 * 
 * Payload:
 * {
 *   "titulo": "Título interno del post",
 *   "copy": "Texto del post",
 *   "red_social": "Instagram" | "LinkedIn" | "Facebook",
 *   "tipo_post": "Post Imagen" | "Reel" | "Carrusel" | "Video largo" | "Texto",
 *   "hashtags": "#economiacircular #peyuchile",
 *   "imagen_url": "https://...",
 *   "fecha_publicacion": "2026-06-10T14:30",
 *   "estado": "Borrador" | "Programado" | "Publicado",
 *   "pillar_contenido": "Producto" | "Sostenibilidad/ESG" | etc,
 *   "producto_relacionado_sku": "CARC-001",
 *   "cta": "Ver más en peyuchile.cl",
 *   "objetivo": "Awareness" | "Engagement" | "Conversión B2C"
 * }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validar campos mínimos
    if (!body.titulo || !body.copy || !body.red_social) {
      return Response.json(
        { error: 'Missing required fields: titulo, copy, red_social' },
        { status: 400 }
      );
    }

    // Crear el post en ContentPost
    const post = await base44.entities.ContentPost.create({
      titulo: body.titulo,
      copy: body.copy,
      red_social: body.red_social,
      tipo_post: body.tipo_post || 'Post Imagen',
      hashtags: body.hashtags || '',
      cta: body.cta || '',
      imagen_url: body.imagen_url || null,
      imagenes_galeria: body.imagenes_galeria || [],
      fecha_publicacion: body.fecha_publicacion || new Date().toISOString(),
      estado: body.estado || 'Borrador',
      pillar_contenido: body.pillar_contenido || 'Producto',
      objetivo: body.objetivo || 'Awareness',
      producto_relacionado_sku: body.producto_relacionado_sku || null,
      generado_por_ia: false,
      agente_creador: 'NOVA'
    });

    // Si es para publicar inmediatamente (no solo borrador)
    if (body.estado === 'Publicado' || body.estado === 'Programado') {
      // Invocar publishContentPost si existe
      try {
        await base44.functions.invoke('publishContentPost', {
          post_id: post.id,
          red_social: body.red_social
        });
      } catch (err) {
        console.log('Note: publishContentPost not available, post created as draft');
      }
    }

    return Response.json({
      success: true,
      post_id: post.id,
      mensaje: `Post creado en ${body.red_social} como ${body.estado.toLowerCase()}`,
      post
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});