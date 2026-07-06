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
  // Gestor de DISEÑOS PEYU del personalizador (galería de grabado láser):
  // subir diseños, cambiar la imagen de uno (ej. la ranita), activar/ocultar.
  // Se evalúa ANTES que catálogo para que "subir un diseño" o "cambiar la
  // imagen de la rana" no dispare el gestor de productos.
  const quiereDisenos = has([
    'diseño', 'diseños', 'diseno', 'disenos', 'galería del personalizador', 'galeria del personalizador',
    'personalizador', 'ranita', 'rana', 'grabados peyu', 'diseños peyu', 'disenos peyu',
  ]);
  if (quiereDisenos) {
    cards.push({ type: 'disenos' });
  }

  // Gestión del catálogo: editar productos, subir/cambiar imágenes, agregar.
  // Tiene prioridad sobre "stock bajo": si el founder quiere ADMINISTRAR el
  // catálogo (no solo ver stock), mostramos el gestor completo.
  const quiereGestionCatalogo = has([
    'editar catálogo', 'editar catalogo', 'gestionar catálogo', 'gestionar catalogo',
    'administrar catálogo', 'administrar catalogo', 'gestor de catálogo', 'gestor de catalogo',
    'editar producto', 'editar productos', 'gestionar producto', 'gestionar productos',
    'subir imagen', 'subir imágenes', 'subir imagenes', 'cambiar imagen', 'cambiar imágenes', 'cambiar imagenes',
    'cambiar foto', 'cambiar fotos', 'agregar producto', 'crear producto', 'nuevo producto', 'añadir producto',
    'editar carcasa', 'editar carcasas', 'gestionar carcasas', 'fotos del catálogo', 'fotos del catalogo',
    'imágenes del producto', 'imagenes del producto', 'imágenes de los productos', 'imagenes de los productos',
    'traer el catálogo', 'traer el catalogo', 'todo el catálogo', 'todo el catalogo',
  ]);
  // Stock / inventario: abrimos el GESTOR COMPLETO (buscador, filtros, edición
  // de stock e imágenes por producto) con el filtro de stock pre-aplicado, en
  // vez de la card de solo lectura. Así el founder actualiza todo en el chat.
  // Keywords inequívocas de gestión de catálogo: evitamos disparar con palabras
  // genéricas como "producto"/"precio" que aparecen en frases sobre pedidos.
  const quiereStock = has([
    'stock', 'inventario', 'agotad', 'reponer', 'sin stock',
    'catálogo', 'catalogo', 'sku', 'actualizar producto', 'actualizar precio',
    'cambiar precio', 'cambiar stock', 'ver productos', 'mis productos',
  ]);
  if (quiereGestionCatalogo || quiereStock) {
    cards.push({
      type: 'catalog',
      categoria: has(['carcasa']) ? 'Carcasas B2C' : undefined,
      stock: has(['agotad', 'sin stock', 'cero']) ? 'agotado' : has(['stock bajo', 'bajo stock', 'poco stock', 'reponer']) ? 'bajo' : undefined,
    });
  }
  if (has(['cupón', 'cupon', 'cupones', 'descuento', 'código de descuento', 'codigo de descuento', 'promoción', 'promocion'])) {
    cards.push({ type: 'cupones' });
  }
  if (has(['gift card', 'giftcard', 'gift cards', 'tarjeta de regalo', 'tarjetas de regalo', 'regalar gift', 'saldo gift', 'canjear gift'])) {
    cards.push({ type: 'giftcards' });
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