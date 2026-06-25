import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsDuplicateCampaign · DUPLICA una campaña existente completa hacia un
// NUEVO objetivo, en UN SOLO PASO (server-side).
// ----------------------------------------------------------------------------
// Resuelve el cuello de botella que frustraba al agente: para "duplicar a
// Ventas" tenía que encadenar leer anuncios + recrear cada uno + recrear el
// carrusel, y se quedaba sin iteraciones o Meta rechazaba las imágenes por URL.
// Aquí todo ocurre dentro de la función:
//   1. Lee TODOS los anuncios de la campaña origen (incluye carruseles).
//   2. Crea una campaña nueva (CBO) con el preset elegido (Ventas / Leads),
//      su ad set con pixel + evento de conversión, todo PAUSADO.
//   3. Re-crea cada anuncio bajo el nuevo ad set reutilizando los image_hash
//      originales (no re-sube nada → sin error de URLs externas). Los carruseles
//      se re-crean como carrusel con sus tarjetas.
//   Si un anuncio falla, sigue con los demás y reporta el detalle.
//
// Payload:
//   {
//     source_campaign_id: '123',         // campaña a duplicar (obligatorio)
//     preset: 'b2c_ventas' | 'b2b_leads',// objetivo destino (default b2c_ventas)
//     campaign_name?: string,            // default: "<origen> (Ventas)"
//     daily_budget_clp: number,          // presupuesto de la campaña nueva (mín 1000)
//     countries?: string[], age_min?, age_max?,
//     pause_source?: boolean,            // si true, pausa la campaña origen
//   }
// Devuelve la campaña nueva, su ad set y los anuncios re-creados (simples y
// carruseles), con errores individuales si alguno falla.
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
  const ud = err?.error_user_msg || err?.error_data?.blame_field_specs;
  const msg = [err?.message, err?.error_user_title, err?.error_user_msg].filter(Boolean).join(' · ')
    || (ud ? JSON.stringify(ud) : 'Error desconocido de Meta.');
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado.', detail: msg };
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso sobre la cuenta o la Página.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido al duplicar: ' + msg, detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

async function graphGet(path, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`);
  return res.json();
}

async function graphPost(path, params, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, access_token: token }),
  });
  return res.json();
}

const PRESETS = {
  b2c_ventas: { objective: 'OUTCOME_SALES', optimization_goal: 'OFFSITE_CONVERSIONS', billing_event: 'IMPRESSIONS', custom_event_type: 'PURCHASE', default_cta: 'SHOP_NOW', advantage_audience: true, suffix: 'Ventas' },
  b2b_leads:  { objective: 'OUTCOME_LEADS', optimization_goal: 'OFFSITE_CONVERSIONS', billing_event: 'IMPRESSIONS', custom_event_type: 'LEAD', default_cta: 'LEARN_MORE', advantage_audience: false, suffix: 'Leads' },
};

// Extrae el contenido reutilizable de un creativo (simple o carrusel).
function parseCreative(creative) {
  if (!creative) return null;
  const oss = creative.object_story_spec || {};
  const link = oss.link_data || {};
  const video = oss.video_data || {};
  const cta = (link.call_to_action || video.call_to_action || {}) || {};
  const afs = creative.asset_feed_spec || {};

  const children = Array.isArray(link.child_attachments) ? link.child_attachments : [];
  let cards = [];
  if (children.length) {
    cards = children.map((c) => ({
      image_hash: c.image_hash || null,
      image_url: c.picture || c.image_url || '',
      headline: c.name || '',
      description: c.description || '',
      link: c.link || c.call_to_action?.value?.link || '',
    }));
  } else if (Array.isArray(afs.images) && afs.images.length > 1) {
    cards = afs.images.map((im, i) => ({
      image_hash: im.hash || null,
      image_url: im.url || '',
      headline: (Array.isArray(afs.titles) && (afs.titles[i] || afs.titles[0])?.text) || '',
      description: (Array.isArray(afs.descriptions) && (afs.descriptions[i] || afs.descriptions[0])?.text) || '',
      link: (Array.isArray(afs.link_urls) && (afs.link_urls[i] || afs.link_urls[0])?.website_url) || '',
    }));
  }

  return {
    primary_text: link.message || video.message || (Array.isArray(afs.bodies) && afs.bodies[0]?.text) || '',
    headline: link.name || (Array.isArray(afs.titles) && afs.titles[0]?.text) || '',
    description: link.description || (Array.isArray(afs.descriptions) && afs.descriptions[0]?.text) || '',
    cta: cta?.type || (Array.isArray(afs.call_to_action_types) && afs.call_to_action_types[0]) || '',
    link: link.link || cta?.value?.link || (Array.isArray(afs.link_urls) && afs.link_urls[0]?.website_url) || '',
    image_hash: link.image_hash || (Array.isArray(afs.images) && afs.images[0]?.hash) || null,
    image_url: link.picture || creative.image_url || '',
    video_id: video.video_id || (Array.isArray(afs.videos) && afs.videos[0]?.video_id) || null,
    is_carousel: cards.length >= 2,
    cards,
  };
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
    const sourceId = body.source_campaign_id;
    if (!sourceId) return Response.json({ ok: false, error: 'Falta source_campaign_id (la campaña a duplicar).' });

    const preset = PRESETS[body.preset] ? body.preset : 'b2c_ventas';
    const cfg = PRESETS[preset];
    const dailyBudget = Math.round(Number(body.daily_budget_clp || 0));
    if (!dailyBudget || dailyBudget < 1000) return Response.json({ ok: false, error: 'daily_budget_clp inválido (mínimo ~$1.000 CLP).' });

    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // 0 · Campaña origen (nombre) + Página.
    const srcCamp = await graphGet(`${sourceId}?fields=name`, token);
    if (srcCamp.error) return Response.json({ ok: false, step: 'read_source', ...diagnoseMetaError(srcCamp.error) });

    const pagesRes = await fetch(`${base}/me/accounts?fields=id,name&limit=10&access_token=${t}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) return Response.json({ ok: false, ...diagnoseMetaError(pagesData.error) });
    const page = (pagesData.data || [])[0];
    if (!page) return Response.json({ ok: false, reason: 'sin_pagina', error: 'No hay Página de Facebook asignada al System User.' });
    const pageId = page.id;

    // 1 · Leer TODOS los anuncios de la campaña origen con su creativo.
    const creativeFields = 'id,object_story_spec,asset_feed_spec,image_url,body,title,image_hash';
    const adsRes = await graphGet(`${sourceId}/ads?fields=id,name,creative{${creativeFields}}&limit=100`, token);
    if (adsRes.error) return Response.json({ ok: false, step: 'read_ads', ...diagnoseMetaError(adsRes.error) });
    const srcAds = (adsRes.data || []).map((a) => ({ name: a.name, content: parseCreative(a.creative) })).filter((a) => a.content);
    if (!srcAds.length) return Response.json({ ok: false, error: 'La campaña origen no tiene anuncios legibles para duplicar.' });

    // 2 · Campaña nueva (CBO) + ad set con pixel + evento de conversión.
    const campaignName = body.campaign_name || `${srcCamp.name} (${cfg.suffix})`;
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

    const targeting = {
      geo_locations: { countries: Array.isArray(body.countries) && body.countries.length ? body.countries : ['CL'] },
      age_min: Number(body.age_min) || 18,
      age_max: Number(body.age_max) || 65,
    };
    if (cfg.advantage_audience) { targeting.targeting_automation = { advantage_audience: 1 }; targeting.age_max = 65; }

    const adset = await graphPost(`${accountId}/adsets`, {
      name: `${campaignName} · Ad Set`,
      campaign_id: campaignId,
      billing_event: cfg.billing_event,
      optimization_goal: cfg.optimization_goal,
      promoted_object: JSON.stringify({ pixel_id: PEYU_PIXEL_ID, custom_event_type: cfg.custom_event_type }),
      destination_type: 'WEBSITE',
      targeting: JSON.stringify(targeting),
      status: 'PAUSED',
    }, token);
    if (adset.error) return Response.json({ ok: false, step: 'adset', campaign_id: campaignId, ...diagnoseMetaError(adset.error) });
    const adsetId = adset.id;

    // 3 · Re-crear cada anuncio bajo el nuevo ad set (reutilizando image_hash).
    const created = [];
    const errors = [];
    const fallbackLink = preset === 'b2b_leads' ? 'https://peyuchile.cl/EmpresasNuevo' : 'https://peyuchile.cl/CatalogoNuevo';

    for (let i = 0; i < srcAds.length; i++) {
      const { name, content } = srcAds[i];
      const adName = name || `${campaignName} · Ad ${i + 1}`;
      const link = content.link || fallbackLink;

      let storySpec;
      if (content.is_carousel && content.cards.length >= 2) {
        // Carrusel: re-armamos child_attachments con los hash originales.
        const childAttachments = content.cards
          .filter((c) => c.image_hash)
          .map((c) => ({
            link: c.link || link,
            image_hash: c.image_hash,
            name: c.headline || content.headline || '',
            description: c.description || '',
            call_to_action: { type: content.cta || cfg.default_cta, value: { link: c.link || link } },
          }));
        if (childAttachments.length < 2) {
          errors.push({ index: i + 1, name: adName, step: 'carousel', error: 'El carrusel no tiene suficientes tarjetas con image_hash reutilizable.' });
          continue;
        }
        storySpec = { page_id: pageId, link_data: { link, message: content.primary_text, multi_share_optimized: true, multi_share_end_card: true, child_attachments: childAttachments } };
      } else if (content.video_id) {
        storySpec = { page_id: pageId, video_data: { video_id: content.video_id, message: content.primary_text, title: content.headline, link_description: content.description || '', call_to_action: { type: content.cta || cfg.default_cta, value: { link } } } };
      } else if (content.image_hash) {
        storySpec = { page_id: pageId, link_data: { link, message: content.primary_text, name: content.headline, description: content.description || '', image_hash: content.image_hash, call_to_action: { type: content.cta || cfg.default_cta, value: { link } } } };
      } else {
        errors.push({ index: i + 1, name: adName, step: 'creative', error: 'El anuncio origen no tiene image_hash ni video reutilizable.' });
        continue;
      }

      const creative = await graphPost(`${accountId}/adcreatives`, { name: `${adName} · Creative`, object_story_spec: storySpec }, token);
      if (creative.error) { errors.push({ index: i + 1, name: adName, step: 'creative', ...diagnoseMetaError(creative.error) }); continue; }

      const ad = await graphPost(`${accountId}/ads`, { name: adName, adset_id: adsetId, creative: JSON.stringify({ creative_id: creative.id }), status: 'PAUSED' }, token);
      if (ad.error) { errors.push({ index: i + 1, name: adName, step: 'ad', creative_id: creative.id, ...diagnoseMetaError(ad.error) }); continue; }

      created.push({ ad_id: ad.id, creative_id: creative.id, name: adName, formato: content.is_carousel ? `carrusel (${content.cards.length})` : (content.video_id ? 'video' : 'imagen') });
    }

    // 4 · Pausar la campaña origen si lo pidieron.
    let source_paused = false;
    if (body.pause_source) {
      const pr = await graphPost(`${sourceId}`, { status: 'PAUSED' }, token);
      source_paused = !pr.error;
    }

    if (!created.length) {
      return Response.json({ ok: false, step: 'ads', campaign_id: campaignId, adset_id: adsetId, error: 'No se pudo re-crear ningún anuncio. Revisa errors.', errors });
    }

    return Response.json({
      ok: true,
      preset,
      message: `Campaña "${campaignName}" creada como ${cfg.suffix} con ${created.length} anuncio(s) duplicado(s)${errors.length ? ` (${errors.length} fallaron)` : ''}, en PAUSADO.${source_paused ? ' La campaña origen quedó pausada.' : ''}`,
      campaign_id: campaignId,
      adset_id: adsetId,
      source_campaign_id: sourceId,
      source_paused,
      ads_created: created,
      ads_failed: errors,
      status: 'PAUSED',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});