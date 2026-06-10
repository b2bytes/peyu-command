// ============================================================================
// color-parser — Extrae colores mencionados en la descripción del producto.
// ----------------------------------------------------------------------------
// PEYU vende productos donde cada SKU se ofrece en colores específicos. El
// catálogo no tiene un campo `colores`, pero la `descripcion` (importada de
// Woo) sí los menciona. Este helper detecta menciones y devuelve solo los
// colores reales del producto, evitando mostrar opciones falsas en la UI.
// ============================================================================

// Catálogo central de colores PEYU con su HEX real y aliases (singular,
// plural, con/sin tilde, variantes en español chileno).
const PEYU_COLOR_CATALOG = [
  // ── COLORES OFICIALES CARCASAS PEYU (5 colores del catálogo real) ──
  { id: 'turquesa',  label: 'Turquesa',         hex: '#34C5B5', aliases: ['turquesa', 'turquesas', 'turquoise', 'teal'] },
  { id: 'amarillo',  label: 'Amarillo',         hex: '#F5C842', aliases: ['amarillo', 'amarillos', 'yellow'] },
  { id: 'rosa',      label: 'Rosado',           hex: '#F48FB1', aliases: ['rosa', 'rosado', 'rosados', 'rosadas', 'rosas', 'pink'] },
  { id: 'negro',     label: 'Negro',            hex: '#212121', aliases: ['negro', 'negros', 'onix', 'ónix', 'black'] },
  { id: 'azul',      label: 'Azul',             hex: '#4DA3DC', aliases: ['azul', 'azules', 'blue', 'celeste'] },
  // ── COLORES ADICIONALES CATÁLOGO (tonos oficiales del PDF B2B) ──
  { id: 'blanco',    label: 'Blanco',           hex: '#F5F5F0', aliases: ['blanco', 'blancos', 'white'] },
  { id: 'verde',     label: 'Verde',            hex: '#4BC5A5', aliases: ['verde', 'verdes', 'green'] },
  { id: 'rojo',      label: 'Rojo',             hex: '#F0807A', aliases: ['rojo', 'rojos', 'coral', 'red'] },
  { id: 'mixto',     label: 'Mixto',            hex: '#4DA3DC', aliases: ['mixto', 'mix', 'multicolor', 'surtido'] },
  { id: 'violeta',   label: 'Violeta',          hex: '#9B72CF', aliases: ['violeta', 'violetas', 'morado', 'morados', 'purple', 'lila'] },
  { id: 'naranja',   label: 'Naranja',          hex: '#FB923C', aliases: ['naranja', 'naranjas', 'orange', 'terracota'] },
  { id: 'gris',      label: 'Gris',             hex: '#6B7280', aliases: ['gris', 'grises', 'gray', 'grey'] },
  { id: 'cafe',      label: 'Café',             hex: '#8B5E3C', aliases: ['cafe', 'café', 'marron', 'marrón', 'brown', 'kraft'] },
  { id: 'beige',     label: 'Beige',            hex: '#E7D8C6', aliases: ['beige', 'arena', 'crema', 'natural'] },
];

// Export público del catálogo de colores PEYU (para selectores en carrito, etc.)
export const PEYU_COLORS = PEYU_COLOR_CATALOG;

// Normaliza string: minúsculas, sin tildes, sin signos.
function normalize(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae colores de la descripción del producto.
 * Solo retorna colores cuyos aliases aparecen como palabra completa.
 * Si no encuentra ninguno, retorna [] (la UI no debería mostrar el selector).
 */
export function parseColoresFromDescripcion(descripcion = '') {
  if (!descripcion) return [];
  const text = ' ' + normalize(descripcion) + ' ';
  const found = new Map();

  for (const color of PEYU_COLOR_CATALOG) {
    for (const alias of color.aliases) {
      const aliasNorm = normalize(alias);
      // Match palabra completa (rodeada de espacios) → evita que "verdes" matchee con otro
      if (text.includes(' ' + aliasNorm + ' ')) {
        found.set(color.id, color);
        break;
      }
    }
  }

  return Array.from(found.values());
}

/**
 * Devuelve los colores correctos para un producto. Prioridad:
 *   1. Colores parseados desde `descripcion`
 *   2. Si no hay matches → fallback por categoría/material
 *   3. Productos sin colores aplicables (Gift Cards, etc.) → []
 */
export function getColoresProducto(producto) {
  if (!producto) return [];

  // Productos sin variantes de color (Gift Cards, packs corporativos definidos)
  const sku = String(producto.sku || '').toUpperCase();
  if (sku.startsWith('GC-PEYU')) return [];

  // ── REGLA OFICIAL PEYU (PRIORIDAD MÁXIMA) ────────────────────────────
  // Carcasas B2C: el cliente DEBE elegir color antes de comprar. Esta regla
  // va PRIMERO — antes del check de material fibra de trigo — porque las
  // carcasas son compostables (fibra) pero igual tienen 5 colores reales en
  // su campo `colores`. Si dejáramos el check de fibra antes, mostraría un
  // solo swatch "Natural compostable" (era el bug reportado).
  if (producto.categoria === 'Carcasas B2C') {
    // Fuente de verdad: campo `colores` (tienda raíz). Si existe, lo usamos.
    // Fallback legacy a `colores_v2`.
    const explicit = Array.isArray(producto.colores) && producto.colores.length > 0
      ? producto.colores
      : (Array.isArray(producto.colores_v2) ? producto.colores_v2 : []);
    if (explicit.length > 0) {
      const norm = (s) => normalize(s);
      const mapped = explicit
        .map((raw) => {
          const n = norm(raw);
          return PEYU_COLOR_CATALOG.find((c) => c.aliases.some((a) => normalize(a) === n));
        })
        .filter(Boolean);
      if (mapped.length > 0) return mapped;
    }
    // Set OFICIAL por defecto para carcasas (5 colores PEYU):
    // Turquesa, Amarillo, Rosado, Negro, Azul. Aplica a TODAS las carcasas
    // (iPhone y Samsung) cuando el producto no trae `colores` cargado.
    return PEYU_COLOR_CATALOG.filter((c) =>
      ['turquesa', 'amarillo', 'rosa', 'negro', 'azul'].includes(c.id)
    );
  }

  // Productos de fibra de trigo (NO carcasas): vienen con color natural único.
  if (producto.material === 'Fibra de Trigo (Compostable)') {
    return [{ id: 'natural', label: 'Natural compostable', hex: '#d4b896' }];
  }

  // Resto del catálogo (Escritorio, Hogar, Entretenimiento, Corporativo):
  // NORMA OFICIAL (catálogo B2B PDF): el campo `colores` del producto es la
  // FUENTE DE VERDAD (Azul, Negro, Rojo, Verde · + Mixto en Pack 4 cachos).
  // Va PRIMERO: aunque solo algunos colores tengan foto, el cliente siempre
  // ve las opciones oficiales completas.
  const explicit = Array.isArray(producto.colores) && producto.colores.length > 0
    ? producto.colores
    : (Array.isArray(producto.colores_v2) ? producto.colores_v2 : []);
  if (explicit.length > 0) {
    const mapped = explicit
      .map((raw) => PEYU_COLOR_CATALOG.find((c) => c.aliases.some((a) => normalize(a) === normalize(raw))))
      .filter(Boolean);
    if (mapped.length > 0) return mapped;
  }

  // Sin `colores` explícitos: las llaves de imagenes_por_color (fotos por
  // color generadas con visión IA) definen las opciones disponibles.
  const mapa = producto.imagenes_por_color;
  if (mapa && typeof mapa === 'object' && Object.keys(mapa).length > 0) {
    const norm = (s) => normalize(s);
    const colores = Object.keys(mapa)
      .map((k) => PEYU_COLOR_CATALOG.find((c) => c.aliases.some((a) => norm(a) === norm(k))))
      .filter(Boolean);
    if (colores.length > 0) return colores;
  }

  // Si no tiene fotos por color pero es plástico reciclado, mostramos los
  // 4 colores oficiales PEYU (azul, verde, rojo, negro). Son colores reales del
  // producto aunque no tengan foto individual — el cliente igual debe elegir.
  if (producto.material === 'Plástico 100% Reciclado') {
    return PEYU_COLOR_CATALOG.filter((c) =>
      ['azul', 'verde', 'rojo', 'negro'].includes(c.id)
    );
  }

  return [];
}