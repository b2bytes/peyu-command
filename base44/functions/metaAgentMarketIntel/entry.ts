import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAgentMarketIntel · Inteligencia de mercado EN VIVO para el agente Meta.
// ----------------------------------------------------------------------------
// Usa el LLM con contexto de internet (búsqueda Google en vivo) para:
//   - 'competencia': mapear competidores reales de PEYU en Chile, su ángulo,
//      ofertas, presencia en Meta/IG, y oportunidades de diferenciación.
//   - 'keywords': keywords de alta intención del segmento (B2C carcasas/eco,
//      B2B regalo corporativo sustentable) listas para SEO, GEO y targeting Meta.
//   - 'tendencias': tendencias vivas del segmento (junio 2026) accionables.
//
// La salida 'keywords' alimenta directamente SEO/GEO (campos seo_focus_keyword,
// etc.) y el targeting/copy de las campañas.
//
// Payload: { mode: 'competencia'|'keywords'|'tendencias', foco?, region? }
// ============================================================================

const CONTEXTO_PEYU = `PEYU (peyuchile.cl) es una marca chilena de diseño consciente: productos de plástico 100% reciclado y fibra de trigo compostable. B2C: carcasas de celular ecológicas, artículos de escritorio y hogar. B2B: regalos corporativos personalizados con logo grabado a láser. Mercado: Chile. Posicionamiento: premium-accesible, sostenibilidad real, fabricación local.`;

const SCHEMAS = {
  competencia: {
    type: 'object',
    properties: {
      resumen: { type: 'string' },
      competidores: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            tipo: { type: 'string', description: 'B2C | B2B | ambos' },
            angulo: { type: 'string', description: 'su propuesta/diferenciador principal' },
            presencia_meta: { type: 'string', description: 'qué se sabe de su Instagram/Facebook/Ads' },
            precio_rango: { type: 'string' },
            debilidad: { type: 'string', description: 'dónde PEYU puede ganarle' },
          },
        },
      },
      oportunidades_peyu: { type: 'array', items: { type: 'string' } },
    },
    required: ['resumen', 'competidores'],
  },
  keywords: {
    type: 'object',
    properties: {
      resumen: { type: 'string' },
      keywords: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            termino: { type: 'string' },
            intencion: { type: 'string', description: 'informacional | comercial | transaccional' },
            segmento: { type: 'string', description: 'B2C | B2B' },
            volumen_estimado: { type: 'string', description: 'alto | medio | bajo' },
            uso: { type: 'string', description: 'SEO | GEO | Meta targeting | copy anuncio' },
          },
        },
      },
      clusters_geo: { type: 'array', items: { type: 'string' }, description: 'ciudades/comunas Chile de mayor oportunidad' },
    },
    required: ['resumen', 'keywords'],
  },
  tendencias: {
    type: 'object',
    properties: {
      resumen: { type: 'string' },
      tendencias: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tendencia: { type: 'string' },
            por_que_importa: { type: 'string' },
            accion_peyu: { type: 'string' },
          },
        },
      },
    },
    required: ['resumen', 'tendencias'],
  },
};

const PROMPTS = {
  competencia: (foco, region) => `${CONTEXTO_PEYU}\n\nInvestiga EN VIVO la competencia real de PEYU en ${region}${foco ? ` con foco en: ${foco}` : ''}. Identifica marcas chilenas reales que vendan carcasas eco, productos reciclados o regalos corporativos sustentables. Para cada una: su ángulo, presencia en Meta/Instagram, rango de precio y su debilidad explotable. Cierra con oportunidades concretas de diferenciación para PEYU. Usa datos actuales de junio 2026.`,
  keywords: (foco, region) => `${CONTEXTO_PEYU}\n\nGenera keywords REALES de alta intención que la gente busca en Google y usa en ${region}${foco ? ` sobre: ${foco}` : ''}, para el segmento de PEYU (carcasas eco B2C y regalos corporativos sustentables B2B). Mezcla términos informacionales, comerciales y transaccionales. Marca cada uno con su mejor uso (SEO, GEO local, targeting Meta, o copy de anuncio) y segmento. Incluye clusters GEO (ciudades/comunas de Chile con más oportunidad). Datos actuales junio 2026.`,
  tendencias: (foco, region) => `${CONTEXTO_PEYU}\n\n¿Cuáles son las tendencias VIVAS (junio 2026) en ${region} relevantes para PEYU${foco ? ` sobre: ${foco}` : ''} — en sostenibilidad, regalo corporativo, consumo consciente, formatos de anuncio Meta/Instagram y comportamiento de compra? Para cada tendencia: por qué importa y una acción concreta que PEYU debería tomar.`,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { mode = 'keywords', foco = '', region = 'Chile' } = await req.json().catch(() => ({}));
    if (!SCHEMAS[mode]) {
      return Response.json({ ok: false, error: "mode debe ser 'competencia', 'keywords' o 'tendencias'." });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: PROMPTS[mode](foco, region),
      add_context_from_internet: true,
      model: 'gemini_3_1_pro',
      response_json_schema: SCHEMAS[mode],
    });

    return Response.json({ ok: true, mode, region, ...result });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});