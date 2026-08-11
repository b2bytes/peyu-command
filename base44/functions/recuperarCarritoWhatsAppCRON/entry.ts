// ============================================================================
// recuperarCarritoWhatsAppCRON — Recordatorio de carrito pendiente por WhatsApp
// ----------------------------------------------------------------------------
// Cada hora busca carritos abandonados (CarritoAbandonado) con teléfono y les
// envía UN mensaje amistoso con el detalle de sus productos y un link directo
// al carrito para retomar la compra.
//
// Reglas:
//   • Ventana: entre 1 y 24 horas desde captured_at
//   • Estados válidos: Pendiente o Recordatorio Enviado (email ya enviado)
//   • Un solo WhatsApp por carrito (whatsapp_enviado_at)
//   • Si el cliente ya compró después de captured_at, se marca Convertido
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enviarTextoCloud, cloudConfigurado } from '../../shared/whatsapp-cloud.ts';
import { normalizarTelefono, horasDesde, primerNombre } from '../../shared/telefono-cl.ts';

const H_MIN = 1, H_MAX = 24;
const LINK_CARRITO = 'https://peyuchile.cl/CarritoNuevo';

function construirMensaje(carrito) {
  const nombre = primerNombre(carrito.nombre);
  const items = (carrito.carrito_items || []).slice(0, 3);
  const detalle = items.map((i) => `• ${i.nombre} x${i.cantidad || 1}`).join('\n');
  const total = Number(carrito.total || carrito.subtotal || 0).toLocaleString('es-CL');

  return (
    `*${nombre}, dejaste tu carrito a medio camino* 🛒\n\n` +
    (detalle ? `${detalle}\n` : '') +
    `Total estimado: $${total} CLP\n` +
    `¿Te ayudo a terminarlo o tienes alguna duda?\n\n` +
    LINK_CARRITO
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

    const carritos = await base44.asServiceRole.entities.CarritoAbandonado.list('-captured_at', 200);

    const elegibles = carritos.filter((c) => {
      if (!['Pendiente', 'Recordatorio Enviado'].includes(c.estado)) return false;
      if (c.whatsapp_enviado_at) return false;
      if (!normalizarTelefono(c.telefono)) return false;
      if (!c.captured_at) return false;
      const h = horas(c.captured_at);
      return h >= H_MIN && h <= H_MAX;
    });

    const stats = { revisados: carritos.length, elegibles: elegibles.length, enviados: 0, convertidos: 0, errores: 0 };

    for (const carrito of elegibles) {
      // ¿Ya compró después de dejar el carrito? Entonces no molestamos.
      const pedidos = carrito.email
        ? await base44.asServiceRole.entities.PedidoWeb.filter({ cliente_email: carrito.email })
        : [];
      const yaCompro = (pedidos || []).some((p) => p.created_date && p.created_date >= carrito.captured_at);

      if (yaCompro) {
        await base44.asServiceRole.entities.CarritoAbandonado.update(carrito.id, {
          estado: 'Convertido',
          converted_at: new Date(ahora).toISOString(),
        });
        stats.convertidos++;
        continue;
      }

      const envio = await enviarTextoCloud(normalizarTelefono(carrito.telefono), construirMensaje(carrito));
      if (!envio.ok) {
        console.warn(`WhatsApp carrito falló ${carrito.id}:`, JSON.stringify(envio.data));
        stats.errores++;
        continue;
      }

      await base44.asServiceRole.entities.CarritoAbandonado.update(carrito.id, {
        whatsapp_enviado_at: new Date(ahora).toISOString(),
      });
      stats.enviados++;
    }

    return Response.json({ ok: true, stats, timestamp: new Date(ahora).toISOString() });
  } catch (error) {
    console.error('recuperarCarritoWhatsAppCRON error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});