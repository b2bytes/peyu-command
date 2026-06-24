import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsCreateAdset · Crea UN ad set NUEVO dentro de una campaña EXISTENTE.
// Permite al agente construir estructuras por separado (1 campaña → N ad sets),
// cada uno con su propio público, presupuesto, evento de conversión y exclusión
// de audiencias (ej: excluir compradores de 180 días).
//
// Payload:
//   {
//     campaign_id: '123',                 // campaña destino (obligatorio)
//     name?: 'Ad set público frío',
//     daily_budget_clp: 3000,             // mínimo 1000
//     optimization?: 'OFFSITE_CONVERSIONS' | 'LINK_CLICKS' | 'LEAD_GENERATION',
//     conversion_event?: 'PURCHASE' | 'LEAD' | 'ADD_TO_CART' | ...  (custom_event_type)
//     countries?: ['CL'],
//     age_min?: 18, age_max?: 65,
//     genders?: [1,2],                    // 1=hombres, 2=mujeres (omite = todos)
//     interests?: [{ id, name }],         // intereses de detailed_targeting
//     included_audience_ids?: ['aud1'],   // custom audiences a incluir
//     excluded_audience_ids?: ['aud2'],   // custom audiences a EXCLUIR (compradores)
//     advantage_audience?: true           // Advantage+ Audience (B2C ventas)
//   }
// El ad set se crea PAUSADO. El pixel se toma automáticamente de la cuenta.
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
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para crear ad sets. Asigna ads_management + tarea MANAGE.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido al crear el ad set: ' + msg, detail: msg };
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
    const campaignId = body.campaign_id;
    if (!campaignId) return Response.json({ ok: false, error: 'Falta campaign_id (la campaña donde crear el ad set).' });

    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    const clp = Math.round(Number(body.daily_budget_clp || 0));
    if (!clp || clp < 1000) return Response.json({ ok: false, error: 'daily_budget_clp inválido (mínimo ~$1.000 CLP).' });

    // Pixel de la cuenta (para optimización por conversión).
    let pixelId = null;
    const pixRes = await fetch(`${base}/${accountId}/adspixels?fields=id&access_token=${t}`);
    const pix = await pixRes.json();
    if (!pix.error) pixelId = (pix.data || [])[0]?.id || null;

    // Targeting.
    const targeting = {
      geo_locations: { countries: body.countries && body.countries.length ? body.countries : ['CL'] },
      age_min: body.age_min || 18,
      age_max: body.age_max || 65,
    };
    if (body.genders && body.genders.length) targeting.genders = body.genders;
    if (body.interests && body.interests.length) {
      targeting.flexible_spec = [{ interests: body.interests.map(i => ({ id: i.id, name: i.name })) }];
    }
    if (body.included_audience_ids && body.included_audience_ids.length) {
      targeting.custom_audiences = body.included_audience_ids.map(id => ({ id }));
    }
    if (body.excluded_audience_ids && body.excluded_audience_ids.length) {
      targeting.excluded_custom_audiences = body.excluded_audience_ids.map(id => ({ id }));
    }
    if (body.advantage_audience) {
      targeting.targeting_automation = { advantage_audience: 1 };
    }

    const optimization = body.optimization || 'OFFSITE_CONVERSIONS';
    const adsetPayload = {
      name: body.name || `Ad set ${new Date().toISOString().slice(0, 10)}`,
      campaign_id: campaignId,
      daily_budget: String(clp),
      billing_event: 'IMPRESSIONS',
      optimization_goal: optimization,
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      targeting,
      status: 'PAUSED',
      access_token: token,
    };

    // Promoted object (pixel + evento de conversión) cuando optimiza a conversiones.
    if (optimization === 'OFFSITE_CONVERSIONS' && pixelId) {
      adsetPayload.promoted_object = {
        pixel_id: pixelId,
        custom_event_type: body.conversion_event || 'PURCHASE',
      };
    }

    const res = await fetch(`${base}/${accountId}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adsetPayload),
    });
    const data = await res.json();
    if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });

    return Response.json({
      ok: true,
      adset_id: data.id,
      campaign_id: campaignId,
      name: adsetPayload.name,
      daily_budget_clp: clp,
      conversion_event: adsetPayload.promoted_object?.custom_event_type || null,
      excluded_audience_ids: body.excluded_audience_ids || [],
      status: 'PAUSED',
      message: `Ad set "${adsetPayload.name}" creado en la campaña ${campaignId}, en PAUSADO. Ahora agrega anuncios con metaAdsCreateAd usando este adset_id.`,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});