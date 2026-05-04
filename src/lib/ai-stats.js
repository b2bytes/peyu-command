// ============================================================================
// ai-stats.js · Cálculo de KPIs de uso de IA en cliente
// ----------------------------------------------------------------------------
// Reemplaza/complementa la función backend aiUsageStats. Toma una lista de
// AILog y produce el mismo shape que aiUsageStats para alimentar los gráficos.
// Es resiliente: si falla la función backend, el frontend sigue funcionando.
// ============================================================================
export function computeAIStats(logs, sinceDate) {
  const since = sinceDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = (logs || []).filter(l => new Date(l.created_date) >= since);

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
    else if (log.status === 'success' || !log.status) success++;
    if (log.marked_for_retraining) retrainQueue++;
    if (!log.auditor_review || log.auditor_review === 'pending') pendingReview++;

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

  return {
    ok: true,
    window: { since: since.toISOString(), until: new Date().toISOString() },
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
  };
}

// Mapa de acciones de auditoría → updates a aplicar en AILog
export function buildAuditUpdates(action, { correctedResponse, notes } = {}) {
  const updates = {};
  switch (action) {
    case 'approve':
      updates.auditor_review = 'approved';
      updates.marked_for_retraining = false;
      break;
    case 'flag':
      updates.auditor_review = 'flagged';
      break;
    case 'retrain':
      updates.auditor_review = 'needs_retraining';
      updates.marked_for_retraining = true;
      updates.retraining_status = 'queued';
      if (correctedResponse) updates.retraining_corrected_response = correctedResponse;
      break;
    case 'reject_retrain':
      updates.marked_for_retraining = false;
      updates.retraining_status = 'rejected';
      break;
    case 'apply_retrain':
      updates.retraining_status = 'applied';
      break;
  }
  if (notes !== undefined) updates.auditor_notes = notes;
  return updates;
}