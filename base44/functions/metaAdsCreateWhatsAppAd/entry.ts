import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsCreateWhatsAppAd · Crea una campaña completa de "Click-to-WhatsApp":
// Campaña (OUTCOME_ENGAGEMENT) → Ad Set (destination_type=WHATSAPP, optimiza
// CONVERSATIONS) → Creativo con CTA WHATSAPP_MESSAGE → Anuncio. Todo PAUSADO.
//
// Cierra la brecha que el agente reportaba: el botón de WhatsApp es un CTA
// especial que ahora SÍ se configura desde aquí (no hay que ir a Ads Manager),
// siempre que la Página tenga un número de WhatsApp Business vinculado.
//
// Soporta imagen simple o CARRUSEL (cards). Al hacer clic, abre WhatsApp con un
// mensaje prellenado opcional.
//
// Payload:
//   {
//     campaign_name: 'WA · Carcasas',
//     daily_budget_clp: 5000,           // mín 1000
//     primary_text: string,
//     headline?: string,
//     description?: string,
//     welcome_message?: 'Hola PEYU, quiero info de...',  // mensaje prellenado
//     image_url?: string,               // imagen simple
//     cards?: [{ image_url?|image_hash?, headline?, description? }],  // carrusel
//     countries?: ['CL'],
//     age_min?: 18, age_max?: 65,
//   }
// La Página 'Peyuchile' debe tener un número de WhatsApp Business conectado.
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
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido. Verifica que la Página tenga un número de WhatsApp Business vinculado. ' + msg, detail: msg };
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

async function uploadImageByUrl(accountId, url, token) {
  const data = await graphPost(`${accountId}/adimages`, { url }, token);
  if (data.error) return { error: data.error };
  const first = Object.values(data.images || {})[0];
  return { hash: first?.hash };
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
    if (!body.primary_text) return Response.json({ ok: false, error: 'El anuncio necesita primary_text.' });
    const cards = Array.isArray(body.cards) ? body.cards : null;
    if (!body.image_url && !cards) return Response.json({ ok: false, error: 'Indica image_url (imagen simple) o cards (carrusel).' });
    if (cards && (cards.length < 2 || cards.length > 10)) return Response.json({ ok: false, error: 'Un carrusel necesita entre 2 y 10 tarjetas.' });

    const budget = Math.max(1000, Math.round(body.daily_budget_clp || 5000));
    const t = encodeURIComponent(token);
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;

    // Página de Facebook (debe tener WhatsApp Business vinculado).
    const pagesRes = await fetch(`${base}/me/accounts?fields=id,name&limit=10&access_token=${t}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) return Response.json({ ok: false, ...diagnoseMetaError(pagesData.error) });
    const page = (pagesData.data || [])[0];
    if (!page) return Response.json({ ok: false, reason: 'sin_pagina', error: 'No hay Página de Facebook asignada al System User.' });
    const pageId = page.id;

    const name = body.campaign_name || `WhatsApp ${new Date().toISOString().slice(0, 10)}`;

    // 1) Campaña (Engagement → conversaciones).
    const campaign = await graphPost(`${accountId}/campaigns`, {
      name: `${name} · CTWA`,
      objective: 'OUTCOME_ENGAGEMENT',
      special_ad_categories: [],
      status: 'PAUSED',
    }, token);
    if (campaign.error) return Response.json({ ok: false, step: 'campaign', ...diagnoseMetaError(campaign.error) });

    // 2) Ad Set con destino WHATSAPP, optimizando conversaciones.
    const adset = await graphPost(`${accountId}/adsets`, {
      name: `${name} · AdSet`,
      campaign_id: campaign.id,
      destination_type: 'WHATSAPP',
      optimization_goal: 'CONVERSATIONS',
      billing_event: 'IMPRESSIONS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      daily_budget: budget,
      promoted_object: { page_id: pageId },
      targeting: {
        geo_locations: { countries: body.countries || ['CL'] },
        age_min: body.age_min || 18,
        age_max: body.age_max || 65,
      },
      status: 'PAUSED',
    }, token);
    if (adset.error) return Response.json({ ok: false, step: 'adset', campaign_id: campaign.id, ...diagnoseMetaError(adset.error) });

    // 3) Creativo con CTA WHATSAPP_MESSAGE. El link arma el deeplink de WhatsApp.
    const waLink = 'https://api.whatsapp.com/send';
    const callToAction = {
      type: 'WHATSAPP_MESSAGE',
      value: {
        app_destination: 'WHATSAPP',
        ...(body.welcome_message ? { whatsapp_welcome_message: body.welcome_message } : {}),
      },
    };

    let linkData;
    if (cards) {
      const childAttachments = [];
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        let hash = c.image_hash;
        if (!hash && c.image_url) {
          const up = await uploadImageByUrl(accountId, c.image_url, token);
          if (up.error) return Response.json({ ok: false, step: `upload_card_${i + 1}`, ...diagnoseMetaError(up.error) });
          hash = up.hash;
        }
        if (!hash) return Response.json({ ok: false, error: `No se pudo resolver la imagen de la tarjeta ${i + 1}.` });
        childAttachments.push({
          link: waLink,
          image_hash: hash,
          name: c.headline || body.headline || '',
          description: c.description || '',
          call_to_action: callToAction,
        });
      }
      linkData = { link: waLink, message: body.primary_text, child_attachments: childAttachments, multi_share_optimized: true };
    } else {
      const up = await uploadImageByUrl(accountId, body.image_url, token);
      if (up.error) return Response.json({ ok: false, step: 'upload_image', ...diagnoseMetaError(up.error) });
      linkData = {
        link: waLink,
        message: body.primary_text,
        name: body.headline || '',
        description: body.description || '',
        image_hash: up.hash,
        call_to_action: callToAction,
      };
    }

    const creative = await graphPost(`${accountId}/adcreatives`, {
      name: `${name} · Creative`,
      object_story_spec: { page_id: pageId, link_data: linkData },
    }, token);
    if (creative.error) return Response.json({ ok: false, step: 'creative', campaign_id: campaign.id, adset_id: adset.id, ...diagnoseMetaError(creative.error) });

    // 4) Anuncio.
    const ad = await graphPost(`${accountId}/ads`, {
      name: `${name} · Ad`,
      adset_id: adset.id,
      creative: JSON.stringify({ creative_id: creative.id }),
      status: 'PAUSED',
    }, token);
    if (ad.error) return Response.json({ ok: false, step: 'ad', campaign_id: campaign.id, adset_id: adset.id, creative_id: creative.id, ...diagnoseMetaError(ad.error) });

    return Response.json({
      ok: true,
      campaign_id: campaign.id,
      adset_id: adset.id,
      ad_id: ad.id,
      creative_id: creative.id,
      formato: cards ? `carrusel (${cards.length} tarjetas)` : 'imagen',
      status: 'PAUSED',
      message: `Campaña Click-to-WhatsApp "${name}" creada (${cards ? cards.length + ' tarjetas' : 'imagen'}) con el botón de WhatsApp, en PAUSADO. Requiere que la Página 'Peyuchile' tenga un número de WhatsApp Business vinculado.`,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});