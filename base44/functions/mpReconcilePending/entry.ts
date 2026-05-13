// ============================================================================
// mpReconcilePending — Reconcilia pedidos pending_mp contra la API de MP.
// ----------------------------------------------------------------------------
// Caso de uso: el webhook de MP a veces no llega (red, timeouts, rate limit).
// Resultado: pedidos quedan en payment_status="pending_mp" para siempre aunque
// el cliente SÍ pagó. Este CRON busca esos pedidos y los reconcilia llamando
// directamente a la API de búsqueda de pagos de MP por external_reference.
//
// Acción:
//   - Toma pedidos con payment_status="pending_mp" creados en los últimos 5 días
//     y que tengan mp_preference_id (es decir, llegaron a checkout MP).
//   - Por cada uno, consulta GET /v1/payments/search?external_reference=...
//   - Si encuentra un pago "approved" → actualiza el pedido como si fuera webhook.
//   - Si encuentra "rejected" → marca failed.
//   - Si no hay pago → no toca el pedido (sigue esperando o expirará por CRON).
//
// Pensado para correr cada 30 min. Es idempotente (chequea mp_payment_id).
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MP_SEARCH_API = 'https://api.mercadopago.com/v1/payments/search';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ ok: false, error: 'MP no configurado' }, { status: 500 });
    }

    const hace5d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    // Cargar pendientes recientes con preferencia MP creada
    const todos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 300);
    const pendientes = todos.filter(p =>
      p.payment_status === 'pending_mp' &&
      p.mp_preference_id &&
      !p.mp_payment_id &&
      p.created_date >= hace5d &&
      p.estado === 'Nuevo'
    );

    const stats = {
      revisados: pendientes.length,
      reconciliados_pagados: 0,
      reconciliados_fallidos: 0,
      sin_pago: 0,
      errores: 0,
    };
    const detalle = [];

    for (const pedido of pendientes) {
      try {
        const url = `${MP_SEARCH_API}?external_reference=${encodeURIComponent(pedido.numero_pedido)}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (!res.ok) {
          console.warn('MP search error para', pedido.numero_pedido, data);
          stats.errores++;
          continue;
        }

        const pagos = data.results || [];
        if (pagos.length === 0) {
          stats.sin_pago++;
          continue;
        }

        // Tomamos el pago más relevante: approved > pending > rejected
        const aprobado = pagos.find(p => p.status === 'approved');
        const rechazado = pagos.find(p => ['rejected', 'cancelled', 'charged_back'].includes(p.status));
        const pago = aprobado || rechazado || pagos[0];

        if (!pago) {
          stats.sin_pago++;
          continue;
        }

        if (pago.status === 'approved') {
          await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
            estado: 'Confirmado',
            payment_status: 'paid',
            mp_payment_id: String(pago.id),
            medio_pago: 'MercadoPago',
            notas: `${pedido.notas || ''} | RECONCILED: MP[${pago.id}] approved $${pago.transaction_amount}`.slice(0, 1000),
            historial: [
              ...(pedido.historial || []),
              {
                at: new Date().toISOString(),
                type: 'paid',
                actor: 'mpReconcilePending',
                channel: 'system',
                detail: `Reconciliado automático · webhook nunca llegó · MP ${pago.id}`,
                meta: { mp_payment_id: pago.id, amount: pago.transaction_amount },
              },
            ],
          });
          stats.reconciliados_pagados++;
          detalle.push({ numero: pedido.numero_pedido, accion: 'paid', mp_id: pago.id });
        } else if (['rejected', 'cancelled', 'charged_back'].includes(pago.status)) {
          await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
            payment_status: 'failed',
            mp_payment_id: String(pago.id),
            notas: `${pedido.notas || ''} | RECONCILED: MP[${pago.id}] ${pago.status}`.slice(0, 1000),
            historial: [
              ...(pedido.historial || []),
              {
                at: new Date().toISOString(),
                type: 'status_changed',
                actor: 'mpReconcilePending',
                channel: 'system',
                detail: `Pago rechazado en MP (${pago.status})`,
                meta: { mp_payment_id: pago.id },
              },
            ],
          });
          stats.reconciliados_fallidos++;
          detalle.push({ numero: pedido.numero_pedido, accion: 'failed', mp_id: pago.id });
        } else {
          stats.sin_pago++;
        }
      } catch (e) {
        console.warn('Error reconciliando', pedido.numero_pedido, e.message);
        stats.errores++;
      }
    }

    return Response.json({ ok: true, stats, detalle, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('mpReconcilePending error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});