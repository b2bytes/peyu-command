// ════════════════════════════════════════════════════════════════════════
// Detector de intención de un mensaje de WhatsApp.
// Distingue si el cliente está pidiendo una COTIZACIÓN o haciendo un RECLAMO,
// para que el pipeline lo mueva directo a su etapa apenas entra el mensaje.
// ════════════════════════════════════════════════════════════════════════

const norm = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const RECLAMO = [
  'reclamo', 'reclamar', 'queja', 'molesto', 'molesta', 'pesimo', 'pesima',
  'llego roto', 'llego rota', 'llego mal', 'llego dañado', 'llego danado',
  'defectuoso', 'fallado', 'fallo el producto', 'mala calidad',
  'no llego', 'no ha llegado', 'nunca llego', 'aun no llega', 'todavia no llega',
  'quiero mi devolucion', 'devolucion', 'reembolso', 'garantia',
  'me equivocaron', 'pedido equivocado', 'producto equivocado', 'falta un producto',
  'estafa', 'demanda', 'sernac',
];

const COTIZACION = [
  'cotizacion', 'cotizar', 'cotiza', 'cotizame', 'me cotizas',
  'presupuesto', 'precio por mayor', 'precios por mayor', 'por mayor',
  'al por mayor', 'mayorista', 'empresa', 'corporativo', 'regalo corporativo',
  'necesito 50', 'necesito 100', 'unidades', 'cuanto sale', 'cuanto saldria',
  'cuanto me sale', 'valor por', 'orden de compra', 'licitacion',
];

const match = (t, list) => list.some((k) => t.includes(k));

/**
 * Devuelve 'reclamo' | 'cotizacion' | null a partir del texto del cliente.
 * El reclamo siempre tiene prioridad sobre la cotización.
 */
export function detectarIntencion(texto) {
  const t = norm(texto);
  if (!t) return null;
  if (match(t, RECLAMO)) return 'reclamo';
  if (match(t, COTIZACION)) return 'cotizacion';
  return null;
}