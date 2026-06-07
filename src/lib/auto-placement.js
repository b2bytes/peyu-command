/**
 * Sistema inteligente y automático de colocación de logos según la geometría del producto.
 * Cuando el usuario selecciona/sube un logo, automáticamente se coloca en la posición
 * óptima sin requerir ajustes manuales. Funciona para carcasas, escritorio, hogar, etc.
 */

/**
 * Determina dimensiones y posición óptima del logo según producto.
 * Cada tipo de producto tiene área de grabado específica.
 * @param {Object} producto - El producto (categoria/nombre/area_laser)
 * @returns {Object} - { defaultPos: 'centro'|'arriba'|'abajo', defaultSize: number }
 */
export function getOptimalPlacement(producto) {
  if (!producto) return { defaultPos: 'centro', defaultSize: 35 };

  const cat = producto.categoria?.toLowerCase() || '';
  const nom = producto.nombre?.toLowerCase() || '';

  // ─── CARCASAS ─── Centro perfecto, tamaño grande
  if (cat.includes('carcasa') || nom.includes('case')) {
    return { defaultPos: 'centro', defaultSize: 40 };
  }

  // ─── CACHOS ─── Centro, tamaño mediano
  if (cat.includes('cacho')) {
    return { defaultPos: 'centro', defaultSize: 32 };
  }

  // ─── ESCRITORIO ─── Centro, adaptar a forma (taza vertical, libreta horizontal)
  if (cat.includes('escritorio')) {
    if (nom.includes('taza') || nom.includes('vaso') || nom.includes('termo')) {
      return { defaultPos: 'centro', defaultSize: 30 }; // Vertical
    }
    if (nom.includes('libreta') || nom.includes('cuaderno')) {
      return { defaultPos: 'centro', defaultSize: 35 }; // Horizontal
    }
    return { defaultPos: 'centro', defaultSize: 32 };
  }

  // ─── POSAVASOS ─── Centro (es circular)
  if (cat.includes('posavaso') || cat.includes('coaster')) {
    return { defaultPos: 'centro', defaultSize: 38 };
  }

  // ─── PALETAS ─── Arriba (dejan grip abajo)
  if (cat.includes('paleta')) {
    return { defaultPos: 'arriba', defaultSize: 36 };
  }

  // ─── HOGAR ─── Centro (cajas, bandejas, etc.)
  if (cat.includes('hogar')) {
    return { defaultPos: 'centro', defaultSize: 34 };
  }

  // ─── DEFAULT ─── Centro seguro
  return { defaultPos: 'centro', defaultSize: 35 };
}

/**
 * Calcula automáticamente las coordenadas de colocación del logo.
 * Centra horizontalmente, posición vertical según tipo, tamaño inteligente.
 *
 * @param {Object} producto - El producto
 * @param {number} logoWidth - Ancho del logo en % (override del default)
 * @returns {Object} - { size: number, x: number, y: number }
 */
export function getDefaultPlacement(producto, logoWidth) {
  const { defaultPos, defaultSize } = getOptimalPlacement(producto);
  const finalSize = typeof logoWidth === 'number' ? logoWidth : defaultSize;

  // Centro horizontal SIEMPRE (perfecto centrado)
  const x = 50;

  // Posición vertical según el tipo de producto
  let y;
  switch (defaultPos) {
    case 'arriba':
      y = 28; // Tercio superior (con margen)
      break;
    case 'abajo':
      y = 72; // Tercio inferior (con margen)
      break;
    case 'centro':
    default:
      y = 50; // Centro vertical perfecto
      break;
  }

  return {
    size: finalSize,  // Tamaño inteligente según producto
    x,                // Centro horizontal
    y,                // Posición vertical óptima
  };
}

/**
 * Aplica automáticamente las placements cuando se selecciona un logo o diseño.
 * Inteligente: centra perfecto + tamaño adaptativo por producto.
 *
 * @param {Object} producto - El producto actual
 * @param {Object} pers - Estado actual de personalización
 * @param {function} setPlacements - Callback para actualizar placements
 */
export function applyAutoPlacement(producto, pers, setPlacements) {
  if (!setPlacements || !producto) return;

  const tieneLogo = pers.logoUrl || pers.disenoPeyuUrl;
  const tieneFrase = pers.texto && pers.texto.length > 0;

  if (tieneLogo || tieneFrase) {
    const placement = getDefaultPlacement(producto);
    setPlacements((prev) => ({
      ...prev,
      // Todos los elementos se colocan en el punto óptimo
      archivo: placement,  // Tu logo
      peyu: placement,     // Diseño PEYU
      frase: { ...placement, size: placement.size * 0.9 }, // Frase ligeramente más pequeña
    }));
  }
}

export default {
  getOptimalPlacement,
  getDefaultPlacement,
  applyAutoPlacement,
};