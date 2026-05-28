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
      const conn = await base44.asServiceRole.connectors.getConnection('linkedin');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ connected: false, error: 'LinkedIn no conectado: ' + e.message });
    }
    
    if (!accessToken) return Response.json({ connected: false, error: 'Token vacío' });

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
    };

    const aclRes = await fetch(
      'https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=5',
      { headers }
    );
    
    const aclData = await aclRes.json();
    const orgUrns = (aclData.elements || []).map(e => e.organizationalTarget);

    let org = null;
    if (orgUrns.length > 0) {
      const orgId = orgUrns[0].split(':').pop();
      const orgRes = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, { headers });
      const orgData = orgRes.ok ? await orgRes.json() : {};

      org = {
        urn: orgUrns[0],
        id: orgId,
        name: orgData.localizedName || orgData.name?.localized?.es_ES || orgData.name?.localized?.en_US || 'PEYU Chile',
        vanityName: orgData.vanityName || 'peyuchile',
        logoUrl: null,
        followerCount: null,
      };

      try {
        const followRes = await fetch(
          `https://api.linkedin.com/v2/networkSizes/urn%3Ali%3Aorganization%3A${orgId}?edgeType=CompanyFollowedByMember`,
          { headers }
        );
        if (followRes.ok) {
          const followData = await followRes.json();
          org.followerCount = followData.firstDegreeSize || null;
        }
      } catch (_) { }
    }

    const posts = await base44.asServiceRole.entities.ContentPost.filter(
      { red_social: 'LinkedIn' }, '-created_date', 30
    );
    
    const stats = {
      total: posts.length,
      publicados: posts.filter(p => p.estado === 'Publicado').length,
      pendientes: posts.filter(p => p.estado === 'En revisión' || p.estado === 'Aprobado').length,
      borradores: posts.filter(p => p.estado === 'Borrador').length,
    };

    return Response.json({
      connected: true,
      org,
      stats,
      recent_posts: posts.slice(0, 10).map(p => ({
        id: p.id,
        titulo: p.titulo,
        estado: p.estado,
        fecha_publicacion: p.fecha_publicacion,
        link_publicado: p.link_publicado,
      })),
    });

  } catch (error) {
    return Response.json({ connected: false, error: error.message }, { status: 500 });
  }
});