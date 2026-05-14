// ============================================================================
// adsGenerateCampaign2026 — Generador de campañas Google Ads v23.1 (2026/2027)
// ----------------------------------------------------------------------------
// Soporta los 4 tipos de campaña relevantes para 2026:
//   - Search (con AI Max + text_guidelines)
//   - Shopping (alineado con Merchant API 2026)
//   - Performance Max (con asset_groups + audience_signals + text_guidelines)
//   - Demand Gen (sucesor de Discovery — el más relevante B2C)
//
// Innovaciones 2026/2027:
//   - text_guidelines v23.1 (term_exclusions + messaging_restrictions)
//   - asset_groups completos para PMax/Demand Gen
//   - audience_signals para custom intent + lookalike
//   - generate_visuals: si true, dispara la generación de assets visuales con IA
//
// Payload: {
//   operation_brief, campaign_type, audience, objective,
//   daily_budget_clp, landing_url, codename,
//   generate_visuals (bool), num_visuals (1-5)
// }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Schema unificado que cubre los 4 tipos de campaña.
// Los campos no relevantes para el tipo se quedan vacíos.
const CAMPAIGN_SCHEMA = {
  type: 'object',
  properties: {
    campaign_name: { type: 'string' },
    strategic_rationale: { type: 'string' },
    scientific_hypothesis: { type: 'string' },
    bid_strategy: { type: 'string' },
    target_cpa_clp: { type: 'number' },
    target_roas_pct: { type: 'number' },
    locations: { type: 'array', items: { type: 'string' } },
    languages: { type: 'array', items: { type: 'string' } },

    // Search/Shopping
    ad_groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          theme: { type: 'string' },
          keywords: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                match_type: { type: 'string' },
                intent: { type: 'string' },
                estimated_cpc_clp: { type: 'number' },
                competition: { type: 'string' },
              },
            },
          },
          headlines: { type: 'array', items: { type: 'string' } },
          descriptions: { type: 'array', items: { type: 'string' } },
          path1: { type: 'string' },
          path2: { type: 'string' },
        },
      },
    },
    negative_keywords: { type: 'array', items: { type: 'string' } },
    sitelinks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          description1: { type: 'string' },
          description2: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    callouts: { type: 'array', items: { type: 'string' } },
    structured_snippets: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          header: { type: 'string' },
          values: { type: 'array', items: { type: 'string' } },
        },
      },
    },

    // PMax / Demand Gen
    asset_groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          theme: { type: 'string' },
          headlines: { type: 'array', items: { type: 'string' } },
          long_headlines: { type: 'array', items: { type: 'string' } },
          descriptions: { type: 'array', items: { type: 'string' } },
          business_name: { type: 'string' },
          call_to_action: { type: 'string' },
          image_prompts: {
            type: 'array',
            items: { type: 'string' },
            description: 'Prompts para generar visuales con IA (Square 1:1, Landscape 1.91:1, Portrait 4:5)',
          },
        },
      },
    },
    audience_signals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          name: { type: 'string' },
          signals: { type: 'array', items: { type: 'string' } },
        },
      },
    },

    // v23.1 — brand safety
    text_guidelines: {
      type: 'object',
      properties: {
        term_exclusions: { type: 'array', items: { type: 'string' } },
        messaging_restrictions: { type: 'array', items: { type: 'string' } },
      },
    },

    // Forecast
    expected_ctr_pct: { type: 'number' },
    expected_cpc_clp: { type: 'number' },
    expected_conversions_week: { type: 'number' },
    expected_cac_clp: { type: 'number' },
    expected_reach_users: { type: 'number' },
  },
  required: ['campaign_name'],
};

// Instrucciones específicas por tipo de campaña
const TYPE_INSTRUCTIONS = {
  'Search': `
TIPO: Search (intención alta, conversión directa).
- Construye 2-4 AD GROUPS, cada uno un ángulo táctico distinto.
- 8-15 KEYWORDS por ad group, mezcla Exact + Phrase (evita Broad sin Smart Bidding).
- 15 HEADLINES (max 30 chars) y 4 DESCRIPTIONS (max 90 chars) por ad group.
- 15-25 NEGATIVE KEYWORDS para limpiar tráfico basura.
- DEJA VACÍOS asset_groups y audience_signals.`,

  'Shopping': `
TIPO: Shopping (catálogo). En Chile 2026, Merchant API es obligatorio desde abril.
- Ad groups simples (1-2): "Catalog All" + "Catalog Best Sellers".
- HEADLINES y DESCRIPTIONS opcionales (Shopping usa data del feed).
- NEGATIVE KEYWORDS exhaustivas (15-25).
- DEJA VACÍOS asset_groups detallados.`,

  'Performance Max': `
TIPO: Performance Max (Google AI auto-optimiza Search+Display+YouTube+Discover+Gmail+Maps).
- Construye 2-3 ASSET GROUPS (no ad groups). Cada uno un tema creativo distinto.
- Por asset group: 5 HEADLINES (max 30 chars), 5 LONG HEADLINES (max 90 chars), 5 DESCRIPTIONS (max 90 chars), 1 business_name (max 25 chars), 1 call_to_action.
- IMAGE_PROMPTS: 4-6 prompts detallados en INGLÉS para generar visuales (mezcla aspect ratios: square, landscape, portrait).
- AUDIENCE_SIGNALS: 2-3 segmentos (custom_segment con search terms + URLs, remarketing, customer_match).
- DEJA VACÍOS ad_groups (Search) y keywords (PMax los infiere).
- NEGATIVE KEYWORDS solo si hay términos a bloquear.`,

  'Demand Gen': `
TIPO: Demand Gen (sucesor de Discovery 2024+, prioritario para B2C visual).
Aparece en YouTube Shorts, YouTube Home/Watch Next, Discover feed, Gmail Promotions.
- Construye 1-2 ASSET GROUPS. Es CREATIVE-FIRST, no keyword-first.
- Por asset group: 5 HEADLINES (max 40 chars), 5 LONG HEADLINES (max 90 chars), 5 DESCRIPTIONS (max 90 chars), business_name, call_to_action.
- IMAGE_PROMPTS: 6-8 prompts en INGLÉS, foco en lifestyle/emotional/product-in-context (no stock).
  Aspect ratios: square 1:1 (1080x1080), landscape 1.91:1 (1200x628), portrait 4:5 (960x1200).
- AUDIENCE_SIGNALS: lookalike de compradores + custom intent (búsquedas YouTube recientes).
- DEJA VACÍOS keywords. NO usar Broad match keywords.
- bid_strategy típica: Maximize Conversions o Target CPA.`,
};

// Defaults de text_guidelines para PEYU (brand safety baseline)
const PEYU_TEXT_GUIDELINES = {
  term_exclusions: [
    'plástico virgen', 'desechable', 'usar y tirar', 'china', 'barato',
    'low cost', 'imitación', 'copia', 'genérico', 'gratis total',
  ],
  messaging_restrictions: [
    'No exagerar afirmaciones ambientales sin respaldo verificable',
    'No usar superlativos absolutos como "el mejor del mundo" o "único en su categoría"',
    'Mantener tono profesional-cercano, español de Chile, evitar anglicismos innecesarios',
    'No prometer plazos de entrega menores a 48 horas',
    'Siempre mencionar "hecho en Chile" o "fabricado localmente" cuando hable de origen',
    'No mencionar competidores directos por nombre',
    'Evitar lenguaje agresivo o de presión ("compra ya", "última oportunidad")',
    'Para B2B, priorizar credibilidad y volumen sobre precio',
    'Para B2C, priorizar el valor emocional (regalo memorable, sustentable) sobre descuentos',
  ],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      operation_brief,
      campaign_type = 'Performance Max',
      audience = 'B2C Regalos',
      objective = 'Sales B2C',
      daily_budget_clp = 15000,
      landing_url,
      codename = `OP_${Date.now()}`,
      generate_visuals = false,
      num_visuals = 3,
    } = await req.json();

    if (!operation_brief || !landing_url) {
      return Response.json({ error: 'operation_brief & landing_url required' }, { status: 400 });
    }
    if (!TYPE_INSTRUCTIONS[campaign_type]) {
      return Response.json({ error: `campaign_type inválido. Usa: ${Object.keys(TYPE_INSTRUCTIONS).join(', ')}` }, { status: 400 });
    }

    const daily_budget_usd = Math.round(daily_budget_clp / 950);

    const prompt = `Eres el COMMANDER de Google Ads de PEYU Chile en 2026.
PEYU vende regalos corporativos y productos de hogar fabricados con plástico 100% reciclado en Chile.

CONTEXTO DE LA OPERACIÓN:
- Brief: ${operation_brief}
- Codename: ${codename}
- Tipo de campaña: ${campaign_type}
- Audiencia objetivo: ${audience}
- Objetivo: ${objective}
- Presupuesto diario: CLP $${daily_budget_clp.toLocaleString('es-CL')} (~US$${daily_budget_usd})
- Landing page: ${landing_url}
- Mercado: Chile (Región Metropolitana + regiones principales)
- Idioma: Español de Chile

${TYPE_INSTRUCTIONS[campaign_type]}

REQUERIMIENTOS UNIVERSALES:
1. RACIONAL ESTRATÉGICO: 3-5 frases explicando por qué este enfoque.
2. HIPÓTESIS CIENTÍFICA: falsable, medible en 7-14 días.
3. FORECAST realista para Chile 2026: CTR esperado %, CPC esperado CLP, conversiones/semana, CAC esperado CLP, reach esperado (usuarios únicos para Demand Gen/PMax).
4. BID STRATEGY recomendada según etapa: lanzamiento sin data → Maximize Conversions; con histórico → Target CPA o Target ROAS.
5. TEXT_GUIDELINES v23.1 (brand safety AI): incluye 5-8 term_exclusions específicos al objetivo y 5-8 messaging_restrictions tácticas para esta campaña (adicionales a los baseline PEYU).
6. LOCATIONS: array con países/regiones (default: ["Chile"] o regiones específicas si son relevantes).
7. LANGUAGES: ["Spanish"] por defecto.

REGLAS DE COPY (PEYU 2026):
- Headlines en español de Chile, tono profesional-cercano.
- Mencionar diferenciadores: "100% reciclado", "hecho en Chile", "garantía 10 años", "personalización láser UV".
- Si B2B → volumen, cotización, fee personalización, ESG corporativo.
- Si B2C → regalo único, entrega rápida, materia recuperada, historia de impacto.
- RESPETAR LÍMITES de caracteres de Google Ads — truncar antes que fallar.

REGLAS DE IMAGE_PROMPTS (solo si aplica PMax/Demand Gen):
- En INGLÉS, detallados (40-80 palabras).
- Estilo: photorealistic, natural lighting, lifestyle in context.
- Diversidad: producto en uso real, manos sosteniendo, escritorio chileno moderno, oficina sostenible, regalo desempacado, detalle de marmolado.
- NUNCA: stock photo genérica, modelos sonriendo a cámara, fondo blanco aislado.
- Especifica aspect ratio al final: "1:1 square", "1.91:1 landscape", o "4:5 portrait".

Responde SOLO el JSON estructurado, sin markdown.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: CAMPAIGN_SCHEMA,
      model: 'gpt_5_5',
    });

    if (!result.campaign_name) {
      result.campaign_name = `${codename} · ${audience} · ${campaign_type}`;
    }

    // Mergear text_guidelines del LLM con los baseline PEYU (limitando a 25/40)
    const mergedExclusions = Array.from(new Set([
      ...PEYU_TEXT_GUIDELINES.term_exclusions,
      ...((result.text_guidelines?.term_exclusions) || []),
    ])).slice(0, 25);
    const mergedRestrictions = Array.from(new Set([
      ...PEYU_TEXT_GUIDELINES.messaging_restrictions,
      ...((result.text_guidelines?.messaging_restrictions) || []),
    ])).slice(0, 40);

    // UTMs consistentes
    const utm_params = {
      utm_source: 'google',
      utm_medium: campaign_type === 'Search' ? 'cpc' : campaign_type === 'Demand Gen' ? 'demand_gen' : 'pmax',
      utm_campaign: (result.campaign_name || codename).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 80),
    };

    // Generación opcional de visuales con IA (solo PMax/Demand Gen)
    let generatedAssetGroups = result.asset_groups || [];
    if (generate_visuals && ['Performance Max', 'Demand Gen'].includes(campaign_type)) {
      const maxVisuals = Math.min(num_visuals, 5);
      generatedAssetGroups = await Promise.all(
        (result.asset_groups || []).map(async (ag) => {
          const prompts = (ag.image_prompts || []).slice(0, maxVisuals);
          const imageUrls = await Promise.all(
            prompts.map(p =>
              base44.asServiceRole.integrations.Core.GenerateImage({ prompt: p })
                .then(r => r?.url)
                .catch(() => null)
            )
          );
          return {
            ...ag,
            image_urls: imageUrls.filter(Boolean),
          };
        })
      );
    }

    // Flat keywords para compat
    const flatKeywords = (result.ad_groups || []).flatMap(ag =>
      (ag.keywords || []).map(k => ({
        text: k.text, match_type: k.match_type, intent: k.intent,
        estimated_cpc_clp: k.estimated_cpc_clp, competition: k.competition,
      }))
    );

    // RSAs para Search
    const rsas = (result.ad_groups || []).map(ag => ({
      ad_group: ag.name,
      headlines: ag.headlines || [],
      descriptions: ag.descriptions || [],
      final_url: landing_url,
      path1: ag.path1 || '',
      path2: ag.path2 || '',
    }));

    // Asset groups con final_urls completados
    const finalAssetGroups = generatedAssetGroups.map(ag => ({
      ...ag,
      final_urls: ag.final_urls?.length ? ag.final_urls : [landing_url],
    }));

    const draft = await base44.asServiceRole.entities.AdCampaignDraft.create({
      codename,
      campaign_name: result.campaign_name,
      campaign_type,
      objective,
      audience_segment: audience,
      daily_budget_clp,
      daily_budget_usd,
      bid_strategy: result.bid_strategy || 'Maximize Conversions',
      target_cpa_clp: result.target_cpa_clp,
      target_roas_pct: result.target_roas_pct,
      locations: result.locations || ['Chile'],
      languages: result.languages || ['Spanish'],
      keywords: flatKeywords,
      negative_keywords: result.negative_keywords || [],
      ad_groups: (result.ad_groups || []).map(ag => ({
        name: ag.name, theme: ag.theme, keywords: (ag.keywords || []).map(k => k.text),
      })),
      responsive_search_ads: rsas,
      asset_groups: finalAssetGroups,
      audience_signals: result.audience_signals || [],
      text_guidelines: {
        term_exclusions: mergedExclusions,
        messaging_restrictions: mergedRestrictions,
      },
      sitelinks: result.sitelinks || [],
      callouts: result.callouts || [],
      structured_snippets: result.structured_snippets || [],
      utm_params,
      strategic_rationale: result.strategic_rationale,
      scientific_hypothesis: result.scientific_hypothesis,
      expected_ctr_pct: result.expected_ctr_pct,
      expected_cpc_clp: result.expected_cpc_clp,
      expected_conversions_week: result.expected_conversions_week,
      expected_cac_clp: result.expected_cac_clp,
      expected_reach_users: result.expected_reach_users,
      api_version_used: 'v23.1',
      status: 'Draft IA',
      generated_by_agent: 'ads_commander_2026',
    });

    return Response.json({
      success: true,
      draft_id: draft.id,
      draft,
      visuals_generated: generate_visuals
        ? finalAssetGroups.reduce((sum, ag) => sum + (ag.image_urls?.length || 0), 0)
        : 0,
    });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
});