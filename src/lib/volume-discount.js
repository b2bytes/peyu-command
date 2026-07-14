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

// 🏭 PRECIO MAYORISTA B2C (10+ u del mismo SKU)
// ----------------------------------------------------------------------------
// Desde 10 unidades del mismo SKU el cliente B2C accede al PRECIO MAYORISTA
// REAL del canal B2B (los tramos oficiales precio_b2b_tramos del catálogo).
// Los tramos B2B son NETOS (sin IVA); el B2C ve precio CON IVA, así que les
// sumamos 19% para que sea coherente con el resto del checkout B2C.
//   <10u  → null (no aplica, se mantiene el flujo B2C de siempre)
//   ≥10u  → { precioUnit (con IVA), label, ahorroPct } del tramo correspondiente
const MOQ_MAYORISTA = 10;
const IVA = 1.19;

const TRAMOS_MAYORISTA = [
  { min: 2000, key: 't2000_mas',  label: '2000+ u' },
  { min: 1000, key: 't1000_1999', label: '1000–1999 u' },
  { min: 500,  key: 't500_999',   label: '500–999 u' },
  { min: 250,  key: 't250_499',   label: '250–499 u' },
  { min: 100,  key: 't100_249',   label: '100–249 u' },
  { min: 50,   key: 't50_99',     label: '50–99 u' },
  { min: 10,   key: 't10_49',     label: '10–49 u' },
];

const numPos = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

/**
 * Precio unitario mayorista CON IVA para N unidades de un mismo SKU.
 * Lee producto.precio_b2b_tramos (netos) y suma 19%. Cae al tramo inferior con
 * precio si el exacto está vacío. Devuelve null si <10u o sin tramos definidos.
 *
 * @param {object} producto  producto con precio_b2b_tramos
 * @param {number} unidades  cantidad del mismo SKU en el carrito
 * @param {number} precioB2C precio unitario B2C con IVA (para calcular ahorroPct y proteger margen)
 * @returns {{ precioUnit:number, precioUnitNeto:number, label:string, ahorroPct:number }|null}
 */
export function getMayoristaUnitPrice(producto, unidades, precioB2C = 0) {
  if (!producto || unidades < MOQ_MAYORISTA) return null;
  const tramos = producto.precio_b2b_tramos;
  if (!tramos || typeof tramos !== 'object') return null;
  const idx = TRAMOS_MAYORISTA.findIndex((t) => unidades >= t.min);
  if (idx < 0) return null;
  for (let i = idx; i < TRAMOS_MAYORISTA.length; i++) {
    const neto = numPos(tramos[TRAMOS_MAYORISTA[i].key]);
    if (neto) {
      const conIva = Math.round(neto * IVA);
      // Nunca sube el precio: si el mayorista quedara igual o más caro que el
      // B2C unitario, no aplica (protege al cliente y el margen).
      if (precioB2C > 0 && conIva >= precioB2C) return null;
      const ahorroPct = precioB2C > 0 ? Math.round((1 - conIva / precioB2C) * 100) : 0;
      // precioUnitNeto = base sin IVA de la fórmula (tramo oficial B2B).
      return { precioUnit: conIva, precioUnitNeto: neto, label: TRAMOS_MAYORISTA[i].label, ahorroPct };
    }
  }
  return null;
}

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
 * @param {Object} [args.productosBySku]  mapa sku → producto (con precio_b2b_tramos) para
 *   aplicar PRECIO MAYORISTA real desde 10u del mismo SKU. Si no se pasa, se mantiene
 *   exactamente el flujo B2C de siempre (2u −10% / 3+u −15%, sin tope mayorista).
 */
export function computeQtyDiscountBySku({ carrito = [], hasCupon = false, productosBySku = null } = {}) {
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
      b2b: false,        // línea agregada desde el flujo B2B (precio tramo ya aplicado)
    };
    prev.unidades += (it.cantidad || 0);
    if (it.es_b2b) prev.b2b = true;
    grupos.set(key, prev);
  }

  const lineas = [];
  let ahorroTotal = 0;
  for (const g of grupos.values()) {
    const montoBruto = g.precioUnit * g.unidades;

    // ── PRECIO MAYORISTA (≥10u del mismo SKU) ──────────────────────────────
    // Si tenemos el producto y sus tramos B2B, desde 10u el cliente paga el
    // precio mayorista real (con IVA), en vez del −15% B2C. Prevalece sobre el
    // descuento por cantidad (es un mejor beneficio). No-acumula con Cyber.
    const producto = productosBySku ? productosBySku[g.sku] : null;
    if (producto && !g.cyber) {
      const mayorista = getMayoristaUnitPrice(producto, g.unidades, g.precioUnit);
      if (mayorista) {
        const ahorro = Math.max(0, (g.precioUnit - mayorista.precioUnit) * g.unidades);
        ahorroTotal += ahorro;
        lineas.push({
          sku: g.sku, nombre: g.nombre, unidades: g.unidades, pct: mayorista.ahorroPct,
          montoBruto, ahorro, beneficioAplicado: 'mayorista',
          precioMayoristaUnit: mayorista.precioUnit, tramoLabel: mayorista.label,
        });
        continue;
      }
    }

    // ── LÍNEA B2B (compra directa desde EmpresaProducto) ──────────────────
    // El precio ya ES el tramo mayorista B2B (+IVA). NUNCA se le suma el
    // descuento B2C por cantidad encima (doble descuento). Se marca como
    // mayorista (ahorro 0) para que el carrito muestre el badge 🏭 correcto.
    if (g.b2b) {
      lineas.push({
        sku: g.sku, nombre: g.nombre, unidades: g.unidades, pct: 0,
        montoBruto, ahorro: 0, beneficioAplicado: 'mayorista',
        precioMayoristaUnit: g.precioUnit, tramoLabel: 'Precio B2B',
      });
      continue;
    }

    const pct = getQtyDiscountPct(g.unidades);
    if (pct === 0) continue;

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