// ============================================================================
// color-tint — Tinte instantáneo al tono OFICIAL del catálogo B2B PDF.
// ----------------------------------------------------------------------------
// Norma: todos los productos de plástico reciclado ofrecen Azul/Negro/Rojo/
// Verde, pero no todos tienen foto real de cada color. Cuando NO existe foto
// real del color elegido, esta capa devuelve un filtro CSS (GPU, instantáneo)
// que re-pinta la foto del producto al tono oficial — el mockup y la galería
// cambian al tiro, sin esperar fotos ni IA. No aplica a carcasas (tienen foto
// real por color) ni a la opción Mixto (multicolor).
// ============================================================================
/**
 * Filtro CSS que tiñe la foto del producto al color oficial elegido.
 * Devuelve '' (sin filtro) cuando: no hay color, es Mixto, o existe una
 * foto REAL de ese color (mapa imagenes_por_color o match en galería).
 *
 * @param {object}  producto
 * @param {object}  color         objeto del catálogo { id, label, hex }
 * @param {boolean} hasRealPhoto  true si la galería ya tiene foto de ese color
 */
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export function getColorTintFilter() {
  // ⛔ DESACTIVADO (feedback fundadores): el tinte CSS sobre la foto completa
  // se veía como una "capa de color ficticia" encima del producto en vez de
  // aplicar el color real. Ahora SIEMPRE devolvemos '' — la foto real del
  // producto se muestra intacta y el color elegido se comunica mediante el
  // swatch seleccionado (que ya muestra el HEX/foto real del color). Las
  // carcasas siguen usando su foto real por color (imagenes_por_color).
  return '';
}