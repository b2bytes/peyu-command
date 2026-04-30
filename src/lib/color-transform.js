// ============================================================================
// color-transform — Transforma el color real de la imagen del producto.
// ----------------------------------------------------------------------------
// Calcula una combinación de filtros CSS (hue-rotate + saturate + brightness)
// que reemplaza el color del producto por el color objetivo.
// No es una capa encima: el navegador re-pinta los píxeles vía GPU.
//
// Limitaciones honestas:
//   - Funciona muy bien en productos con un color dominante (carcasas, vasos,
//     macetas, etc).
//   - No es una segmentación pixel-perfect — para eso haría falta un canvas
//     con extracción de máscara, lo cual rompería SEO/lazy/cache de imágenes.
//     Esta solución es el mejor compromiso técnico/UX.
// ============================================================================

// Color "base" promedio del catálogo PEYU (turquesa moderado).
// Calibramos los filtros para "salir" desde aquí hacia el color objetivo.
const BASE_HUE = 175;       // hue del turquesa #2d9d8f en HSL
const BASE_SAT = 56;        // saturación %
const BASE_LIG = 39;        // luminosidad %

function hexToHsl(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const lig = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = lig > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue *= 60;
  }
  return { h: hue, s: sat * 100, l: lig * 100 };
}

/**
 * Devuelve el style.filter CSS que recolorea la imagen del producto al
 * color objetivo. Si el target es el "base" (turquesa) o no se reconoce,
 * retorna '' (sin filtro = imagen original).
 *
 * @param {string} hexTarget hex del color objetivo (ej: '#1a1a1a')
 * @param {string} hexBase   hex del color base de la imagen (default turquesa)
 * @returns {string} valor para CSS `filter:`
 */
export function buildColorFilter(hexTarget, hexBase = '#2d9d8f') {
  if (!hexTarget) return '';

  const target = hexToHsl(hexTarget);
  const base = hexBase === '#2d9d8f'
    ? { h: BASE_HUE, s: BASE_SAT, l: BASE_LIG }
    : hexToHsl(hexBase);

  // Caso especial 1: NEGRO → desaturar + oscurecer (no rotar matiz).
  if (target.l < 12) {
    return 'saturate(0) brightness(0.25) contrast(1.4)';
  }
  // Caso especial 2: BLANCO/MUY CLARO → desaturar + aclarar.
  if (target.l > 85 && target.s < 20) {
    return 'saturate(0.1) brightness(1.6) contrast(0.85)';
  }

  // Caso general: rotar matiz + ajustar saturación + ajustar luminosidad.
  const hueShift = ((target.h - base.h) + 360) % 360;
  const satRatio = Math.max(0.4, Math.min(2.5, target.s / Math.max(1, base.s)));
  const ligRatio = Math.max(0.5, Math.min(1.8, target.l / Math.max(1, base.l)));

  return `hue-rotate(${hueShift.toFixed(0)}deg) saturate(${satRatio.toFixed(2)}) brightness(${ligRatio.toFixed(2)})`;
}