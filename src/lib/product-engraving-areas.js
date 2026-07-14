/**
 * Sistema inteligente de áreas de estampado por producto.
 * Deduce automáticamente dónde se puede grabar en cada producto según:
 * 1. Campo custom `area_grabado` del producto (si existe)
 * 2. Categoría del producto
 * 3. Nombre del producto (fallback)
 */

// Áreas estándar predefinidas
const AREAS = {
  CARCASA: { left: 26, right: 74, top: 18, bottom: 86 },    // Carcasas de celular
  CACHO: { left: 10, right: 90, top: 12, bottom: 88 },       // Cachos individuales
  POSAVASO: { left: 12, right: 88, top: 15, bottom: 85 },    // Posavasos hexagonales
  COASTER: { left: 15, right: 85, top: 20, bottom: 80 },     // Coasters redondos
  PALETA: { left: 8, right: 92, top: 10, bottom: 90 },       // Paletas
  ESCRITORIO: { left: 8, right: 92, top: 8, bottom: 92 },    // Objetos escritorio (taza, libreta, etc)
  LLAVERO: { left: 10, right: 90, top: 10, bottom: 90 },     // Llaveros y soportes: área casi libre — la pieza llena la foto y el cliente posiciona donde quiera
  CORPORATIVO: { left: 10, right: 90, top: 12, bottom: 88 }, // Artículos corporativos
  LIBRE: { left: 8, right: 92, top: 8, bottom: 92 },          // Fallback general
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