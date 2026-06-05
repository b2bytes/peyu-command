// ============================================================================
// personalizacion-config.js — Config del cobro de personalización láser
// ----------------------------------------------------------------------------
// Regla PEYU: el grabado láser es GRATIS desde 10 unidades del mismo ítem.
// Bajo ese MOQ, se cobra un cargo por unidad personalizada según el TIPO de
// diseño elegido por el cliente.
//
// ✅ DATO CONFIRMADO POR CARLOS (2026-06-03): tres tramos de cobro:
//   - Frase personalizada (texto)             → $3.990
//   - Diseño PEYU (galería propia)            → $4.990
//   - Diseño del cliente (sube su archivo)    → $7.990
// Desde 10u del mismo ítem → GRATIS (cualquier tipo).
// Para cambiarlo, edita SOLO estas constantes.
// ============================================================================

// 💲 Cargos por tipo de personalización láser bajo el MOQ.
export const PRECIO_PERSONALIZACION = {
  frase: 3990,   // Frase / texto personalizado
  peyu: 4990,    // Diseño elegido de la galería PEYU
  archivo: 7990, // Diseño propio del cliente (sube su logo/archivo)
};

// Etiqueta legible por tipo (para el desglose en el carrito/checkout).
export const PERSONALIZACION_LABEL = {
  frase: 'Frase personalizada',
  peyu: 'Diseño PEYU',
  archivo: 'Diseño personalizado',
};

// MOQ para grabado gratis (productos pueden sobreescribir con personalizacion_gratis_desde).
export const MOQ_PERSONALIZACION_GRATIS = 10;

// Determina el tipo de personalización a partir de la línea del carrito.
// Prioridad: tipo explícito > archivo/logo subido > diseño PEYU > frase/texto.
export function getTipoPersonalizacion(item) {
  if (!item) return null;
  if (item.tipo_personalizacion && PRECIO_PERSONALIZACION[item.tipo_personalizacion]) {
    return item.tipo_personalizacion;
  }
  if (item.logoUrl || item.logo_url || item.archivo) return 'archivo';
  if (item.disenoPeyuUrl || item.diseno_peyu_url) return 'peyu';
  if (item.personalizacion) return 'frase';
  return null;
}

/**
 * Precio del cargo de personalización para un tipo dado.
 * @param {'frase'|'peyu'|'archivo'} tipo
 * @returns {number} cargo CLP (0 si tipo inválido)
 */
export function getPrecioPersonalizacion(tipo) {
  return PRECIO_PERSONALIZACION[tipo] || 0;
}

/**
 * Calcula el cargo de personalización láser de una línea del carrito.
 * GRATIS si la cantidad alcanza el MOQ del producto; si no, cobra el cargo
 * POR UNIDAD según el TIPO de diseño (cargo unitario × cantidad).
 *
 * @param {object} item - línea del carrito { cantidad, personalizacion, tipo_personalizacion, ... }
 * @param {number} [moqGratis] - MOQ específico del producto (default global)
 * @returns {number} cargo en CLP para esa línea (0 si no aplica)
 */
export function calcularCargoPersonalizacion(item, moqGratis = MOQ_PERSONALIZACION_GRATIS) {
  if (!item || !item.personalizacion) return 0;
  const qty = item.cantidad || 0;
  const moq = moqGratis || MOQ_PERSONALIZACION_GRATIS;
  if (qty >= moq) return 0; // gratis desde el MOQ
  // Combinable: si la línea ya trae el cargo unitario combinado (frase + PEYU +
  // logo), úsalo. Si no, cae al cargo de un solo tipo (retrocompat).
  const feeUnit = typeof item.cargo_personalizacion === 'number' && item.cargo_personalizacion > 0
    ? item.cargo_personalizacion
    : getPrecioPersonalizacion(getTipoPersonalizacion(item));
  return feeUnit * qty; // cargo POR UNIDAD
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