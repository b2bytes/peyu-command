// ============================================================================
// chat-sanitize.js — Limpieza defensiva de respuestas del agente
// ----------------------------------------------------------------------------
// El agente Peyu recibe en cada mensaje bloques [CONTEXTO] y [BRAIN] con data
// cruda (top_skus="SKU|nombre|cat|precio, …", referencias "(products/PROD-XX)",
// listados de productos, fragmentos de políticas, etc).
//
// A veces el LLM "fuga" parte de esa data a su respuesta visible al usuario,
// produciendo muros de texto ilegibles. Este módulo:
//   1. Elimina artefactos técnicos crudos (headers, key=value, SKU pipes).
//   2. Detecta "muros" (>4 líneas con precios, listados de productos) y los
//      colapsa a una invitación corta para que el chat siga vendiendo.
// ============================================================================

const KNOWN_NAMESPACES = '(products|customers|conversations|policies|policies_faq|sustainability|proposals|brand_voice)';

const STRIP_PATTERNS = [
  // 🔥 BLOQUE [BRAIN]…\n\n[…fin del Brain…] — el lookahead acepta el siguiente
  // bloque técnico ([CONTEXTO]/[BRAIN]/[PRODUCTOS]) o un \n\n que separa del
  // mensaje real del usuario. ⚠️ NO usamos \n\s*\[ porque las líneas del Brain
  // son "[1] texto", "[2] texto" y se quedaban dentro del payload visible.
  /\[CONTEXTO\][\s\S]*?(?=\n\s*\[(?:CONTEXTO|BRAIN|PRODUCTOS|CATALOGO|MEMORIA)\]|\n\n|$)/gi,
  /\[BRAIN\][\s\S]*?(?=\n\s*\[(?:CONTEXTO|BRAIN|PRODUCTOS|CATALOGO|MEMORIA)\]|\n\n|$)/gi,

  // Headers sueltos que se hayan colado
  /^\s*\[(CONTEXTO|BRAIN|PRODUCTOS|CATALOGO|MEMORIA)\]\s*:?\s*$/gim,

  // 🧹 Líneas residuales del Brain tipo "[1] Conversación del…", "[2] Resumen…"
  // Estas son el artefacto típico cuando el bloque [BRAIN] no se cortó bien.
  // Cubre el caso del usuario en la captura.
  /^\s*\[\d+\]\s.*$/gm,

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

// Líneas de "listado de productos crudo" — patrón típico:
//   "- Pack 6 cachos: $18.990"
//   "• Panera Notebook · $29.990"
//   "1. Lámpara Reciclada — $24.990"
// Si vienen >3 seguidas, el agente está pegando catálogo en vez de vender.
const PRICE_LINE = /^\s*[-•*·\d.]+\s.{3,80}\$\s?\d{1,3}([.,]\d{3})+/;

// Tags que el chat rendea como tarjetas — NO los contamos como "muro de texto".
const TAG_LINE = /\[\[(PRODUCTO|CART|CHECKOUT|NAV|ACTION|NEWSLETTER)/i;

/**
 * Detecta muros de texto crudos (>4 líneas con precio o >12 líneas totales sin
 * estructura). Si lo encuentra, recorta la respuesta a las primeras 2 líneas
 * útiles para que el chat siga conversacional.
 */
function collapseWallOfText(text) {
  const lines = text.split('\n');
  let priceLines = 0;
  for (const l of lines) {
    if (TAG_LINE.test(l)) continue;
    if (PRICE_LINE.test(l)) priceLines++;
  }

  // >3 líneas con precio = listado de catálogo → cortar
  if (priceLines >= 3) {
    const keep = [];
    let kept = 0;
    for (const l of lines) {
      // mantenemos siempre tags (productos/cart/checkout/etc) y máximo 2 líneas normales
      if (TAG_LINE.test(l)) { keep.push(l); continue; }
      if (PRICE_LINE.test(l)) continue; // saltamos listados
      if (l.trim() && kept < 2) { keep.push(l); kept++; }
      else if (!l.trim() && keep.length) { keep.push(l); }
    }
    let result = keep.join('\n').trim();
    if (!result || result.length < 10) {
      result = '¿Quieres que te muestre algo específico? Cuéntame para qué es 🐢';
    }
    return result;
  }

  // Más de 8 líneas totales con texto = muy largo, posible discurso. Cortamos.
  const textLines = lines.filter(l => l.trim() && !TAG_LINE.test(l));
  if (textLines.length > 8) {
    const keep = [];
    let textKept = 0;
    for (const l of lines) {
      if (TAG_LINE.test(l)) { keep.push(l); continue; }
      if (!l.trim()) { keep.push(l); continue; }
      if (textKept < 3) { keep.push(l); textKept++; }
    }
    return keep.join('\n').trim();
  }

  return text;
}

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

  // 🛡️ Última capa: detectar y colapsar muros de texto / listados crudos
  t = collapseWallOfText(t);

  return t.trim();
}

/**
 * Limpieza específica para mensajes del USUARIO. Quita únicamente los bloques
 * técnicos [CONTEXTO] y [BRAIN] inyectados por withContext(), pero NUNCA
 * recorta el contenido real del usuario aunque sea largo.
 *
 * Si lo único que queda tras limpiar es vacío o el chip de "prompt sugerido",
 * devuelve el texto original sin los bloques tag, no el colapso de muro.
 */
export function sanitizeUserMessage(raw) {
  if (!raw) return '';
  let t = String(raw);
  for (const re of STRIP_PATTERNS) {
    t = t.replace(re, '');
  }
  t = t.replace(/\n{3,}/g, '\n\n');
  t = t.replace(/^[\s,;:.|]+$/gm, '');
  t = t.trim();

  // 🛡️ Última línea de defensa: si después de limpiar quedan vestigios del Brain
  // (palabras clave técnicas como "Conversación del", "Consulta clave:", "Usuario
  // anónimo", "Resumen:"), recortamos al último párrafo no-técnico. withContext()
  // siempre pone el mensaje real del usuario al FINAL tras un \n\n, así que el
  // último bloque es lo que el usuario realmente escribió.
  const BRAIN_LEAK = /(Consulta clave:|Usuario an[oó]nimo|Conversaci[oó]n del \d|Resumen:)/i;
  if (BRAIN_LEAK.test(t)) {
    const blocks = t.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
    // Encontrar el último bloque que NO tenga leaks técnicos
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (!BRAIN_LEAK.test(blocks[i]) && blocks[i].length < 300) {
        return blocks[i];
      }
    }
    // Si todos los bloques son leak, devolvemos vacío para no mostrar basura
    return '';
  }

  return t;
}