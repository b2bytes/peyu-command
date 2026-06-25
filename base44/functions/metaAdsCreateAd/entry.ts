import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsCreateAd · Crea UN anuncio NUEVO (creativo + ad) dentro de un AD SET
// EXISTENTE. Permite al agente agregar creativos sueltos a un ad set ya creado
// (con metaAdsCreateAdset) — para construir estructuras 1 campaña → N ad sets →
// M anuncios pieza por pieza, o sumar variantes a un ad set ganador.
//
// Payload:
//   {
//     adset_id: '123',                 // ad set destino (obligatorio)
//     name?: 'Variante carrusel',
//     primary_text: string,
//     headline: string,
//     description?: string,
//     cta?: 'SHOP_NOW' | 'LEARN_MORE' | ...,
//     link: string,
//     image_url?: string,              // imagen por URL pública
//     image_hash?: string,             // o por hash (de un anuncio leído con metaAdsReadAds)
//     video_id?: string,               // o un video existente
//     thumbnail_url?: string,          // VIDEO: miniatura por URL pública (Meta la exige)
//     thumbnail_hash?: string,         // VIDEO: o miniatura por image_hash (ej. foto de la carcasa)
//   }
// El anuncio se crea PAUSADO.
//
// IMPORTANTE para VIDEO: Meta EXIGE una miniatura en video_data. Pasa
// thumbnail_hash (reutiliza el image_hash de una foto del producto traída con
// metaAdsLibraryImages) o thumbnail_url. Si no la pasas, intentamos usar la
// miniatura que Meta auto-genera del video una vez procesado.
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const msg = [err?.message, err?.error_user_title, err?.error_user_msg].filter(Boolean).join(' · ') || 'Error desconocido de Meta.';
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado.', detail: msg };
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para crear anuncios o gestionar la Página.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido (revisa link, image_url o adset_id): ' + msg, detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

async function graphPost(path, params, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, access_token: token }),
  });
  return res.json();
}

// Sube una imagen por URL al ad account y devuelve su image_hash. Meta rechaza
// con frecuencia link_data.picture (URL externa) al crear creativos; el hash sí
// es aceptado siempre. Por eso convertimos URL → hash antes de crear.
async function uploadImageByUrl(accountId, url, token) {
  const data = await graphPost(`${accountId}/adimages`, { url }, token);
  if (data.error) return { error: data.error };
  const first = Object.values(data.images || {})[0];
  return { hash: first?.hash };
}

async function graphGet(path, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`);
  return res.json();
}

// Espera a que un video subido termine de procesarse en Meta y devuelve la
// miniatura (picture) que Meta auto-genera. Un video recién subido no tiene
// thumbnail hasta que su status pasa a 'ready'. Sondeamos unos segundos.
async function waitVideoReadyThumb(videoId, token) {
  for (let i = 0; i < 6; i++) {
    const data = await graphGet(`${videoId}?fields=status,picture`, token);
    const status = data?.status?.video_status;
    if (status === 'ready' && data.picture) return { thumbnail_url: data.picture };
    if (status === 'error') return { error: 'El video falló al procesarse en Meta.' };
    await new Promise((r) => setTimeout(r, 3000));
  }
  return {}; // sigue procesando; devolvemos vacío y dejamos que Meta resuelva
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
    const adsetId = body.adset_id;
    if (!adsetId) return Response.json({ ok: false, error: 'Falta adset_id (el ad set donde crear el anuncio).' });
    if (!body.primary_text || !body.headline || !body.link) {
      return Response.json({ ok: false, error: 'El anuncio necesita primary_text, headline y link.' });
    }
    if (!body.image_url && !body.image_hash && !body.video_id) {
      return Response.json({ ok: false, error: 'El anuncio necesita una imagen (image_url/image_hash) o un video_id.' });
    }

    const t = encodeURIComponent(token);
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;

    // Página de Facebook asociada.
    const pagesRes = await fetch(`${base}/me/accounts?fields=id,name&limit=10&access_token=${t}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) return Response.json({ ok: false, ...diagnoseMetaError(pagesData.error) });
    const page = (pagesData.data || [])[0];
    if (!page) return Response.json({ ok: false, reason: 'sin_pagina', error: 'No hay Página de Facebook asignada al System User.' });
    const pageId = page.id;

    const cta = body.cta || 'SHOP_NOW';
    const adName = body.name || `Ad ${new Date().toISOString().slice(0, 10)}`;

    // Si la imagen viene por URL (no hash ni video), la subimos para obtener
    // image_hash: Meta rechaza picture con URLs externas al crear creativos.
    if (!body.image_hash && !body.video_id && body.image_url) {
      const up = await uploadImageByUrl(accountId, body.image_url, token);
      if (up.hash) { body.image_hash = up.hash; body.image_url = null; }
    }

    // Creativo según fuente (imagen url/hash o video).
    let storySpec;
    if (body.video_id) {
      // Meta EXIGE una miniatura en video_data (image_hash o image_url). Resolvemos
      // la fuente: thumbnail_hash directo, thumbnail_url subida a hash, o la
      // miniatura auto-generada por Meta cuando el video termina de procesar.
      let thumbHash = body.thumbnail_hash || null;
      let thumbUrl = null;
      if (!thumbHash && body.thumbnail_url) {
        const up = await uploadImageByUrl(accountId, body.thumbnail_url, token);
        if (up.hash) thumbHash = up.hash;
        else thumbUrl = body.thumbnail_url;
      }
      if (!thumbHash && !thumbUrl) {
        const ready = await waitVideoReadyThumb(body.video_id, token);
        if (ready.error) return Response.json({ ok: false, step: 'video', error: ready.error });
        if (ready.thumbnail_url) thumbUrl = ready.thumbnail_url;
      }
      if (!thumbHash && !thumbUrl) {
        return Response.json({ ok: false, step: 'video_thumbnail', error: 'El anuncio de video necesita una miniatura. Pasa thumbnail_hash (ej. la foto del producto) o thumbnail_url, o reintenta en unos segundos mientras Meta procesa el video.' });
      }
      storySpec = {
        page_id: pageId,
        video_data: {
          video_id: body.video_id,
          message: body.primary_text,
          title: body.headline,
          link_description: body.description || '',
          call_to_action: { type: cta, value: { link: body.link } },
          ...(thumbHash ? { image_hash: thumbHash } : { image_url: thumbUrl }),
        },
      };
    } else {
      const linkData = {
        link: body.link,
        message: body.primary_text,
        name: body.headline,
        description: body.description || '',
        call_to_action: { type: cta, value: { link: body.link } },
      };
      if (body.image_hash) linkData.image_hash = body.image_hash;
      else if (body.image_url) linkData.picture = body.image_url;
      storySpec = { page_id: pageId, link_data: linkData };
    }

    const creative = await graphPost(`${accountId}/adcreatives`, {
      name: `${adName} · Creative`,
      object_story_spec: storySpec,
    }, token);
    if (creative.error) return Response.json({ ok: false, step: 'creative', ...diagnoseMetaError(creative.error) });

    const ad = await graphPost(`${accountId}/ads`, {
      name: adName,
      adset_id: adsetId,
      creative: JSON.stringify({ creative_id: creative.id }),
      status: 'PAUSED',
    }, token);
    if (ad.error) return Response.json({ ok: false, step: 'ad', creative_id: creative.id, ...diagnoseMetaError(ad.error) });

    return Response.json({
      ok: true,
      ad_id: ad.id,
      creative_id: creative.id,
      adset_id: adsetId,
      name: adName,
      status: 'PAUSED',
      message: `Anuncio "${adName}" creado en el ad set ${adsetId}, en PAUSADO.`,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});