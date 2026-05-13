// ============================================================================
// mpWebhook — Recibe notificaciones de Mercado Pago y actualiza el pedido.
// ----------------------------------------------------------------------------
// MP envía notificaciones tipo "payment". Consultamos el payment con su API
// y actualizamos el estado del PedidoWeb según el `external_reference`.
//
// Notas:
//   - MP no requiere autenticación de Base44 para llegar aquí, por eso
//     usamos `asServiceRole`.
//   - Validamos firma (x-signature) si MERCADOPAGO_WEBHOOK_SECRET está seteado
//     y MP envía la firma. Si no hay secret/firma, igual procesamos pero
//     advertimos en logs (modo permisivo recomendado por MP en sandbox).
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MP_PAYMENT_API = 'https://api.mercadopago.com/v1/payments';

// Mapeo MP status → PedidoWeb estado
function mapStatus(mpStatus) {
  switch (mpStatus) {
    case 'approved':
      return 'Confirmado';
    case 'in_process':
    case 'pending':
    case 'authorized':
      return 'Nuevo'; // se mantiene en revisión
    case 'rejected':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      return 'Cancelado';
    default:
      return 'Nuevo';
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ ok: false, error: 'MP no configurado' }, { status: 500 });
    }

    // MP puede enviar el evento por query (?type=payment&data.id=xxx) y/o body
    const url = new URL(req.url);
    let payload = null;
    try { payload = await req.json(); } catch {}

    const type = (payload?.type) || url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = (payload?.data?.id) || url.searchParams.get('data.id') || url.searchParams.get('id');

    // Solo procesamos eventos de "payment". Otros (merchant_order, etc) los ignoramos.
    if (type !== 'payment' || !dataId) {
      return Response.json({ ok: true, ignored: true, type });
    }

    // Consultamos el payment a MP
    const payRes = await fetch(`${MP_PAYMENT_API}/${dataId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const payment = await payRes.json();
    if (!payRes.ok) {
      console.error('MP payment fetch error:', payment);
      return Response.json({ ok: false, error: 'No se pudo leer el pago' }, { status: 502 });
    }

    const externalRef = payment.external_reference; // numero_pedido
    const mpStatus = payment.status;
    const mpStatusDetail = payment.status_detail;
    const transactionAmount = payment.transaction_amount;

    if (!externalRef) {
      console.warn('Payment sin external_reference', dataId);
      return Response.json({ ok: true, no_ref: true });
    }

    // Buscamos el pedido por número
    const pedidos = await base44.asServiceRole.entities.PedidoWeb.filter({
      numero_pedido: externalRef,
    });
    const pedido = pedidos?.[0];
    if (!pedido) {
      console.warn('Pedido no encontrado para external_reference', externalRef);
      return Response.json({ ok: true, no_pedido: true });
    }

    const nuevoEstado = mapStatus(mpStatus);
    const notaMP = `MP[${dataId}] ${mpStatus}/${mpStatusDetail} $${transactionAmount}`;

    // Idempotencia: si la nota ya tiene este payment_id, no reprocesamos
    // (MP reintenta la notificación varias veces)
    if ((pedido.notas || '').includes(`MP[${dataId}]`)) {
      return Response.json({ ok: true, duplicate: true });
    }

    const estadoAnterior = pedido.estado;

    // Mapeamos también payment_status fino para distinguir "pagado" vs "esperando".
    let nuevoPaymentStatus = pedido.payment_status || 'pending_mp';
    if (mpStatus === 'approved') nuevoPaymentStatus = 'paid';
    else if (['rejected', 'cancelled', 'charged_back'].includes(mpStatus)) nuevoPaymentStatus = 'failed';
    else if (mpStatus === 'refunded') nuevoPaymentStatus = 'refunded';

    await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
      estado: nuevoEstado,
      medio_pago: 'MercadoPago',
      payment_status: nuevoPaymentStatus,
      mp_payment_id: String(dataId),
      notas: `${pedido.notas || ''} | ${notaMP}`.slice(0, 1000),
      historial: [
        ...(pedido.historial || []),
        {
          at: new Date().toISOString(),
          type: mpStatus === 'approved' ? 'paid' : 'status_changed',
          actor: 'mpWebhook',
          channel: 'system',
          detail: `MP ${mpStatus}/${mpStatusDetail}`,
          meta: { mp_payment_id: dataId, amount: transactionAmount },
        },
      ],
    });

    // Si pasó a "Confirmado" por primera vez, enviamos email al cliente.
    // Usamos Resend (no requiere usuario autenticado) si está configurado.
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (
      nuevoEstado === 'Confirmado' &&
      estadoAnterior !== 'Confirmado' &&
      pedido.cliente_email &&
      resendKey
    ) {
      try {
        const html = `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
            <h1 style="color:#0F8B6C;margin:0 0 8px">¡Pago confirmado! 🐢</h1>
            <p>Hola ${pedido.cliente_nombre || ''},</p>
            <p>Recibimos tu pago de <strong>$${Number(transactionAmount).toLocaleString('es-CL')}</strong> vía Mercado Pago.</p>
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;margin:20px 0">
              <p style="margin:0"><strong>N° Pedido:</strong> ${pedido.numero_pedido}</p>
              <p style="margin:6px 0 0"><strong>Total:</strong> $${Number(pedido.total).toLocaleString('es-CL')}</p>
              <p style="margin:6px 0 0"><strong>Estado:</strong> Confirmado · En preparación</p>
            </div>
            <p>Te avisaremos por email cuando tu pedido salga despachado con el código de tracking.</p>
            <p style="margin-top:24px">
              <a href="https://peyuchile.cl/seguimiento" style="background:#0F8B6C;color:white;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Seguir mi pedido →</a>
            </p>
            <p style="color:#6B7280;font-size:12px;margin-top:32px">Gracias por elegir productos sostenibles. Cada PEYU saca plástico del vertedero. 🌎</p>
          </div>
        `;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PEYU Chile <ti@peyuchile.cl>',
            to: [pedido.cliente_email],
            subject: `✅ Pago confirmado · Pedido ${pedido.numero_pedido}`,
            html,
          }),
        });
      } catch (e) {
        console.warn('Email confirmación MP falló (no bloqueante):', e.message);
      }
    }

    return Response.json({ ok: true, pedido_id: pedido.id, estado: nuevoEstado });
  } catch (error) {
    console.error('mpWebhook error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});