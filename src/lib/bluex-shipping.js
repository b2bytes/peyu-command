// ─────────────────────────────────────────────────────────────────────────────
// Bluex Shipping · cálculo de costo de envío en checkout
// ─────────────────────────────────────────────────────────────────────────────
// Usa la entidad TarifaBluex (importada desde los Excel oficiales) para
// calcular el costo de envío exacto según comuna y peso del carrito.
//
// Tramos de peso del tarifario Bluex:
//   tarifa_base   → 0 – 0.5 kg
//   tarifa_2kg    → 0.5 – 1.5 kg
//   tarifa_3kg    → 1.5 – 3 kg
//   tarifa_5kg    → 3 – 6 kg
//   tarifa_10kg   → 6 – 10 kg
//   tarifa_15kg   → 10 – 16 kg
//   tarifa_25kg   → 16 – 60 kg
// ─────────────────────────────────────────────────────────────────────────────

import { base44 } from '@/api/base44Client';

export function normalizeComuna(s) {
  if (!s) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Devuelve el campo de la entidad que corresponde al peso (kg) dado. */
export function pickTarifaField(pesoKg) {
  if (pesoKg <= 0.5) return 'tarifa_base';
  if (pesoKg <= 1.5) return 'tarifa_2kg';
  if (pesoKg <= 3)   return 'tarifa_3kg';
  if (pesoKg <= 6)   return 'tarifa_5kg';
  if (pesoKg <= 10)  return 'tarifa_10kg';
  if (pesoKg <= 16)  return 'tarifa_15kg';
  return 'tarifa_25kg'; // 16-60 kg
}

/**
 * Calcula el costo de envío para una comuna y peso dados.
 * @param {Object} params
 * @param {string} params.comuna   - Comuna destino (acepta tildes y mayúsculas)
 * @param {number} params.pesoKg   - Peso total del envío en kg (default 0.5)
 * @param {string} params.servicio - 'EXPRESS' (default) o 'PRIORITY'
 * @returns {Promise<{servicio, comuna, region, costo, lead_time_dias, tramo} | null>}
 */
export async function cotizarEnvioBluex({ comuna, pesoKg = 0.5, servicio = 'EXPRESS' }) {
  if (!comuna) return null;
  const norm = normalizeComuna(comuna);
  const tarifas = await base44.entities.TarifaBluex.filter({
    servicio,
    comuna_normalizada: norm,
    vigente: true,
  });
  const t = tarifas?.[0];
  if (!t) return null;

  const field = pickTarifaField(pesoKg);
  let costo = t[field];
  // Si el tramo no tiene tarifa cargada (==0), bajamos al inmediato superior disponible
  if (!costo) {
    const fallbackOrder = ['tarifa_base', 'tarifa_2kg', 'tarifa_3kg', 'tarifa_5kg', 'tarifa_10kg', 'tarifa_15kg', 'tarifa_25kg'];
    const startIdx = fallbackOrder.indexOf(field);
    for (let i = startIdx; i >= 0; i--) {
      if (t[fallbackOrder[i]]) { costo = t[fallbackOrder[i]]; break; }
    }
  }
  if (!costo) return null;

  return {
    servicio,
    comuna: t.comuna,
    region: t.region,
    costo,
    lead_time_dias: t.lead_time_dias,
    tramo: field,
    peso_kg: pesoKg,
  };
}

/** Cotiza ambos servicios (EXPRESS y PRIORITY) en paralelo. */
export async function cotizarEnvioAmbos({ comuna, pesoKg = 0.5 }) {
  const [express, priority] = await Promise.all([
    cotizarEnvioBluex({ comuna, pesoKg, servicio: 'EXPRESS' }),
    cotizarEnvioBluex({ comuna, pesoKg, servicio: 'PRIORITY' }),
  ]);
  return { express, priority };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo de peso de carrito · usa peso real + volumétrico de cada producto
// ─────────────────────────────────────────────────────────────────────────────

/** Peso facturable Bluex: max(peso real, peso volumétrico). Mínimo 0.5 kg. */
export function calcularPesoFacturable(producto, cantidad = 1) {
  if (!producto) return 0.5 * cantidad;
  const pesoReal = producto.peso_kg || 0;
  const pesoVol = producto.peso_volumetrico_kg
    || (producto.largo_cm && producto.ancho_cm && producto.alto_cm
        ? (producto.largo_cm * producto.ancho_cm * producto.alto_cm) / 5000
        : 0);
  // El courier factura por el mayor de los dos
  const facturable = Math.max(pesoReal, pesoVol);
  // Si no hay datos, asumimos 0.3 kg/unidad (carcasa promedio)
  const efectivo = facturable > 0 ? facturable : 0.3;
  return efectivo * cantidad;
}

/**
 * Suma el peso facturable de todos los items del carrito.
 * Cada item: { productoId, cantidad } → consulta a Producto para peso real.
 * @returns {Promise<{pesoTotalKg, detalle}>}
 */
export async function calcularPesoCarrito(items = []) {
  if (!items.length) return { pesoTotalKg: 0.5, detalle: [] };

  // Cargar productos del carrito en una sola query
  const ids = [...new Set(items.map(i => i.productoId).filter(Boolean))];
  const productos = await Promise.all(
    ids.map(id => base44.entities.Producto.filter({ id }).then(r => r[0]).catch(() => null))
  );
  const byId = new Map(productos.filter(Boolean).map(p => [p.id, p]));

  const detalle = items.map(item => {
    const p = byId.get(item.productoId);
    const peso = calcularPesoFacturable(p, item.cantidad || 1);
    return {
      nombre: item.nombre || p?.nombre,
      cantidad: item.cantidad || 1,
      peso_unidad_kg: p ? Math.max(p.peso_kg || 0, p.peso_volumetrico_kg || 0) || 0.3 : 0.3,
      peso_total_kg: Math.round(peso * 1000) / 1000,
      sin_datos: !p?.peso_kg && !p?.peso_volumetrico_kg,
    };
  });

  const pesoTotalKg = Math.max(0.5, detalle.reduce((s, d) => s + d.peso_total_kg, 0));
  return {
    pesoTotalKg: Math.round(pesoTotalKg * 1000) / 1000,
    detalle,
  };
}

/**
 * Cotiza envío para un carrito completo. Calcula peso real, consulta tarifa
 * Bluex EXPRESS y PRIORITY, y devuelve ambas opciones listas para mostrar.
 */
export async function cotizarEnvioCarrito({ comuna, items = [] }) {
  if (!comuna) return null;
  const { pesoTotalKg, detalle } = await calcularPesoCarrito(items);
  const tarifas = await cotizarEnvioAmbos({ comuna, pesoKg: pesoTotalKg });
  return {
    peso_total_kg: pesoTotalKg,
    detalle_peso: detalle,
    express: tarifas.express,
    priority: tarifas.priority,
  };
}