// ============================================================================
// adsGenerateCampaign — Generador militar de campañas Google Ads
// ----------------------------------------------------------------------------
// Usa el agente "ads_commander" + LLM para construir una campaña Search/PMax
// táctica, con keywords, match types, ad copy, extensiones, UTMs y racional.
// Payload: {
//   operation_brief: "Lanzamiento 2026 - B2B regalos corporativos",
//   campaign_type: "Search" | "Performance Max" | "Shopping",
//   audience: "B2B Corporativo",
//   daily_budget_usd: 50,
//   landing_url: "https://peyuchile.cl/b2b/contacto",
//   codename: "OP_LAUNCH_01"
// }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CAMPAIGN_SCHEMA = {
  type: 'object',
  properties: {
    campaign_name: { type: 'string' },
    strategic_rationale: { type: 'string' },
    scientific_hypothesis: { type: 'string' },
    bid_strategy: { type: 'string' },
    target_cpa_clp: { type: 'number' },
    locations: { type: 'array', items: { type: 'string' } },
    languages: { type: 'array', items: { type: 'string' } },
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
              required: ['text', 'match_type'],
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
    expected_ctr_pct: { type: 'number' },
    expected_cpc_clp: { type: 'number' },
    expected_conversions_week: { type: 'number' },
    expected_cac_clp: { type: 'number' },
  },
  required: ['campaign_name'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      operation_brief,
      campaign_type = 'Search',
      audience = 'B2B Corporativo',
      objective = 'Leads B2B',
      daily_budget_usd = 50,
      landing_url,
      codename = `OP_${Date.now()}`,
    } = await req.json();

    if (!operation_brief || !landing_url) {
      return Response.json({ error: 'operation_brief & landing_url required' }, { status: 400 });
    }

    const daily_budget_clp = Math.round(daily_budget_usd * 950);

    const prompt = `Eres el COMMANDER de una operación de Google Ads de grado militar para PEYU Chile
(regalos corporativos sostenibles en plástico 100% reciclado, fabricados en Chile).
Operamos con precisión científica. Cada keyword, cada headline y cada negative keyword
tiene un propósito táctico.

CONTEXTO DE LA OPERACIÓN:
- Brief: ${operation_brief}
- Codename: ${codename}
- Tipo de campaña: ${campaign_type}
- Audiencia objetivo: ${audience}
- Objetivo: ${objective}
- Presupuesto diario: US$${daily_budget_usd} (~CLP $${daily_budget_clp.toLocaleString('es-CL')})
- Landing page: ${landing_url}
- Mercado: Chile (principalmente Región Metropolitana + regiones)
- Idioma: Español

MISIÓN: Construye una campaña ${campaign_type} completa, lista para subir a Google Ads Editor.

REQUERIMIENTOS ESTRICTOS (sin improvisar):
1. **Ad Groups (2-4)**: cada uno debe ser un *ángulo táctico* distinto (ej: "Regalos Navidad Empresa" / "Gift ESG Corporativo" / "Personalización Láser"). Grupos fuertes > grupos débiles.
2. **Keywords (8-15 por ad group)**: mezcla de Exact (high-intent comercial), Phrase (variantes cercanas) y evita Broad salvo que sea necesario. Incluye "intent" (buyer/researcher/comparer) y estimación CPC realista en CLP para Chile (search local competencia media = $300-900 CLP).
3. **Headlines (15 por ad group)**: hasta 30 caracteres cada uno. Diversidad: beneficios, features, precios, garantías, urgencia, brand, ESG. NO repetir el mismo ángulo.
4. **Descriptions (4 por ad group)**: hasta 90 caracteres. Call-to-action claros.
5. **Path1/Path2**: hasta 15 caracteres cada uno (ej: /corporativo, /cotiza).
6. **Negative keywords (15-25)**: elimina tráfico de baja calidad (gratis, DIY, juguetes, reciclar basura, etc.).
7. **Sitelinks (4-6)**: textos hasta 25 chars + 2 descripciones hasta 35 chars.
8. **Callouts (6-10)**: hasta 25 chars (ej: "Envío en 48h", "Garantía 10 años", "100% Reciclado").
9. **Structured snippets**: header válido de Google (Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types) + 3-5 valores.
10. **Racional estratégico**: explica en 3-5 frases la lógica militar detrás de esta campaña (por qué estas keywords, por qué este angle).
11. **Hipótesis científica**: hipótesis falsable medible en 7 días (ej: "CTR > 4% en exact match demuestra que 'regalos corporativos sostenibles' tiene demanda latente no atendida").
12. **Forecast realista**: CTR esperado %, CPC esperado CLP, conversiones esperadas/semana, CAC esperado CLP.
13. **Bid strategy** recomendada (Maximize Conversions en lanzamiento sin data, luego Target CPA).

IMPORTANTE:
- Headlines y descriptions en ESPAÑOL DE CHILE, tono profesional-cercano.
- NO inventes marcas, precios o promos que no sean obvias.
- Si el audience es B2B → foco en volumen, cotización, fee personalización.
- Si el audience es B2C → foco en regalo único, entrega rápida, garantía.
- Respeta límites de caracteres de Google Ads (truncar antes que fallar).

Responde SOLO el JSON estructurado.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: CAMPAIGN_SCHEMA,
      model: 'gpt_5_mini',
    });

    // Fallback de seguridad: si el LLM no devolvió campaign_name, construir uno básico
    if (!result.campaign_name) {
      result.campaign_name = `${codename} · ${audience} · ${campaign_type}`;
    }

    // Calcular UTMs consistentes
    const utm_params = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: (result.campaign_name || codename).toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    };

    // Construir keywords flat desde ad_groups
    const flatKeywords = (result.ad_groups || []).flatMap(ag =>
      (ag.keywords || []).map(k => ({
        text: k.text, match_type: k.match_type, intent: k.intent,
        estimated_cpc_clp: k.estimated_cpc_clp, competition: k.competition,
      }))
    );

    // Construir responsive search ads desde ad_groups
    const rsas = (result.ad_groups || []).map(ag => ({
      ad_group: ag.name,
      headlines: ag.headlines || [],
      descriptions: ag.descriptions || [],
      final_url: landing_url,
      path1: ag.path1 || '',
      path2: ag.path2 || '',
    }));

    // Persistir el draft
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
      locations: result.locations || ['Chile'],
      languages: result.languages || ['Spanish'],
      keywords: flatKeywords,
      negative_keywords: result.negative_keywords || [],
      ad_groups: (result.ad_groups || []).map(ag => ({
        name: ag.name, theme: ag.theme, keywords: (ag.keywords || []).map(k => k.text),
      })),
      responsive_search_ads: rsas,
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
      status: 'Draft IA',
      generated_by_agent: 'ads_commander',
    });

    return Response.json({ success: true, draft_id: draft.id, draft });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
});