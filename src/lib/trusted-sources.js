// ============================================================================
// trusted-sources.js — Fuentes oficiales preferidas (Chile)
// ----------------------------------------------------------------------------
// Cuando un agente o función backend invoca al LLM con búsqueda en internet
// (add_context_from_internet: true), debe priorizar SIEMPRE estos dominios
// oficiales por sobre blogs, foros o medios secundarios.
//
// Uso típico:
//   import { TRUSTED_SOURCES_CL, buildSourcePreferenceClause } from '@/lib/trusted-sources';
//
//   const prompt = `${pregunta}\n\n${buildSourcePreferenceClause()}`;
//   await base44.integrations.Core.InvokeLLM({ prompt, add_context_from_internet: true });
//
// El frontend lo importa con '@/lib/trusted-sources'.
// El backend (Deno) lo replica inline o lo importa relativo si lo movemos.
// ============================================================================

export const TRUSTED_SOURCES_CL = [
  // Gobierno chileno (cualquier subdominio .gob.cl)
  { domain: 'gob.cl', label: 'Portal del Estado de Chile', match: 'suffix' },
  // Instituto Nacional de Estadísticas
  { domain: 'ine.cl', label: 'Instituto Nacional de Estadísticas', match: 'suffix' },
  { domain: 'ine.gob.cl', label: 'INE (alterno)', match: 'suffix' },
  // Comisión para el Mercado Financiero
  { domain: 'cmfchile.cl', label: 'Comisión para el Mercado Financiero', match: 'suffix' },
  { domain: 'cmf.cl', label: 'CMF (alias)', match: 'suffix' },
  // Servicio de Impuestos Internos
  { domain: 'sii.cl', label: 'Servicio de Impuestos Internos', match: 'suffix' },
  // Servicio Nacional del Consumidor
  { domain: 'sernac.cl', label: 'SERNAC', match: 'suffix' },
  // Biblioteca del Congreso Nacional
  { domain: 'bcn.cl', label: 'Biblioteca del Congreso Nacional', match: 'suffix' },
  { domain: 'leychile.cl', label: 'LeyChile (BCN)', match: 'suffix' },
];

// Lista plana solo dominios — útil para filtros y prompts.
export const TRUSTED_DOMAINS_CL = TRUSTED_SOURCES_CL.map(s => s.domain);

// Cláusula de preferencia que se inyecta al prompt del LLM cuando se usa
// add_context_from_internet: true. Le dice al modelo qué fuentes priorizar
// y cómo citar.
export function buildSourcePreferenceClause(opts = {}) {
  const { strict = false, topic = 'normativa, estadísticas o información oficial chilena' } = opts;
  const list = TRUSTED_SOURCES_CL.map(s => `${s.domain} (${s.label})`).join(', ');

  if (strict) {
    return `\n\n[FUENTES OFICIALES — OBLIGATORIO]
Para ${topic}, USA EXCLUSIVAMENTE estos dominios oficiales chilenos: ${list}.
Si la información no está disponible en ellos, dilo explícitamente. NO uses blogs, foros, Wikipedia ni medios secundarios. Cita siempre la URL exacta del dominio oficial.`;
  }

  return `\n\n[FUENTES PREFERIDAS]
Para ${topic}, prioriza SIEMPRE estos dominios oficiales chilenos por sobre cualquier otra fuente: ${list}.
Si una respuesta proviene de uno de estos dominios, cita la URL exacta. Si proviene de otra fuente, indícalo claramente.`;
}

// Verifica si una URL pertenece a una fuente oficial preferida.
export function isTrustedSource(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TRUSTED_DOMAINS_CL.some(d => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}