// ════════════════════════════════════════════════════════════════════════
// Mapa de las SECUENCIAS DE CORREOS completas de PEYU (B2C y B2B), pensado
// para un diagrama de flujo explicativo en /admin/flujo-correos.
//
// Fuente de verdad real (funciones backend):
//   B2C → onNewPedidoWeb, mpWebhook, enviarComprobantePedido,
//         onPedidoWebStatusChange, carritoAbandonadoCRON,
//         recordatorioRecompraCRON, solicitarResenaCRON
//   B2B → sendProposalEmail + b2bProposalEmailSequence (4 toques),
//         recordarPropuestasPendientesCRON, checkExpiringProposals,
//         onProposalAccepted, recordatorioAnticipoB2B, recuperarPropuestaRechazada
//
// Cada paso = un correo real al cliente. `cuando` describe el disparador,
// `asunto` es el subject real aproximado y `detalle` el contenido clave.
// ════════════════════════════════════════════════════════════════════════

export const EMAIL_FLOWS = {
  b2c: {
    titulo: 'Cliente B2C',
    subtitulo: 'Persona que compra en la tienda online',
    color: '#C0785C',
    colorSoft: 'rgba(192,120,92,.10)',
    descripcion: 'Cada correo que recibe una persona desde que pone un producto en el carro hasta que vuelve a comprar.',
    etapas: [
      {
        fase: 'Antes de pagar',
        nota: 'Solo si dejó el carrito a medias.',
        correos: [
          {
            paso: 'Carrito abandonado',
            cuando: 'Dejó productos en el carro sin pagar (revisado cada hora)',
            funcion: 'carritoAbandonadoCRON → enviarRecordatorioCarrito',
            asunto: 'Dejaste algo en tu carro 🛒',
            detalle: 'Le recuerda los productos guardados y lo invita a terminar la compra.',
            tono: 'recuperacion',
          },
        ],
      },
      {
        fase: 'Al comprar',
        nota: 'Disparado al crear el pedido. El contenido cambia según el medio de pago.',
        correos: [
          {
            paso: 'Confirmación · Transferencia',
            cuando: 'Crea el pedido pagando por transferencia',
            funcion: 'onNewPedidoWeb',
            asunto: '📋 Datos para transferencia · Pedido #',
            detalle: 'Monto a transferir, datos bancarios, los 3 pasos y CTA para enviar el comprobante. Incluye el 5% de descuento por transferencia.',
            tono: 'pendiente',
          },
          {
            paso: 'Confirmación · Mercado Pago',
            cuando: 'Crea el pedido pagando con Mercado Pago',
            funcion: 'onNewPedidoWeb',
            asunto: '🛒 Pedido recibido · Esperando confirmación de pago',
            detalle: '"Recibimos tu pedido, apenas Mercado Pago confirme partimos producción".',
            tono: 'pendiente',
          },
          {
            paso: 'Comprobante de pago',
            cuando: 'Mercado Pago confirma el pago (webhook)',
            funcion: 'mpWebhook → enviarComprobantePedido',
            asunto: '✅ Comprobante de tu compra · Pedido #',
            detalle: 'Comprobante formal con el detalle y total. Confirma que el pago entró.',
            tono: 'exito',
          },
        ],
      },
      {
        fase: 'En producción y envío',
        nota: 'Un correo por cada cambio de estado del pedido.',
        correos: [
          {
            paso: 'En producción',
            cuando: 'Estado del pedido → En Producción',
            funcion: 'onPedidoWebStatusChange',
            asunto: '🏭 En producción · Pedido #',
            detalle: '"Estamos fabricando tu pedido en el taller de Santiago". Tiempo estimado.',
            tono: 'proceso',
          },
          {
            paso: 'Listo para despacho',
            cuando: 'Estado → Listo para Despacho',
            funcion: 'onPedidoWebStatusChange',
            asunto: '📦 Listo para despacho · Pedido #',
            detalle: '"Tu pedido fue empaquetado y espera al courier".',
            tono: 'proceso',
          },
          {
            paso: 'Despachado + tracking',
            cuando: 'Estado → Despachado',
            funcion: 'onPedidoWebStatusChange',
            asunto: '🚚 ¡Tu pedido está en camino! · Pedido #',
            detalle: 'Número de tracking BlueExpress + botón para rastrear el envío.',
            tono: 'proceso',
          },
        ],
      },
      {
        fase: 'Post-venta y fidelización',
        nota: 'Tras la entrega, para pedir reseña y reactivar al cliente.',
        correos: [
          {
            paso: 'Entregado + reseña',
            cuando: 'Estado → Entregado',
            funcion: 'onPedidoWebStatusChange',
            asunto: '🎉 ¡Pedido entregado! ¿Cómo te fue?',
            detalle: 'Felicita por la entrega e invita a calificar el pedido (⭐⭐⭐⭐⭐).',
            tono: 'exito',
          },
          {
            paso: 'Solicitud de reseña',
            cuando: 'Pedido entregado (CRON)',
            funcion: 'solicitarResenaCRON',
            asunto: '¿Nos dejas tu opinión? 🐢',
            detalle: 'Refuerza la solicitud de reseña si aún no calificó.',
            tono: 'fidelizacion',
          },
          {
            paso: 'Invitación a recomprar',
            cuando: '~21 días después de la entrega (CRON)',
            funcion: 'recordatorioRecompraCRON',
            asunto: '¿Listo para tu próximo PEYU? 💚',
            detalle: 'Invita a volver a comprar con recomendaciones de cross-sell.',
            tono: 'fidelizacion',
          },
        ],
      },
    ],
  },

  b2b: {
    titulo: 'Cliente B2B',
    subtitulo: 'Empresa que pide una cotización / propuesta corporativa',
    color: '#0F8B6C',
    colorSoft: 'rgba(15,139,108,.10)',
    descripcion: 'La secuencia que acompaña a una empresa desde que recibe su propuesta hasta que la acepta (o se recupera si la rechaza).',
    etapas: [
      {
        fase: 'Propuesta enviada',
        nota: 'Apenas se envía la propuesta corporativa.',
        correos: [
          {
            paso: 'Propuesta lista (Día 0)',
            cuando: 'Se envía la propuesta',
            funcion: 'sendProposalEmail + b2bProposalEmailSequence · paso 1',
            asunto: 'Tu propuesta PEYU está lista, [empresa] 🎉',
            detalle: 'Propuesta con PDF adjunto: precios por volumen, lead time, condiciones de personalización láser y total estimado.',
            tono: 'exito',
          },
        ],
      },
      {
        fase: 'Secuencia de seguimiento (nurturing)',
        nota: 'Automática por días, solo si la propuesta sigue abierta. Se detiene si se acepta o rechaza.',
        correos: [
          {
            paso: 'Por qué PEYU (Día 2)',
            cuando: '2 días después del envío',
            funcion: 'b2bProposalEmailSequence · paso 2',
            asunto: '[empresa]: por qué las empresas eligen PEYU 🌿',
            detalle: 'Valor más allá del precio: 100% reciclado, marmolado único, grabado láser permanente y reporte ESG.',
            tono: 'proceso',
          },
          {
            paso: 'Recordatorio + caso de éxito (Día 5)',
            cuando: '5 días después del envío',
            funcion: 'b2bProposalEmailSequence · paso 3',
            asunto: '[empresa], ¿pudiste revisar tu propuesta? 👀',
            detalle: 'Urgencia suave + testimonio de cliente corporativo + CTA para agendar llamada.',
            tono: 'proceso',
          },
          {
            paso: 'Última oportunidad (Día 10)',
            cuando: '10 días después del envío',
            funcion: 'b2bProposalEmailSequence · paso 4',
            asunto: 'Último recordatorio: propuesta # por vencer ⏰',
            detalle: 'Oferta especial: 5% adicional de descuento si confirma antes del vencimiento.',
            tono: 'pendiente',
          },
        ],
      },
      {
        fase: 'Recordatorios por vencimiento',
        nota: 'CRONs que vigilan propuestas sin respuesta.',
        correos: [
          {
            paso: 'Propuesta sin respuesta',
            cuando: 'Propuesta enviada sin contestar (CRON)',
            funcion: 'recordarPropuestasPendientesCRON',
            asunto: 'Recordatorio de tu propuesta PEYU',
            detalle: 'Re-impulsa la propuesta pendiente para que el cliente la revise.',
            tono: 'proceso',
          },
          {
            paso: 'Propuesta por vencer',
            cuando: 'Se acerca la fecha de vencimiento (CRON)',
            funcion: 'checkExpiringProposals',
            asunto: 'Tu propuesta está por vencer ⏰',
            detalle: 'Avisa que la validez de la propuesta está terminando.',
            tono: 'pendiente',
          },
        ],
      },
      {
        fase: 'Cierre',
        nota: 'Según la decisión final de la empresa.',
        correos: [
          {
            paso: 'Propuesta aceptada',
            cuando: 'La empresa acepta la propuesta',
            funcion: 'onProposalAccepted',
            asunto: '✅ Confirmamos tu pedido corporativo',
            detalle: 'Confirmación + se genera la orden de producción. Inicia el flujo de fabricación.',
            tono: 'exito',
          },
          {
            paso: 'Recordatorio de anticipo',
            cuando: 'Anticipo pendiente tras aceptar',
            funcion: 'recordatorioAnticipoB2B',
            asunto: 'Recordatorio: anticipo de tu pedido',
            detalle: 'Recuerda pagar el anticipo (ej. 50%) para iniciar la producción.',
            tono: 'pendiente',
          },
          {
            paso: 'Recuperación si rechaza',
            cuando: 'La propuesta fue rechazada (CRON)',
            funcion: 'recuperarPropuestaRechazada',
            asunto: 'Sabemos que ahora no, pero…',
            detalle: 'Último intento de recuperación, deja la puerta abierta para el futuro.',
            tono: 'recuperacion',
          },
        ],
      },
    ],
  },
};

// Paleta por "tono" del correo (estado emocional/comercial del mensaje).
export const TONOS = {
  recuperacion: { label: 'Recuperación', color: '#B45309', bg: 'rgba(180,83,9,.10)' },
  pendiente:    { label: 'Acción pendiente', color: '#C2410C', bg: 'rgba(194,65,12,.10)' },
  exito:        { label: 'Confirmación', color: '#0F8B6C', bg: 'rgba(15,139,108,.10)' },
  proceso:      { label: 'En proceso', color: '#1D4ED8', bg: 'rgba(29,78,216,.10)' },
  fidelizacion: { label: 'Fidelización', color: '#7C3AED', bg: 'rgba(124,58,237,.10)' },
};