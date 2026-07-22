// ============================================================================
// retomarPedidoPendiente — Reutiliza un pedido pendiente en un reintento de pago.
// ----------------------------------------------------------------------------
// Problema real (22-jul): cada clic en "Pagar" del checkout creaba un PedidoWeb
// NUEVO. Si el pago WebPay/MP fallaba y el cliente reintentaba, se generaban
// pedidos duplicados (3 pedidos + 3 correos + stock descontado 3 veces).
//
// El checkout guarda {id, numero, firma} del pedido pendiente en localStorage.
// En el reintento llama aquí: verificamos que el pedido siga pendiente, que el
// email y el total coincidan, y actualizamos el medio de pago elegido. El
// frontend entonces redirige a MP/WebPay con el MISMO pedido.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const PS_POR_MEDIO = {
  MercadoPago: 'pending_mp',
  WebPay: 'pending_webpay',
  Transferencia: 'pending_transfer',
  GiftCard: 'paid',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { pedido_id, email, medio_pago, total } = await req.json();
    if (!pedido_id || !email || !medio_pago) {
      return Response.json({ ok: false, error: 'Parámetros incompletos' }, { status: 400 });
    }

    const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id).catch(() => null);
    if (!pedido) return Response.json({ ok: false, error: 'Pedido no encontrado' }, { status: 404 });

    // Solo se puede retomar un pedido que sigue esperando pago, del mismo
    // cliente y por el mismo monto. Cualquier otra cosa → pedido nuevo.
    const pendiente = pedido.estado === 'Nuevo' &&
      String(pedido.payment_status || '').startsWith('pending');
    const mismoCliente = String(pedido.cliente_email || '').toLowerCase() === String(email).toLowerCase();
    const mismoTotal = Math.round(pedido.total || 0) === Math.round(Number(total) || 0);

    if (!pendiente || !mismoCliente || !mismoTotal) {
      return Response.json({ ok: false, reason: !pendiente ? 'no_pendiente' : !mismoCliente ? 'email_distinto' : 'total_distinto' });
    }

    await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
      medio_pago: medio_pago,
      payment_status: PS_POR_MEDIO[medio_pago] || 'pending_mp',
      historial: [
        ...(Array.isArray(pedido.historial) ? pedido.historial : []),
        {
          at: new Date().toISOString(),
          type: 'note',
          actor: 'checkout',
          channel: 'web',
          detail: `Reintento de pago del cliente · medio: ${medio_pago} · se reutiliza el pedido (sin duplicar)`,
        },
      ],
    });

    return Response.json({ ok: true, numero: pedido.numero_pedido, pedido_id: pedido.id });
  } catch (error) {
    console.error('retomarPedidoPendiente error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});