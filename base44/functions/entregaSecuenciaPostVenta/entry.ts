import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// entregaSecuenciaPostVenta · Orquestador de la secuencia POST-ENTREGA.
// ----------------------------------------------------------------------------
// Se dispara cuando BlueExpress reporta un pedido como "Entregado" (vía
// bluexTrackingPush en tiempo real, o el poller CRON). Convierte el evento de
// entrega en una cascada de inteligencia de negocio:
//   1. Marca el PedidoWeb como "Entregado" (idempotente).
//   2. Registra el evento de entrega en el historial[] del pedido.
//   3. Envía email inmediato de "¡llegó!" + solicitud de reseña con cupón.
//   4. Deja marcas en notas[] para que los CRON de cross-sell / recompra /
//      reseña tardía NO se pisen ni dupliquen.
//
// Idempotencia: usa el flag email_entrega_enviado del PedidoWeb. Si ya está
// en true, no reenvía nada. Cada paso es independiente y best-effort.
//
// Payload: { pedido_id } o { numero_pedido } o { envio_id }
// ============================================================================

function buildEntregaEmail(pedido) {
  const nombre = (pedido.cliente_nombre || '').split(' ')[0] || 'Hola';
  const reviewUrl = `https://peyuchile.cl/seguimiento?pedido=${encodeURIComponent(pedido.numero_pedido || pedido.id)}&review=1`;
  return `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F8B6C,#06947A);padding:32px 28px;text-align:center">
    <div style="font-size:48px;line-height:1;margin-bottom:8px">🎉</div>
    <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0">¡Tu pedido llegó, ${nombre}!</h1>
    <p style="margin:8px 0 0;color:#A7D9C9;font-size:13px;font-weight:600">PEDIDO ${pedido.numero_pedido || ''}</p>
  </div>
  <div style="padding:28px;color:#4B4F54;font-size:14px;line-height:1.7">
    <p style="margin:0 0 16px">BlueExpress nos confirmó que tu pedido fue entregado. Esperamos que te encante 💚</p>
    <p style="margin:0 0 22px">Cada producto PEYU es plástico que rescatamos y volvió a nacer. Si tienes 1 minuto, <strong>cuéntanos qué te pareció</strong> — y de regalo te dejamos un cupón <strong style="color:#0F8B6C">10% OFF</strong> para tu próxima compra.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${reviewUrl}" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px">Calificar mi pedido ⭐ →</a>
    </div>
    <div style="background:#f0faf7;border-radius:10px;padding:14px;margin:20px 0;text-align:center">
      <p style="margin:0;font-size:11px;color:#006D5B;font-weight:700;letter-spacing:1px">CUPÓN POST-ENTREGA</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0F8B6C;font-family:monospace">GRACIAS10</p>
      <p style="margin:6px 0 0;font-size:11px;color:#4B4F54">Válido 30 días · Mínimo $20.000</p>
    </div>
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
    <p style="margin:0;color:#6b7280;font-size:11px;text-align:center">Peyu Chile SPA · Plástico que renace 🐢 · ventas@peyuchile.cl</p>
  </div>
</div></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Auth: llamadas internas (bluexTrackingPush, poller) pasan internal:true vía
    // service role. Llamadas manuales desde el admin exigen rol admin.
    const body = await req.json().catch(() => ({}));
    if (!body.internal) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Resolver el pedido
    let pedido = null;
    if (body.pedido_id) {
      pedido = await sr.entities.PedidoWeb.get(body.pedido_id).catch(() => null);
    } else if (body.numero_pedido) {
      const list = await sr.entities.PedidoWeb.filter({ numero_pedido: String(body.numero_pedido) }, undefined, 1);
      pedido = list?.[0] || null;
    } else if (body.envio_id) {
      const envio = await sr.entities.Envio.get(body.envio_id).catch(() => null);
      if (envio?.pedido_id) pedido = await sr.entities.PedidoWeb.get(envio.pedido_id).catch(() => null);
    }
    if (!pedido) return Response.json({ ok: false, error: 'Pedido no encontrado' });

    const acciones = [];
    const ahora = new Date().toISOString();

    // 1) Marcar Entregado + registrar evento en historial (idempotente)
    const update = {};
    if (pedido.estado !== 'Entregado') update.estado = 'Entregado';

    const historial = Array.isArray(pedido.historial) ? [...pedido.historial] : [];
    const yaRegistrado = historial.some(h => h.type === 'delivered');
    if (!yaRegistrado) {
      historial.push({
        at: ahora,
        type: 'delivered',
        actor: 'BlueExpress',
        channel: 'system',
        detail: 'Entrega confirmada por el courier · secuencia post-venta activada',
      });
      update.historial = historial;
      acciones.push('marcado_entregado');
    }

    // 2) Email de entrega + reseña inmediata (idempotente por flag)
    let emailEnviado = false;
    if (!pedido.email_entrega_enviado && pedido.cliente_email) {
      try {
        await sr.integrations.Core.SendEmail({
          to: pedido.cliente_email,
          from_name: 'PEYU Chile',
          subject: `🎉 ¡Tu pedido ${pedido.numero_pedido || ''} llegó! · 10% OFF de regalo`,
          body: buildEntregaEmail(pedido),
        });
        update.email_entrega_enviado = true;
        update.email_entrega_enviado_at = ahora;
        historial.push({ at: ahora, type: 'email_sent', actor: 'sistema', channel: 'email', detail: 'Email de entrega + solicitud de reseña enviado' });
        update.historial = historial;
        emailEnviado = true;
        acciones.push('email_entrega');
      } catch (e) {
        acciones.push(`email_entrega_error: ${e.message}`);
      }
    }

    if (Object.keys(update).length > 0) {
      await sr.entities.PedidoWeb.update(pedido.id, update);
    }

    return Response.json({
      ok: true,
      pedido_id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      email_enviado: emailEnviado,
      acciones,
    });
  } catch (error) {
    console.error('[entregaSecuenciaPostVenta]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});