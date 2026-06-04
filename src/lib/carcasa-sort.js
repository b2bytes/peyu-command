// ============================================================================
// carcasa-sort.js — Orden de carcasas estilo sitio oficial peyuchile.cl
// ----------------------------------------------------------------------------
// Agrupa las carcasas POR MARCA en este orden: Apple → Samsung → Huawei →
// Xiaomi → (otras). Dentro de cada marca, ordena por modelo de MÁS NUEVO a
// MÁS ANTIGUO (ej. iPhone 17 Pro Max → iPhone 6).
//
// No inventa precios ni colores: solo reordena el array de carcasas. El precio,
// colores y stock los maneja cada producto/ProductCard.
// ============================================================================

// Prioridad de marca (menor = primero). Lo que no matchea va al final.
const MARCA_ORDEN = ['apple', 'samsung', 'huawei', 'xiaomi'];

// Detecta la marca de una carcasa a partir de su nombre/SKU.
function detectarMarca(p) {
  const txt = `${p?.nombre || ''} ${p?.sku || ''}`.toLowerCase();
  if (/iphone|apple/.test(txt)) return 'apple';
  if (/samsung|galaxy/.test(txt)) return 'samsung';
  if (/huawei|mate|p\d{2}/.test(txt)) return 'huawei';
  if (/xiaomi|redmi|poco|mi\s?\d/.test(txt)) return 'xiaomi';
  return 'otras';
}

// Extrae un "score" numérico de modelo para ordenar de nuevo→viejo.
// Combina el número de modelo (ej. iPhone 17 = 17) con un bonus por sufijos
// (Pro Max > Pro > Plus > base) para que las variantes top queden primero.
function scoreModelo(p) {
  const txt = `${p?.nombre || ''}`.toLowerCase();
  // primer número de 1-2 dígitos relevante (modelo)
  const m = txt.match(/\b(\d{1,2})\b/);
  const num = m ? parseInt(m[1], 10) : 0;
  let bonus = 0;
  if (/pro\s*max|ultra/.test(txt)) bonus = 0.4;
  else if (/\bpro\b/.test(txt)) bonus = 0.3;
  else if (/plus|\+/.test(txt)) bonus = 0.2;
  else if (/\bmax\b/.test(txt)) bonus = 0.25;
  return num + bonus;
}

/**
 * Ordena una lista de carcasas estilo oficial: por marca y modelo (nuevo→viejo).
 * @param {Array} carcasas
 * @returns {Array} nuevo array ordenado (no muta el original)
 */
export function ordenarCarcasas(carcasas = []) {
  return [...carcasas].sort((a, b) => {
    const ma = detectarMarca(a);
    const mb = detectarMarca(b);
    const ia = MARCA_ORDEN.indexOf(ma);
    const ib = MARCA_ORDEN.indexOf(mb);
    const ra = ia === -1 ? MARCA_ORDEN.length : ia;
    const rb = ib === -1 ? MARCA_ORDEN.length : ib;
    if (ra !== rb) return ra - rb;            // marca primero
    const sa = scoreModelo(a);
    const sb = scoreModelo(b);
    if (sb !== sa) return sb - sa;            // modelo nuevo → viejo
    return (a.nombre || '').localeCompare(b.nombre || '');
  });
}