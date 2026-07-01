import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// whatsappEstadoPedido — Estado detallado de un pedido para WhatsApp.
// ----------------------------------------------------------------------------
// Busca un pedido por número, teléfono o email. Devuelve el estado actual,
// timeline de eventos, tracking de courier y resumen legible para enviar
// al cliente en WhatsApp.
//
// Payload: { numero_pedido?, telefono?, email? }
// ============================================================================

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { numero_pedido, telefono, email } = await req.json().catch(() => ({}));

    let pedidos = [];
    if (numero_pedido) {
      pedidos = await base44.asServiceRole.entities.PedidoWeb.filter({ numero_pedido }, '-created_date', 5).catch(() => []);
    } else if (telefono) {
      pedidos = await base44.asServiceRole.entities.PedidoWeb.filter({ cliente_telefono: telefono }, '-created_date', 5).catch(() => []);
    } else if (email) {
      pedidos = await base44.asServiceRole.entities.PedidoWeb.filter({ cliente_email: email }, '-created_date', 5).catch(() => []);
    } else {
      return Response.json({ error: 'Indica numero_pedido, telefono o email.' }, { status: 400 });
    }

    if (!pedidos || pedidos.length === 0) {
      return Response.json({
        encontrado: false,
        mensaje: 'No encontré pedidos con esos datos. ¿Puedes confirmar el número de pedido o el email que usaste al comprar?',
      });
    }

    const resultado = pedidos.slice(0, 3).map(p => {
      const timeline = Array.isArray(p.historial) ? p.historial.slice(-6).map(h => ({
        at: h.at,
        type: h.type,
        detail: h.detail || '',
      })) : [];

      // Estado legible para WhatsApp
      const estadosLegibles = {
        'Nuevo': '📥 Pedido recibido',
        'Confirmado': '✅ Pedido confirmado',
        'En Producción': '🔨 En producción (personalización láser)',
        'Listo para Despacho': '📦 Listo para despacho',
        'Despachado': '🚚 Despachado',
        'Entregado': '🎉 Entregado',
        'Cancelado': '❌ Cancelado',
        'Reembolsado': '💸 Reembolsado',
      };
      const paymentLegibles = {
        'pending_mp': '⏳ Esperando pago',
        'pending_transfer': '⏳ Esperando transferencia',
        'paid': '💰 Pagado',
        'expired': '⌛ Link de pago expirado',
        'failed': '⚠️ Pago fallido',
        'manual_review': '🔍 En revisión manual',
        'refunded': '💸 Reembolsado',
      };

      return {
        numero_pedido: p.numero_pedido,
        fecha: p.fecha,
        estado: p.estado,
        estado_legible: estadosLegibles[p.estado] || p.estado,
        payment_status: p.payment_status,
        pago_legible: paymentLegibles[p.payment_status] || p.payment_status,
        total: p.total,
        items: p.descripcion_items || (Array.isArray(p.items_detalle) ? p.items_detalle.map(i => `${i.cantidad}x ${i.nombre}`).join(', ') : ''),
        courier: p.courier || null,
        tracking: p.tracking || null,
        tracking_url: p.tracking ? `https://app.bluex.cl/tracking?shipment=${p.tracking}` : null,
        direccion: p.direccion_envio || null,
        timeline,
        mensaje_whatsapp: `📦 *Pedido ${p.numero_pedido}*\n\n` +
          `Estado: ${estadosLegibles[p.estado] || p.estado}\n` +
          `Pago: ${paymentLegibles[p.payment_status] || p.payment_status}\n` +
          `Items: ${p.descripcion_items || 'ver detalle'}\n` +
          `Total: $${(p.total || 0).toLocaleString('es-CL')} CLP\n` +
          (p.tracking ? `\n🚚 Tracking: ${p.tracking}\nRastrea aquí: https://app.bluex.cl/tracking?shipment=${p.tracking}` : '') +
          `\n\n¿Necesitas ayuda con algo más? 🐢`,
      };
    });

    return Response.json({
      encontrado: true,
      count: resultado.length,
      pedidos: resultado,
      mensaje: resultado.length === 1
        ? resultado[0].mensaje_whatsapp
        : `Encontré ${resultado.length} pedidos. El más reciente:\n\n${resultado[0].mensaje_whatsapp}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});