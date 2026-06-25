import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsAutoRules · Crea y gestiona REGLAS AUTOMÁTICAS PERMANENTES de Meta
// (las "Automated Rules" del Ads Manager) que corren SOLAS 24/7 en los
// servidores de Meta — no requieren que la app esté despierta.
// ----------------------------------------------------------------------------
// El gran faltante #5: metaAdsBulkRule actúa UNA vez. Una agencia deja reglas
// vivas tipo "pausa el anuncio si el CPA supera $X por 3 días" o "sube 20% el
// presupuesto si el ROAS > 3". Eso es lo que hace esta función, usando el
// endpoint nativo /adrules_library de Meta (la regla queda guardada en la
// cuenta y Meta la evalúa por su cuenta).
//
// Acciones:
//   - 'list'   : lista las reglas automáticas existentes en la cuenta.
//   - 'create' : crea una regla desde un PRESET legible o desde una condición
//                custom. PAUSAR es seguro (no gasta); SUBIR presupuesto solo se
//                crea si confirm:true.
//   - 'toggle' : { rule_id, enable:true|false } activa/desactiva una regla.
//   - 'delete' : { rule_id } elimina una regla.
//
// Presets (preset):
//   'pausar_cpa_alto'      : pausa anuncios con CPA > value por encima de min_spend.
//   'pausar_ctr_bajo'      : pausa anuncios con CTR < value (%) tras gastar.
//   'pausar_frecuencia'    : pausa anuncios con frecuencia > value (fatiga).
//   'subir_budget_roas'    : +budget_pct% al ad set si ROAS > value (necesita confirm).
//   'bajar_budget_cpa'     : -budget_pct% al ad set si CPA > value (necesita confirm).
//
// Payload create:
//   { action:'create', preset, value, min_spend_clp?, budget_pct?, name?,
//     schedule?:'continuous'|'daily', confirm? }
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
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para gestionar reglas automáticas.', detail: msg };
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

async function graphDelete(path, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}?access_token=${encodeURIComponent(token)}`, { method: 'DELETE' });
  return res.json();
}

// Construye el spec de una regla automática de Meta desde un preset legible.
// Devuelve { name, evaluation_spec, execution_spec } o { error }.
function buildRuleSpec(preset, opts) {
  const minSpend = Math.round(Number(opts.min_spend_clp || 5000)); // CLP en unidades enteras
  const value = Number(opts.value);
  const budgetPct = Math.max(1, Math.min(1000, Number(opts.budget_pct || 20)));
  if (!Number.isFinite(value)) return { error: 'Falta value (el umbral de la regla).' };

  // Filtro base: solo entidades ACTIVE con gasto mínimo (evita falsos positivos).
  const baseFilters = [
    { field: 'entity_type', value: 'AD', operator: 'EQUAL' },
    { field: 'time_preset', value: 'LAST_3_DAYS', operator: 'EQUAL' },
    { field: 'spent', value: minSpend, operator: 'GREATER_THAN' },
  ];

  const PRESETS = {
    pausar_cpa_alto: {
      name: opts.name || `Pausar si CPA > $${value}`,
      filters: [...baseFilters, { field: 'cost_per', value, operator: 'GREATER_THAN', extra_data: JSON.stringify({ action_type: 'offsite_conversion.fb_pixel_purchase' }) }],
      execution: { execution_type: 'PAUSE' },
      gasta: false,
    },
    pausar_ctr_bajo: {
      name: opts.name || `Pausar si CTR < ${value}%`,
      filters: [...baseFilters, { field: 'ctr', value, operator: 'LESS_THAN' }],
      execution: { execution_type: 'PAUSE' },
      gasta: false,
    },
    pausar_frecuencia: {
      name: opts.name || `Pausar si frecuencia > ${value} (fatiga)`,
      filters: [...baseFilters, { field: 'frequency', value, operator: 'GREATER_THAN' }],
      execution: { execution_type: 'PAUSE' },
      gasta: false,
    },
    subir_budget_roas: {
      name: opts.name || `Subir presupuesto +${budgetPct}% si ROAS > ${value}`,
      filters: [
        { field: 'entity_type', value: 'ADSET', operator: 'EQUAL' },
        { field: 'time_preset', value: 'LAST_3_DAYS', operator: 'EQUAL' },
        { field: 'spent', value: minSpend, operator: 'GREATER_THAN' },
        { field: 'website_purchase_roas', value, operator: 'GREATER_THAN' },
      ],
      execution: { execution_type: 'CHANGE_BUDGET', execution_options: JSON.stringify([{ field: 'change_spec', value: { amount: `${budgetPct}%`, limit_type: 'INCREASE_TO', metric: 'daily_budget' }, operator: 'EQUAL' }]) },
      gasta: true,
    },
    bajar_budget_cpa: {
      name: opts.name || `Bajar presupuesto -${budgetPct}% si CPA > $${value}`,
      filters: [
        { field: 'entity_type', value: 'ADSET', operator: 'EQUAL' },
        { field: 'time_preset', value: 'LAST_3_DAYS', operator: 'EQUAL' },
        { field: 'spent', value: minSpend, operator: 'GREATER_THAN' },
        { field: 'cost_per', value, operator: 'GREATER_THAN', extra_data: JSON.stringify({ action_type: 'offsite_conversion.fb_pixel_purchase' }) },
      ],
      execution: { execution_type: 'CHANGE_BUDGET', execution_options: JSON.stringify([{ field: 'change_spec', value: { amount: `${budgetPct}%`, limit_type: 'DECREASE_BY', metric: 'daily_budget' }, operator: 'EQUAL' }]) },
      gasta: false,
    },
  };

  const p = PRESETS[preset];
  if (!p) return { error: `preset inválido. Usa: ${Object.keys(PRESETS).join(', ')}.` };

  const schedule = opts.schedule === 'daily'
    ? { schedule_type: 'DAILY', schedule: JSON.stringify([{ start_minute: 0, end_minute: 1439, days: [0, 1, 2, 3, 4, 5, 6] }]) }
    : { schedule_type: 'SEMI_HOURLY' }; // continuo: Meta evalúa cada ~30 min

  return {
    name: p.name,
    gasta: p.gasta,
    evaluation_spec: JSON.stringify({ evaluation_type: 'SCHEDULE', filters: p.filters }),
    execution_spec: JSON.stringify(p.execution),
    schedule_spec: JSON.stringify(schedule),
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
    const action = body.action || 'list';

    // ── LISTAR REGLAS ─────────────────────────────────────────────────────
    if (action === 'list') {
      const data = await graphGet(`${accountId}/adrules_library?fields=id,name,status,evaluation_spec,execution_spec&limit=50`, token);
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const reglas = (data.data || []).map((r) => ({ rule_id: r.id, name: r.name, status: r.status, accion: r.execution_spec?.execution_type }));
      return Response.json({ ok: true, action, count: reglas.length, reglas, message: reglas.length ? `Hay ${reglas.length} regla(s) automática(s) en la cuenta.` : 'No hay reglas automáticas creadas todavía.' });
    }

    // ── CREAR REGLA ───────────────────────────────────────────────────────
    if (action === 'create') {
      const spec = buildRuleSpec(body.preset, body);
      if (spec.error) return Response.json({ ok: false, error: spec.error });

      // Las reglas que SUBEN presupuesto gastan: exigen confirmación explícita.
      if (spec.gasta && !body.confirm) {
        return Response.json({
          ok: false,
          requiere_confirmacion: true,
          regla_propuesta: spec.name,
          message: `Esta regla SUBE presupuesto automáticamente (gasta más). Te la dejo lista: "${spec.name}". Confírmame con confirm:true para crearla.`,
        });
      }

      const data = await graphPost(`${accountId}/adrules_library`, {
        name: spec.name,
        evaluation_spec: spec.evaluation_spec,
        execution_spec: spec.execution_spec,
        schedule_spec: spec.schedule_spec,
        status: 'ENABLED',
      }, token);
      if (data.error) return Response.json({ ok: false, step: 'create', ...diagnoseMetaError(data.error) });

      return Response.json({
        ok: true,
        action,
        rule_id: data.id,
        name: spec.name,
        message: `Regla automática "${spec.name}" creada y ACTIVADA. Meta la evalúa solo (24/7, sin depender de la app) y la ejecuta cuando se cumpla la condición.`,
      });
    }

    // ── ACTIVAR/DESACTIVAR ────────────────────────────────────────────────
    if (action === 'toggle') {
      if (!body.rule_id) return Response.json({ ok: false, error: 'Falta rule_id.' });
      const status = body.enable === false ? 'DISABLED' : 'ENABLED';
      const data = await graphPost(`${body.rule_id}`, { status }, token);
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({ ok: true, action, rule_id: body.rule_id, status, message: `Regla ${status === 'ENABLED' ? 'activada' : 'desactivada'}.` });
    }

    // ── ELIMINAR ──────────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!body.rule_id) return Response.json({ ok: false, error: 'Falta rule_id.' });
      const data = await graphDelete(`${body.rule_id}`, token);
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({ ok: true, action, rule_id: body.rule_id, message: 'Regla eliminada.' });
    }

    return Response.json({ ok: false, error: "action debe ser 'list', 'create', 'toggle' o 'delete'." });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});