import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Cambia el estado de un PedidoWeb y envía email automático al cliente.
 * Soporta: Confirmado, En Producción, Listo para Despacho, Despachado, Entregado.
 *
 * Payload: { pedido_id, nuevo_estado, tracking?, courier? }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { pedido_id, nuevo_estado, tracking, courier } = await req.json();
    if (!pedido_id || !nuevo_estado) {
      return Response.json({ error: 'pedido_id y nuevo_estado son requeridos' }, { status: 400 });
    }

    const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id);
    if (!pedido) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });

    const updates = { estado: nuevo_estado };
    if (tracking) updates.tracking = tracking;
    if (courier) updates.courier = courier;
    await base44.asServiceRole.entities.PedidoWeb.update(pedido_id, updates);

    // Plantillas de email por estado
    const templates = {
      'Confirmado': {
        subject: `✅ Pedido ${pedido.numero_pedido} confirmado — ya lo estamos preparando`,
        body: (p) => `Hola ${p.cliente_nombre},\n\n¡Confirmamos tu pedido ${p.numero_pedido}! 🎉\n\nYa comenzamos a prepararlo en nuestro taller de Providencia.\n\nTe avisaremos cuando esté listo para despacho.\n\n—Equipo Peyu 🐢`,
      },
      'En Producción': {
        subject: `🏭 Pedido ${pedido.numero_pedido} en producción`,
        body: (p) => `Hola ${p.cliente_nombre},\n\nTu pedido ${p.numero_pedido} está en producción 🔨\n\n${p.requiere_personalizacion ? 'Incluye personalización láser UV — este proceso toma 1-2 días hábiles adicionales.\n\n' : ''}Te avisaremos apenas esté listo para despachar.\n\n—Equipo Peyu 🐢`,
      },
      'Listo para Despacho': {
        subject: `📦 Pedido ${pedido.numero_pedido} listo para despacho`,
        body: (p) => `Hola ${p.cliente_nombre},\n\n¡Tu pedido ${p.numero_pedido} ya está listo! 📦\n\nSale despachado hoy o mañana vía ${p.courier || 'courier'}.\n\nTe enviaremos el número de seguimiento apenas lo entreguemos al transportista.\n\n—Equipo Peyu 🐢`,
      },
      'Despachado': {
        subject: `🚚 Pedido ${pedido.numero_pedido} despachado — ¡viene en camino!`,
        body: (p) => `Hola ${p.cliente_nombre},\n\n¡Tu pedido ${p.numero_pedido} ya viaja hacia ti! 🚚\n\n${tracking ? `📍 Número de seguimiento: ${tracking}\n` : ''}${courier ? `🏢 Courier: ${courier}\n` : ''}\nTiempo estimado de entrega: 2-5 días hábiles.\n\n${tracking && courier ? `Rastrea tu envío:\n${getTrackingUrl(courier, tracking)}\n\n` : ''}—Equipo Peyu 🐢`,
      },
      'Entregado': {
        subject: `🎉 Pedido ${pedido.numero_pedido} entregado — ¡gracias!`,
        body: (p) => `Hola ${p.cliente_nombre},\n\n¡Tu pedido ${p.numero_pedido} fue entregado! 🎁\n\nEsperamos que te encante.\n\n¿Nos ayudas con una review? Responde este email con tu experiencia.\n\nSi necesitas cualquier cosa: WhatsApp +56 9 3504 0242.\n\nGracias por elegir plástico reciclado chileno 🇨🇱♻️\n\n—Equipo Peyu 🐢`,
      },
    };

    const tpl = templates[nuevo_estado];
    if (tpl && pedido.cliente_email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: pedido.cliente_email,
        from_name: 'Peyu Chile',
        subject: tpl.subject,
        body: tpl.body({ ...pedido, ...updates }),
      });
    }

    return Response.json({ ok: true, estado: nuevo_estado, email_enviado: !!tpl });
  } catch (error) {
    console.error('updateShippingStatus error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getTrackingUrl(courier, tracking) {
  const map = {
    'Starken': `https://www.starken.cl/seguimiento?codigo=${tracking}`,
    'Chilexpress': `https://www.chilexpress.cl/Seguimiento?numero=${tracking}`,
    'BlueExpress': `https://www.blue.cl/seguimiento?n=${tracking}`,
    'Correos Chile': `https://www.correos.cl/seguimiento?n=${tracking}`,
  };
  return map[courier] || `https://peyuchile.cl/seguimiento?t=${tracking}`;
}