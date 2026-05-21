// ============================================================================
// analyzeKeywordSerp · Analiza la SERP real de Google.cl para una keyword
// usando Gemini con add_context_from_internet=true (búsqueda web en vivo).
// ----------------------------------------------------------------------------
// Body: { keyword: string }
// Devuelve estructura con competidores TOP 10, tipo de contenido dominante,
// ángulo recomendado para PEYU, título y meta description sugeridos, y
// dificultad estimada.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch {}
    const keyword = String(body.keyword || '').trim();
    if (!keyword) return Response.json({ error: 'Falta keyword' }, { status: 400 });

    const prompt = `Eres un consultor SEO experto en e-commerce chileno. Realiza una BÚSQUEDA REAL en Google.cl para la query "${keyword}" (país Chile, idioma español) y analiza los TOP 10 resultados orgánicos.

Contexto del cliente: PEYU es una marca chilena que vende productos sustentables hechos con plástico 100% reciclado y fibra de trigo compostable. Catálogo: organizadores de escritorio, accesorios de hogar/oficina, carcasas para celulares, regalos corporativos personalizables con grabado láser. URL: peyuchile.cl.

Devuelve un análisis EJECUTABLE para ganarle a esos TOP 10. Sé concreto, nada de relleno genérico.

Reglas:
- competitors: extrae 5-8 sitios reales que aparecen en el TOP 10. Incluye dominio, título del resultado y una micro-descripción de qué venden o publican.
- content_type: ¿qué domina la SERP? (e-commerce / blog / marketplace / mixto / agencia).
- intent: comercial / informacional / mixto.
- difficulty: low / medium / high según autoridad de los competidores.
- difficulty_reason: por qué calificás esa dificultad (en 1 frase).
- gap: qué le falta a la SERP actual y dónde PEYU puede destacar (1-2 frases concretas).
- angle: ángulo editorial/comercial recomendado para que PEYU rankee (1 frase).
- suggested_title: meta title optimizado para PEYU (50-60 chars, incluye la keyword).
- suggested_meta: meta description (150-160 chars, con CTA y diferenciador chileno/sustentable).
- suggested_h1: H1 sugerido para la página.
- content_outline: 4-6 secciones/bullets que la página debería cubrir para superar a la competencia.
- quick_wins: 2-3 acciones inmediatas de baja fricción que PEYU puede aplicar hoy.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          competitors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                domain: { type: 'string' },
                title:  { type: 'string' },
                snippet:{ type: 'string' },
              },
              required: ['domain', 'title'],
            },
          },
          content_type:       { type: 'string' },
          intent:             { type: 'string' },
          difficulty:         { type: 'string', enum: ['low', 'medium', 'high'] },
          difficulty_reason:  { type: 'string' },
          gap:                { type: 'string' },
          angle:              { type: 'string' },
          suggested_title:    { type: 'string' },
          suggested_meta:     { type: 'string' },
          suggested_h1:       { type: 'string' },
          content_outline:    { type: 'array', items: { type: 'string' } },
          quick_wins:         { type: 'array', items: { type: 'string' } },
        },
        required: ['competitors', 'difficulty', 'angle', 'suggested_title', 'suggested_meta'],
      },
    });

    return Response.json({ ok: true, keyword, analysis: res });
  } catch (error) {
    console.error('analyzeKeywordSerp error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});