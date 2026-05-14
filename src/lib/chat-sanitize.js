// ============================================================================
// chat-sanitize.js — Limpieza defensiva de respuestas del agente
// ----------------------------------------------------------------------------
// El agente Peyu recibe en cada mensaje bloques [CONTEXTO] y [BRAIN] con data
// cruda (top_skus="SKU|nombre|cat|precio, …", referencias "(products/PROD-XX)",
// listados de productos, fragmentos de políticas, etc).
//
// A veces el LLM "fuga" parte de esa data a su respuesta visible al usuario,
// produciendo muros de texto ilegibles tipo:
//
//   "[CONTEXTO] page=/ top_skus=ENT-CACH6|Pack 6 cachos|Entretenimiento|18990,
//    OFF-PANNT|Panera Notebook|Oficina|29990, …
//    [BRAIN] (products/PROD-X) Soporte celular 100% reciclado…"
//
// Este sanitizer elimina esos artefactos ANTES de renderizar, sin importar
// cómo se haya filtrado. Es la última línea de defensa.
// ============================================================================

const KNOWN_NAMESPACES = '(products|customers|conversations|policies|policies_faq|sustainability|proposals)';

const STRIP_PATTERNS = [
  // Bloques completos con header [CONTEXTO] / [BRAIN] (multilínea, voraces hasta otro bloque o fin)
  /\[CONTEXTO\][\s\S]*?(?=\n\s*\[|\n\n|$)/gi,
  /\[BRAIN\][\s\S]*?(?=\n\s*\[|\n\n|$)/gi,

  // Pares clave=valor típicos del [CONTEXTO]
  new RegExp(`\\b(page|top_skus|categorias_disponibles|viewing_sku|viewing_name|viewing_category|viewing_price_b2c|cart_items|cart_total|detected_qty|already_shown_skus|user_name|user_email)\\s*=\\s*("[^"]*"|[^\\s,]+)`, 'gi'),

  // Líneas tipo "SKU|nombre|categoria|precio"
  /^[A-Z0-9][A-Z0-9\-_]{2,}\|[^|\n]+\|[^|\n]+\|\s*\d+\s*$/gm,

  // Referencias vector store: "[7] (products)", "[12] (customers/cust-xx)"
  new RegExp(`\\[\\s*\\d+\\s*\\]\\s*\\(\\s*${KNOWN_NAMESPACES}[^)]*\\)`, 'gi'),

  // Paths de vector store sueltos: "(products/PROD-SKU)"
  new RegExp(`\\(\\s*${KNOWN_NAMESPACES}\\/[^)]+\\)`, 'gi'),

  // Strings literales tipo: top_skus="…" (cuando viene con comillas)
  /top_skus\s*=\s*"[\s\S]*?"/gi,
];

/**
 * Limpia artefactos técnicos de una respuesta del agente.
 * Idempotente y seguro: si el texto está limpio, lo devuelve tal cual.
 */
export function sanitizeAgentText(raw) {
  if (!raw) return '';
  let t = String(raw);

  for (const re of STRIP_PATTERNS) {
    t = t.replace(re, '');
  }

  // Colapsar saltos triples y limpiar líneas vacías al inicio/final
  t = t.replace(/\n{3,}/g, '\n\n');
  // Quitar líneas que quedaron como pura puntuación residual tras los strips
  t = t.replace(/^[\s,;:.|]+$/gm, '');
  t = t.replace(/\n{3,}/g, '\n\n');

  return t.trim();
}