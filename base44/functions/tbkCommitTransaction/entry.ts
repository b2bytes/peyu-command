// ============================================================================
// tbkCommitTransaction — Confirma (commit) una transacción WebPay Plus
// ----------------------------------------------------------------------------
// Llamada desde /gracias cuando Transbank devuelve al cliente con token_ws.
// El PUT de commit contra Transbank ES la validación de autenticidad: solo un
// token real emitido por Transbank puede confirmarse. Si el pago fue aprobado
// (status AUTHORIZED + response_code 0) marca el pedido como pagado/Confirmado
// y dispara el comprobante al cliente.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token_ws } = await req.json();
    if (!token_ws || !/^[a-zA-Z0-9]+$/.test(token_ws)) {
      return Response.json({ error: 'token_ws requerido' }, { status: 400 });
    }

    const keyId = Deno.env.get('TBK_API_KEY_ID') || '';
    const keySecret = Deno.env.get('TBK_API_KEY_SECRET') || '';
    const esIntegracion = keyId.startsWith('59705555');
    const host = esIntegracion ? 'https://webpay3gint.transbank.cl' : 'https://webpay3g.transbank.cl';

    const res = await fetch(`${host}/rswebpaytransaction/api/webpay/v1.2/transactions/${token_ws}`, {
      method: 'PUT',
      headers: {
        'Tbk-Api-Key-Id': keyId,
        'Tbk-Api-Key-Secret': keySecret,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Transbank commit error:', res.status, JSON.stringify(data));
      return Response.json({ ok: false, approved: false, error: data.error_message || 'No se pudo confirmar el pago' }, { status: 502 });
    }

    const approved = data.status === 'AUTHORIZED' && data.response_code === 0;
    const buyOrder = data.buy_order || '';

    // session_id lleva el id del pedido; buy_order lleva el numero_pedido.
    let pedido = null;
    if (data.session_id) {
      pedido = await base44.asServiceRole.entities.PedidoWeb.get(data.session_id).catch(() => null);
    }
    if (!pedido && buyOrder) {
      const found = await base44.asServiceRole.entities.PedidoWeb.filter({ numero_pedido: buyOrder });
      pedido = found?.[0] || null;
    }

    if (pedido) {
      if (approved && pedido.payment_status !== 'paid') {
        await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
          estado: pedido.estado === 'Nuevo' ? 'Confirmado' : pedido.estado,
          payment_status: 'paid',
          medio_pago: 'WebPay',
          historial: [
            ...(Array.isArray(pedido.historial) ? pedido.historial : []),
            {
              at: new Date().toISOString(),
              type: 'paid',
              actor: 'webpay',
              channel: 'system',
              detail: `Pago WebPay aprobado · auth ${data.authorization_code || ''} · ${data.payment_type_code || ''} ${data.card_detail?.card_number ? '**** ' + data.card_detail.card_number : ''}`.trim(),
              meta: { authorization_code: data.authorization_code, amount: data.amount, transaction_date: data.transaction_date },
            },
          ],
        });
        // Comprobante al cliente (idempotente vía flag comprobante_enviado). Best-effort.
        if (!pedido.comprobante_enviado) {
          try {
            await base44.asServiceRole.functions.invoke('enviarComprobantePedido', { pedido_id: pedido.id });
          } catch (e) {
            console.warn('No se pudo enviar comprobante:', e.message);
          }
        }
      } else if (!approved && pedido.payment_status !== 'paid') {
        await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
          payment_status: 'failed',
          historial: [
            ...(Array.isArray(pedido.historial) ? pedido.historial : []),
            {
              at: new Date().toISOString(),
              type: 'note',
              actor: 'webpay',
              channel: 'system',
              detail: `Pago WebPay rechazado · status ${data.status} · response_code ${data.response_code}`,
            },
          ],
        });
      }
    }

    return Response.json({
      ok: true,
      approved,
      status: data.status,
      response_code: data.response_code,
      numero: pedido?.numero_pedido || buyOrder,
      email: pedido?.cliente_email || '',
      total: data.amount || pedido?.total || 0,
    });
  } catch (error) {
    console.error('tbkCommitTransaction error:', error);
    return Response.json({ ok: false, approved: false, error: error.message }, { status: 500 });
  }
});