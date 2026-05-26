// ============================================================================
// color-image-matcher.js — Matching inteligente color ↔ imagen de galería
// ----------------------------------------------------------------------------
// Dado un color seleccionado y una galería de URLs, intenta detectar cuál
// imagen muestra el producto en ese color. UI/UX 2026: el match es scored
// (no solo substring) y soporta variantes hispano (rosado/rosa, celeste/azul,
// turquesa/aqua, etc).
//
// Devuelve { index: number, score: number, matchedAlias: string }
// o null si no hay match con score suficiente.
// ============================================================================

// Aliases hispano + inglés por color. La clave es el `id` del color
// (lowercase, sin tildes — ya viene normalizado de color-parser).
const COLOR_ALIASES = {
  negro:     ['negro', 'black', 'noir'],
  blanco:    ['blanco', 'white', 'blanc'],
  gris:      ['gris', 'gray', 'grey'],
  azul:      ['azul', 'blue', 'celeste', 'azulino', 'navy'],
  celeste:   ['celeste', 'cielo', 'sky', 'lightblue', 'azul-claro'],
  turquesa:  ['turquesa', 'turquoise', 'aqua', 'tiffany', 'menta', 'mint'],
  verde:     ['verde', 'green', 'olive', 'olivo'],
  amarillo:  ['amarillo', 'yellow', 'amber', 'mostaza', 'mustard'],
  naranja:   ['naranja', 'naranjo', 'orange', 'mandarina'],
  rojo:      ['rojo', 'red', 'rouge', 'carmin', 'carmesi'],
  rosa:      ['rosa', 'rosado', 'pink', 'fucsia', 'fuchsia', 'magenta', 'palo-rosa'],
  rosado:    ['rosado', 'rosa', 'pink', 'salmón', 'salmon'],
  morado:    ['morado', 'purple', 'violeta', 'violet', 'lila', 'lavanda'],
  violeta:   ['violeta', 'violet', 'morado', 'purple', 'lila'],
  cafe:      ['cafe', 'café', 'brown', 'marron', 'marrón', 'chocolate'],
  beige:     ['beige', 'crema', 'cream', 'arena', 'sand', 'nude', 'tan'],
  natural:   ['natural', 'raw', 'crudo', 'transparente', 'sin-color'],
  marmolado: ['marmolado', 'marbled', 'marble', 'jaspe'],
  dorado:    ['dorado', 'gold', 'oro'],
  plateado:  ['plateado', 'plata', 'silver'],
};

// Normaliza: lowercase, sin tildes, sin caracteres especiales raros.
function norm(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');
}

// Extrae solo el filename (sin querystrings ni dominios) para que el match
// sea sobre la parte del URL que tiene info real del producto.
function getUrlSearchable(url) {
  if (!url) return '';
  try {
    // Tomamos pathname y removemos extensión.
    const path = url.split('?')[0].split('#')[0];
    const file = path.split('/').pop() || '';
    return norm(file.replace(/\.(jpe?g|png|webp|gif|avif)$/i, ''));
  } catch {
    return norm(url);
  }
}

/**
 * Construye lista de aliases buscables para un color dado.
 * @param {{id: string, label: string}} color
 * @returns {string[]} aliases normalizados (únicos, sin vacíos)
 */
export function buildColorAliases(color) {
  if (!color) return [];
  const idNorm = norm(color.id);
  const labelNorm = norm(color.label || '').split('-')[0]; // primer token del label
  const explicit = COLOR_ALIASES[idNorm] || [];

  const all = new Set([idNorm, labelNorm, ...explicit.map(norm)].filter(Boolean));
  // Quitamos aliases demasiado cortos (riesgo de falsos positivos: "azul" sí, pero no "az")
  return [...all].filter(a => a.length >= 3);
}

/**
 * Score de matching entre un URL y los aliases del color.
 * Higher = better. 0 = no match.
 *
 *  Exact filename equals alias                → 100
 *  Filename starts with alias + boundary      →  80
 *  Filename contains alias as separated word  →  60
 *  Filename contains alias as substring       →  35
 */
function scoreUrlForAliases(url, aliases) {
  const searchable = getUrlSearchable(url);
  if (!searchable || aliases.length === 0) return 0;

  let best = 0;
  for (const alias of aliases) {
    if (!alias) continue;
    if (searchable === alias) { best = Math.max(best, 100); continue; }
    // alias como palabra completa separada por - _ o limites
    const wordRe = new RegExp(`(^|[-_])${alias}([-_]|$)`);
    if (wordRe.test(searchable)) { best = Math.max(best, 80); continue; }
    if (searchable.startsWith(alias + '-') || searchable.startsWith(alias + '_')) {
      best = Math.max(best, 70); continue;
    }
    if (searchable.includes(alias)) { best = Math.max(best, 35); }
  }
  return best;
}

/**
 * Busca en la galería la imagen que mejor representa el color elegido.
 *
 * @param {string[]} galeria   URLs de la galería en orden
 * @param {{id: string, label: string}} color  Color seleccionado
 * @param {object} [opts]
 * @param {number} [opts.minScore=35]  Score mínimo para considerar match
 * @returns {{ index: number, score: number, matchedAlias: string } | null}
 */
export function findColorImageMatch(galeria, color, opts = {}) {
  const { minScore = 35 } = opts;
  if (!Array.isArray(galeria) || galeria.length === 0 || !color) return null;

  const aliases = buildColorAliases(color);
  if (aliases.length === 0) return null;

  let bestIdx = -1;
  let bestScore = 0;
  let bestAlias = '';

  galeria.forEach((url, idx) => {
    const score = scoreUrlForAliases(url, aliases);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
      // Captura el alias que dio el mejor match (para feedback UI)
      const searchable = getUrlSearchable(url);
      bestAlias = aliases.find(a => searchable.includes(a)) || color.label;
    }
  });

  if (bestScore < minScore || bestIdx < 0) return null;
  return { index: bestIdx, score: bestScore, matchedAlias: bestAlias };
}