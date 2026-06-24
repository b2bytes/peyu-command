import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsLibraryImages · TRAE las fotos al chat. Lista la biblioteca de imágenes
// creativas de la cuenta de anuncios (las fotos ya subidas a Meta) y/o las
// imágenes de los anuncios de una campaña, con su URL para previsualizar y su
// image_hash para reutilizarlas directo en nuevos anuncios o carruseles SIN
// re-subirlas.
//
// Payload:
//   {}                       → últimas imágenes de la biblioteca de la cuenta
//   { campaign_id: '123' }   → imágenes de los anuncios de esa campaña
//   { limit?: 30 }
//
// Devuelve: { images: [{ image_hash, url, name, width, height, ad_name? }] }
// El agente puede mostrarlas en el chat (markdown) y pasar el image_hash a
// metaAdsCreateCarousel / metaAdsCreateAd / metaAdsCreateWhatsAppAd.
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

    let images = [];

    if (body.campaign_id) {
      // Imágenes de los anuncios de una campaña (con el nombre del anuncio).
      const fields = 'name,creative{object_story_spec,image_url,thumbnail_url}';
      const res = await fetch(`${base}/${body.campaign_id}/ads?fields=${fields}&limit=${limit}&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      for (const ad of data.data || []) {
        const oss = ad.creative?.object_story_spec || {};
        const ld = oss.link_data || {};
        const collect = (hash, url) => images.push({ image_hash: hash || null, url: url || null, name: '', ad_name: ad.name });
        if (Array.isArray(ld.child_attachments) && ld.child_attachments.length) {
          ld.child_attachments.forEach((c) => collect(c.image_hash, c.picture));
        } else {
          collect(ld.image_hash, ld.picture || ad.creative?.image_url || ad.creative?.thumbnail_url);
        }
      }
    } else {
      // Biblioteca de imágenes de la cuenta.
      const res = await fetch(`${base}/${accountId}/adimages?fields=hash,url,name,width,height,created_time&limit=${limit}&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      images = (data.data || []).map((img) => ({
        image_hash: img.hash,
        url: img.url,
        name: img.name || '',
        width: img.width || null,
        height: img.height || null,
      }));
    }

    return Response.json({
      ok: true,
      count: images.length,
      images,
      nota: 'Cada imagen trae su url (para mostrarla en el chat) y su image_hash (para reutilizarla directo en metaAdsCreateCarousel/metaAdsCreateAd/metaAdsCreateWhatsAppAd sin re-subir).',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});