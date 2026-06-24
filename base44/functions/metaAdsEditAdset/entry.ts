import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsEditAdset · Edita un AD SET EXISTENTE (lo que metaAdsManage no cubre).
// Permite al agente cambiar audiencia, evento de conversión, presupuesto, edad,
// y excluir/incluir custom audiences (ej: excluir compradores de 180 días) sin
// recrear el ad set.
//
// Payload (todo opcional salvo adset_id; solo se aplica lo que mandes):
//   {
//     adset_id: '123',                       // obligatorio
//     name?: 'Nuevo nombre',
//     daily_budget_clp?: 5000,
//     conversion_event?: 'PURCHASE'|'LEAD'|'ADD_TO_CART'|...,  // cambia promoted_object
//     age_min?: 18, age_max?: 65,
//     countries?: ['CL'],
//     genders?: [1,2],
//     interests?: [{ id, name }],            // reemplaza el detailed targeting
//     included_audience_ids?: ['aud1'],      // custom audiences a INCLUIR
//     excluded_audience_ids?: ['aud2'],      // custom audiences a EXCLUIR
//   }
// Para cambiar targeting (edad/país/género/intereses/audiencias) se lee el
// targeting actual y se hace merge con lo que envíes, para no romper el resto.
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
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para editar este ad set.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido al editar el ad set: ' + msg, detail: msg };
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
    const adsetId = body.adset_id;
    if (!adsetId) return Response.json({ ok: false, error: 'Falta adset_id.' });

    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    const update = {};
    const applied = [];

    if (body.name) { update.name = body.name; applied.push('nombre'); }

    if (body.daily_budget_clp != null) {
      const clp = Math.round(Number(body.daily_budget_clp));
      if (!clp || clp < 1000) return Response.json({ ok: false, error: 'daily_budget_clp inválido (mínimo ~$1.000).' });
      update.daily_budget = String(clp);
      applied.push(`presupuesto $${clp}`);
    }

    // ¿Hay que tocar targeting? Solo si llega alguno de estos campos.
    const touchTargeting = body.age_min != null || body.age_max != null || body.countries
      || body.genders || body.interests || body.included_audience_ids || body.excluded_audience_ids;

    if (touchTargeting) {
      // Leemos el targeting actual para hacer merge (no pisar lo demás).
      const curRes = await fetch(`${base}/${adsetId}?fields=targeting&access_token=${t}`);
      const cur = await curRes.json();
      if (cur.error) return Response.json({ ok: false, ...diagnoseMetaError(cur.error) });
      const targeting = cur.targeting || {};

      if (body.countries) { targeting.geo_locations = { ...(targeting.geo_locations || {}), countries: body.countries }; applied.push('países'); }
      if (body.age_min != null) { targeting.age_min = Number(body.age_min); applied.push('edad mín'); }
      if (body.age_max != null) { targeting.age_max = Number(body.age_max); applied.push('edad máx'); }
      if (body.genders) { targeting.genders = body.genders; applied.push('género'); }
      if (body.interests) {
        targeting.flexible_spec = [{ interests: body.interests.map(i => ({ id: i.id, name: i.name })) }];
        applied.push('intereses');
      }
      if (body.included_audience_ids) {
        targeting.custom_audiences = body.included_audience_ids.map(id => ({ id }));
        applied.push('audiencias incluidas');
      }
      if (body.excluded_audience_ids) {
        targeting.excluded_custom_audiences = body.excluded_audience_ids.map(id => ({ id }));
        applied.push('audiencias excluidas');
      }
      update.targeting = JSON.stringify(targeting);
    }

    // Cambiar el evento de conversión (promoted_object) — requiere el pixel.
    if (body.conversion_event) {
      let pixelId = null;
      const pixRes = await fetch(`${base}/${accountId}/adspixels?fields=id&access_token=${t}`);
      const pix = await pixRes.json();
      if (!pix.error) pixelId = (pix.data || [])[0]?.id || null;
      if (!pixelId) return Response.json({ ok: false, reason: 'sin_pixel', error: 'No hay pixel en la cuenta para fijar el evento de conversión.' });
      update.promoted_object = JSON.stringify({ pixel_id: pixelId, custom_event_type: body.conversion_event });
      applied.push(`evento ${body.conversion_event}`);
    }

    if (Object.keys(update).length === 0) {
      return Response.json({ ok: false, error: 'No enviaste ningún cambio. Indica al menos uno: nombre, presupuesto, audiencia, evento, edad, etc.' });
    }

    const res = await fetch(`${base}/${adsetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...update, access_token: token }),
    });
    const data = await res.json();
    if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });

    return Response.json({
      ok: true,
      adset_id: adsetId,
      cambios_aplicados: applied,
      message: `Ad set ${adsetId} actualizado: ${applied.join(', ')}.`,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});