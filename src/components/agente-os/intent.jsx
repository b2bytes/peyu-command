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
  // Pedidos POR CONFIRMAR PAGO: el founder quiere ver los que falta marcar pagados.
  const quierePorPagar = has(['confirmar pago', 'confirmar por pagado', 'por confirmar pago', 'por pagar', 'marcar pagado', 'marcar pagados', 'falta pagar', 'sin pagar', 'pago pendiente', 'pagos pendientes', 'transferencia por']);
  // Pedidos PARA CREAR ETIQUETA: pagados sin OT, listos para emitir BlueExpress.
  const quiereEtiqueta = has(['crear etiqueta', 'para etiqueta', 'generar etiqueta', 'hacer etiqueta', 'emitir etiqueta', 'sacar etiqueta', 'para despachar', 'por despachar', 'listos para despacho', 'listo para despacho']);

  // Etiquetas POR VOLUMEN / impresión masiva → tarjeta dedicada de selección
  // múltiple + generación en lote + impresión rápida desde el chat.
  const quiereEtiquetasMasivo = has(['etiquetas en lote', 'etiquetas por volumen', 'generar etiquetas', 'imprimir etiquetas', 'imprimir todas', 'todas las etiquetas', 'etiquetas masivo', 'etiquetas masivas', 'varias etiquetas', 'imprimir despacho', 'imprimir despachos']);

  if (quiereEtiquetasMasivo) {
    cards.push({ type: 'bulk_labels' });
  } else if (has(['pipeline', 'flujo de pedidos', 'flujo completo', 'embudo de pedidos', 'gestionar pedidos', 'gestionar todo', 'confirmar pagos', 'varios pedidos', 'en lote', 'de principio a fin'])) {
    cards.push({ type: 'pipeline' });
  } else if (quierePorPagar) {
    cards.push({ type: 'orders', filtro: 'por_pagar' });
  } else if (quiereEtiqueta) {
    cards.push({ type: 'orders', filtro: 'por_etiqueta' });
  } else if (has(['pedido', 'pendiente', 'producción', 'produccion'])) {
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
    // "nuevos/recientes/últimos" → últimos registrados; si no → top compradores
    cards.push({ type: 'clients', modo: has(['nuevo', 'nueva', 'recien', 'recién', 'últim', 'ultim']) ? 'nuevos' : 'top' });
  }
  // Resumen general
  if (has(['resumen', 'cómo vamos', 'como vamos', 'cómo va', 'como va', 'estado general', 'briefing', 'día de hoy'])) {
    cards.push({ type: 'summary' });
  }

  return cards;
}