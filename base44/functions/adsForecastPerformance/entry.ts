// ============================================================================
// adsForecastPerformance — IA que predice el rendimiento de un draft Google Ads
// ----------------------------------------------------------------------------
// FLUJO:
//   1. Recibe un draft_id de AdCampaignDraft.
//   2. Carga el draft + hasta 20 campañas históricas (con scientist_analysis o
//      performance_score conocidos) como contexto comparativo.
//   3. Llama a GPT-5-4 con prompt estructurado y response_json_schema.
//   4. IA retorna predicciones pesimista/esperada/optimista para 5 KPIs:
//      impressions, ctr, conversions, cac, roas + score 0-100 + risk_flags.
//   5. Persiste el forecast en draft.forecast y retorna al cliente.
//
// Cacheado en la entidad → solo re-corre si el usuario lo pide explícitamente.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FORECAST_SCHEMA = {
  type: 'object',
  properties: {
    confidence_score: { type: 'number', description: 'Confianza 0-100 en la predicción' },
    performance_score: { type: 'number', description: 'Score esperado 0-100 (0=fracaso, 100=ganadora)' },
    verdict: { type: 'string', enum: ['ship_it', 'review', 'pivot', 'kill'], description: 'Recomendación accionable' },
    headline: { type: 'string', description: 'Resumen de 1 frase impactante (max 100 chars)' },
    impressions_weekly: {
      type: 'object',
      properties: {
        pessimistic: { type: 'number' },
        expected: { type: 'number' },
        optimistic: { type: 'number' },
      }
    },
    ctr_pct: {
      type: 'object',
      properties: {
        pessimistic: { type: 'number' },
        expected: { type: 'number' },
        optimistic: { type: 'number' },
      }
    },
    conversions_weekly: {
      type: 'object',
      properties: {
        pessimistic: { type: 'number' },
        expected: { type: 'number' },
        optimistic: { type: 'number' },
      }
    },
    cac_clp: {
      type: 'object',
      properties: {
        pessimistic: { type: 'number' },
        expected: { type: 'number' },
        optimistic: { type: 'number' },
      }
    },
    roas: {
      type: 'object',
      properties: {
        pessimistic: { type: 'number', description: 'ROAS multiple, ej 2.5 = 250%' },
        expected: { type: 'number' },
        optimistic: { type: 'number' },
      }
    },
    risk_flags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Riesgos detectados (max 5): keywords saturadas, CPC alto, copy débil, audiencia muy amplia, etc.'
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: 'Fortalezas detectadas (max 4)'
    },
    optimization_suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          area: { type: 'string', description: 'Headlines, Keywords, Audience, Budget, Bid, Creative' },
          suggestion: { type: 'string' },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] }
        }
      },
      description: 'Sugerencias accionables (3-6)'
    },
    comparable_campaigns: {
      type: 'array',
      items: { type: 'string' },
      description: 'Nombres de campañas históricas similares usadas como referencia'
    }
  },
  required: ['performance_score', 'verdict', 'headline', 'confidence_score']
};

function condensar(draft) {
  return {
    name: draft.campaign_name,
    type: draft.campaign_type,
    objective: draft.objective,
    audience: draft.audience_segment,
    budget_clp: draft.daily_budget_clp,
    bid_strategy: draft.bid_strategy,
    target_cpa_clp: draft.target_cpa_clp,
    target_roas_pct: draft.target_roas_pct,
    num_keywords: (draft.keywords || []).length,
    num_negatives: (draft.negative_keywords || []).length,
    num_ad_groups: (draft.ad_groups || []).length,
    num_asset_groups: (draft.asset_groups || []).length,
    num_audience_signals: (draft.audience_signals || []).length,
    sample_headlines: (draft.responsive_search_ads?.[0]?.headlines || draft.asset_groups?.[0]?.headlines || []).slice(0, 5),
    sample_descriptions: (draft.responsive_search_ads?.[0]?.descriptions || draft.asset_groups?.[0]?.descriptions || []).slice(0, 3),
    top_keywords: (draft.keywords || []).slice(0, 8).map(k => ({ text: k.text, match: k.match_type, cpc: k.estimated_cpc_clp, comp: k.competition })),
    strategic_rationale: draft.strategic_rationale,
    hypothesis: draft.scientific_hypothesis,
    expected_ctr_pct: draft.expected_ctr_pct,
    expected_cpc_clp: draft.expected_cpc_clp,
    expected_conversions_week: draft.expected_conversions_week,
    expected_cac_clp: draft.expected_cac_clp,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { draft_id } = await req.json();
    if (!draft_id) return Response.json({ error: 'draft_id requerido' }, { status: 400 });

    const draft = await base44.asServiceRole.entities.AdCampaignDraft.get(draft_id);
    if (!draft) return Response.json({ error: 'Draft no encontrado' }, { status: 404 });

    // Carga campañas históricas relevantes como contexto (con análisis previo o score conocido)
    const allDrafts = await base44.asServiceRole.entities.AdCampaignDraft.list('-created_date', 50);
    const historicalContext = allDrafts
      .filter(d => d.id !== draft_id && (d.performance_score || d.scientist_analysis))
      .slice(0, 12)
      .map(d => ({
        name: d.campaign_name,
        type: d.campaign_type,
        objective: d.objective,
        audience: d.audience_segment,
        budget_clp: d.daily_budget_clp,
        status: d.status,
        performance_score: d.performance_score,
        expected_ctr_pct: d.expected_ctr_pct,
        expected_conversions_week: d.expected_conversions_week,
        scientist_analysis: d.scientist_analysis?.slice(0, 400),
      }));

    const prompt = `Eres el agente "Ads Forecaster" de PEYU Chile, especialista en predicción de rendimiento de campañas Google Ads v23.1.

CAMPAÑA A PREDECIR:
${JSON.stringify(condensar(draft), null, 2)}

HISTORIAL DE CAMPAÑAS PEYU (referencia comparativa):
${historicalContext.length > 0 ? JSON.stringify(historicalContext, null, 2) : 'Sin historial previo (primera campaña).'}

CONTEXTO DE NEGOCIO:
- PEYU vende regalos corporativos sostenibles 100% plástico reciclado en Chile.
- Mercado: B2B (empresas) y B2C (regalos individuales).
- AOV B2C ~$15.000 CLP, AOV B2B ~$250.000 CLP.
- CPC promedio en Chile para nicho: $400-900 CLP.
- CTR healthy Search: 3-6%. CTR healthy PMax/Demand Gen: 0.8-2%.
- Conversion rate Search: 1.5-4%. Demand Gen: 0.5-1.5%.

TU MISIÓN:
1. Analiza fortalezas y debilidades del draft (keywords, copy, audience, budget, bid strategy).
2. Compara con históricos similares (mismo tipo/objetivo/audiencia) si existen.
3. Predice rangos pesimista/esperado/optimista para 5 KPIs semanales.
4. Asigna performance_score 0-100 esperado y verdict accionable.
5. Lista 3-6 sugerencias de optimización ANTES de publicar.
6. Detecta riesgos críticos (max 5 flags).
7. Sé RIGUROSO: no infles métricas. Si el draft es débil, dilo claramente.

REGLAS:
- Si el historial está vacío, basa predicciones en benchmarks del nicho (PEYU regalos corporativos Chile).
- Para verdict='ship_it': performance_score esperado >=70 + sin risk_flags críticos.
- Para verdict='review': 50-69 o tiene risk_flags medios.
- Para verdict='pivot': 30-49 (recomienda cambios estructurales).
- Para verdict='kill': <30 (campaña fundamentalmente débil).
- headline: 1 frase contundente que resuma TODO (ej: "PMax sólida con creative weak → editar headlines y lanzar").`;

    const ai = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5_4',
      response_json_schema: FORECAST_SCHEMA,
    });

    const forecast = {
      ...ai,
      forecasted_at: new Date().toISOString(),
      forecasted_by: 'ads_forecaster',
      historical_n: historicalContext.length,
    };

    // Persistir en draft + actualizar score
    await base44.asServiceRole.entities.AdCampaignDraft.update(draft_id, {
      forecast,
      performance_score: ai.performance_score ?? draft.performance_score,
    });

    return Response.json({ success: true, forecast });
  } catch (error) {
    console.error('[adsForecastPerformance]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});