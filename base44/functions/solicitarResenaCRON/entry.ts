import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * CRON diario 11:00 — Solicita reseña a clientes 7 días después de "Entregado".
 * Email con link al formulario de reseña + descuento de gracias por feedback.
 *
 * Regla: PedidoWeb en estado "Entregado" cuyo updated_date sea hace 6-9 días
 * y que aún no tenga calificacion_cliente registrada ni reseña asociada.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isCron = !user;
    if (!isCron && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ahora = new Date();
    const hace6dias = new Date(ahora.getTime() - 6 * 24 * 60 * 60 * 1000);
    const hace9dias = new Date(ahora.getTime() - 9 * 24 * 60 * 60 * 1000);

    const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-updated_date', 200);
    const reseñasExistentes = await base44.asServiceRole.entities.ResenaPedido.list(null, 500);
    const pedidosConResena = new Set(reseñasExistentes.map(r => r.pedido_id));

    const elegibles = pedidos.filter(p => {
      if (p.estado !== 'Entregado') return false;
      if (!p.cliente_email) return false;
      if (p.calificacion_cliente) return false;
      if (pedidosConResena.has(p.id)) return false;
      const updated = new Date(p.updated_date || p.created_date);
      return updated >= hace9dias && updated <= hace6dias;
    });

    let enviados = 0;
    let errores = 0;

    for (const pedido of elegibles) {
      try {
        const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px;background:#F7F7F5">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F8B6C,#006D5B);padding:28px">
    <p style="color:#A7D9C9;font-size:11px;margin:0 0 4px;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">¿Cómo estuvo tu experiencia, ${pedido.cliente_nombre || ''}? 🌱</h1>
  </div>
  <div style="padding:28px;color:#4B4F54;font-size:14px;line-height:1.7">
    <p style="margin:0 0 16px">Esperamos que ya estés disfrutando tu pedido <strong>${pedido.numero_pedido || ''}</strong>. Como empresa pequeña que fabrica en Chile, tu opinión nos ayuda a mejorar mucho más que cualquier review en internet.</p>
    <p style="margin:0 0 24px"><strong>Te toma 1 minuto</strong> y como agradecimiento te regalamos un cupón <strong style="color:#0F8B6C">10% OFF</strong> para tu próxima compra.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://peyuchile.cl/seguimiento?pedido=${encodeURIComponent(pedido.numero_pedido || pedido.id)}#resena"
         style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px">
        Dejar mi reseña ⭐ →
      </a>
    </div>
    <div style="background:#f0faf7;border-radius:10px;padding:14px;margin:20px 0;text-align:center">
      <p style="margin:0;font-size:12px;color:#006D5B;font-weight:700">CUPÓN POST-RESEÑA</p>
      <p style="margin:6px 0 0;font-size:24px;font-weight:900;color:#0F8B6C;font-family:monospace">GRACIAS10</p>
      <p style="margin:6px 0 0;font-size:11px;color:#4B4F54">Válido 30 días · Mínimo $20.000</p>
    </div>
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
    <p style="margin:0;color:#6b7280;font-size:11px;text-align:center">Peyu Chile SPA · ventas@peyuchile.cl · +56 9 7707 6280</p>
  </div>
</div></body></html>`;

        await base44.integrations.Core.SendEmail({
          from_name: 'Peyu Chile',
          to: pedido.cliente_email,
          subject: `${pedido.cliente_nombre || 'Hola'}, ¿cómo te llegó tu PEYU? · 10% OFF de regalo`,
          body: html,
        });

        // Marcar para no reenviar
        await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
          notas: `${pedido.notas || ''}\n[RESENA_REQUEST] enviado ${ahora.toISOString().split('T')[0]}`.trim(),
        });

        enviados++;
      } catch (e) {
        console.error(`Error pedido ${pedido.numero_pedido}:`, e.message);
        errores++;
      }
    }

    return Response.json({
      ok: true,
      total_pedidos_revisados: pedidos.length,
      elegibles: elegibles.length,
      enviados,
      errores,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});