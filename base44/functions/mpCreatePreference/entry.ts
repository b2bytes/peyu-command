// ============================================================================
// mpCreatePreference — Crea una preferencia de pago en Mercado Pago.
// ----------------------------------------------------------------------------
// Recibe:
//   - pedido_id (id de PedidoWeb ya creado en estado "Nuevo")
// Devuelve:
//   - { init_point, sandbox_init_point, preference_id }
// El frontend redirige al `init_point` para completar el pago.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MP_API = 'https://api.mercadopago.com/checkout/preferences';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null); // checkout es público (B2C)

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'MERCADOPAGO_ACCESS_TOKEN no configurado' }, { status: 500 });
    }

    const { pedido_id } = await req.json();
    if (!pedido_id) {
      return Response.json({ error: 'pedido_id requerido' }, { status: 400 });
    }

    // Cargamos el pedido como service role (el checkout puede ser anónimo).
    const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id);
    if (!pedido) {
      return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (pedido.total <= 0) {
      return Response.json({ error: 'Total inválido' }, { status: 400 });
    }

    // Origin para construir URLs de retorno y webhook.
    const origin = req.headers.get('origin') || 'https://peyuchile.cl';

    // Construimos el item agregado (MP soporta múltiples pero para simplificar
    // y asegurar consistencia con el total registrado, mandamos uno solo).
    const items = [{
      id: pedido.numero_pedido,
      title: `PEYU Chile · Pedido ${pedido.numero_pedido}`,
      description: (pedido.descripcion_items || '').slice(0, 250),
      quantity: 1,
      currency_id: 'CLP',
      unit_price: Math.round(pedido.total),
    }];

    const preference = {
      items,
      external_reference: pedido.numero_pedido, // clave para reconciliar
      metadata: {
        pedido_id: pedido.id,
        numero_pedido: pedido.numero_pedido,
      },
      payer: {
        name: pedido.cliente_nombre || '',
        email: pedido.cliente_email || '',
        phone: pedido.cliente_telefono ? { number: pedido.cliente_telefono } : undefined,
      },
      back_urls: {
        success: `${origin}/gracias?numero=${encodeURIComponent(pedido.numero_pedido)}&email=${encodeURIComponent(pedido.cliente_email || '')}&total=${pedido.total}&mp=success`,
        pending: `${origin}/gracias?numero=${encodeURIComponent(pedido.numero_pedido)}&email=${encodeURIComponent(pedido.cliente_email || '')}&total=${pedido.total}&mp=pending`,
        failure: `${origin}/cart?mp=failure&numero=${encodeURIComponent(pedido.numero_pedido)}`,
      },
      auto_return: 'approved',
      notification_url: `https://app.base44.com/api/apps/${Deno.env.get('BASE44_APP_ID')}/functions/mpWebhook`,
      statement_descriptor: 'PEYU CHILE',
      binary_mode: false, // permite estados pendientes (transferencia/efectivo)
    };

    const res = await fetch(MP_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('MP preference error:', data);
      return Response.json({ error: 'Error MP', details: data }, { status: 500 });
    }

    // Guardamos referencia en el pedido para auditoría + expiración a 5 días.
    try {
      const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
        mp_preference_id: data.id,
        payment_status: pedido.payment_status === 'manual_review' ? 'manual_review' : 'pending_mp',
        expires_at: expiresAt,
        notas: `${pedido.notas || ''} | MP_PREF:${data.id}`.slice(0, 1000),
      });
    } catch {}

    return Response.json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      preference_id: data.id,
    });
  } catch (error) {
    console.error('mpCreatePreference error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});