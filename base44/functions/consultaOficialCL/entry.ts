// ============================================================================
// consultaOficialCL — Consulta normativa / regulatoria / estadística chilena
// ----------------------------------------------------------------------------
// Responde preguntas (FinTech, datos personales, ciberseguridad, tributación,
// estadísticas INE, leyes BCN, fiscalización SII/CMF/SERNAC) usando IA con
// búsqueda en internet PERO restringida a fuentes oficiales chilenas:
//   .gob.cl · ine.cl · cmf.cl · cmfchile.cl · sii.cl · sernac.cl ·
//   bcn.cl · leychile.cl
//
// Payload:
//   { query: "¿Qué obliga la Ley 21.521 a las plataformas FinTech?",
//     strict?: true,        // por defecto true → usa SOLO dominios oficiales
//     model?: "gemini_3_flash" }  // gemini soporta búsqueda web
//
// Solo admin. Devuelve { answer, sources_used, used_strict }.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Fuentes oficiales preferidas (espejado de lib/trusted-sources.js)
const TRUSTED_SOURCES_CL = [
  { domain: 'gob.cl', label: 'Portal del Estado de Chile' },
  { domain: 'ine.cl', label: 'Instituto Nacional de Estadísticas' },
  { domain: 'ine.gob.cl', label: 'INE (alterno)' },
  { domain: 'cmfchile.cl', label: 'Comisión para el Mercado Financiero' },
  { domain: 'cmf.cl', label: 'CMF (alias)' },
  { domain: 'sii.cl', label: 'Servicio de Impuestos Internos' },
  { domain: 'sernac.cl', label: 'SERNAC' },
  { domain: 'bcn.cl', label: 'Biblioteca del Congreso Nacional' },
  { domain: 'leychile.cl', label: 'LeyChile (BCN)' },
];

function buildSourcePreferenceClause({ strict = true, topic = 'normativa, estadísticas o información oficial chilena' } = {}) {
  const list = TRUSTED_SOURCES_CL.map(s => `${s.domain} (${s.label})`).join(', ');
  if (strict) {
    return `

[FUENTES OFICIALES — OBLIGATORIO]
Para ${topic}, USA EXCLUSIVAMENTE estos dominios oficiales chilenos: ${list}.
Si la información no está disponible en ellos, dilo explícitamente. NO uses blogs, foros, Wikipedia ni medios secundarios. Cita SIEMPRE la URL exacta del dominio oficial al final de cada afirmación entre paréntesis: (fuente: https://www.bcn.cl/...).`;
  }
  return `

[FUENTES PREFERIDAS]
Para ${topic}, prioriza SIEMPRE estos dominios oficiales chilenos por sobre cualquier otra fuente: ${list}.
Si una respuesta proviene de uno de estos dominios, cita la URL exacta. Si proviene de otra fuente, indícalo claramente.`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });
    }

    const { query, strict = true, model = 'gemini_3_flash' } = await req.json();
    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'query requerido' }, { status: 400 });
    }

    const sourceClause = buildSourcePreferenceClause({ strict });
    const prompt = `Eres asesor regulatorio senior de PEYU Chile.
Responde la siguiente consulta de manera precisa, citando textualmente artículos, números de ley o circulares cuando aplique.
Sé breve (máximo 8 líneas) pero exacto. Si hay plazos, fechas o sanciones, destácalos.

CONSULTA: ${query}
${sourceClause}`;

    const t0 = Date.now();
    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string', description: 'Respuesta a la consulta, en español formal Chile' },
          sources_used: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                title: { type: 'string' },
                domain: { type: 'string' },
              },
              required: ['url'],
            },
          },
          confidence: {
            type: 'string',
            enum: ['alta', 'media', 'baja'],
            description: 'Alta si todas las fuentes son oficiales y dicen lo mismo. Baja si la info no está en fuentes oficiales.',
          },
          warning: {
            type: 'string',
            description: 'Vacío si no hay advertencias. Si la consulta no está cubierta por fuentes oficiales, indicarlo aquí.',
          },
        },
        required: ['answer', 'confidence'],
      },
    });
    const latencyMs = Date.now() - t0;

    // Validar que las fuentes citadas pertenecen a dominios oficiales
    const trustedDomains = TRUSTED_SOURCES_CL.map(s => s.domain);
    const isTrusted = (url) => {
      try {
        const host = new URL(url).hostname.toLowerCase();
        return trustedDomains.some(d => host === d || host.endsWith(`.${d}`));
      } catch {
        return false;
      }
    };
    const sources = (llmRes?.sources_used || []).map(s => ({
      ...s,
      is_official: isTrusted(s.url),
    }));
    const officialCount = sources.filter(s => s.is_official).length;

    // Auto-log en AILog (no bloquea)
    try {
      await base44.asServiceRole.entities.AILog.create({
        agent_name: 'consultaOficialCL',
        model,
        task_type: 'other',
        user_message: query,
        system_context: `strict=${strict} · trusted_domains=${trustedDomains.join(',')}`,
        ai_response: typeof llmRes === 'string' ? llmRes : JSON.stringify(llmRes).slice(0, 4000),
        user_email: user.email,
        latency_ms: latencyMs,
        status: 'success',
        tags: ['regulatory', 'cl', strict ? 'strict' : 'preferred'],
      });
    } catch { /* best-effort */ }

    return Response.json({
      ok: true,
      query,
      answer: llmRes?.answer || '',
      confidence: llmRes?.confidence || 'media',
      warning: llmRes?.warning || null,
      sources_used: sources,
      official_sources_count: officialCount,
      total_sources_count: sources.length,
      used_strict: strict,
      latency_ms: latencyMs,
    });
  } catch (error) {
    console.error('[consultaOficialCL]', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});