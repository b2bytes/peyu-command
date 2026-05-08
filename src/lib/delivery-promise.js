// ============================================================================
// PEYU · Delivery Promise (Single Source of Truth)
// ----------------------------------------------------------------------------
// Define las MISMAS promesas de entrega que comunicamos a:
//   1. Google Merchant Center (feed XML → Google Shopping ads)
//   2. Página /envios (pública)
//   3. Producto detalle ("Recibe entre X y Y")
//   4. Carrito / checkout
//   5. Email de confirmación
//
// Si tu operación cambia (ej: BlueExpress mejora, o cierras los sábados),
// actualiza SOLO este archivo. Todo lo demás se sincroniza automáticamente.
// ============================================================================

// ── Hora de corte para procesar el día ────────────────────────────────────
// Pedidos pagados antes de esta hora salen el MISMO día.
// BlueExpress retira en Santiago hasta las 17:00 → corte 14:00 da margen.
export const CUTOFF_TIME = '14:00';
export const CUTOFF_TIMEZONE = 'America/Santiago';

// ── Tiempo de preparación (handling time) ─────────────────────────────────
// 0–1 días hábiles: si pagan antes de las 14:00, sale el mismo día (0).
// Si pagan después, sale al día siguiente hábil (1).
// IMPORTANTE: Lun–Vie únicamente. BlueExpress no retira los sábados.
export const HANDLING_DAYS = { min: 0, max: 1 };
export const HANDLING_BUSINESS_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// ── Zonas de despacho ─────────────────────────────────────────────────────
// Cada zona define: regiones cubiertas + lead time de transporte.
// Días de envío del courier: BlueExpress entrega Lun–Sáb (no domingos).
export const SHIPPING_ZONES = [
  {
    id: 'rm',
    label: 'Región Metropolitana (Santiago)',
    regions: ['Región Metropolitana de Santiago'],
    transitDays: { min: 1, max: 2 },
    courierBusinessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  },
  {
    id: 'urban',
    label: 'Resto urbano (Valparaíso, Concepción, La Serena, Temuco, etc.)',
    regions: [
      'Región de Valparaíso',
      'Región del Biobío',
      'Región de Coquimbo',
      'Región de La Araucanía',
      'Región del Maule',
      'Región del Libertador General Bernardo O\'Higgins',
      'Región de Ñuble',
      'Región de Los Ríos',
      'Región de Los Lagos',
      'Región de Atacama',
      'Región de Antofagasta',
    ],
    transitDays: { min: 2, max: 4 },
    courierBusinessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  },
  {
    id: 'extreme',
    label: 'Extremos / rurales (Arica, Iquique, Aysén, Magallanes)',
    regions: [
      'Región de Arica y Parinacota',
      'Región de Tarapacá',
      'Región de Aysén del General Carlos Ibáñez del Campo',
      'Región de Magallanes y de la Antártica Chilena',
    ],
    transitDays: { min: 4, max: 8 },
    courierBusinessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  },
];

// ── Promedio conservador (usado cuando no se sabe el destino) ─────────────
// Útil para feed de GMC con configuración "Todos los destinos" o
// para mostrar plazo genérico antes de que el cliente ingrese dirección.
export const DEFAULT_TRANSIT_DAYS = { min: 2, max: 5 };

// ── Promesa total visible al cliente ──────────────────────────────────────
// handling + transit, presentado como rango "X–Y días hábiles".
export function totalDeliveryRange(zoneId = null) {
  const zone = SHIPPING_ZONES.find((z) => z.id === zoneId);
  const transit = zone?.transitDays || DEFAULT_TRANSIT_DAYS;
  return {
    min: HANDLING_DAYS.min + transit.min,
    max: HANDLING_DAYS.max + transit.max,
  };
}

// ── Free shipping threshold (usado en feed GMC y en /envios) ──────────────
export const FREE_SHIPPING_THRESHOLD_CLP = 40000;
export const FLAT_SHIPPING_CLP = 5990;

// ── Mapper helper para componentes que necesiten un texto humano ──────────
export function deliveryLabel(zoneId = null) {
  const { min, max } = totalDeliveryRange(zoneId);
  return min === max ? `${min} día${min === 1 ? '' : 's'} hábil${min === 1 ? '' : 'es'}` : `${min}–${max} días hábiles`;
}