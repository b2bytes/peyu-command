// ============================================================================
// Detector de intención simple para Peyu Agent OS.
// Mapea la pregunta del founder a los tipos de tarjeta que se embeben en la
// conversación. Liviano, sin LLM — solo keywords.
// ============================================================================
export function detectCards(text) {
  const q = (text || '').toLowerCase();
  const has = (kw) => kw.some((k) => q.includes(k));
  const cards = [];

  if (has(['vendimos', 'venta', 'ventas', 'ingreso', 'facturamos', 'cuánto vend', 'cuanto vend'])) {
    cards.push({ type: 'sales', periodo: has(['semana', '7 día', '7 dia', 'últimos']) ? '7d' : 'hoy' });
  }
  if (has(['pedido', 'pendiente', 'por despachar', 'producción', 'produccion', 'transferencia por'])) {
    cards.push({ type: 'orders' });
  }
  if (has(['stock', 'inventario', 'agotad', 'reponer'])) {
    cards.push({ type: 'stock' });
  }
  if (has(['cotizaci', 'propuesta', 'b2b', 'corporativ'])) {
    cards.push({ type: 'quotes' });
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