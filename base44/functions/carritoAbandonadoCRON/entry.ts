import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// CRON: detecta pedidos web "Nuevo" sin actualizar en >2h y envía email de recuperación
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const ahora = new Date();
    const hace2h = new Date(ahora.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const hace72h = new Date(ahora.getTime() - 72 * 60 * 60 * 1000).toISOString();

    // Pedidos en estado Nuevo creados entre 2h y 72h atrás (no muy viejos)
    const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 200);

    const abandonados = pedidos.filter(p => {
      if (p.estado !== 'Nuevo') return false;
      if (!p.cliente_email) return false;
      // 🛡️ NO enviar a pedidos sospechosos (test interno, alto riesgo)
      if (p.payment_status === 'manual_review') return false;
      if ((p.risk_flags || []).includes('email_test_interno')) return false;
      // 🛡️ NO enviar a pedidos que YA se pagaron (paid) ni a los que ya expiraron
      if (p.payment_status === 'paid' || p.payment_status === 'expired') return false;
      // 🛡️ NO reenviar si ya se envió el primer toque en últimas 22h
      const ultimoEnvio = p.recovery_secuencia?.toque_1_enviado_at;
      if (ultimoEnvio && new Date(ultimoEnvio) > new Date(Date.now() - 22 * 60 * 60 * 1000)) return false;
      const creado = new Date(p.created_date);
      return creado < new Date(hace2h) && creado > new Date(hace72h);
    });

    let enviados = 0;

    for (const pedido of abandonados) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: pedido.cliente_email,
          from_name: 'Peyu Chile',
          subject: `🐢 ${pedido.cliente_nombre?.split(' ')[0] || 'Hola'}, tu pedido Peyu te espera`,
          body: `
Hola ${pedido.cliente_nombre?.split(' ')[0] || 'cliente'},

Vimos que hiciste un pedido en Peyu y queremos asegurarnos de que todo esté bien.

📦 Pedido N°: ${pedido.numero_pedido}
💰 Total: $${(pedido.total || 0).toLocaleString('es-CL')} CLP
📅 Fecha: ${pedido.fecha || ''}

Si tienes alguna pregunta sobre tu pedido o necesitas cambiar algo, estamos aquí para ayudarte:

💬 WhatsApp: +56 9 3504 0242
📧 ventas@peyuchile.cl
🌐 peyuchile.cl

Nuestros productos tienen garantía de 10 años y están fabricados 100% con plástico reciclado en Chile.

¿Tienes plástico para reciclar en tu empresa? 🔄 También fabricamos regalos corporativos personalizados — contáctanos para una cotización sin costo.

Gracias por elegir Peyu 🐢♻️
          `.trim(),
        });

        // Marcar como contactado para no re-enviar
        await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
          notas: `${pedido.notas || ''} | Recovery email enviado: ${ahora.toISOString()}`,
        });

        enviados++;
      } catch (e) {
        console.warn(`Error enviando email a ${pedido.cliente_email}:`, e.message);
      }
    }

    return Response.json({
      ok: true,
      pedidos_revisados: pedidos.length,
      abandonados_encontrados: abandonados.length,
      emails_enviados: enviados,
      timestamp: ahora.toISOString(),
    });
  } catch (error) {
    console.error('carritoAbandonadoCRON error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});