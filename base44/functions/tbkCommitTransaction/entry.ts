// ============================================================================
// tbkCommitTransaction — Confirma (commit) una transacción WebPay Plus
// ----------------------------------------------------------------------------
// Llamada desde /gracias cuando Transbank devuelve al cliente con token_ws.
// El PUT de commit ES la validación de autenticidad: solo un token real emitido
// por Transbank puede confirmarse.
//
// Blindaje (22-jul):
//   - Si el PUT falla (ej: el cliente refrescó /gracias y el token ya fue
//     confirmado), hacemos GET status con el mismo token: si el pago está
//     AUTHORIZED lo tratamos como aprobado en vez de mostrar "rechazado".
//   - Si el pedido ya está pagado, respondemos approved de inmediato.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { tbkCommit, tbkGetStatus, esAprobado, marcarPagadoWebPay, marcarFallidoWebPay } from '../../shared/webpay.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token_ws } = await req.json();
    if (!token_ws || !/^[a-zA-Z0-9]+$/.test(token_ws)) {
      return Response.json({ error: 'token_ws requerido' }, { status: 400 });
    }

    // 1) Intentar el commit. 2) Si falla, GET status (token ya confirmado /
    //    refresh de la página) para no perder pagos reales.
    let result = await tbkCommit(token_ws);
    let via = 'commit';
    if (!result.ok) {
      console.warn('Commit falló, verificando con GET status:', result.status, JSON.stringify(result.data));
      const statusRes = await tbkGetStatus(token_ws);
      if (statusRes.ok) {
        result = statusRes;
        via = 'status';
      } else {
        console.error('Transbank commit+status error:', result.status, JSON.stringify(result.data));
        return Response.json({
          ok: false,
          approved: false,
          unconfirmed: true,
          error: result.data?.error_message || 'No se pudo confirmar el pago con Transbank',
        }, { status: 502 });
      }
    }

    const data = result.data;
    const approved = esAprobado(data);
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
      if (approved) {
        await marcarPagadoWebPay(base44, pedido, data, `webpay:${via}`);
      } else {
        await marcarFallidoWebPay(base44, pedido, data, `webpay:${via}`);
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
      // Voucher exigido por Transbank en la página de resultado (requisito de
      // la validación oficial): autorización, tarjeta, tipo de pago y fecha.
      voucher: approved ? {
        authorization_code: data.authorization_code || '',
        card_number: data.card_detail?.card_number || '',
        payment_type_code: data.payment_type_code || '',
        installments_number: data.installments_number || 0,
        transaction_date: data.transaction_date || '',
        buy_order: buyOrder,
        amount: data.amount || 0,
      } : null,
    });
  } catch (error) {
    console.error('tbkCommitTransaction error:', error);
    return Response.json({ ok: false, approved: false, unconfirmed: true, error: error.message }, { status: 500 });
  }
});