// ============================================================================
// tbkCreateTransaction — Crea una transacción WebPay Plus (Transbank REST v1.2)
// ----------------------------------------------------------------------------
// Recibe { pedido_id }, crea la transacción en Transbank y devuelve la URL de
// redirección al formulario de pago. El cliente vuelve a /gracias con token_ws
// (éxito/rechazo) o TBK_TOKEN (anulación), donde tbkCommitTransaction confirma.
// Ambiente: si el API Key Id es el código de integración de Transbank
// (59705555…), se usa el host de integración; si no, producción.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { pedido_id } = await req.json();
    if (!pedido_id) return Response.json({ error: 'pedido_id requerido' }, { status: 400 });

    const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id);
    if (!pedido) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });
    if (pedido.payment_status === 'paid') {
      return Response.json({ error: 'El pedido ya está pagado' }, { status: 409 });
    }
    const amount = Math.round(pedido.total || 0);
    if (amount <= 0) return Response.json({ error: 'Monto inválido' }, { status: 400 });

    const keyId = Deno.env.get('TBK_API_KEY_ID') || '';
    const keySecret = Deno.env.get('TBK_API_KEY_SECRET') || '';
    if (!keyId || !keySecret) {
      return Response.json({ error: 'Credenciales Transbank no configuradas' }, { status: 500 });
    }
    const esIntegracion = keyId.startsWith('59705555');
    const host = esIntegracion ? 'https://webpay3gint.transbank.cl' : 'https://webpay3g.transbank.cl';

    const res = await fetch(`${host}/rswebpaytransaction/api/webpay/v1.2/transactions`, {
      method: 'POST',
      headers: {
        'Tbk-Api-Key-Id': keyId,
        'Tbk-Api-Key-Secret': keySecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buy_order: String(pedido.numero_pedido || pedido_id).slice(0, 26),
        session_id: String(pedido_id).slice(0, 61),
        amount,
        return_url: 'https://peyuchile.cl/gracias',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token || !data.url) {
      console.error('Transbank create error:', res.status, JSON.stringify(data));
      return Response.json({ error: data.error_message || 'Transbank no aceptó la transacción', detail: data }, { status: 502 });
    }

    await base44.asServiceRole.entities.PedidoWeb.update(pedido_id, {
      payment_status: 'pending_webpay',
      // Campo dedicado: el token en historial se perdía cuando otro proceso
      // (onNewPedidoWeb) actualizaba historial en paralelo. Este campo es la
      // fuente de verdad para tbkReconcilePending.
      tbk_token: data.token,
      historial: [
        ...(Array.isArray(pedido.historial) ? pedido.historial : []),
        {
          at: new Date().toISOString(),
          type: 'note',
          actor: 'webpay',
          channel: 'system',
          detail: 'Transacción WebPay Plus creada, cliente redirigido a Transbank',
          meta: { token: data.token, ambiente: esIntegracion ? 'integracion' : 'produccion', amount },
        },
      ],
    });

    return Response.json({
      ok: true,
      token: data.token,
      url: data.url,
      redirect_url: `${data.url}?token_ws=${data.token}`,
      ambiente: esIntegracion ? 'integracion' : 'produccion',
    });
  } catch (error) {
    console.error('tbkCreateTransaction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});