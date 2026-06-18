// ════════════════════════════════════════════════════════════════════════
// Mapa de las secuencias automáticas reales de PEYU (emails, notificaciones,
// CRONs y automatizaciones por evento). Es la fuente de verdad del diagrama
// de flujo en /admin/secuencias. Cada flujo agrupa pasos: disparador → función
// → destinatario, para entender visualmente cómo se conectan las notificaciones.
//
// audiencia:  'cliente_b2c' | 'cliente_b2b' | 'equipo' | 'sistema'
// trigger:    'evento' (create/update entidad) | 'cron' (programado) | 'webhook'
// ════════════════════════════════════════════════════════════════════════

export const AUDIENCIAS = {
  cliente_b2c: { label: 'Cliente B2C', color: '#C0785C', bg: 'rgba(192,120,92,.12)' },
  cliente_b2b: { label: 'Cliente B2B', color: '#0F8B6C', bg: 'rgba(15,139,108,.12)' },
  equipo:      { label: 'Equipo PEYU', color: '#3B6CB7', bg: 'rgba(59,108,183,.12)' },
  sistema:     { label: 'Sistema',     color: '#8C6BB1', bg: 'rgba(140,107,177,.12)' },
};

export const TRIGGERS = {
  evento:  { label: 'Por evento', icon: 'Zap' },
  cron:    { label: 'Programado', icon: 'Clock' },
  webhook: { label: 'Webhook',    icon: 'Webhook' },
};

// Cada flujo = una columna del diagrama. pasos = nodos conectados en cadena.
export const FLUJOS = [
  {
    id: 'compra_b2c',
    titulo: 'Compra B2C',
    descripcion: 'Desde que un cliente paga hasta que califica su pedido.',
    icon: 'ShoppingCart',
    pasos: [
      { trigger: 'evento', disparador: 'Se crea el pedido (PedidoWeb)', funcion: 'onNewPedidoWeb', envia: 'Confirmación de pedido + instrucciones de pago', a: 'cliente_b2c' },
      { trigger: 'evento', disparador: 'Se crea el pedido', funcion: 'onNewPedidoWeb', envia: 'Aviso de nuevo pedido al equipo', a: 'equipo' },
      { trigger: 'webhook', disparador: 'MercadoPago confirma el pago', funcion: 'mpWebhook', envia: 'Registra pago + dispara comprobante', a: 'sistema' },
      { trigger: 'evento', disparador: 'Pago confirmado', funcion: 'enviarComprobantePedido', envia: 'Comprobante de compra', a: 'cliente_b2c' },
      { trigger: 'evento', disparador: 'Estado → En Producción', funcion: 'onPedidoWebStatusChange', envia: '"Estamos preparando tu pedido"', a: 'cliente_b2c' },
      { trigger: 'evento', disparador: 'Estado → Despachado', funcion: 'onPedidoWebStatusChange', envia: 'Tracking BlueExpress', a: 'cliente_b2c' },
      { trigger: 'evento', disparador: 'Estado → Entregado', funcion: 'onPedidoWebStatusChange', envia: '"¿Cómo llegó tu PEYU?" + reseña', a: 'cliente_b2c' },
    ],
  },
  {
    id: 'recuperacion_b2c',
    titulo: 'Recuperación B2C',
    descripcion: 'Recupera carritos y pagos que quedaron a medias.',
    icon: 'Undo2',
    pasos: [
      { trigger: 'cron', disparador: 'Carrito abandonado (cada hora)', funcion: 'carritoAbandonadoCRON', envia: 'Secuencia de recuperación de carrito', a: 'cliente_b2c' },
      { trigger: 'evento', disparador: 'Carrito recuperado', funcion: 'enviarRecordatorioCarrito', envia: 'Recordatorio con el carrito guardado', a: 'cliente_b2c' },
      { trigger: 'cron', disparador: 'Pagos pendientes', funcion: 'mpReconcilePending', envia: 'Reconcilia pagos / expira pedidos', a: 'sistema' },
      { trigger: 'cron', disparador: 'Pedidos de prueba / vencidos', funcion: 'cleanupTestAndExpiredOrders', envia: 'Limpieza automática', a: 'sistema' },
    ],
  },
  {
    id: 'postventa_b2c',
    titulo: 'Post-venta B2C',
    descripcion: 'Fideliza y reactiva al cliente tras la entrega.',
    icon: 'Heart',
    pasos: [
      { trigger: 'cron', disparador: '~21 días tras entrega', funcion: 'recordatorioRecompraCRON', envia: 'Invitación a recomprar', a: 'cliente_b2c' },
      { trigger: 'cron', disparador: 'Pedido entregado', funcion: 'solicitarResenaCRON', envia: 'Solicitud de reseña', a: 'cliente_b2c' },
      { trigger: 'evento', disparador: 'Compra completada', funcion: 'crossSellPostCompra', envia: 'Recomendaciones de cross-sell', a: 'cliente_b2c' },
      { trigger: 'evento', disparador: 'Reseña recibida', funcion: 'analizarResenaIA', envia: 'Análisis IA de la reseña', a: 'sistema' },
    ],
  },
  {
    id: 'lead_b2b',
    titulo: 'Lead B2B',
    descripcion: 'Captura, califica y nutre al lead corporativo.',
    icon: 'Briefcase',
    pasos: [
      { trigger: 'evento', disparador: 'Se crea un lead (B2BLead)', funcion: 'onNewB2BLead', envia: 'Scoring + mockup + propuesta auto', a: 'sistema' },
      { trigger: 'evento', disparador: 'Se crea un lead', funcion: 'notificarEquipoLead', envia: 'Aviso de nuevo lead al equipo', a: 'equipo' },
      { trigger: 'cron', disparador: 'Lead caliente sin cotizar', funcion: 'autoQuoteHotB2BLeads', envia: 'Cotización automática', a: 'cliente_b2b' },
      { trigger: 'evento', disparador: 'Lead en seguimiento', funcion: 'nurtureLeadB2B', envia: 'Secuencia de nurturing', a: 'cliente_b2b' },
      { trigger: 'cron', disparador: 'Lead frío', funcion: 'leadReactivationCRON', envia: 'Reactivación del lead', a: 'cliente_b2b' },
    ],
  },
  {
    id: 'propuesta_b2b',
    titulo: 'Propuesta B2B',
    descripcion: 'Acompaña la propuesta desde el envío hasta el cierre.',
    icon: 'FileText',
    pasos: [
      { trigger: 'evento', disparador: 'Propuesta enviada', funcion: 'sendProposalEmail', envia: 'Propuesta + PDF', a: 'cliente_b2b' },
      { trigger: 'evento', disparador: 'Propuesta enviada', funcion: 'b2bProposalEmailSequence', envia: 'Secuencia de seguimiento', a: 'cliente_b2b' },
      { trigger: 'cron', disparador: 'Propuesta sin respuesta', funcion: 'recordarPropuestasPendientesCRON', envia: 'Recordatorio de propuesta', a: 'cliente_b2b' },
      { trigger: 'cron', disparador: 'Propuesta por vencer', funcion: 'checkExpiringProposals', envia: 'Aviso de vencimiento', a: 'cliente_b2b' },
      { trigger: 'evento', disparador: 'Propuesta aceptada', funcion: 'onProposalAccepted', envia: 'Confirmación + orden de producción', a: 'cliente_b2b' },
      { trigger: 'evento', disparador: 'Cambio de estado', funcion: 'notifyProposalStatusChange', envia: 'Aviso de cambio al equipo', a: 'equipo' },
      { trigger: 'cron', disparador: 'Propuesta rechazada', funcion: 'recuperarPropuestaRechazada', envia: 'Intento de recuperación', a: 'cliente_b2b' },
      { trigger: 'evento', disparador: 'Anticipo pendiente', funcion: 'recordatorioAnticipoB2B', envia: 'Recordatorio de anticipo', a: 'cliente_b2b' },
    ],
  },
  {
    id: 'logistica',
    titulo: 'Logística & Envíos',
    descripcion: 'Sigue el envío en tiempo real con BlueExpress.',
    icon: 'Truck',
    pasos: [
      { trigger: 'cron', disparador: 'Seguimiento de envíos', funcion: 'bluexTrackingPollerCRON', envia: 'Consulta estado en BlueExpress', a: 'sistema' },
      { trigger: 'webhook', disparador: 'Evento del courier', funcion: 'bluexTrackingPush', envia: 'Actualiza estado del envío', a: 'sistema' },
      { trigger: 'evento', disparador: 'Cambio en el envío', funcion: 'updateShippingStatus', envia: 'Notificación de envío', a: 'cliente_b2c' },
    ],
  },
  {
    id: 'inventario',
    titulo: 'Inventario & Alertas',
    descripcion: 'Vigila stock, demanda y costos para el equipo.',
    icon: 'Boxes',
    pasos: [
      { trigger: 'cron', disparador: 'Stock bajo', funcion: 'alertaStockBajoCRON', envia: 'Alerta de stock al equipo', a: 'equipo' },
      { trigger: 'cron', disparador: 'Análisis de tendencias', funcion: 'analizarTendenciasYAlertarStock', envia: 'Alerta de demanda', a: 'equipo' },
      { trigger: 'cron', disparador: 'Predicción de demanda', funcion: 'prediccionDemandaCRON', envia: 'Pronóstico de stock', a: 'equipo' },
      { trigger: 'cron', disparador: 'Auditoría de catálogo', funcion: 'auditoriaCatalogoCRON', envia: 'Reporte de catálogo', a: 'equipo' },
    ],
  },
  {
    id: 'equipo_briefings',
    titulo: 'Briefings del Equipo',
    descripcion: 'Reportes e inteligencia que recibe el equipo PEYU.',
    icon: 'Mail',
    pasos: [
      { trigger: 'cron', disparador: 'Cada mañana', funcion: 'dailyBriefingCRON', envia: 'Briefing diario', a: 'equipo' },
      { trigger: 'cron', disparador: 'Cada semana', funcion: 'insightsSemanalesIA', envia: 'Insights semanales IA', a: 'equipo' },
      { trigger: 'cron', disparador: 'Reporte semanal B2B', funcion: 'reporteSemanalB2B', envia: 'Reporte de pipeline B2B', a: 'equipo' },
      { trigger: 'cron', disparador: 'Oportunidades SEO', funcion: 'oportunidadesSEOCRON', envia: 'Oportunidades de SEO', a: 'equipo' },
      { trigger: 'cron', disparador: 'Trimestral B2B', funcion: 'npsTrimestralB2B', envia: 'Encuesta NPS', a: 'cliente_b2b' },
    ],
  },
];