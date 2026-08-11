// ============================================================================
// recuperarPagoWhatsAppCRON — Recuperación de pagos abandonados por WhatsApp
// ----------------------------------------------------------------------------
// Cada hora busca pedidos B2C que quedaron sin pagar y envía UN mensaje
// amistoso por WhatsApp ofreciendo ayuda para completar la compra.
//
// Reglas:
//   • Solo pedidos "Nuevo" sin pago confirmado, con teléfono válido chileno
//   • Ventana: entre 2 y 26 horas desde que se creó el pedido
//   • Un solo mensaje por pedido (flag whatsapp_enviado_at en recovery_secuencia)
//   • Excluye B2B y pedidos marcados como test/spam
//   • No incluye descuentos: el cupón lo maneja la secuencia de email
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enviarTextoCloud, cloudConfigurado } from '../../shared/whatsapp-cloud.ts';
import { normalizarTelefono, horasDesde, primerNombre } from '../../shared/telefono-cl.ts';

const H_MIN = 2, H_MAX = 26;

function construirMensaje(pedido) {
  const nombre = primerNombre(pedido.cliente_nombre);
  const total = Number(pedido.total || 0).toLocaleString('es-CL');
  const link = `https://peyuchile.cl/seguimiento?pedido=${encodeURIComponent(pedido.numero_pedido || '')}`;
  return (
    `*${nombre}, tu pedido quedó a un paso* 🐢\n\n` +
    `• Pedido ${pedido.numero_pedido} · $${total} CLP\n` +
    `• Lo dejamos guardado por si quieres completarlo\n` +
    `• ¿Tuviste algún problema con el pago? Te ayudo por acá\n\n` +
    link
  );
}

Deno.serve(async (req) => {
  try {
    if (!cloudConfigurado()) {
      return Response.json({ ok: false, error: 'WhatsApp Cloud API no configurado' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const ahora = Date.now();
    const horas = (d) => horasDesde(d, ahora);

    const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 300);

    const elegibles = pedidos.filter((p) => {
      if (p.estado !== 'Nuevo') return false;
      if (p.tipo_cliente && p.tipo_cliente !== 'B2C Individual') return false;
      if (['paid', 'expired', 'manual_review', 'failed', 'refunded'].includes(p.payment_status)) return false;
      const flags = p.risk_flags || [];
      if (flags.includes('email_test_interno') || flags.includes('telefono_spammer') || flags.includes('nombre_test')) return false;
      if (p.recovery_secuencia?.whatsapp_enviado_at) return false;
      if (!normalizarTelefono(p.cliente_telefono)) return false;
      const h = horas(p.created_date);
      return h >= H_MIN && h <= H_MAX;
    });

    const stats = { revisados: pedidos.length, elegibles: elegibles.length, enviados: 0, errores: 0 };

    for (const pedido of elegibles) {
      const telefono = normalizarTelefono(pedido.cliente_telefono);
      const envio = await enviarTextoCloud(telefono, construirMensaje(pedido));

      if (!envio.ok) {
        console.warn(`WhatsApp recovery falló ${pedido.numero_pedido}:`, JSON.stringify(envio.data));
        stats.errores++;
        continue;
      }

      await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
        recovery_secuencia: {
          ...(pedido.recovery_secuencia || {}),
          whatsapp_enviado_at: new Date(ahora).toISOString(),
        },
        historial: [
          ...(pedido.historial || []),
          {
            at: new Date(ahora).toISOString(),
            type: 'recovery_sent',
            actor: 'recuperarPagoWhatsAppCRON',
            channel: 'whatsapp',
            detail: 'Recordatorio de pago abandonado enviado por WhatsApp',
            meta: { telefono },
          },
        ],
      });
      stats.enviados++;
    }

    return Response.json({ ok: true, stats, timestamp: new Date(ahora).toISOString() });
  } catch (error) {
    console.error('recuperarPagoWhatsAppCRON error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});