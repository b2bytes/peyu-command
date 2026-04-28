import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Automatización entity-update: cuando el estado de PedidoWeb cambia, envía
 * email HTML personalizado al cliente con el detalle correspondiente.
 *
 * Estados que disparan email:
 *  - Confirmado, En Producción, Listo para Despacho, Despachado, Entregado
 *
 * En estado "Entregado" se incluye CTA para calificar el pedido.
 */
const TRACKING_URLS = {
  'Starken':       (t) => `https://www.starken.cl/seguimiento?codigo=${t}`,
  'Chilexpress':   (t) => `https://www.chilexpress.cl/Seguimiento?numero=${t}`,
  'BlueExpress':   (t) => `https://www.blue.cl/seguimiento?n=${t}`,
  'Correos Chile': (t) => `https://www.correos.cl/seguimiento?n=${t}`,
};

const STATUS_EMAILS = {
  'Confirmado': {
    icon: '✅',
    color: '#0F8B6C',
    title: 'Pedido confirmado',
    intro: 'Confirmamos tu pedido y ya está en cola de producción.',
    eta: 'Estará listo en 3-5 días hábiles.',
  },
  'En Producción': {
    icon: '🏭',
    color: '#D96B4D',
    title: 'En producción',
    intro: 'Estamos fabricando tu pedido en nuestro taller de Santiago.',
    eta: 'Quedan 2-4 días hábiles para que esté listo.',
  },
  'Listo para Despacho': {
    icon: '📦',
    color: '#0F8B6C',
    title: 'Listo para despacho',
    intro: 'Tu pedido fue empaquetado y está esperando al courier.',
    eta: 'Saldrá despachado hoy o mañana.',
  },
  'Despachado': {
    icon: '🚚',
    color: '#0F8B6C',
    title: '¡En camino!',
    intro: 'Tu pedido salió de nuestro taller y ya viaja hacia ti.',
    eta: 'Tiempo estimado de entrega: 2-5 días hábiles.',
  },
  'Entregado': {
    icon: '🎉',
    color: '#0F8B6C',
    title: '¡Pedido entregado!',
    intro: 'Esperamos que te encante tu compra. Cada producto cuenta una historia: el plástico que renace.',
    eta: '',
  },
};

const buildHtmlEmail = (pedido, status, opts = {}) => {
  const config = STATUS_EMAILS[status];
  if (!config) return null;

  const trackingUrl = pedido.tracking && pedido.courier && TRACKING_URLS[pedido.courier]
    ? TRACKING_URLS[pedido.courier](pedido.tracking)
    : null;

  const seguimientoUrl = `https://peyuchile.cl/seguimiento?pedido=${encodeURIComponent(pedido.numero_pedido || '')}`;
  const reviewUrl = `https://peyuchile.cl/seguimiento?pedido=${encodeURIComponent(pedido.numero_pedido || '')}&review=1`;

  const isDelivered = status === 'Entregado';

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:'Helvetica Neue',Arial,sans-serif;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,${config.color},#0a6b54);padding:32px 24px;text-align:center;color:white;">
      <div style="font-size:48px;margin-bottom:8px;">${config.icon}</div>
      <h1 style="margin:0;font-size:24px;font-weight:700;">${config.title}</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Pedido ${pedido.numero_pedido || ''}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hola <strong>${pedido.cliente_nombre || 'cliente'}</strong>,</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#4b5563;">${config.intro}</p>

      ${config.eta ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#15803d;"><strong>⏱ ETA:</strong> ${config.eta}</p>
      </div>
      ` : ''}

      ${trackingUrl ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">N° Tracking ${pedido.courier}:</p>
        <p style="margin:0 0 12px;font-family:monospace;font-size:16px;font-weight:700;color:#1e40af;">${pedido.tracking}</p>
        <a href="${trackingUrl}" style="display:inline-block;background:#1e40af;color:white;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Rastrear envío →</a>
      </div>
      ` : ''}

      <!-- Resumen pedido -->
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 24px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Detalle del pedido</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;">${pedido.descripcion_items || '—'}</p>
        ${pedido.requiere_personalizacion ? `<p style="margin:8px 0 0;font-size:13px;color:#7c3aed;">✨ Con grabado láser: <em>"${pedido.texto_personalizacion || ''}"</em></p>` : ''}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
        <table width="100%" style="font-size:14px;">
          <tr><td style="padding:4px 0;color:#6b7280;">Total</td><td style="padding:4px 0;text-align:right;font-weight:700;color:${config.color};font-size:18px;">$${(pedido.total || 0).toLocaleString('es-CL')}</td></tr>
          ${pedido.ciudad ? `<tr><td style="padding:4px 0;color:#6b7280;">Despacho</td><td style="padding:4px 0;text-align:right;color:#374151;">${pedido.ciudad}</td></tr>` : ''}
        </table>
      </div>

      ${isDelivered ? `
      <!-- CTA Calificar -->
      <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #fbbf24;border-radius:16px;padding:24px;margin:0 0 24px;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">⭐⭐⭐⭐⭐</div>
        <h3 style="margin:0 0 8px;font-size:18px;color:#92400e;">¿Cómo fue tu experiencia?</h3>
        <p style="margin:0 0 16px;font-size:14px;color:#78350f;line-height:1.5;">Tu opinión nos ayuda a mejorar y a otros clientes a decidirse.</p>
        <a href="${reviewUrl}" style="display:inline-block;background:#92400e;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">Calificar mi pedido →</a>
      </div>
      ` : `
      <!-- CTA Seguimiento -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${seguimientoUrl}" style="display:inline-block;background:${config.color};color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">Ver seguimiento detallado →</a>
      </div>
      `}

      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:24px 0 0;">
        ¿Necesitas ayuda? Escríbenos por WhatsApp <a href="https://wa.me/56935040242" style="color:${config.color};text-decoration:none;font-weight:600;">+56 9 3504 0242</a> o responde este email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#1f2937;padding:24px;text-align:center;color:#9ca3af;font-size:12px;">
      <p style="margin:0 0 8px;color:#fff;font-weight:700;">PEYU Chile · Plástico que renace 🐢♻️</p>
      <p style="margin:0;">Productos 100% reciclados, hechos en Santiago.</p>
      <p style="margin:8px 0 0;"><a href="https://peyuchile.cl" style="color:#9ca3af;text-decoration:none;">peyuchile.cl</a></p>
    </div>
  </div>
</body></html>`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data: pedido, old_data, changed_fields } = body;

    if (event?.type !== 'update') return Response.json({ ok: true, skip: 'no_update' });
    if (!changed_fields?.includes('estado')) return Response.json({ ok: true, skip: 'estado_unchanged' });

    const nuevoEstado = pedido?.estado;
    if (!STATUS_EMAILS[nuevoEstado]) return Response.json({ ok: true, skip: `estado_${nuevoEstado}_no_email` });
    if (!pedido?.cliente_email) return Response.json({ ok: true, skip: 'no_email' });

    const html = buildHtmlEmail(pedido, nuevoEstado);
    const config = STATUS_EMAILS[nuevoEstado];

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: pedido.cliente_email,
      from_name: 'PEYU Chile',
      subject: `${config.icon} ${config.title} · Pedido ${pedido.numero_pedido}`,
      body: html,
    });

    return Response.json({ ok: true, estado: nuevoEstado, email_enviado: true });
  } catch (error) {
    console.error('onPedidoWebStatusChange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});