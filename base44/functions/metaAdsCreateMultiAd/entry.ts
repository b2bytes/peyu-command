import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsCreateMultiAd · Crea UNA campaña con UN ad set y N ANUNCIOS dentro.
// ----------------------------------------------------------------------------
// Resuelve la limitación que más frustraba al founder: poder lanzar una sola
// campaña que contenga VARIOS anuncios (todos bajo el mismo ad set y objetivo),
// en vez de una campaña separada por cada anuncio.
//
// Sirve además para "duplicar" anuncios existentes en una campaña nueva con
// otro objetivo: lee el contenido con metaAdsReadAds y pásalo aquí como ads[].
//
// Todo nace en PAUSED para que el founder revise antes de activar.
//
// Payload:
// {
//   preset: 'b2c_ventas' | 'b2b_leads',
//   campaign_name?: string,
//   daily_budget_clp: number,          // CBO a nivel campaña (mín ~$1.000)
//   countries?: string[],              // default ['CL']
//   age_min?: number, age_max?: number,
//   ads: [                             // 1..N anuncios bajo el MISMO ad set
//     {
//       name?: string,
//       primary_text: string,
//       headline: string,
//       description?: string,
//       cta?: string,                  // SHOP_NOW | LEARN_MORE | ...
//       link: string,                  // landing del anuncio (puede variar por anuncio)
//       image_url?: string,            // imagen por URL pública
//       image_hash?: string,           // o por hash (de un anuncio leído)
//       video_id?: string,             // o un video existente
//     }, ...
//   ]
// }
//
// Devuelve campaign_id, adset_id y la lista de anuncios creados (con errores
// individuales si alguno falla, sin abortar los demás).
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const ud = err?.error_user_msg || err?.error_data?.blame_field_specs;
  const msg = [err?.message, err?.error_user_title, err?.error_user_msg].filter(Boolean).join(' · ')
    || (ud ? JSON.stringify(ud) : 'Error desconocido de Meta.');
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado. Regenera el token del System User con ads_management.', detail: msg };
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para crear anuncios o gestionar la Página. Asigna la cuenta publicitaria Y la Página al System User con permisos completos.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Un parámetro es inválido (revisa link, image_url o el objetivo).', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando las consultas. Reintenta en unos minutos.', detail: msg };
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
// con frecuencia link_data.picture (URL externa) al crear creativos en lote,
// pero acepta siempre image_hash. Por eso convertimos URL → hash antes de crear.
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

// Sube un video por URL al ad account y devuelve su video_id (para anuncios de video).
async function uploadVideoByUrl(accountId, url, token, title) {
  const data = await graphPost(`${accountId}/advideos`, { file_url: url, ...(title ? { title, name: title } : {}) }, token);
  if (data.error) return { error: data.error };
  return { video_id: data.id };
}

// Espera a que un video procese y devuelve la miniatura auto-generada por Meta.
async function waitVideoReadyThumb(videoId, token) {
  for (let i = 0; i < 6; i++) {
    const data = await graphGet(`${videoId}?fields=status,picture`, token);
    const status = data?.status?.video_status;
    if (status === 'ready' && data.picture) return { thumbnail_url: data.picture };
    if (status === 'error') return { error: 'El video falló al procesarse en Meta.' };
    await new Promise((r) => setTimeout(r, 3000));
  }
  return {};
}

// Pixel de PEYU (activo, disparando Purchase + Lead). Necesario en el
// promoted_object del ad set para optimizar a conversiones reales.
const PEYU_PIXEL_ID = '769018551017679';

// Mismos presets que metaAdsCreateCampaign — ambos optimizan a CONVERSIONES
// reales (no tráfico): OUTCOME_SALES / OUTCOME_LEADS + OFFSITE_CONVERSIONS +
// promoted_object con el pixel. Sin esto, "ventas" salía como tráfico.
const PRESETS = {
  b2c_ventas: {
    objective: 'OUTCOME_SALES',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    billing_event: 'IMPRESSIONS',
    custom_event_type: 'PURCHASE',
    default_cta: 'SHOP_NOW',
    advantage_audience: true,
    name: 'PEYU | B2C - Ventas Ecom',
  },
  b2b_leads: {
    objective: 'OUTCOME_LEADS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    billing_event: 'IMPRESSIONS',
    custom_event_type: 'LEAD',
    default_cta: 'LEARN_MORE',
    advantage_audience: false,
    name: 'PEYU | B2B - Leads Regalos Corporativos',
  },
};

// Arma el link_data de un creativo según la fuente disponible (url, hash o video).
function buildLinkData(ad, pageId, fallbackCta) {
  const cta = ad.cta || fallbackCta;
  const link = ad.link;
  const linkData = {
    link,
    message: ad.primary_text,
    name: ad.headline,
    description: ad.description || '',
    call_to_action: { type: cta, value: { link } },
  };
  if (ad.image_hash) linkData.image_hash = ad.image_hash;
  else if (ad.image_url) linkData.picture = ad.image_url;
  return linkData;
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
    const preset = PRESETS[body.preset] ? body.preset : 'b2c_ventas';
    const cfg = PRESETS[preset];
    const t = encodeURIComponent(token);
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;

    const dailyBudget = Math.round(Number(body.daily_budget_clp || 0));
    if (!dailyBudget || dailyBudget < 1000) {
      return Response.json({ ok: false, error: 'daily_budget_clp inválido (mínimo ~$1.000 CLP).' });
    }

    const ads = Array.isArray(body.ads) ? body.ads : [];
    if (!ads.length) {
      return Response.json({ ok: false, error: 'Pasa al menos un anuncio en ads[] (con primary_text, headline, link e imagen/video).' });
    }
    // Validación por anuncio: deben tener copy, titular, link y un creativo.
    for (let i = 0; i < ads.length; i++) {
      const a = ads[i];
      if (!a.primary_text || !a.headline || !a.link) {
        return Response.json({ ok: false, error: `El anuncio #${i + 1} necesita primary_text, headline y link.` });
      }
      if (!a.image_url && !a.image_hash && !a.video_id && !a.video_url) {
        return Response.json({ ok: false, error: `El anuncio #${i + 1} necesita una imagen (image_url/image_hash) o un video (video_id/video_url).` });
      }
    }

    // 0 · Página de Facebook asociada (necesaria para los creativos)
    const pagesRes = await fetch(`${base}/me/accounts?fields=id,name&limit=10&access_token=${t}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) return Response.json({ ok: false, ...diagnoseMetaError(pagesData.error) });
    const page = (pagesData.data || [])[0];
    if (!page) {
      return Response.json({ ok: false, reason: 'sin_pagina', error: 'No se encontró una Página de Facebook asignada al System User. Asígnale la Página de PEYU en Meta Business Settings.' });
    }
    const pageId = page.id;

    const campaignName = body.campaign_name || cfg.name;

    // 1 · Campaña (CBO)
    const camp = await graphPost(`${accountId}/campaigns`, {
      name: campaignName,
      objective: cfg.objective,
      status: 'PAUSED',
      special_ad_categories: JSON.stringify([]),
      daily_budget: String(dailyBudget),
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    }, token);
    if (camp.error) return Response.json({ ok: false, step: 'campaign', ...diagnoseMetaError(camp.error) });
    const campaignId = camp.id;

    // 2 · UN solo Ad Set para todos los anuncios
    const targeting = {
      geo_locations: { countries: Array.isArray(body.countries) && body.countries.length ? body.countries : ['CL'] },
      age_min: Number(body.age_min) || 18,
      age_max: Number(body.age_max) || 65,
    };
    if (cfg.advantage_audience) {
      targeting.targeting_automation = { advantage_audience: 1 };
      targeting.age_max = 65; // Meta exige age_max>=65 con Advantage+
    }
    const adset = await graphPost(`${accountId}/adsets`, {
      name: `${campaignName} · Ad Set`,
      campaign_id: campaignId,
      billing_event: cfg.billing_event,
      optimization_goal: cfg.optimization_goal,
      // promoted_object: pixel + evento de conversión (Purchase / Lead).
      // Obligatorio para OFFSITE_CONVERSIONS — sin esto Meta rechaza el ad set.
      promoted_object: JSON.stringify({ pixel_id: PEYU_PIXEL_ID, custom_event_type: cfg.custom_event_type }),
      destination_type: 'WEBSITE',
      targeting: JSON.stringify(targeting),
      status: 'PAUSED',
    }, token);
    if (adset.error) return Response.json({ ok: false, step: 'adset', campaign_id: campaignId, ...diagnoseMetaError(adset.error) });
    const adsetId = adset.id;

    // 3 · Para cada anuncio: creativo + ad, todos bajo el mismo ad set.
    //     Si uno falla, registramos el error pero seguimos con los demás.
    const created = [];
    const errors = [];
    for (let i = 0; i < ads.length; i++) {
      const a = ads[i];
      const adName = a.name || `${campaignName} · Ad ${i + 1}`;

      // Si viene un video por URL, lo subimos primero para obtener su video_id.
      if (!a.video_id && a.video_url) {
        const uv = await uploadVideoByUrl(accountId, a.video_url, token, a.name);
        if (uv.error) { errors.push({ index: i + 1, name: adName, step: 'video_upload', ...diagnoseMetaError(uv.error) }); continue; }
        a.video_id = uv.video_id;
      }

      // Si la imagen viene por URL (no hash ni video), la subimos para obtener
      // image_hash: Meta rechaza picture con URLs externas al crear creativos.
      if (!a.image_hash && !a.video_id && a.image_url) {
        const up = await uploadImageByUrl(accountId, a.image_url, token);
        if (up.hash) { a.image_hash = up.hash; delete a.image_url; }
      }

      // Creativo según fuente (imagen url/hash o video)
      let storySpec;
      if (a.video_id) {
        const cta = a.cta || cfg.default_cta;
        // Video: Meta EXIGE miniatura. thumbnail_hash, thumbnail_url→hash, o la
        // miniatura auto-generada por Meta tras procesar el video.
        let thumbHash = a.thumbnail_hash || null;
        let thumbUrl = null;
        if (!thumbHash && a.thumbnail_url) {
          const ut = await uploadImageByUrl(accountId, a.thumbnail_url, token);
          if (ut.hash) thumbHash = ut.hash; else thumbUrl = a.thumbnail_url;
        }
        if (!thumbHash && !thumbUrl) {
          const ready = await waitVideoReadyThumb(a.video_id, token);
          if (ready.thumbnail_url) thumbUrl = ready.thumbnail_url;
        }
        if (!thumbHash && !thumbUrl) {
          errors.push({ index: i + 1, name: adName, step: 'video_thumbnail', error: 'El anuncio de video necesita una miniatura. Pasa thumbnail_hash (foto del producto) o thumbnail_url.' });
          continue;
        }
        storySpec = {
          page_id: pageId,
          video_data: {
            video_id: a.video_id,
            message: a.primary_text,
            title: a.headline,
            link_description: a.description || '',
            call_to_action: { type: cta, value: { link: a.link } },
            ...(thumbHash ? { image_hash: thumbHash } : { image_url: thumbUrl }),
          },
        };
      } else {
        storySpec = { page_id: pageId, link_data: buildLinkData(a, pageId, cfg.default_cta) };
      }

      const creative = await graphPost(`${accountId}/adcreatives`, {
        name: `${adName} · Creative`,
        object_story_spec: storySpec,
      }, token);
      if (creative.error) {
        errors.push({ index: i + 1, name: adName, step: 'creative', ...diagnoseMetaError(creative.error) });
        continue;
      }

      const ad = await graphPost(`${accountId}/ads`, {
        name: adName,
        adset_id: adsetId,
        creative: JSON.stringify({ creative_id: creative.id }),
        status: 'PAUSED',
      }, token);
      if (ad.error) {
        errors.push({ index: i + 1, name: adName, step: 'ad', creative_id: creative.id, ...diagnoseMetaError(ad.error) });
        continue;
      }

      created.push({ ad_id: ad.id, creative_id: creative.id, name: adName });
    }

    if (!created.length) {
      return Response.json({
        ok: false,
        step: 'ads',
        campaign_id: campaignId,
        adset_id: adsetId,
        error: 'No se pudo crear ningún anuncio. Revisa los errores por anuncio.',
        errors,
      });
    }

    return Response.json({
      ok: true,
      preset,
      message: `Campaña "${campaignName}" creada en Meta con ${created.length} anuncio(s) en un solo ad set, en estado PAUSADO. Revísala en Ads Manager y actívala cuando quieras${errors.length ? ` (${errors.length} anuncio(s) fallaron — ver errors)` : ''}.`,
      campaign_id: campaignId,
      adset_id: adsetId,
      page_used: page.name,
      ads_created: created,
      ads_failed: errors,
      status: 'PAUSED',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});