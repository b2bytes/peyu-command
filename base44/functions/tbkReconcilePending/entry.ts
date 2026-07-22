// ============================================================================
// tbkReconcilePending — Reconcilia pedidos pending_webpay contra Transbank.
// ----------------------------------------------------------------------------
// Caso real (22-jul): si el cliente paga en WebPay pero nunca vuelve a
// /gracias (cierra el navegador, se corta la red), el commit no ocurre y el
// pedido queda "pending_webpay" para siempre — sin comprobante y sin que el
// equipo sepa si hubo cobro.
//
// Este CRON toma los pedidos WebPay pendientes de los últimos 5 días, recupera
// el token de la transacción (guardado en el historial por tbkCreateTransaction)
// y consulta GET /transactions/{token}:
//   - AUTHORIZED + response_code 0 → pagado (Confirmado + comprobante).
//   - FAILED / REVERSED / NULLIFIED → payment_status "failed".
//   - INITIALIZED (nunca pagó) → se deja pendiente (el checkout lo reutiliza).
// Idempotente: nunca toca pedidos ya pagados/fallidos. Corre cada 30 min.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { tbkGetStatus, esAprobado, esFallido, tokenDePedido, marcarPagadoWebPay, marcarFallidoWebPay } from '../../shared/webpay.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!Deno.env.get('TBK_API_KEY_ID')) {
      return Response.json({ ok: false, error: 'Transbank no configurado' }, { status: 500 });
    }

    const hace5d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const todos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 300);
    const pendientes = todos.filter(p =>
      p.payment_status === 'pending_webpay' &&
      p.medio_pago === 'WebPay' &&
      p.created_date >= hace5d &&
      !['Cancelado', 'Reembolsado'].includes(p.estado)
    );

    const stats = { revisados: pendientes.length, pagados: 0, fallidos: 0, sin_pago: 0, sin_token: 0, errores: 0 };
    const detalle = [];

    for (const pedido of pendientes) {
      try {
        const token = tokenDePedido(pedido);
        if (!token) { stats.sin_token++; continue; }

        const res = await tbkGetStatus(token);
        if (!res.ok) {
          // Token expirado/abortado sin pago: Transbank responde error. No es
          // un problema — el pedido sigue pendiente hasta expirar por CRON.
          stats.sin_pago++;
          continue;
        }

        const data = res.data;
        if (esAprobado(data)) {
          await marcarPagadoWebPay(base44, pedido, data, 'tbkReconcilePending');
          stats.pagados++;
          detalle.push({ numero: pedido.numero_pedido, accion: 'paid', auth: data.authorization_code });
        } else if (esFallido(data)) {
          await marcarFallidoWebPay(base44, pedido, data, 'tbkReconcilePending');
          stats.fallidos++;
          detalle.push({ numero: pedido.numero_pedido, accion: 'failed', status: data.status });
        } else {
          // INITIALIZED u otro estado intermedio → sigue esperando.
          stats.sin_pago++;
        }
      } catch (e) {
        console.warn('Error reconciliando', pedido.numero_pedido, e.message);
        stats.errores++;
      }
    }

    return Response.json({ ok: true, stats, detalle, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('tbkReconcilePending error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});