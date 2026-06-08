// ============================================================================
// PEYU · publishContentPost
// ----------------------------------------------------------------------------
// "Publica" un ContentPost a redes sociales. Como las APIs nativas
// (Instagram Graph, LinkedIn) requieren OAuth Business + tokens long-lived
// que aún no están provisionados, este endpoint:
//
//   1) Valida que el post esté Aprobado.
//   2) Si hay credenciales configuradas (META_PAGE_ACCESS_TOKEN, META_IG_USER_ID,
//      LINKEDIN_ACCESS_TOKEN, LINKEDIN_ORG_URN) → publica de verdad.
//   3) Si NO hay credenciales → marca como "Publicado" en sistema y entrega
//      los assets listos (imagen + copy + hashtags) para publicación manual,
//      con link directo al composer de cada red.
//
// Body: { post_id, modo?: 'auto' | 'manual' }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function publishToInstagram(post, base44) {
  let token;
  try {
    const conn = await base44.asServiceRole.connectors.getConnection("instagram");
    token = conn.accessToken;
  } catch (e) {
    return { ok: false, reason: 'no_credentials', detail: e.message };
  }
  if (!token) return { ok: false, reason: 'no_credentials' };

  const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${token}`);
  const meData = await meRes.json();
  if (!meData.id) return { ok: false, reason: 'no_user_id', detail: meData };
  const igUser = meData.id;

  // Step 1: crear container
  const fullCaption = [post.copy, post.hashtags].filter(Boolean).join('\n\n');
  const containerRes = await fetch(
    `https://graph.instagram.com/v21.0/${igUser}/media?image_url=${encodeURIComponent(post.imagen_url)}&caption=${encodeURIComponent(fullCaption)}&access_token=${token}`,
    { method: 'POST' }
  );
  const container = await containerRes.json();
  if (!container.id) return { ok: false, reason: 'container_failed', detail: container };

  // Step 2: publicar
  const publishRes = await fetch(
    `https://graph.instagram.com/v21.0/${igUser}/media_publish?creation_id=${container.id}&access_token=${token}`,
    { method: 'POST' }
  );
  const published = await publishRes.json();
  if (!published.id) return { ok: false, reason: 'publish_failed', detail: published };

  return {
    ok: true,
    external_id: published.id,
    link: `https://instagram.com/p/${published.id}`,
  };
}

async function publishToLinkedIn(post) {
  const token = Deno.env.get('LINKEDIN_ACCESS_TOKEN');
  const orgUrn = Deno.env.get('LINKEDIN_ORG_URN'); // ej: urn:li:organization:123456
  if (!token || !orgUrn) return { ok: false, reason: 'no_credentials' };

  const body = {
    author: orgUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: [post.copy, post.hashtags].filter(Boolean).join('\n\n') },
        shareMediaCategory: post.imagen_url ? 'IMAGE' : 'NONE',
        ...(post.imagen_url
          ? {
              media: [
                {
                  status: 'READY',
                  description: { text: post.titulo || '' },
                  originalUrl: post.imagen_url,
                  title: { text: post.titulo || '' },
                },
              ],
            }
          : {}),
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.id) return { ok: false, reason: 'linkedin_failed', detail: data };
  return {
    ok: true,
    external_id: data.id,
    link: `https://www.linkedin.com/feed/update/${encodeURIComponent(data.id)}`,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { post_id, modo = 'auto' } = await req.json();
    if (!post_id) return Response.json({ error: 'post_id requerido' }, { status: 400 });

    const post = await base44.asServiceRole.entities.ContentPost.get(post_id);
    if (!post) return Response.json({ error: 'Post no encontrado' }, { status: 404 });
    if (post.estado !== 'Aprobado' && post.estado !== 'Programado') {
      return Response.json({ error: `Post debe estar Aprobado/Programado. Estado actual: ${post.estado}` }, { status: 400 });
    }

    let publishResult = { ok: false, reason: 'manual_mode' };
    if (modo === 'auto') {
      if (post.red_social === 'Instagram') publishResult = await publishToInstagram(post, base44);
      else if (post.red_social === 'LinkedIn') publishResult = await publishToLinkedIn(post);
      else publishResult = { ok: false, reason: 'red_no_soportada' };
    }

    // Si fue exitoso → marcar publicado real
    if (publishResult.ok) {
      await base44.asServiceRole.entities.ContentPost.update(post_id, {
        estado: 'Publicado',
        link_publicado: publishResult.link || '',
        post_id_externo: publishResult.external_id || '',
      });
      return Response.json({
        ok: true,
        modo: 'auto',
        post_id,
        external_id: publishResult.external_id,
        link: publishResult.link,
      });
    }

    // Fallback manual: marcamos publicado en sistema y devolvemos asset listos
    if (modo === 'manual' || publishResult.reason === 'no_credentials') {
      const fullCaption = [post.copy, post.hashtags].filter(Boolean).join('\n\n');
      // Composer links útiles para post manual
      const composerLinks = {
        Instagram: 'https://www.instagram.com/',
        LinkedIn: 'https://www.linkedin.com/feed/?shareActive=true',
        Facebook: 'https://www.facebook.com/',
        TikTok: 'https://www.tiktok.com/upload',
      };
      await base44.asServiceRole.entities.ContentPost.update(post_id, {
        estado: 'Publicado',
        link_publicado: composerLinks[post.red_social] || '',
        notas: `${post.notas || ''}\n[Publicación manual ${new Date().toISOString().slice(0, 10)}]`.trim(),
      });
      return Response.json({
        ok: true,
        modo: 'manual',
        reason: publishResult.reason,
        message: 'Marcado como publicado. Copia los assets y postea desde el composer nativo.',
        assets: {
          imagen_url: post.imagen_url,
          caption_completo: fullCaption,
          composer_url: composerLinks[post.red_social] || '',
        },
      });
    }

    // Error real: no se pudo auto-publicar ni modo manual
    return Response.json({ ok: false, error: publishResult.reason, detail: publishResult }, { status: 400 });
  } catch (error) {
    console.error('publishContentPost error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});