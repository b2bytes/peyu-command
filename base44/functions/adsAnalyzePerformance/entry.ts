// ============================================================================
// adsAnalyzePerformance — Agente "scientist" que analiza rendimiento de Ads
// ----------------------------------------------------------------------------
// Evalúa data (CTR, CPC, conversions, CPA, ROAS) contra el forecast original.
// Detecta winners/losers con razonamiento estadístico (significancia, elevación).
// Payload: { draft_id, actual_metrics: { impressions, clicks, conversions, cost_clp, revenue_clp, days_running } }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Trae métricas reales del tráfico de pago de Google desde GA4 (últimos 7d),
// para que el agente pueda "analizar en vivo" sin que le pasen números a mano.
async function fetchPaidMetricsFromGA4(base44) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');
    if (!accessToken) return null;
    let propertyId = Deno.env.get('GA4_PROPERTY_ID');
    if (!propertyId) {
      const sres = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (sres.ok) {
        const sdata = await sres.json();
        for (const acc of (sdata.accountSummaries || [])) {
          const prop = (acc.propertySummaries || [])[0];
          if (prop?.property) { propertyId = String(prop.property).replace('properties/', ''); break; }
        }
      }
    }
    if (!propertyId) return null;
    propertyId = String(propertyId).replace('properties/', '');
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [
          { name: 'sessions' }, { name: 'totalUsers' }, { name: 'keyEvents' },
          { name: 'conversions' }, { name: 'totalRevenue' },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Sumamos los canales pagados de Google (Paid Search, Paid Shopping, Paid Video, Display).
    let sessions = 0, conversions = 0, revenue = 0;
    for (const r of (data.rows || [])) {
      const ch = (r.dimensionValues?.[0]?.value || '').toLowerCase();
      if (/paid|display|shopping|video|cross-network/.test(ch)) {
        sessions += Number(r.metricValues?.[0]?.value || 0);
        conversions += Number(r.metricValues?.[3]?.value || 0) || Number(r.metricValues?.[2]?.value || 0);
        revenue += Number(r.metricValues?.[4]?.value || 0);
      }
    }
    if (sessions === 0) return null;
    return { source: 'ga4_paid_7d', sessions, conversions, revenue };
  } catch { return null; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { draft_id, actual_metrics } = await req.json();
    if (!draft_id) {
      return Response.json({ error: 'draft_id required' }, { status: 400 });
    }

    const drafts = await base44.asServiceRole.entities.AdCampaignDraft.filter({ id: draft_id });
    const draft = drafts[0];
    if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });

    // Si no nos pasan métricas a mano, intentamos traerlas reales desde GA4 (tráfico pagado).
    let metrics = actual_metrics;
    let metricsSource = 'manual';
    if (!metrics) {
      const ga = await fetchPaidMetricsFromGA4(base44);
      if (ga) {
        // GA4 da sesiones/conversiones/revenue del pago, no impresiones/clics/costo.
        // Estimamos clics ≈ sesiones y dejamos costo desconocido (el agente lo aclara).
        metrics = {
          impressions: 0,
          clicks: ga.sessions,
          conversions: ga.conversions,
          cost_clp: 0,
          revenue_clp: ga.revenue,
          days_running: 7,
        };
        metricsSource = ga.source;
      } else {
        return Response.json({
          error: 'No hay métricas para analizar. Conecta Google Analytics (para leer el tráfico pagado real) o pásame los números de la campaña (impresiones, clics, conversiones, costo).',
          need_metrics: true,
        }, { status: 400 });
      }
    }
    const actual_metrics_resolved = metrics;

    const { impressions = 0, clicks = 0, conversions = 0, cost_clp = 0, revenue_clp = 0, days_running = 1 } = actual_metrics_resolved;
    const actualCtr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const actualCpc = clicks > 0 ? cost_clp / clicks : 0;
    const actualCpa = conversions > 0 ? cost_clp / conversions : 0;
    const actualRoas = cost_clp > 0 ? revenue_clp / cost_clp : 0;
    const convRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

    // Significancia estadística (rule of thumb): conversions > 30 y clicks > 100
    const statSignificant = conversions >= 30 && clicks >= 100;

    const prompt = `Eres el SCIENTIST ASTRONOMER de PEYU Ads Command Center — un analista cuantitativo con
visión de astrónomo (ver patrones en la señal) y rigor de científico (no confundir ruido con señal).

DATA REAL vs FORECAST:
Campaña: ${draft.campaign_name} (${draft.campaign_type}, ${draft.audience_segment})
Días corriendo: ${days_running}

FORECAST (hipótesis del commander):
- CTR esperado: ${draft.expected_ctr_pct}%
- CPC esperado: CLP $${draft.expected_cpc_clp}
- Conversiones/semana: ${draft.expected_conversions_week}
- CAC esperado: CLP $${draft.expected_cac_clp}

OBSERVADO:
- Impresiones: ${impressions.toLocaleString()}
- Clicks: ${clicks.toLocaleString()}
- CTR real: ${actualCtr.toFixed(2)}%
- CPC real: CLP $${Math.round(actualCpc).toLocaleString()}
- Conversiones: ${conversions}
- Conv. rate: ${convRate.toFixed(2)}%
- CPA real: CLP $${Math.round(actualCpa).toLocaleString()}
- Revenue: CLP $${revenue_clp.toLocaleString()}
- ROAS: ${actualRoas.toFixed(2)}x
- Significancia estadística: ${statSignificant ? 'SÍ (conv ≥ 30, clicks ≥ 100)' : 'NO — muestra insuficiente'}

HIPÓTESIS ORIGINAL: ${draft.scientific_hypothesis || 'N/A'}

MISIÓN:
1. Diagnóstico en 2-3 frases: ¿la data confirma o refuta la hipótesis?
2. Si hay desviación grande (>30%) vs forecast, identifica la causa más probable.
3. 3-5 ACCIONES tácticas concretas (pausar keyword X, subir bid en ad group Y, pivot mensaje Z).
4. Veredicto final: WINNER / LOSER / INCONCLUSO / PIVOT_REQUIRED.
5. Score performance 0-100 (0=desastre, 100=dominación absoluta).

Responde JSON estricto.`;

    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          diagnosis: { type: 'string' },
          root_cause: { type: 'string' },
          tactical_actions: { type: 'array', items: { type: 'string' } },
          verdict: { type: 'string', enum: ['WINNER', 'LOSER', 'INCONCLUSO', 'PIVOT_REQUIRED'] },
          performance_score: { type: 'number' },
          statistical_confidence: { type: 'string' },
        },
        required: ['diagnosis', 'verdict', 'performance_score', 'tactical_actions'],
      },
      model: 'claude_sonnet_4_6',
    });

    const statusMap = { WINNER: 'Ganadora', LOSER: 'Perdedora', INCONCLUSO: 'Activa', PIVOT_REQUIRED: 'Pausada' };
    await base44.asServiceRole.entities.AdCampaignDraft.update(draft_id, {
      performance_score: analysis.performance_score,
      scientist_analysis: `${analysis.diagnosis}\n\nRoot cause: ${analysis.root_cause}\n\nAcciones:\n- ${(analysis.tactical_actions || []).join('\n- ')}\n\nVeredicto: ${analysis.verdict} (confianza: ${analysis.statistical_confidence})`,
      status: statusMap[analysis.verdict] || draft.status,
    });

    return Response.json({
      success: true,
      analysis,
      metrics_source: metricsSource,
      observed: {
        ctr_pct: Number(actualCtr.toFixed(2)),
        cpc_clp: Math.round(actualCpc),
        conv_rate_pct: Number(convRate.toFixed(2)),
        cpa_clp: Math.round(actualCpa),
        roas: Number(actualRoas.toFixed(2)),
      },
      statistically_significant: statSignificant,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});