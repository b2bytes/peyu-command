import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsCreateAdvantagePlus · Crea una campaña ADVANTAGE+ SHOPPING (ASC).
// ----------------------------------------------------------------------------
// Es el formato estrella de Meta 2026 (motor Andromeda): una sola campaña de
// adquisición donde la IA de Meta resuelve audiencia, ubicaciones y entrega,
// y tú solo aportas presupuesto + creativos. Meta reporta +22% ROAS y -17%
// costo por compra vs. campañas manuales. Es la columna vertebral del ecommerce
// DTC hoy — lo que faltaba para que el agente reemplace a una agencia.
//
// Diferencia técnica con una campaña normal (metaAdsCreateCampaign):
//   - smart_promotion_type: 'AUTOMATED_SHOPPING_ADS' en la campaña.
//   - El ad set NO lleva targeting de intereses: Meta lo decide (Andromeda).
//   - Soporta "existing customer budget cap": % del presupuesto reservado a
//     clientes que YA compraron (el resto va 100% a adquisición nueva).
//
// Todo nace PAUSED para revisión. Acepta 1..N creativos (imagen o video) que
// se cargan como anuncios dentro del único ad set ASC.
//
// Payload:
// {
//   campaign_name?: string,
//   daily_budget_clp: number,            // CBO (mín ~$1.000)
//   countries?: string[],                // default ['CL']
//   existing_customer_budget_pct?: number, // 0-100, default 0 (todo adquisición)
//   conversion_event?: 'PURCHASE'|'ADD_TO_CART'|'INITIATED_CHECKOUT', // default PURCHASE
//   ads: [ { name?, primary_text, headline, description?, cta?, link,
//            image_url?|image_hash? | video_id?|video_url? + thumbnail_hash?|thumbnail_url? } ]
// }
// ============================================================================

const GRAPH_VERSION = 'v21.0';
const PEYU_PIXEL_ID = '769018551017679';

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
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido: ' + msg, detail: msg };
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

async function graphGet(path, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`);
  return res.json();
}

async function uploadImageByUrl(accountId, url, token) {
  const data = await graphPost(`${accountId}/adimages`, { url }, token);
  if (data.error) return { error: data.error };
  const first = Object.values(data.images || {})[0];
  return { hash: first?.hash };
}

async function uploadVideoByUrl(accountId, url, token, title) {
  const data = await graphPost(`${accountId}/advideos`, { file_url: url, ...(title ? { title, name: title } : {}) }, token);
  if (data.error) return { error: data.error };
  return { video_id: data.id };
}

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
    const t = encodeURIComponent(token);
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;

    const dailyBudget = Math.round(Number(body.daily_budget_clp || 0));
    if (!dailyBudget || dailyBudget < 1000) {
      return Response.json({ ok: false, error: 'daily_budget_clp inválido (mínimo ~$1.000 CLP).' });
    }
    const ads = Array.isArray(body.ads) ? body.ads : [];
    if (!ads.length) return Response.json({ ok: false, error: 'Pasa al menos un creativo en ads[] (primary_text, headline, link e imagen/video).' });
    for (let i = 0; i < ads.length; i++) {
      const a = ads[i];
      if (!a.primary_text || !a.headline || !a.link) return Response.json({ ok: false, error: `El anuncio #${i + 1} necesita primary_text, headline y link.` });
      if (!a.image_url && !a.image_hash && !a.video_id && !a.video_url) return Response.json({ ok: false, error: `El anuncio #${i + 1} necesita una imagen o un video.` });
    }

    const customEvent = ['PURCHASE', 'ADD_TO_CART', 'INITIATED_CHECKOUT'].includes(body.conversion_event) ? body.conversion_event : 'PURCHASE';
    const existingPct = Math.max(0, Math.min(100, Number(body.existing_customer_budget_pct || 0)));

    // Página de Facebook
    const pagesRes = await fetch(`${base}/me/accounts?fields=id,name&limit=10&access_token=${t}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) return Response.json({ ok: false, ...diagnoseMetaError(pagesData.error) });
    const page = (pagesData.data || [])[0];
    if (!page) return Response.json({ ok: false, reason: 'sin_pagina', error: 'No hay Página de Facebook asignada al System User.' });
    const pageId = page.id;

    const campaignName = body.campaign_name || 'PEYU | Advantage+ Shopping';

    // 1 · Campaña ASC — la clave es smart_promotion_type
    const campParams = {
      name: campaignName,
      objective: 'OUTCOME_SALES',
      smart_promotion_type: 'AUTOMATED_SHOPPING_ADS',
      status: 'PAUSED',
      special_ad_categories: JSON.stringify([]),
      daily_budget: String(dailyBudget),
    };
    const camp = await graphPost(`${accountId}/campaigns`, campParams, token);
    if (camp.error) return Response.json({ ok: false, step: 'campaign', ...diagnoseMetaError(camp.error) });
    const campaignId = camp.id;

    // 2 · Ad set ASC — SIN intereses (Andromeda decide la audiencia). Solo geo.
    const adsetParams = {
      name: `${campaignName} · ASC`,
      campaign_id: campaignId,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'OFFSITE_CONVERSIONS',
      promoted_object: JSON.stringify({ pixel_id: PEYU_PIXEL_ID, custom_event_type: customEvent }),
      destination_type: 'WEBSITE',
      targeting: JSON.stringify({ geo_locations: { countries: Array.isArray(body.countries) && body.countries.length ? body.countries : ['CL'] } }),
      status: 'PAUSED',
    };
    // % de presupuesto reservado a clientes existentes (lo demás va a adquisición).
    if (existingPct > 0) {
      adsetParams.existing_customer_budget_percentage = existingPct;
    }
    const adset = await graphPost(`${accountId}/adsets`, adsetParams, token);
    if (adset.error) return Response.json({ ok: false, step: 'adset', campaign_id: campaignId, ...diagnoseMetaError(adset.error) });
    const adsetId = adset.id;

    // 3 · Anuncios (imagen o video) dentro del ad set ASC.
    const created = [];
    const errors = [];
    for (let i = 0; i < ads.length; i++) {
      const a = ads[i];
      const adName = a.name || `${campaignName} · Ad ${i + 1}`;

      if (!a.video_id && a.video_url) {
        const uv = await uploadVideoByUrl(accountId, a.video_url, token, a.name);
        if (uv.error) { errors.push({ index: i + 1, name: adName, step: 'video_upload', ...diagnoseMetaError(uv.error) }); continue; }
        a.video_id = uv.video_id;
      }
      if (!a.image_hash && !a.video_id && a.image_url) {
        const up = await uploadImageByUrl(accountId, a.image_url, token);
        if (up.hash) { a.image_hash = up.hash; delete a.image_url; }
      }

      let storySpec;
      if (a.video_id) {
        const cta = a.cta || 'SHOP_NOW';
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
        if (!thumbHash && !thumbUrl) { errors.push({ index: i + 1, name: adName, step: 'video_thumbnail', error: 'El video necesita miniatura (thumbnail_hash o thumbnail_url).' }); continue; }
        storySpec = {
          page_id: pageId,
          video_data: {
            video_id: a.video_id, message: a.primary_text, title: a.headline,
            link_description: a.description || '',
            call_to_action: { type: cta, value: { link: a.link } },
            ...(thumbHash ? { image_hash: thumbHash } : { image_url: thumbUrl }),
          },
        };
      } else {
        const cta = a.cta || 'SHOP_NOW';
        const linkData = { link: a.link, message: a.primary_text, name: a.headline, description: a.description || '', call_to_action: { type: cta, value: { link: a.link } } };
        if (a.image_hash) linkData.image_hash = a.image_hash; else if (a.image_url) linkData.picture = a.image_url;
        storySpec = { page_id: pageId, link_data: linkData };
      }

      const creative = await graphPost(`${accountId}/adcreatives`, { name: `${adName} · Creative`, object_story_spec: storySpec }, token);
      if (creative.error) { errors.push({ index: i + 1, name: adName, step: 'creative', ...diagnoseMetaError(creative.error) }); continue; }
      const ad = await graphPost(`${accountId}/ads`, { name: adName, adset_id: adsetId, creative: JSON.stringify({ creative_id: creative.id }), status: 'PAUSED' }, token);
      if (ad.error) { errors.push({ index: i + 1, name: adName, step: 'ad', ...diagnoseMetaError(ad.error) }); continue; }
      created.push({ ad_id: ad.id, creative_id: creative.id, name: adName });
    }

    if (!created.length) {
      return Response.json({ ok: false, step: 'ads', campaign_id: campaignId, adset_id: adsetId, error: 'No se pudo crear ningún anuncio.', errors });
    }

    return Response.json({
      ok: true,
      tipo: 'Advantage+ Shopping (ASC)',
      message: `Campaña Advantage+ Shopping "${campaignName}" creada en PAUSADO con ${created.length} creativo(s). Meta (Andromeda) optimizará audiencia y entrega automáticamente. ${existingPct > 0 ? `${existingPct}% del presupuesto reservado a clientes existentes.` : 'Todo el presupuesto va a adquisición nueva.'} Revísala y actívala cuando quieras${errors.length ? ` (${errors.length} creativo(s) fallaron — ver errors)` : ''}.`,
      campaign_id: campaignId,
      adset_id: adsetId,
      existing_customer_budget_pct: existingPct,
      conversion_event: customEvent,
      page_used: page.name,
      ads_created: created,
      ads_failed: errors,
      status: 'PAUSED',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});