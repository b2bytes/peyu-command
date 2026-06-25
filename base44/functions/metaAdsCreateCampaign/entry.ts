import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsCreateCampaign · CREA campañas reales en Meta Ads vía Graph API.
// Crea, en cadena: Campaña → Ad Set → Ad Creative (con imagen) → Ad.
// Todo nace en estado PAUSED para que el founder revise antes de activar.
//
// Soporta dos presets listos para PEYU (ambos optimizan a CONVERSIONES reales):
//   preset='b2c_ventas' → OUTCOME_SALES, optimiza a Purchase, Advantage+, CBO.
//   preset='b2b_leads'  → OUTCOME_LEADS, optimiza a Lead, públicos amplios.
//
// Payload:
// {
//   preset: 'b2c_ventas' | 'b2b_leads',
//   campaign_name?: string,
//   daily_budget_clp: number,       // presupuesto diario (CBO a nivel campaña)
//   landing_url: string,            // URL de destino del anuncio
//   image_url: string,              // creativo (imagen) — puede venir de agentGenerateMedia
//   primary_text: string,           // copy principal del anuncio
//   headline: string,               // titular
//   description?: string,           // descripción
//   cta?: string,                   // SHOP_NOW | LEARN_MORE | GET_QUOTE | SIGN_UP | CONTACT_US ...
//   countries?: string[],           // default ['CL']
//   age_min?: number, age_max?: number,
// }
//
// Devuelve los IDs creados. NO activa nada (status PAUSED).
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  // Mensaje útil de Meta: title + user_msg cuando existen (más claro que "Invalid parameter").
  const ud = err?.error_user_msg || err?.error_data?.blame_field_specs;
  const msg = [err?.message, err?.error_user_title, err?.error_user_msg].filter(Boolean).join(' · ')
    || (ud ? JSON.stringify(ud) : 'Error desconocido de Meta.');
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado. Regenera el token del System User con ads_management.', detail: msg };
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para crear anuncios o gestionar la Página. Asigna la cuenta publicitaria Y la Página de Facebook al System User con permisos completos.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Un parámetro es inválido (revisa landing_url, image_url o el objetivo).', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando las consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

// POST helper a la Graph API con manejo de error uniforme.
async function graphPost(path, params, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, access_token: token }),
  });
  const data = await res.json();
  return data;
}

// Pixel de PEYU (activo, disparando Purchase + Lead). Necesario en el
// promoted_object del ad set para optimizar a conversiones reales.
const PEYU_PIXEL_ID = '769018551017679';

// Ambos presets optimizan a CONVERSIONES reales (no tráfico):
//   - objective: OUTCOME_SALES (Ventas) / OUTCOME_LEADS (Leads)
//   - optimization_goal: OFFSITE_CONVERSIONS
//   - billing_event: IMPRESSIONS
//   - promoted_object: { pixel_id, custom_event_type } → le dice a Meta qué
//     evento de conversión optimizar (Purchase / Lead). Sin esto Meta rechaza
//     OFFSITE_CONVERSIONS, y con TRAFFIC/LINK_CLICKS la campaña no busca ventas.
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
    const landingUrl = body.landing_url;
    const imageUrl = body.image_url;
    const primaryText = body.primary_text;
    const headline = body.headline;
    if (!landingUrl || !imageUrl || !primaryText || !headline) {
      return Response.json({ ok: false, error: 'Faltan datos del anuncio: landing_url, image_url, primary_text y headline son obligatorios.' });
    }

    // 0 · Detectar la Página de Facebook asociada (necesaria para el creativo)
    const pagesRes = await fetch(`${base}/me/accounts?fields=id,name&limit=10&access_token=${t}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) return Response.json({ ok: false, ...diagnoseMetaError(pagesData.error) });
    const page = (pagesData.data || [])[0];
    if (!page) {
      return Response.json({ ok: false, reason: 'sin_pagina', error: 'No se encontró una Página de Facebook asignada al System User. Asígnale la Página de PEYU en Meta Business Settings para poder crear anuncios.' });
    }
    const pageId = page.id;

    const campaignName = body.campaign_name || cfg.name;

    // 1 · Crear CAMPAÑA (CBO: presupuesto a nivel campaña)
    const camp = await graphPost(`${accountId}/campaigns`, {
      name: campaignName,
      objective: cfg.objective,
      status: 'PAUSED',
      special_ad_categories: JSON.stringify([]),
      daily_budget: String(dailyBudget),
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',   // CBO: la estrategia de puja va en la campaña
    }, token);
    if (camp.error) return Response.json({ ok: false, step: 'campaign', ...diagnoseMetaError(camp.error) });
    const campaignId = camp.id;

    // 2 · Crear AD SET (públicos + optimización; sin presupuesto propio porque va por CBO)
    const targeting = {
      geo_locations: { countries: Array.isArray(body.countries) && body.countries.length ? body.countries : ['CL'] },
      age_min: Number(body.age_min) || 18,
      age_max: Number(body.age_max) || 65,
    };
    if (cfg.advantage_audience) {
      // Advantage+ Audience: deja que la IA de Meta expanda más allá del público semilla.
      targeting.targeting_automation = { advantage_audience: 1 };
      // Meta NO permite age_max < 65 con Advantage+ (solo lo toma como "sugerencia").
      // Para evitar el error de validación, con Advantage+ siempre fijamos age_max=65.
      targeting.age_max = 65;
    }
    const adset = await graphPost(`${accountId}/adsets`, {
      name: `${campaignName} · Ad Set`,
      campaign_id: campaignId,
      billing_event: cfg.billing_event,
      optimization_goal: cfg.optimization_goal,
      // promoted_object: pixel + evento de conversión a optimizar (Purchase / Lead).
      // Obligatorio para OFFSITE_CONVERSIONS — sin esto Meta rechaza el ad set.
      promoted_object: JSON.stringify({ pixel_id: PEYU_PIXEL_ID, custom_event_type: cfg.custom_event_type }),
      destination_type: 'WEBSITE',   // tráfico a la landing del sitio
      targeting: JSON.stringify(targeting),
      status: 'PAUSED',
    }, token);
    if (adset.error) return Response.json({ ok: false, step: 'adset', campaign_id: campaignId, ...diagnoseMetaError(adset.error) });
    const adsetId = adset.id;

    // 3 · Crear AD CREATIVE con la imagen
    const cta = body.cta || cfg.default_cta;
    const creativeSpec = {
      name: `${campaignName} · Creative`,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          link: landingUrl,
          message: primaryText,
          name: headline,
          description: body.description || '',
          image_hash: null,        // usamos picture URL directa abajo
          picture: imageUrl,
          call_to_action: { type: cta, value: { link: landingUrl } },
        },
      },
    };
    const creative = await graphPost(`${accountId}/adcreatives`, creativeSpec, token);
    if (creative.error) return Response.json({ ok: false, step: 'creative', campaign_id: campaignId, adset_id: adsetId, ...diagnoseMetaError(creative.error) });
    const creativeId = creative.id;

    // 4 · Crear AD (anuncio) que une ad set + creativo
    const ad = await graphPost(`${accountId}/ads`, {
      name: `${campaignName} · Ad`,
      adset_id: adsetId,
      creative: JSON.stringify({ creative_id: creativeId }),
      status: 'PAUSED',
    }, token);
    if (ad.error) return Response.json({ ok: false, step: 'ad', campaign_id: campaignId, adset_id: adsetId, creative_id: creativeId, ...diagnoseMetaError(ad.error) });

    return Response.json({
      ok: true,
      preset,
      message: `Campaña "${campaignName}" creada en Meta en estado PAUSADO. Revísala en Ads Manager y actívala cuando quieras (o pídeme activarla).`,
      campaign_id: campaignId,
      adset_id: adsetId,
      creative_id: creativeId,
      ad_id: ad.id,
      page_used: page.name,
      status: 'PAUSED',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});