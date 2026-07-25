// ════════════════════════════════════════════════════════════════════════
// whatsappProactivoCRON — El agente no solo responde: avisa primero.
// ────────────────────────────────────────────────────────────────────────
// 1 · Rescate de links de pago: pedido creado por WhatsApp sin pagar hace
//     más de 3 h → mensaje corto con el link vivo de MercadoPago.
// 2 · Aviso de despacho: pedido Despachado con tracking → WhatsApp con el
//     número de seguimiento (antes solo salía correo).
// 3 · Aviso de entrega: pedido Entregado → mensaje de cierre + reseña.
//
// Idempotencia sin tocar el esquema: cada envío queda anotado en el
// historial del pedido (type: 'note', detail: 'wa_<accion>').
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enviarTexto } from '../../shared/evolution.ts';

const HORA = 3600000;

const yaEnviado = (pedido, marca) =>
  (pedido.historial || []).some((h) => (h?.detail || '').startsWith(`wa_${marca}`));

async function anotar(base44, pedido, marca, detalle) {
  await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
    historial: [...(pedido.historial || []), {
      at: new Date().toISOString(),
      type: 'note',
      actor: 'agente_whatsapp',
      channel: 'whatsapp',
      detail: `wa_${marca} · ${detalle}`,
    }],
  }).catch(() => {});
}

/** Recupera el link de pago vivo desde MercadoPago (no lo guardamos). */
async function linkPagoMP(preferenceId) {
  const token = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
  if (!token || !preferenceId) return '';
  const r = await fetch(`https://api.mercadopago.com/checkout/preferences/${preferenceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!r?.ok) return '';
  const d = await r.json().catch(() => ({}));
  return d.init_point || '';
}

const plata = (n) => `$${Math.round(n || 0).toLocaleString('es-CL')}`;
const nombreCorto = (n) => String(n || '').trim().split(/\s+/)[0] || '';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const pedidos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 300);
    const ahora = Date.now();
    const enviados = { rescate: 0, despacho: 0, entrega: 0 };
    const detalles = [];

    for (const p of pedidos) {
      const tel = (p.cliente_telefono || '').replace(/\D/g, '');
      if (tel.length < 8) continue;
      const nombre = nombreCorto(p.cliente_nombre);
      const edadH = (ahora - new Date(p.created_date || p.fecha).getTime()) / HORA;

      // ── 1 · Rescate del link de pago (solo pedidos nacidos en WhatsApp) ──
      const pendiente = ['pending_mp', 'pending_webpay'].includes(p.payment_status);
      if (p.canal === 'WhatsApp' && pendiente && p.estado === 'Nuevo'
          && edadH >= 3 && edadH <= 72 && !yaEnviado(p, 'rescate')) {
        const link = await linkPagoMP(p.mp_preference_id);
        if (link) {
          await enviarTexto(tel, `${nombre ? `${nombre}, ` : ''}te dejo tu pedido *${p.numero_pedido}* listo para pagar 🐢\n\n${p.descripcion_items || ''}\nTotal: *${plata(p.total)} CLP*\n\n${link}\n\nTe guardo el stock unas horas más. Si quieres cambiar algo, dime y lo ajusto.`);
          await anotar(base44, p, 'rescate', `link reenviado (${Math.round(edadH)}h sin pagar)`);
          enviados.rescate++;
          detalles.push(`rescate ${p.numero_pedido}`);
          continue;
        }
      }

      // Los avisos de postventa solo aplican a pedidos recientes: nunca se
      // escribe a compras antiguas del historial (evita "blast" retroactivo).
      const reciente = edadH <= 24 * 10;

      // ── 2 · Aviso de despacho con tracking ───────────────────────────────
      if (reciente && p.estado === 'Despachado' && p.tracking && !yaEnviado(p, 'despacho')) {
        await enviarTexto(tel, `¡${nombre || 'Hola'}! Tu pedido *${p.numero_pedido}* ya va en camino 🚚\n\nSeguimiento ${p.courier || 'BlueExpress'}: *${p.tracking}*\nEstado en línea: https://peyuchile.cl/seguimiento\n\nCualquier duda, escríbeme por aquí 🐢`);
        await anotar(base44, p, 'despacho', `tracking ${p.tracking}`);
        enviados.despacho++;
        detalles.push(`despacho ${p.numero_pedido}`);
        continue;
      }

      // ── 3 · Cierre post-entrega + reseña ────────────────────────────────
      if (reciente && p.estado === 'Entregado' && !yaEnviado(p, 'entrega')) {
        await enviarTexto(tel, `${nombre ? `${nombre}, ` : ''}¡tu PEYU ya llegó! 🐢💚\n\n¿Cómo quedó? Cuéntame con una nota del 1 al 5 por aquí mismo — me sirve muchísimo.\n\nY si quieres repetir o regalar uno grabado, dime y te lo armo al tiro.`);
        await anotar(base44, p, 'entrega', 'mensaje de cierre + reseña');
        enviados.entrega++;
        detalles.push(`entrega ${p.numero_pedido}`);
      }
    }

    return Response.json({ ok: true, revisados: pedidos.length, enviados, detalles });
  } catch (error) {
    console.error('[whatsappProactivoCRON]', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});