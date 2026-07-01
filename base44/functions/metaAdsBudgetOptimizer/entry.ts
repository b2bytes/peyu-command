import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsBudgetOptimizer · Reasignación INTELIGENTE de presupuesto entre campañas.
// ----------------------------------------------------------------------------
// Analiza el ROAS y CPA de cada campaña activa y propone un plan de
// reasignación: subir presupuesto a las ganadoras, bajar o pausar las
// perdedoras. Piensa como un media buyer de agencia optimizando el budget
// total para maximizar conversiones al menor CPA.
//
// Lógica:
//   1. Trae todas las campañas activas con insights (gasto + ROAS + CPA).
//   2. Clasifica cada una: WINNER (ROAS > target), MEDIO, PERDEDORA (ROAS < 0.5x target).
//   3. Calcula el presupuesto total actual y lo redistribuye:
//      - WINNERS: +30% del budget de perdedoras.
//      - PERDEDORAS: -50% o pausar (según severidad).
//      - MEDIOS: mantener.
//   4. Devuelve el plan ANTES/DESPUÉS con CLP exactos + impacto estimado.
//
// Payload:
//   { target_roas?: number }     — ROAS objetivo (default 1.5)
//   { date_preset?: string }     — período de análisis (default 'last_7d')
//   { apply?: boolean }          — false (default) = solo plan; true = ejecuta
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
  if (code === 190) return { reason: 'token_invalido', error: 'Token inválido.', detail: msg };
  if (code === 200 || code === 10) return { reason: 'sin_permiso', error: 'Sin permiso.', detail: msg };
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
    const datePreset = body.date_preset || 'last_7d';
    const targetRoas = Number(body.target_roas) || 1.5;
    const apply = body.apply === true;
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // 1 · Campañas activas con presupuesto
    const campRes = await fetch(`${base}/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,objective&limit=200&access_token=${t}`);
    const campData = await campRes.json();
    if (campData.error) return Response.json({ ok: false, ...diagnoseMetaError(campData.error) });
    const campaigns = (campData.data || []).filter(c => c.status === 'ACTIVE' && (c.daily_budget || c.lifetime_budget));

    // 2 · Insights por campaña
    const insRes = await fetch(`${base}/${accountId}/insights?level=campaign&fields=campaign_id,spend,purchase_roas,ctr,frequency,actions&date_preset=${datePreset}&limit=200&access_token=${t}`);
    const insData = await insRes.json();
    if (insData.error) return Response.json({ ok: false, ...diagnoseMetaError(insData.error) });
    const insMap = {};
    for (const ins of (insData.data || [])) insMap[ins.campaign_id] = ins;

    // 3 · Clasificar campañas
    const classified = campaigns.map(c => {
      const ins = insMap[c.id] || {};
      const spend = Number(ins.spend || 0);
      const actionsArr = Array.isArray(ins.actions) ? ins.actions : [];
      const conversions = Number(actionsArr.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'purchase' || a.action_type === 'offsite_conversion')?.value || 0);
      const roas = Number(ins.purchase_roas || 0);
      const ctr = Number(ins.ctr || 0);
      const freq = Number(ins.frequency || 0);
      const dailyBudget = c.daily_budget ? Number(c.daily_budget) : 0;
      const cpa = conversions > 0 ? spend / conversions : 0;

      let category = 'medio';
      let recommendation = 'mantener';
      let reason = '';

      if (spend === 0) {
        category = 'sin_gasto';
        recommendation = 'investigar';
        reason = 'Sin gasto en el período. Posible problema de entrega.';
      } else if (roas >= targetRoas && conversions > 0) {
        category = 'winner';
        recommendation = 'escalar';
        reason = `ROAS ${roas.toFixed(2)}x ≥ objetivo ${targetRoas}x. Escalar para capturar más volumen.`;
      } else if (spend > 5000 && conversions === 0) {
        category = 'perdedora';
        recommendation = 'pausar';
        reason = `$${Math.round(spend)} de gasto con 0 conversiones. Pausar y redirigir presupuesto.`;
      } else if (roas > 0 && roas < targetRoas * 0.5) {
        category = 'perdedora';
        recommendation = 'bajar';
        reason = `ROAS ${roas.toFixed(2)}x < 50% del objetivo. Bajar presupuesto y revisar creativos.`;
      } else if (roas > 0 && roas < targetRoas) {
        category = 'medio';
        recommendation = 'mantener';
        reason = `ROAS ${roas.toFixed(2)}x cerca del objetivo. Monitorear.`;
      } else if (freq > 3.0) {
        category = 'fatiga';
        recommendation = 'renovar';
        reason = `Frecuencia ${freq.toFixed(1)} — fatiga creativa. Renovar antes de subir presupuesto.`;
      }

      return {
        campaign_id: c.id,
        name: c.name,
        objective: c.objective,
        current_daily_budget: dailyBudget,
        spend_clp: Math.round(spend),
        conversions,
        roas: roas > 0 ? Number(roas.toFixed(2)) : null,
        cpa_clp: cpa > 0 ? Math.round(cpa) : null,
        ctr_pct: ctr > 0 ? Number(ctr.toFixed(2)) : null,
        frequency: freq > 0 ? Number(freq.toFixed(1)) : null,
        category,
        recommendation,
        reason,
        new_daily_budget: dailyBudget,
        budget_change: 0,
      };
    });

    // 4 · Calcular reasignación
    const winners = classified.filter(c => c.category === 'winner');
    const perdedoras = classified.filter(c => c.category === 'perdedora');
    const fatigadas = classified.filter(c => c.category === 'fatiga');

    // Presupuesto a liberar de perdedoras
    let freedBudget = 0;
    for (const c of perdedoras) {
      if (c.recommendation === 'pausar') {
        freedBudget += c.current_daily_budget;
        c.new_daily_budget = 0;
        c.budget_change = -c.current_daily_budget;
      } else if (c.recommendation === 'bajar') {
        const reduction = Math.round(c.current_daily_budget * 0.5);
        freedBudget += reduction;
        c.new_daily_budget = c.current_daily_budget - reduction;
        c.budget_change = -reduction;
      }
    }
    // Fatigadas: no escalar hasta renovar (mantener presupuesto)
    for (const c of fatigadas) {
      c.new_daily_budget = c.current_daily_budget;
      c.budget_change = 0;
    }

    // Redistribuir el presupuesto liberado entre winners
    if (winners.length > 0 && freedBudget > 0) {
      const perWinner = Math.round(freedBudget / winners.length);
      for (const c of winners) {
        c.new_daily_budget = c.current_daily_budget + perWinner;
        c.budget_change = perWinner;
      }
    }

    // 5 · Impacto estimado
    const totalCurrentBudget = classified.reduce((s, c) => s + c.current_daily_budget, 0);
    const totalNewBudget = classified.reduce((s, c) => s + c.new_daily_budget, 0);
    const winnersCurrentSpend = winners.reduce((s, c) => s + c.spend_clp, 0);
    const winnersCurrentConv = winners.reduce((s, c) => s + c.conversions, 0);
    const winnerCpa = winnersCurrentConv > 0 ? winnersCurrentSpend / winnersCurrentConv : 0;
    // Estimación: presupuesto adicional × CPA inverso = conversiones extra
    const extraBudgetPerDay = winners.reduce((s, c) => s + Math.max(0, c.budget_change), 0);
    const estimatedExtraConversions = winnerCpa > 0 ? Math.round(extraBudgetPerDay / winnerCpa * 7) : 0; // por semana

    // 6 · Aplicar cambios si apply=true
    const applied = [];
    const applyErrors = [];
    if (apply) {
      for (const c of classified) {
        if (c.budget_change === 0) continue;
        if (c.recommendation === 'pausar') {
          // Pausar la campaña
          const res = await fetch(`${base}/${c.campaign_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'PAUSED', access_token: token }),
          });
          const data = await res.json();
          if (data.error) { applyErrors.push({ campaign_id: c.campaign_id, error: data.error.message }); }
          else { applied.push({ campaign_id: c.campaign_id, name: c.name, action: 'paused' }); }
        } else {
          // Cambiar presupuesto
          const res = await fetch(`${base}/${c.campaign_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ daily_budget: String(c.new_daily_budget), access_token: token }),
          });
          const data = await res.json();
          if (data.error) { applyErrors.push({ campaign_id: c.campaign_id, error: data.error.message }); }
          else { applied.push({ campaign_id: c.campaign_id, name: c.name, action: 'budget_changed', new_budget: c.new_daily_budget }); }
        }
      }
    }

    return Response.json({
      ok: true,
      date_preset: datePreset,
      target_roas: targetRoas,
      applied,
      apply_errors: applyErrors,
      summary: {
        total_campaigns: classified.length,
        winners: winners.length,
        perdedoras: perdedoras.length,
        fatigadas: fatigadas.length,
        total_current_daily_budget: totalCurrentBudget,
        total_new_daily_budget: totalNewBudget,
        freed_budget_per_day: freedBudget,
        estimated_extra_conversions_per_week: estimatedExtraConversions,
      },
      reallocation_plan: classified
        .filter(c => c.budget_change !== 0 || c.category !== 'medio')
        .sort((a, b) => {
          const order = { winner: 0, perdedora: 1, fatiga: 2, sin_gasto: 3, medio: 4 };
          return (order[a.category] || 5) - (order[b.category] || 5);
        }),
      all_campaigns: classified,
      nota: apply
        ? 'Cambios APLICADOS. Revisa el rendimiento en 3-5 días antes de ajustar de nuevo.'
        : 'Plan SIN aplicar. Llama con apply:true para ejecutar (requiere confirmación del founder).',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});