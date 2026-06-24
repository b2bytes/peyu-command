import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsBulkRule · Acciones MASIVAS por REGLA (el media buyer automático).
// Lee métricas reales del periodo, FILTRA por una condición y EJECUTA en lote.
// Resuelve pedidos tipo:
//   "Sube 20% el presupuesto de todo lo que tenga ROAS > 3"
//   "Pausa los anuncios con CPA > $10.000"
//   "Activa los ad sets con ROAS > 4"
//
// Payload:
//   {
//     level: 'campaign' | 'adset' | 'ad',     // sobre qué objetos opera
//     metric: 'roas'|'cpa'|'ctr'|'cpc'|'cpm'|'frequency'|'spend'|'conversions',
//     operator: 'gt'|'gte'|'lt'|'lte',
//     value: number,                          // umbral de la métrica
//     action: 'pause'|'activate'|'increase_budget'|'decrease_budget',
//     budget_pct?: 20,                        // % para increase/decrease_budget
//     date_preset?: 'last_30d',
//     min_spend_clp?: 1000,                   // ignora objetos con poco gasto
//     dry_run?: true                          // SOLO simula, no ejecuta (default true)
//   }
//
// dry_run=true (default) devuelve a QUÉ objetos aplicaría sin tocar nada — el
// agente lo usa para mostrar la lista y confirmar. Con dry_run=false ejecuta.
// El presupuesto solo se ajusta a nivel campaign/adset (no ad).
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
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El System User no tiene permiso (ads_management + tarea MANAGE).', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: msg, detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

const PURCHASE_TYPES = ['purchase', 'offsite_conversion.fb_pixel_purchase', 'omni_purchase'];
const CONV_TYPES = [...PURCHASE_TYPES, 'lead', 'offsite_conversion.fb_pixel_lead'];

function parseRow(d) {
  const conv = (d.actions || []).find(a => CONV_TYPES.includes(a.action_type));
  const conversions = conv ? Number(conv.value) : 0;
  const valObj = (d.action_values || []).find(a => PURCHASE_TYPES.includes(a.action_type));
  const conversion_value = valObj ? Number(valObj.value) : 0;
  const spend = Number(d.spend || 0);
  const roasObj = (d.purchase_roas || [])[0];
  const roas = roasObj ? Number(roasObj.value) : (spend > 0 && conversion_value > 0 ? conversion_value / spend : 0);
  return {
    spend,
    ctr: Number(d.ctr || 0),
    cpc: Number(d.cpc || 0),
    cpm: Number(d.cpm || 0),
    frequency: Number(d.frequency || 0),
    conversions,
    conversion_value,
    roas,
    cpa: conversions > 0 ? spend / conversions : 0,
  };
}

function cmp(val, operator, threshold) {
  switch (operator) {
    case 'gt': return val > threshold;
    case 'gte': return val >= threshold;
    case 'lt': return val < threshold;
    case 'lte': return val <= threshold;
    default: return false;
  }
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
    const level = ['campaign', 'adset', 'ad'].includes(body.level) ? body.level : 'campaign';
    const metric = body.metric || 'roas';
    const operator = body.operator || 'gt';
    const value = Number(body.value);
    const action = body.action;
    const datePreset = body.date_preset || 'last_30d';
    const minSpend = Number(body.min_spend_clp || 1000);
    const budgetPct = Number(body.budget_pct || 20);
    const dryRun = body.dry_run !== false; // default true (simula)

    if (Number.isNaN(value)) return Response.json({ ok: false, error: 'Falta value (umbral numérico de la métrica).' });
    if (!['pause', 'activate', 'increase_budget', 'decrease_budget'].includes(action)) {
      return Response.json({ ok: false, error: "action debe ser 'pause', 'activate', 'increase_budget' o 'decrease_budget'." });
    }
    const isBudget = action === 'increase_budget' || action === 'decrease_budget';
    if (isBudget && level === 'ad') {
      return Response.json({ ok: false, error: 'El presupuesto solo se ajusta a nivel campaign o adset, no de anuncio.' });
    }

    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // 1) Insights del nivel pedido.
    const idField = level === 'campaign' ? 'campaign_id,campaign_name'
      : level === 'adset' ? 'adset_id,adset_name' : 'ad_id,ad_name';
    const fields = `${idField},spend,ctr,cpc,cpm,frequency,actions,action_values,purchase_roas`;
    const insRes = await fetch(`${base}/${accountId}/insights?level=${level}&date_preset=${datePreset}&fields=${fields}&limit=500&access_token=${t}`);
    const ins = await insRes.json();
    if (ins.error) return Response.json({ ok: false, ...diagnoseMetaError(ins.error) });

    // 2) Filtra por la regla.
    const matched = [];
    for (const d of (ins.data || [])) {
      const m = parseRow(d);
      if (m.spend < minSpend) continue;
      const metricVal = m[metric];
      if (metricVal == null) continue;
      if (cmp(metricVal, operator, value)) {
        const id = d[`${level}_id`];
        const name = d[`${level}_name`];
        matched.push({ id, name, metric_value: metricVal, ...m });
      }
    }

    // 3) Para presupuesto necesitamos el presupuesto actual de cada objeto.
    if (isBudget) {
      for (const obj of matched) {
        const r = await fetch(`${base}/${obj.id}?fields=daily_budget&access_token=${t}`);
        const j = await r.json();
        obj.daily_budget_actual = j.daily_budget ? Number(j.daily_budget) : null;
        if (obj.daily_budget_actual != null) {
          const factor = action === 'increase_budget' ? (1 + budgetPct / 100) : (1 - budgetPct / 100);
          obj.daily_budget_nuevo = Math.max(1000, Math.round(obj.daily_budget_actual * factor));
        }
      }
    }

    const resumen = {
      ok: true,
      level, metric, operator, value, action,
      ...(isBudget ? { budget_pct: budgetPct } : {}),
      date_preset: datePreset,
      dry_run: dryRun,
      matched_count: matched.length,
      matched: matched.map(o => ({
        id: o.id, name: o.name,
        [metric]: Math.round(o.metric_value * 100) / 100,
        spend: Math.round(o.spend),
        ...(isBudget ? { daily_budget_actual: o.daily_budget_actual, daily_budget_nuevo: o.daily_budget_nuevo } : {}),
      })),
    };

    // 4) dry_run: devuelve la lista sin ejecutar (para confirmar).
    if (dryRun) {
      resumen.message = matched.length
        ? `${matched.length} ${level}(s) cumplen la regla (${metric} ${operator} ${value}). Esto es una SIMULACIÓN — confirma para aplicar "${action}".`
        : `Ningún ${level} cumple la regla (${metric} ${operator} ${value}) con gasto ≥ $${minSpend}.`;
      return Response.json(resumen);
    }

    // 5) Ejecuta en lote.
    const ejecutadas = [];
    const fallidas = [];
    for (const obj of matched) {
      let payload = null;
      if (action === 'pause') payload = { status: 'PAUSED' };
      else if (action === 'activate') payload = { status: 'ACTIVE' };
      else if (isBudget && obj.daily_budget_nuevo != null) payload = { daily_budget: String(obj.daily_budget_nuevo) };
      if (!payload) { fallidas.push({ id: obj.id, name: obj.name, error: 'Sin presupuesto actual para ajustar.' }); continue; }

      const r = await fetch(`${base}/${obj.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_token: token }),
      });
      const j = await r.json();
      if (j.error) fallidas.push({ id: obj.id, name: obj.name, ...diagnoseMetaError(j.error) });
      else ejecutadas.push({ id: obj.id, name: obj.name, ...(isBudget ? { daily_budget_nuevo: obj.daily_budget_nuevo } : { new_status: payload.status }) });
    }

    resumen.executed = ejecutadas;
    resumen.failed = fallidas;
    resumen.message = `Regla aplicada: ${ejecutadas.length} ${level}(s) afectados con "${action}"${fallidas.length ? `, ${fallidas.length} fallaron` : ''}.`;
    return Response.json(resumen);
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});