// ============================================================================
// personalizacion-config.js — Config del cobro de personalización láser (C2)
// ----------------------------------------------------------------------------
// Regla PEYU: el grabado láser es GRATIS desde 10 unidades del mismo ítem.
// Bajo ese MOQ, se cobra un cargo por unidad personalizada.
//
// ⚠️ DATO PENDIENTE DE DIEGO: el monto exacto del cargo. Mientras tanto usamos
// el placeholder PRECIO_PERSONALIZACION_LASER. Cuando Diego confirme, cambia
// SOLO esa constante (ej. 1500).
// ============================================================================

// 💲 Cargo por unidad personalizada bajo el MOQ. CAMBIAR cuando Diego confirme.
export const PRECIO_PERSONALIZACION_LASER = 1500;

// MOQ para grabado gratis (productos pueden sobreescribir con personalizacion_gratis_desde).
export const MOQ_PERSONALIZACION_GRATIS = 10;

/**
 * Calcula el cargo de personalización láser de una línea del carrito.
 * GRATIS si la cantidad alcanza el MOQ del producto; si no, cobra por unidad.
 *
 * @param {object} item - línea del carrito { cantidad, personalizacion, ... }
 * @param {number} [moqGratis] - MOQ específico del producto (default global)
 * @returns {number} cargo total en CLP para esa línea (0 si no aplica)
 */
export function calcularCargoPersonalizacion(item, moqGratis = MOQ_PERSONALIZACION_GRATIS) {
  if (!item || !item.personalizacion) return 0;
  const qty = item.cantidad || 0;
  const moq = moqGratis || MOQ_PERSONALIZACION_GRATIS;
  if (qty >= moq) return 0; // gratis desde el MOQ
  return PRECIO_PERSONALIZACION_LASER * qty;
}

/**
 * Suma el cargo de personalización de todo el carrito.
 * @param {Array} carrito
 * @returns {number} cargo total CLP
 */
export function calcularCargoPersonalizacionCarrito(carrito = []) {
  return (carrito || []).reduce((sum, i) => {
    const moq = i.moq_personalizacion || i.personalizacion_gratis_desde || MOQ_PERSONALIZACION_GRATIS;
    return sum + calcularCargoPersonalizacion(i, moq);
  }, 0);
}