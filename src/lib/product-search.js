// 🔎 Búsqueda de productos PEYU — tolerante a acentos/typos, por nombre, SKU,
// categoría y modelo de teléfono (ej: "iphone 15", "samsung s20", "i15 pro").
// Sin dependencias externas: normalización + matching por tokens + distancia
// de edición acotada para typos leves.

// Normaliza: minúsculas, sin tildes, sin signos, espacios colapsados.
export function normalize(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Sinónimos / alias comunes que la gente escribe para buscar carcasas.
const SYNONYMS = {
  iphone: ['iphone', 'ip', 'apple'],
  samsung: ['samsung', 'galaxy', 'sgs'],
  huawei: ['huawei', 'hw'],
  carcasa: ['carcasa', 'funda', 'cover', 'case'],
  escritorio: ['escritorio', 'oficina', 'desk'],
  soporte: ['soporte', 'stand', 'base'],
};

// Expande la query con sinónimos para mejorar el recall.
function expandTokens(tokens) {
  const out = new Set(tokens);
  for (const t of tokens) {
    for (const [canon, alts] of Object.entries(SYNONYMS)) {
      if (alts.includes(t) || t === canon) {
        out.add(canon);
        alts.forEach(a => out.add(a));
      }
    }
  }
  return Array.from(out);
}

// Distancia de Levenshtein acotada (para typos leves en tokens cortos).
function editDistance(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// Construye el "blob" indexable de un producto (todo lo buscable concatenado).
function productBlob(p) {
  return normalize([
    p.nombre, p.sku, p.categoria, p.material, p.descripcion,
  ].filter(Boolean).join(' '));
}

// ¿Un token de la query matchea el blob? (substring exacto o typo leve por palabra)
function tokenMatches(token, blobWords, blob) {
  if (token.length < 2) return blob.includes(token);
  if (blob.includes(token)) return true;
  // Typo leve: comparar contra palabras del blob de longitud similar.
  for (const w of blobWords) {
    if (Math.abs(w.length - token.length) > 2) continue;
    if (editDistance(token, w) <= (token.length <= 4 ? 1 : 2)) return true;
  }
  return false;
}

/**
 * Score de relevancia de un producto contra la query. 0 = no matchea.
 * Mayor score = más relevante (match en nombre/SKU pesa más).
 */
export function scoreProduct(p, queryNorm, queryTokens) {
  if (!queryNorm) return 1;
  const blob = productBlob(p);
  const blobWords = blob.split(' ');
  const nombreN = normalize(p.nombre);
  const skuN = normalize(p.sku);

  // Match exacto de la frase completa → score alto
  let score = 0;
  if (nombreN.includes(queryNorm)) score += 100;
  if (skuN.includes(queryNorm.replace(/\s/g, ''))) score += 90;
  if (blob.includes(queryNorm)) score += 40;

  // Match por tokens (todos deben matchear para contar como resultado válido)
  let matched = 0;
  for (const t of queryTokens) {
    if (tokenMatches(t, blobWords, blob)) {
      matched++;
      if (nombreN.includes(t)) score += 12;
      else score += 5;
    }
  }
  // Exigimos que TODOS los tokens hagan match (búsqueda AND, tolerante a typos).
  if (matched < queryTokens.length) return 0;
  return score || (matched > 0 ? 1 : 0);
}

/**
 * Filtra + ordena productos por relevancia a la query.
 * Tolerante a acentos/typos. Busca en nombre, SKU, categoría, material, modelo.
 */
export function searchProductos(productos = [], query = '') {
  const queryNorm = normalize(query);
  if (!queryNorm) return productos;
  const tokens = expandTokens(queryNorm.split(' ').filter(Boolean));
  return productos
    .map(p => ({ p, s: scoreProduct(p, queryNorm, queryNorm.split(' ').filter(Boolean)) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.p);
}

/**
 * Sugerencias rápidas mientras se escribe (máx N). Devuelve productos top.
 */
export function suggestProductos(productos = [], query = '', limit = 6) {
  return searchProductos(productos, query).slice(0, limit);
}