// 💸 Descuento automático B2C por volumen
// Replica la lógica de la web anterior de PEYU:
//   - 2 unidades totales → 10% off sobre subtotal
//   - 3+ unidades totales → 15% off sobre subtotal
//
// Reglas de acumulación:
//   - NO se acumula con cupones (si hay cupón, se prioriza el cupón).
//   - SÍ se acumula con descuento por transferencia (-5%) y GiftCard (es pago, no descuento).
//   - NO aplica para B2B (B2B usa precios escalonados de precio_50_199 etc.).
//
// Excluimos GiftCards del cómputo de cantidades (no es un producto físico).

const GIFTCARD_SKU_PREFIX = 'GC-PEYU';

const isGiftCardItem = (item) =>
  String(item?.sku || '').startsWith(GIFTCARD_SKU_PREFIX) ||
  String(item?.nombre || '').toLowerCase().includes('gift card');

/**
 * Cuenta unidades totales del carrito EXCLUYENDO gift cards.
 */
export function countVolumeUnits(carrito = []) {
  return (carrito || [])
    .filter(it => !isGiftCardItem(it))
    .reduce((sum, it) => sum + (it.cantidad || 0), 0);
}

/**
 * Devuelve el porcentaje de descuento por volumen según unidades totales.
 * 2u → 10 | 3+u → 15 | else → 0
 */
export function getVolumeDiscountPct(unidades) {
  if (unidades >= 3) return 15;
  if (unidades === 2) return 10;
  return 0;
}

/**
 * Calcula el descuento por volumen en CLP a partir de un carrito y subtotal.
 * Si hay cupón aplicado, retorna 0 (no se acumulan).
 */
export function computeVolumeDiscount({ carrito, subtotal, hasCupon = false }) {
  if (hasCupon) {
    return { pct: 0, clp: 0, unidades: countVolumeUnits(carrito), bloqueadoPorCupon: true };
  }
  const unidades = countVolumeUnits(carrito);
  const pct = getVolumeDiscountPct(unidades);
  const clp = Math.floor((subtotal || 0) * (pct / 100));
  return { pct, clp, unidades, bloqueadoPorCupon: false };
}

/**
 * Mensaje motivador: si está cerca del próximo escalón, devuelve cuántas unidades
 * más necesita y el % que ganaría. Útil para mostrar "agrega 1 más y obtén 15% off".
 */
export function getNextVolumeTeaser(unidades) {
  if (unidades === 0) {
    return { necesita: 2, pctSiguiente: 10, alcanzado: 0 };
  }
  if (unidades === 1) {
    return { necesita: 1, pctSiguiente: 10, alcanzado: 0 };
  }
  if (unidades === 2) {
    return { necesita: 1, pctSiguiente: 15, alcanzado: 10 };
  }
  // 3+ ya está en el tope
  return { necesita: 0, pctSiguiente: 15, alcanzado: 15 };
}