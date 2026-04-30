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
  { id: 'negro',     label: 'Negro Ónix',       hex: '#1a1a1a', aliases: ['negro', 'negros', 'onix', 'ónix', 'black'] },
  { id: 'blanco',    label: 'Blanco',           hex: '#f4f4f0', aliases: ['blanco', 'blancos', 'white'] },
  { id: 'azul',      label: 'Azul',             hex: '#4a90d9', aliases: ['azul', 'azules', 'blue', 'celeste'] },
  { id: 'turquesa',  label: 'Turquesa',         hex: '#2d9d8f', aliases: ['turquesa', 'turquesas', 'turquoise'] },
  { id: 'verde',     label: 'Verde',            hex: '#0F8B6C', aliases: ['verde', 'verdes', 'green'] },
  { id: 'rojo',      label: 'Rojo Coral',       hex: '#c94040', aliases: ['rojo', 'rojos', 'coral', 'red'] },
  { id: 'rosa',      label: 'Rosa',             hex: '#e8799c', aliases: ['rosa', 'rosado', 'rosados', 'rosadas', 'rosas', 'pink'] },
  { id: 'amarillo',  label: 'Amarillo',         hex: '#f0c040', aliases: ['amarillo', 'amarillos', 'yellow'] },
  { id: 'violeta',   label: 'Violeta',          hex: '#8b5cf6', aliases: ['violeta', 'violetas', 'morado', 'morados', 'purple', 'lila'] },
  { id: 'naranja',   label: 'Naranja',          hex: '#fb923c', aliases: ['naranja', 'naranjas', 'orange', 'terracota'] },
  { id: 'gris',      label: 'Gris',             hex: '#6b7280', aliases: ['gris', 'grises', 'gray', 'grey'] },
  { id: 'cafe',      label: 'Café',             hex: '#8b5e3c', aliases: ['cafe', 'café', 'marron', 'marrón', 'brown', 'kraft'] },
  { id: 'beige',     label: 'Beige',            hex: '#E7D8C6', aliases: ['beige', 'arena', 'crema', 'natural'] },
];

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

  // Productos de fibra de trigo: vienen con color natural único, no se eligen
  if (producto.material === 'Fibra de Trigo (Compostable)') {
    return [{ id: 'natural', label: 'Natural compostable', hex: '#d4b896' }];
  }

  // ── REGLA OFICIAL PEYU ───────────────────────────────────────────────
  // Carcasas B2C: cada SKU es un único color (el que muestra la foto).
  // No se ofrece selector — el cliente compra el modelo/color que ve.
  if (producto.categoria === 'Carcasas B2C') {
    return [];
  }

  // Resto del catálogo (Escritorio, Hogar, Entretenimiento, Corporativo):
  // Solo 4 colores oficiales → Turquesa, Negro, Azul, Rosado.
  return PEYU_COLOR_CATALOG.filter(c =>
    ['turquesa', 'negro', 'azul', 'rosa'].includes(c.id)
  );
}