// ============================================================================
// PEYU · instagramStatus
// ----------------------------------------------------------------------------
// Verifica conexión Instagram Business, trae perfil y stats de ContentPost.
// Usa Instagram Graph API (graph.instagram.com) con access_token como query param.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('instagram');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ connected: false, error: 'Instagram no conectado: ' + e.message });
    }
    if (!accessToken) return Response.json({ connected: false, error: 'Token vacío' });

    // Fetch profile info
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
    );
    const meData = await meRes.json();
    if (meData.error) {
      return Response.json({ connected: false, error: meData.error.message || 'Error API Instagram' });
    }

    const profile = {
      id: meData.id,
      username: meData.username || '',
      name: meData.name || meData.username || 'PEYU Chile',
      profile_picture_url: meData.profile_picture_url || null,
      followers_count: meData.followers_count || 0,
      media_count: meData.media_count || 0,
    };

    // Fetch recent media (últimos 6) para preview
    let recentMedia = [];
    try {
      const mediaRes = await fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink&limit=6&access_token=${accessToken}`
      );
      const mediaData = await mediaRes.json();
      recentMedia = (mediaData.data || []).map(m => ({
        id: m.id,
        type: m.media_type,
        url: m.media_url || m.thumbnail_url,
        permalink: m.permalink,
        caption: (m.caption || '').slice(0, 100),
        timestamp: m.timestamp,
      }));
    } catch (_) { /* no-op */ }

    // Internal ContentPost stats para Instagram
    const posts = await base44.asServiceRole.entities.ContentPost.filter(
      { red_social: 'Instagram' }, '-created_date', 30
    );

    const stats = {
      total: posts.length,
      publicados: posts.filter(p => p.estado === 'Publicado').length,
      pendientes: posts.filter(p => p.estado === 'En revisión' || p.estado === 'Aprobado').length,
      borradores: posts.filter(p => p.estado === 'Borrador').length,
    };

    return Response.json({
      connected: true,
      profile,
      stats,
      recent_media: recentMedia,
      recent_posts: posts.slice(0, 10).map(p => ({
        id: p.id,
        titulo: p.titulo,
        estado: p.estado,
        imagen_url: p.imagen_url,
        fecha_publicacion: p.fecha_publicacion,
        link_publicado: p.link_publicado,
      })),
    });

  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 500 });
  }
});