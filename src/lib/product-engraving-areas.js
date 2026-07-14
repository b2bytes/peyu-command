/**
 * Sistema inteligente de áreas de estampado por producto.
 * Deduce automáticamente dónde se puede grabar en cada producto según:
 * 1. Campo custom `area_grabado` del producto (si existe)
 * 2. Categoría del producto
 * 3. Nombre del producto (fallback)
 */

// Áreas estándar predefinidas.
// REGLA FUNDADOR (jul 2026): salvo carcasas (cuya forma física limita el láser),
// TODOS los productos usan el lienzo COMPLETO — el cliente posiciona su logo en
// cualquier parte de la pieza, sin importar la forma del producto (llaveros con
// formas irregulares, cachos, posavasos hexagonales, paletas, etc.).
const TOTAL = { left: 2, right: 98, top: 2, bottom: 98 };
const AREAS = {
  CARCASA: { left: 26, right: 74, top: 18, bottom: 86 },    // Carcasas de celular (forma contenida)
  CACHO: TOTAL,
  POSAVASO: TOTAL,
  COASTER: TOTAL,
  PALETA: TOTAL,
  ESCRITORIO: TOTAL,
  LLAVERO: TOTAL,
  CORPORATIVO: TOTAL,
  LIBRE: TOTAL,
};

/**
 * Retorna el área de estampado (grabado láser) para un producto.
 * Si el producto no tiene área explícita, la deduce de forma inteligente.
 *
 * @param {Object} producto - Objeto producto con sku, nombre, categoria, area_grabado (opcional)
 * @returns {Object} Área { left, right, top, bottom } en % del lienzo
 */
export function getProductEngraggingArea(producto) {
  if (!producto) return AREAS.LIBRE;

  // 1. Si el producto tiene área grabado explícita, usarla
  if (producto.area_grabado && typeof producto.area_grabado === 'object') {
    return producto.area_grabado;
  }

  // 2. Productos con área propia por NOMBRE (antes que la categoría genérica:
  //    un llavero es "Hogar" pero su área de grabado es la placa, no toda la foto)
  const nomEarly = producto.nombre?.toLowerCase() || '';
  if (nomEarly.includes('llavero')) return AREAS.LLAVERO;

  // 3. Deducir de categoría
  const cat = producto.categoria?.toLowerCase() || '';
  if (cat.includes('carcasa')) return AREAS.CARCASA;
  if (cat.includes('cacho')) return AREAS.CACHO;
  if (cat.includes('posavaso')) return AREAS.POSAVASO;
  if (cat.includes('coaster')) return AREAS.COASTER;
  if (cat.includes('paleta')) return AREAS.PALETA;
  if (cat.includes('escritorio')) return AREAS.ESCRITORIO;
  if (cat.includes('corporativo')) return AREAS.CORPORATIVO;
  if (cat.includes('hogar')) return AREAS.ESCRITORIO;

  // 4. Deducir del nombre (fallback inteligente)
  const nom = nomEarly;
  if (nom.includes('carcasa') || nom.includes('case')) return AREAS.CARCASA;
  if (nom.includes('cacho')) return AREAS.CACHO;
  if (nom.includes('posavaso') || nom.includes('coaster')) return AREAS.POSAVASO;
  if (nom.includes('paleta')) return AREAS.PALETA;
  if (nom.includes('taza') || nom.includes('vaso') || nom.includes('libreta')) return AREAS.ESCRITORIO;

  // Default seguro. (Antes: "tiene colores → es carcasa", lo que rompía el
  // mockup de Jenga, llaveros y otros productos con variantes de color: se
  // les aplicaban las reglas exclusivas de carcasas.)
  return AREAS.LIBRE;
}

/**
 * Determina si el producto es una "carcasa" (teléfono) o algo más.
 * Usado para decidir comportamientos específicos en el preview.
 *
 * @param {Object} producto
 * @returns {boolean}
 */
export function isProductoCarcasa(producto) {
  if (!producto) return false;
  const area = getProductEngraggingArea(producto);
  return area === AREAS.CARCASA;
}

/**
 * Alias para compatibilidad: getArea ahora es el nuevo estándar.
 * Mantiene el mismo comportamiento que antes pero centralizado.
 */
export function getProductoArea(producto) {
  return getProductEngraggingArea(producto);
}

export default {
  AREAS,
  getProductEngraggingArea,
  isProductoCarcasa,
  getProductoArea,
};