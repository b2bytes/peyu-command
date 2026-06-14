// ============================================================================
// color-transform — Transforma el color real de la imagen del producto.
// ----------------------------------------------------------------------------
// Calcula una combinación de filtros CSS que recolorea la imagen del producto
// al color objetivo elegido por el cliente. Funciona en IMÁGENES REALES (no
// transparentes) de cualquier tono base: oscuro, claro o medio.
//
// Técnica: sepia() inyecta croma en píxeles neutros → hue-rotate() gira al
// tono objetivo → saturate() ajusta intensidad → brightness() equilibra.
// Es la misma técnica que usa CSS para fondos SVG inline y funciona en toda
// la gama de colores PEYU (rojo, azul, verde, negro, etc.) partiendo desde
// cualquier base.
// ============================================================================

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

// Detección del tono base de la imagen para ajustar la estrategia.
// Si la imagen base es muy OSCURA (l < 25), usamos sepia() como puente.
// Si es muy CLARA (l > 85), usamos oscurecer + sepia.
// Si es media, hue-rotate directo funciona bien.
function detectBaseStrategy(hexBase) {
  const hsl = hexBase ? hexToHsl(hexBase) : { h: 175, s: 56, l: 50 };
  if (hsl.l < 25) return 'dark';
  if (hsl.l > 85) return 'light';
  return 'mid';
}

/**
 * Devuelve el style.filter CSS que recolorea la imagen del producto al
 * color objetivo. Maneja correctamente bases oscuras (negro), claras
 * (blanco/beige) y medias (turquesa, verde, etc).
 *
 * @param {string} hexTarget hex del color objetivo (ej: '#1a1a1a')
 * @param {string} hexBase   hex del color base de la imagen (default turquesa)
 * @returns {string} valor para CSS `filter:`
 */
export function buildColorFilter(hexTarget, hexBase = '#2d9d8f') {
  if (!hexTarget) return '';

  const target = hexToHsl(hexTarget);
  const strategy = detectBaseStrategy(hexBase);

  // ── NEGRO puro (target) ──────────────────────────────────────────
  if (target.l < 12) {
    // Desde cualquier base: desaturar a gris + oscurecer.
    // Si la base ya es oscura, brightness bajo basta.
    return strategy === 'dark'
      ? 'grayscale(1) brightness(0.6) contrast(1.1)'
      : 'saturate(0) brightness(0.28) contrast(1.3)';
  }

  // ── BLANCO / MUY CLARO (target) ─────────────────────────────────
  if (target.l > 85 && target.s < 20) {
    return 'saturate(0.1) brightness(1.5) contrast(0.88)';
  }

  // ── PRODUCTOS CON BASE OSCURA (ej: soporte notebook negro, macetero negro) ─
  // sepia(1) inyecta un tono marrón/warm en los píxeles neutros.
  // Luego hue-rotate gira ese marrón al color objetivo.
  // saturate devuelve la intensidad y brightness ajusta luminosidad.
  if (strategy === 'dark') {
    // El sepia produce ~30° de hue (naranja/marrón). Rotamos desde ahí.
    const sepiaHue = 30;
    const hueShift = ((target.h - sepiaHue) + 360) % 360;
    const sat = Math.max(1.2, Math.min(3.5, (target.s / 30)));
    const bri = Math.max(0.7, Math.min(1.6, target.l / 35));
    return `sepia(1) hue-rotate(${hueShift.toFixed(0)}deg) saturate(${sat.toFixed(2)}) brightness(${bri.toFixed(2)})`;
  }

  // ── PRODUCTOS CON BASE CLARA (ej: paleta playa verde claro) ─────
  if (strategy === 'light') {
    const sepiaHue = 30;
    const hueShift = ((target.h - sepiaHue) + 360) % 360;
    const sat = Math.max(1.0, Math.min(3.0, (target.s / 25)));
    const bri = Math.max(0.5, Math.min(1.2, target.l / 55));
    return `sepia(0.3) hue-rotate(${hueShift.toFixed(0)}deg) saturate(${sat.toFixed(2)}) brightness(${bri.toFixed(2)})`;
  }

  // ── PRODUCTOS CON BASE MEDIA (turquesa base clásico PEYU) ───────
  const base = hexBase === '#2d9d8f'
    ? { h: 175, s: 56, l: 39 }
    : hexToHsl(hexBase);

  const hueShift = ((target.h - base.h) + 360) % 360;
  const satRatio = Math.max(0.5, Math.min(2.5, target.s / Math.max(1, base.s)));
  const ligRatio = Math.max(0.5, Math.min(1.8, target.l / Math.max(1, base.l)));

  return `hue-rotate(${hueShift.toFixed(0)}deg) saturate(${satRatio.toFixed(2)}) brightness(${ligRatio.toFixed(2)})`;
}