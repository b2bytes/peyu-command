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
import { buildColorFilter } from '@/lib/color-transform';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';

/**
 * Filtro CSS que tiñe la foto del producto al color oficial elegido.
 * Devuelve '' (sin filtro) cuando: no hay color, es Mixto, o existe una
 * foto REAL de ese color (mapa imagenes_por_color o match en galería).
 *
 * @param {object}  producto
 * @param {object}  color         objeto del catálogo { id, label, hex }
 * @param {boolean} hasRealPhoto  true si la galería ya tiene foto de ese color
 */
export function getColorTintFilter(producto, color, hasRealPhoto = false) {
  if (!producto || !color?.hex) return '';
  if (color.id === 'mixto') return '';
  if (hasRealPhoto) return '';
  const mapped = getProductImageForColor(producto, color);
  if (mapped !== getProductImage(producto)) return ''; // hay foto real por color
  return buildColorFilter(color.hex);
}