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