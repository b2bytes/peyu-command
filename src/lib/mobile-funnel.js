// ============================================================================
// mobile-funnel · Construye el embudo de compra móvil desde ActivityLog.
// Cada paso cuenta SESIONES únicas (no eventos) para medir personas reales,
// y calcula el % de abandono entre un paso y el siguiente.
// ============================================================================

export const PASOS_EMBUDO = [
  { id: 'page_view', label: 'Entró al sitio', ruta: 'Home / catálogo' },
  { id: 'product_view', label: 'Vio un producto', ruta: '/ProductoNuevo' },
  { id: 'add_to_cart', label: 'Agregó al carrito', ruta: '/CarritoNuevo' },
  { id: 'checkout_start', label: 'Inició el pago', ruta: '/CheckoutNuevo' },
  { id: 'checkout_complete', label: 'Compró', ruta: '/gracias' },
];

/** Filtra logs por dispositivo y ventana de días. */
export function filtrarLogs(logs, { device = 'mobile', dias = 30 } = {}) {
  const desde = Date.now() - dias * 24 * 60 * 60 * 1000;
  return (logs || []).filter((l) => {
    if (device !== 'todos' && l.device !== device) return false;
    return new Date(l.created_date).getTime() >= desde;
  });
}

/** Sesiones únicas por paso + abandono entre pasos. */
export function construirEmbudo(logs) {
  const sesionesPorPaso = PASOS_EMBUDO.map((paso) => {
    const sesiones = new Set(
      logs.filter((l) => l.event_type === paso.id).map((l) => l.session_id || l.id)
    );
    return { ...paso, sesiones: sesiones.size };
  });

  const base = sesionesPorPaso[0]?.sesiones || 0;
  return sesionesPorPaso.map((paso, i) => {
    const siguiente = sesionesPorPaso[i + 1];
    const perdidos = siguiente ? Math.max(0, paso.sesiones - siguiente.sesiones) : 0;
    const abandonoPct = siguiente && paso.sesiones > 0
      ? Math.round((perdidos / paso.sesiones) * 100)
      : 0;
    return {
      ...paso,
      pctDelTotal: base > 0 ? Math.round((paso.sesiones / base) * 100) : 0,
      perdidos,
      abandonoPct,
      esUltimo: !siguiente,
    };
  });
}

/** El paso con mayor fuga absoluta — el punto a optimizar primero. */
export function pasoCritico(embudo) {
  const candidatos = embudo.filter((p) => !p.esUltimo);
  if (candidatos.length === 0) return null;
  return candidatos.reduce((a, b) => (b.perdidos > a.perdidos ? b : a));
}