// ============================================================================
// Detector de intención simple para Peyu Agent OS.
// Mapea la pregunta del founder a los tipos de tarjeta que se embeben en la
// conversación. Liviano, sin LLM — solo keywords.
// ============================================================================
export function detectCards(text) {
  const q = (text || '').toLowerCase();
  const has = (kw) => kw.some((k) => q.includes(k));
  const cards = [];

  if (has(['vendimos', 'venta', 'ventas', 'ingreso', 'facturamos', 'cuánto vend', 'cuanto vend', 'caja', 'financiero', 'ganancia'])) {
    cards.push({ type: 'sales', periodo: has(['semana', '7 día', '7 dia', 'últimos']) ? '7d' : 'hoy' });
  }
  if (has(['pedido', 'pendiente', 'por despachar', 'producción', 'produccion', 'transferencia por'])) {
    cards.push({ type: 'orders' });
  }
  if (has(['stock', 'inventario', 'agotad', 'reponer', 'producto', 'catálogo', 'catalogo', 'sku', 'precio'])) {
    cards.push({ type: 'stock' });
  }
  if (has(['cotizaci', 'propuesta', 'corporativ'])) {
    cards.push({ type: 'proposals' });
  }
  if (has(['lead', 'b2b', 'prospecto', 'empresa'])) {
    cards.push({ type: 'leads' });
  }
  if (has(['envío', 'envio', 'bluex', 'blue express', 'tracking', 'etiqueta', 'courier', 'reparto', 'tránsito', 'transito', 'despacho'])) {
    cards.push({ type: 'shipments' });
  }
  if (has(['consulta', 'pregunta', 'sin responder', 'mensaje', 'whatsapp'])) {
    cards.push({ type: 'consultas' });
  }
  if (has(['cliente', 'comprador'])) {
    cards.push({ type: 'clients' });
  }
  // Resumen general
  if (has(['resumen', 'cómo vamos', 'como vamos', 'cómo va', 'como va', 'estado general', 'briefing', 'día de hoy'])) {
    cards.push({ type: 'summary' });
  }

  return cards;
}