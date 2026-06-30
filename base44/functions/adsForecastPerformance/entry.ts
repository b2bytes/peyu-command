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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Modelo determinista base ────────────────────────────────────────────────
// Calcula el "piso" de KPIs a partir de la estructura real del draft (budget,
// tipo, CPC del nicho, completitud creativa) y del AOV B2C REAL del catálogo.
// La IA luego ajusta DENTRO de bandas alrededor de este piso, así dos mejoras
// estructurales reales mueven el número y el veredicto no queda clavado.
function modeloBase(draft, aovB2C) {
  const budget = draft.daily_budget_clp || 15000;
  const type = (draft.campaign_type || '').toLowerCase();
  // CPC y conv-rate típicos del nicho PEYU Chile por tipo de campaña.
  const cpc = type.includes('search') ? 650 : type.includes('shopping') ? 480 : type.includes('demand') ? 350 : 520;
  const ctrBase = type.includes('search') ? 4.5 : type.includes('demand') ? 1.1 : 1.4; // %
  let convRate = type.includes('search') ? 2.4 : type.includes('shopping') ? 1.8 : type.includes('demand') ? 0.8 : 1.3; // %

  // Bonus de completitud: estructura más rica = mejor aprendizaje de la IA de Google.
  const assetGroups = (draft.asset_groups || []).length;
  const signals = (draft.audience_signals || []).length;
  const headlines = (draft.asset_groups?.[0]?.headlines || draft.responsive_search_ads?.[0]?.headlines || []).length;
  let completeness = 0;
  if (assetGroups >= 3) completeness += 0.15; else if (assetGroups >= 2) completeness += 0.08;
  if (signals >= 3) completeness += 0.12; else if (signals >= 1) completeness += 0.05;
  if (headlines >= 7) completeness += 0.10; else if (headlines >= 5) completeness += 0.05;
  if ((draft.negative_keywords || []).length >= 5) completeness += 0.05;
  convRate *= (1 + completeness); // mejoras estructurales suben la conversión esperada

  const clicksWeek = (budget / cpc) * 7;
  const impressionsWeek = (clicksWeek / (ctrBase / 100));
  const conversionsWeek = clicksWeek * (convRate / 100);
  const cac = conversionsWeek > 0 ? (budget * 7) / conversionsWeek : budget * 7;
  const roas = aovB2C > 0 ? aovB2C / cac : 0;

  return {
    cpc: Math.round(cpc),
    ctr_pct: Number(ctrBase.toFixed(2)),
    impressions_week: Math.round(impressionsWeek),
    conversions_week: Number(conversionsWeek.toFixed(1)),
    cac_clp: Math.round(cac),
    roas: Number(roas.toFixed(2)),
    completeness_bonus_pct: Math.round(completeness * 100),
    aov_b2c: aovB2C,
  };
}

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

    // AOV B2C REAL: promedio de precio_b2c de productos activos del catálogo.
    // (Antes estaba hardcodeado en $15.000, que es el presupuesto — no el ticket.)
    let aovB2C = 15000;
    try {
      const prods = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 300);
      const precios = (prods || []).map(p => p.precio_b2c).filter(v => v > 0);
      if (precios.length) aovB2C = Math.round(precios.reduce((a, b) => a + b, 0) / precios.length);
    } catch { /* fallback al default */ }

    const base = modeloBase(draft, aovB2C);

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
- PEYU vende productos sostenibles 100% plástico reciclado en Chile (B2C regalos/hogar y B2B empresas).
- AOV B2C REAL (promedio del catálogo activo): $${aovB2C.toLocaleString('es-CL')} CLP. USA ESTE valor, no asumas otro.
- CPC promedio en Chile para el nicho: $400-900 CLP según tipo.
- CTR healthy Search: 3-6%. CTR healthy PMax/Demand Gen: 0.8-2%.
- Conversion rate Search: 1.5-4%. PMax: 1-2%. Demand Gen: 0.5-1.5%.

═══ ANCLA DETERMINISTA (modelo base calculado sobre la estructura REAL del draft) ═══
Estos números salen de un modelo matemático sobre el budget, tipo de campaña, CPC del nicho,
AOV real y la completitud de la estructura (asset groups, señales, headlines, negativas).
Tu predicción 'expected' debe quedar DENTRO de ±15% de cada ancla — NO te desvíes sin justificar:
${JSON.stringify(base, null, 2)}
El "completeness_bonus_pct" indica cuánto mejoró la estructura: si subió respecto a un forecast previo,
el score y la conversión DEBEN reflejar esa mejora (no dejes el ROAS clavado).

TU MISIÓN:
1. Analiza fortalezas y debilidades del draft (keywords, copy, audience, budget, bid strategy).
2. Compara con históricos similares (mismo tipo/objetivo/audiencia) si existen.
3. Predice rangos pesimista/esperado/optimista para 5 KPIs semanales, anclados al modelo base de arriba.
4. Asigna performance_score 0-100 esperado y verdict accionable.
5. Lista 3-6 sugerencias de optimización ANTES de publicar.
6. Detecta riesgos críticos (max 5 flags).
7. Sé RIGUROSO pero JUSTO: con AOV B2C bajo, un ROAS directo <1x en PMax frío es ESPERABLE al inicio —
   NO lo trates como fracaso fatal. PMax aprende y mejora el ROAS con volumen. Evalúa el POTENCIAL,
   no solo el ROAS day-1. Una campaña bien estructurada con CAC razonable merece 'review' o 'ship_it',
   aunque el ROAS arranque bajo: el founder la usará como test controlado de 10-14 días.

REGLAS DE VERDICT (con AOV bajo el ROAS inicial bajo NO descalifica por sí solo):
- 'ship_it': estructura completa (≥2 asset groups, ≥2 señales, ≥7 headlines), CAC razonable, score >=68.
- 'review': estructura buena con 1-2 mejoras pendientes (feed, video, Customer Match), score 52-67.
- 'pivot': estructura incompleta o ángulo equivocado que requiere rearmar, score 30-51.
- 'kill': fundamentalmente inviable (<30).
- Si en este forecast la estructura es MÁS completa que el modelo base sugería antes, sube el score.
- headline: 1 frase contundente y accionable (ej: "PMax sólida, CAC sano → lanzar como test 14 días").`;

    // gpt_5_mini: rápido para no colgar al agente en vivo. El forecast ya es
    // determinista (ancla matemática sobre estructura real + AOV), así que el
    // modelo solo ajusta dentro de bandas — no necesita un modelo pesado.
    const ai = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gpt_5_mini',
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

    // Campos PLANOS (escenario esperado) para que la card del agente los muestre directo.
    const cac = ai.cac_clp?.expected;
    const flat = {
      verdict: ai.verdict,
      headline: ai.headline,
      performance_score: ai.performance_score,
      impressions_week: ai.impressions_weekly?.expected,
      ctr_pct: ai.ctr_pct?.expected,
      conversions_week: ai.conversions_weekly?.expected,
      cac_clp: cac,
      roas: ai.roas?.expected,
    };

    return Response.json({ success: true, forecast, ...flat });
  } catch (error) {
    console.error('[adsForecastPerformance]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});