// ============================================================================
// aiUsageStats · KPIs agregados del uso de IA (v3)
// ----------------------------------------------------------------------------
// Calcula estadísticas para el dashboard de monitoreo: tokens totales, costo,
// latencia promedio, distribución por modelo y agente, casos pendientes de
// auditoría y casos marcados para re-entrenamiento.
// Acepta { since: ISOString? } para filtrar por ventana temporal.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { since } = await req.json().catch(() => ({}));
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Trae los últimos 500 logs (suficiente para 7 días de actividad típica)
    const logs = await base44.asServiceRole.entities.AILog.list('-created_date', 500);
    const recent = logs.filter(l => new Date(l.created_date) >= sinceDate);

    const byModel = {};
    const byAgent = {};
    const byTask = {};
    const byDay = {};

    let tokensTotal = 0, tokensIn = 0, tokensOut = 0, costTotal = 0;
    let latencySum = 0, latencyCount = 0;
    let errors = 0, success = 0, retrainQueue = 0, pendingReview = 0;

    for (const log of recent) {
      tokensTotal += log.tokens_total || 0;
      tokensIn += log.tokens_input || 0;
      tokensOut += log.tokens_output || 0;
      costTotal += log.cost_usd || 0;
      if (log.latency_ms) {
        latencySum += log.latency_ms;
        latencyCount++;
      }
      if (log.status === 'error' || log.status === 'timeout') errors++;
      else if (log.status === 'success') success++;
      if (log.marked_for_retraining) retrainQueue++;
      if (log.auditor_review === 'pending') pendingReview++;

      const m = log.model || 'unknown';
      byModel[m] = byModel[m] || { count: 0, tokens: 0, cost: 0 };
      byModel[m].count++;
      byModel[m].tokens += log.tokens_total || 0;
      byModel[m].cost += log.cost_usd || 0;

      const a = log.agent_name || 'unknown';
      byAgent[a] = byAgent[a] || { count: 0, tokens: 0 };
      byAgent[a].count++;
      byAgent[a].tokens += log.tokens_total || 0;

      const t = log.task_type || 'other';
      byTask[t] = (byTask[t] || 0) + 1;

      const day = new Date(log.created_date).toISOString().slice(0, 10);
      byDay[day] = byDay[day] || { day, calls: 0, tokens: 0, cost: 0 };
      byDay[day].calls++;
      byDay[day].tokens += log.tokens_total || 0;
      byDay[day].cost += log.cost_usd || 0;
    }

    return Response.json({
      ok: true,
      window: { since: sinceDate.toISOString(), until: new Date().toISOString() },
      total_calls: recent.length,
      tokens: { input: tokensIn, output: tokensOut, total: tokensTotal },
      cost_usd: Number(costTotal.toFixed(4)),
      latency_ms_avg: latencyCount > 0 ? Math.round(latencySum / latencyCount) : 0,
      success_rate: recent.length > 0 ? Number((success / recent.length).toFixed(3)) : 0,
      errors,
      retrain_queue: retrainQueue,
      pending_review: pendingReview,
      by_model: byModel,
      by_agent: byAgent,
      by_task: byTask,
      by_day: Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});