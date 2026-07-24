// ════════════════════════════════════════════════════════════════════════
// mensajeError — Traduce cualquier error de una función backend al motivo
// REAL y legible para el founder. El SDK a veces sólo expone el mensaje de
// axios ("Request failed with status code 500"), que no dice nada útil;
// aquí buscamos el detalle en todas las formas posibles de la respuesta.
// ════════════════════════════════════════════════════════════════════════
const GENERICOS = [
  'Request failed with status code',
  'Network Error',
  'timeout of',
];

const POR_CODIGO = {
  403: 'Acción bloqueada: el pedido no tiene el pago confirmado.',
  409: 'Ya existe una operación igual para este pedido.',
  429: 'Demasiadas solicitudes seguidas. Espera unos segundos y reintenta.',
  500: 'El servicio externo (BlueExpress) rechazó la operación o no respondió. Reintenta en un momento.',
  502: 'El servicio externo no respondió. Reintenta en un momento.',
  503: 'Servicio momentáneamente no disponible. Reintenta en un momento.',
  504: 'El servicio externo tardó demasiado. Reintenta en un momento.',
  509: 'Se alcanzó el límite de tráfico del plan. Reintenta en unos minutos.',
};

export function mensajeError(e) {
  const d = e?.response?.data ?? e?.data;
  const candidatos = [
    typeof d === 'string' ? d : null,
    d?.error,
    d?.reason,
    d?.detail,
    d?.message,
    e?.message,
  ].filter((s) => typeof s === 'string' && s.trim());

  const util = candidatos.find((s) => !GENERICOS.some((g) => s.includes(g)));
  if (util) return util.slice(0, 240);

  const status = e?.response?.status || e?.status;
  return POR_CODIGO[status] || candidatos[0] || 'No se pudo completar la acción.';
}