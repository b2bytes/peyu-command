// 💸 Descuento automático B2C por cantidad — POR SKU IGUAL
// ----------------------------------------------------------------------------
// Regla PEYU (retail B2C, NO el flujo corporativo ≥10u con cotización PDF):
//   - Se cuentan las unidades del MISMO SKU (mismo producto exacto).
//   - 2 unidades del mismo SKU  → 10% sobre esas unidades de ese SKU.
//   - 3+ unidades del mismo SKU → 15% sobre esas unidades de ese SKU.
//   - Cada SKU se evalúa de forma INDEPENDIENTE. 1 sola unidad → sin descuento.
//
// No-acumulación con Cyber:
//   - Si una línea tiene precio_oferta Cyber Y califica al descuento por cantidad,
//     se aplica SOLO el beneficio MAYOR para el cliente (nunca ambos).
//     El precio Cyber ya viene reflejado en item.precio (se setea al agregar),
//     por eso el descuento por cantidad se calcula sobre item.precio salvo que
//     la línea esté marcada como oferta Cyber (cyber=true) — en ese caso el
//     beneficio Cyber ya está incluido y NO sumamos el % por cantidad encima.
//
// Reglas de acumulación con otros descuentos:
//   - NO se acumula con cupones (si hay cupón, se prioriza el cupón).
//   - SÍ con transferencia (-5%) y GiftCard (es pago, no descuento).
//   - NO aplica para B2B (precios escalonados precio_50_199, etc.).

const GIFTCARD_SKU_PREFIX = 'GC-PEYU';

const isGiftCardItem = (item) =>
  String(item?.sku || '').startsWith(GIFTCARD_SKU_PREFIX) ||
  String(item?.nombre || '').toLowerCase().includes('gift card');

/**
 * % de descuento por cantidad para N unidades de un mismo SKU.
 * 2u → 10 | 3+u → 15 | else → 0
 */
export function getQtyDiscountPct(unidades) {
  if (unidades >= 3) return 15;
  if (unidades === 2) return 10;
  return 0;
}

/**
 * Agrupa el carrito por SKU y calcula el descuento por cantidad de cada grupo.
 * Devuelve por línea: sku, nombre, unidades, pct, montoBruto, ahorro y si fue
 * bloqueado porque la línea ya tiene beneficio Cyber (no-acumulación).
 *
 * @param {Object} args
 * @param {Array}  args.carrito  items del carrito ({ sku, nombre, precio, cantidad, cyber })
 * @param {boolean} args.hasCupon  si hay cupón aplicado (bloquea todo el descuento por cantidad)
 */
export function computeQtyDiscountBySku({ carrito = [], hasCupon = false } = {}) {
  if (hasCupon) {
    return { lineas: [], ahorroTotal: 0, bloqueadoPorCupon: true };
  }

  // Agrupar por SKU (los productos sin SKU se agrupan por nombre como fallback).
  const grupos = new Map();
  for (const it of carrito) {
    if (isGiftCardItem(it)) continue;
    const key = String(it.sku || it.productoId || it.nombre || '').trim();
    if (!key) continue;
    const prev = grupos.get(key) || {
      sku: it.sku || '',
      nombre: it.nombre || '',
      unidades: 0,
      precioUnit: it.precio || 0,
      cyber: !!it.cyber, // línea con oferta Cyber ya aplicada
    };
    prev.unidades += (it.cantidad || 0);
    grupos.set(key, prev);
  }

  const lineas = [];
  let ahorroTotal = 0;
  for (const g of grupos.values()) {
    const pct = getQtyDiscountPct(g.unidades);
    if (pct === 0) continue;
    const montoBruto = g.precioUnit * g.unidades;

    // No-acumulación: si la línea ya trae beneficio Cyber, NO sumamos el % por
    // cantidad encima. Mostramos que se aplicó Cyber (mayor beneficio asumido).
    if (g.cyber) {
      lineas.push({
        sku: g.sku, nombre: g.nombre, unidades: g.unidades, pct,
        montoBruto, ahorro: 0, beneficioAplicado: 'cyber',
      });
      continue;
    }

    const ahorro = Math.floor(montoBruto * (pct / 100));
    ahorroTotal += ahorro;
    lineas.push({
      sku: g.sku, nombre: g.nombre, unidades: g.unidades, pct,
      montoBruto, ahorro, beneficioAplicado: 'cantidad',
    });
  }

  return { lineas, ahorroTotal, bloqueadoPorCupon: false };
}

/**
 * Teaser por SKU: para un grupo de N unidades de un mismo producto, cuántas
 * más necesita para subir de escalón y a qué % llegaría. null si ya está al tope.
 */
export function getNextQtyTeaserForSku(unidades) {
  if (unidades <= 0) return { necesita: 2, pctSiguiente: 10 };
  if (unidades === 1) return { necesita: 1, pctSiguiente: 10 };
  if (unidades === 2) return { necesita: 1, pctSiguiente: 15 };
  return null; // 3+ ya está en el tope
}