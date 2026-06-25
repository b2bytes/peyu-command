import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsLibraryVideos · TRAE los VIDEOS de la cuenta al chat. Lista los videos
// ya subidos al ad account (con su miniatura para previsualizar y su video_id
// para reutilizarlos directo en anuncios de video) y/o los videos usados en los
// anuncios de una campaña.
//
// Es el equivalente de metaAdsLibraryImages pero para video: permite al agente
// mostrarle al founder en el chat los videos disponibles (con thumbnail), que
// elija uno, y crear el anuncio con su video_id sin que el founder salga de Ads.
//
// Payload:
//   {}                       → últimos videos de la biblioteca de la cuenta
//   { campaign_id: '123' }   → videos de los anuncios de esa campaña
//   { limit?: 30 }
//
// Devuelve: { videos: [{ video_id, title, thumbnail_url, status, length, created_time, ad_name? }] }
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const msg = err?.message || 'Error desconocido de Meta.';
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado.', detail: msg };
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El System User no tiene permiso ads_read sobre la cuenta.', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const accountId = fmtAccountId(Deno.env.get('META_AD_ACCOUNT_ID'));
    if (!token || !accountId) return Response.json({ ok: false, error: 'Faltan credenciales de Meta.' });

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || 30, 100);
    const t = encodeURIComponent(token);
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;

    let videos = [];

    if (body.campaign_id) {
      // Videos usados en los anuncios de una campaña.
      const fields = 'name,creative{object_story_spec,video_id,thumbnail_url}';
      const res = await fetch(`${base}/${body.campaign_id}/ads?fields=${fields}&limit=${limit}&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      for (const ad of data.data || []) {
        const vd = ad.creative?.object_story_spec?.video_data || {};
        const videoId = vd.video_id || ad.creative?.video_id;
        if (videoId) {
          videos.push({ video_id: videoId, title: '', thumbnail_url: ad.creative?.thumbnail_url || null, ad_name: ad.name });
        }
      }
    } else {
      // Biblioteca de videos de la cuenta.
      const res = await fetch(`${base}/${accountId}/advideos?fields=id,title,picture,status,length,created_time&limit=${limit}&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      videos = (data.data || []).map((v) => ({
        video_id: v.id,
        title: v.title || '',
        thumbnail_url: v.picture || null,
        status: v.status?.video_status || 'unknown',
        length: v.length || null,
        created_time: v.created_time || null,
      }));
    }

    return Response.json({
      ok: true,
      count: videos.length,
      videos,
      nota: 'Cada video trae su thumbnail_url (para mostrarlo en el chat con markdown) y su video_id (para crear un anuncio de video con metaAdsCreateAd/metaAdsCreateMultiAd). Recuerda pasar una miniatura: thumbnail_hash de una foto del producto.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});