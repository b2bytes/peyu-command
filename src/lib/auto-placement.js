/**
 * Sistema automático de colocación de logos según la posición predeterminada del producto.
 * Cuando el usuario selecciona/sube un logo, automáticamente se coloca en la posición
 * correcta sin requerir ajustes manuales.
 */

/**
 * Determina la posición vertical predeterminada del logo según el tipo de producto.
 * @param {Object} producto - El producto (debe tener categoria/nombre/area_grabado)
 * @returns {string} - 'arriba' | 'centro' | 'abajo'
 */
export function getDefaultEngravePosition(producto) {
  if (!producto) return 'centro';

  const categoria = producto.categoria?.toLowerCase() || '';
  const nombre = producto.nombre?.toLowerCase() || '';

  // Carcasas: centradas (es lo estándar)
  if (categoria.includes('carcasa') || nombre.includes('case')) return 'centro';

  // Cachos: centrados
  if (categoria.includes('cacho')) return 'centro';

  // Escritorio (tazas, libretas): centradas
  if (categoria.includes('escritorio') || nombre.includes('taza') || nombre.includes('vaso')) return 'centro';

  // Posavasos, coasters: centrados
  if (categoria.includes('posavaso') || categoria.includes('coaster')) return 'centro';

  // Paletas: arriba (dejan espacio para grip abajo)
  if (categoria.includes('paleta')) return 'arriba';

  // Hogar: centrados por defecto
  if (categoria.includes('hogar')) return 'centro';

  // Default: centro (es lo más seguro)
  return 'centro';
}

/**
 * Calcula automáticamente las coordenadas de colocación del logo.
 * Centra horizontalmente y usa la posición vertical predeterminada.
 *
 * @param {Object} producto - El producto
 * @param {number} logoWidth - Ancho del logo en % (default 35%)
 * @returns {Object} - { size: number, x: number, y: number }
 */
export function getDefaultPlacement(producto, logoWidth = 35) {
  const posicion = getDefaultEngravePosition(producto);

  // Centro horizontal siempre
  const x = 50;

  // Posición vertical según el tipo
  let y;
  switch (posicion) {
    case 'arriba':
      y = 25; // Tercio superior
      break;
    case 'abajo':
      y = 75; // Tercio inferior
      break;
    case 'centro':
    default:
      y = 50; // Centro
      break;
  }

  return {
    size: logoWidth,  // Tamaño relativo del logo (% del lienzo)
    x,                // Posición horizontal (%)
    y,                // Posición vertical (%)
  };
}

/**
 * Aplica automáticamente las placements cuando se selecciona un logo o diseño.
 * Usada en PersonalizadorV2 para actualizar placements sin necesidad de manual input.
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
      logo: placement,  // Logo u diseño PEYU
      frase: placement, // La frase usa la misma posición que el logo
    }));
  }
}

export default {
  getDefaultEngravePosition,
  getDefaultPlacement,
  applyAutoPlacement,
};