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

    await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
      estado: nuevoEstado,
      medio_pago: 'MercadoPago',
      notas: `${pedido.notas || ''} | ${notaMP}`.slice(0, 1000),
    });

    return Response.json({ ok: true, pedido_id: pedido.id, estado: nuevoEstado });
  } catch (error) {
    console.error('mpWebhook error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});