import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// onPedidoWebStatusChange — Email transaccional B2C en cada cambio de estado
// ============================================================================
// Diseño unificado con paleta PEYU. Hero gradient por estado, tracking visible,
// CTA de seguimiento y review post-entrega.
// ----------------------------------------------------------------------------

const TRACKING_URLS = {
  'Starken':       (t) => `https://www.starken.cl/seguimiento?codigo=${t}`,
  'Chilexpress':   (t) => `https://www.chilexpress.cl/Seguimiento?numero=${t}`,
  'BlueExpress':   (t) => `https://www.blue.cl/seguimiento?n=${t}`,
  'Correos Chile': (t) => `https://www.correos.cl/seguimiento?n=${t}`,
};

const STATUS_CONFIG = {
  'Confirmado': {
    emoji: '✅',
    gradient: 'linear-gradient(135deg,#0F8B6C 0%,#0A6B54 100%)',
    color: '#0F8B6C',
    title: 'Pedido confirmado',
    intro: 'Confirmamos tu pedido y ya está en cola de producción.',
    eta: 'Estará listo en 3–5 días hábiles.',
  },
  'En Producción': {
    emoji: '🏭',
    gradient: 'linear-gradient(135deg,#D96B4D 0%,#B85638 100%)',
    color: '#D96B4D',
    title: 'En producción',
    intro: 'Estamos fabricando tu pedido en nuestro taller en Santiago.',
    eta: 'Quedan 2–4 días hábiles para que esté listo.',
  },
  'Listo para Despacho': {
    emoji: '📦',
    gradient: 'linear-gradient(135deg,#0F8B6C 0%,#06947A 100%)',
    color: '#0F8B6C',
    title: 'Listo para despacho',
    intro: 'Tu pedido fue empaquetado y está esperando al courier.',
    eta: 'Saldrá despachado hoy o mañana.',
  },
  'Despachado': {
    emoji: '🚚',
    gradient: 'linear-gradient(135deg,#0F8B6C 0%,#0A6B54 100%)',
    color: '#0F8B6C',
    title: '¡Tu pedido está en camino!',
    intro: 'Salió de nuestro taller y ya viaja hacia ti.',
    eta: 'Tiempo estimado: 2–5 días hábiles.',
  },
  'Entregado': {
    emoji: '🎉',
    gradient: 'linear-gradient(135deg,#0F8B6C 0%,#06947A 100%)',
    color: '#0F8B6C',
    title: '¡Pedido entregado!',
    intro: 'Esperamos que te encante. Cada producto cuenta una historia: el plástico que renace.',
    eta: '',
  },
};

const buildHtmlEmail = (pedido, status) => {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;

  const trackingUrl = pedido.tracking && pedido.courier && TRACKING_URLS[pedido.courier]
    ? TRACKING_URLS[pedido.courier](pedido.tracking)
    : null;

  const seguimientoUrl = `https://peyuchile.cl/seguimiento?pedido=${encodeURIComponent(pedido.numero_pedido || '')}`;
  const reviewUrl = `https://peyuchile.cl/seguimiento?pedido=${encodeURIComponent(pedido.numero_pedido || '')}&review=1`;
  const isDelivered = status === 'Entregado';

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px;">
  <tr><td align="center">

    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 28px rgba(15,23,42,0.06);">

      <!-- HERO -->
      <tr><td style="background:${cfg.gradient};padding:44px 40px 36px;color:#fff;text-align:center;">
        <div style="font-size:56px;line-height:1;margin-bottom:12px;">${cfg.emoji}</div>
        <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;line-height:1.2;">${cfg.title}</h1>
        <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.85);font-weight:600;letter-spacing:1px;">PEDIDO ${pedido.numero_pedido || ''}</p>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:36px 40px 8px;">
        <p style="margin:0 0 8px;font-size:16px;color:#0F172A;font-weight:600;">Hola ${pedido.cliente_nombre || 'cliente'},</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#475569;">${cfg.intro}</p>

        ${cfg.eta ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0FAF7;border:1px solid #C8E6DA;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:14px 18px;font-size:14px;color:#0A6B54;">
            <strong>⏱ Tiempo estimado:</strong> ${cfg.eta}
          </td></tr>
        </table>` : ''}

        ${trackingUrl ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1px;color:#3B82F6;text-transform:uppercase;">N° Tracking ${pedido.courier}</p>
            <p style="margin:0 0 14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:18px;font-weight:700;color:#1E40AF;">${pedido.tracking}</p>
            <a href="${trackingUrl}" style="display:inline-block;background:#1E40AF;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;">Rastrear envío →</a>
          </td></tr>
        </table>` : ''}

        <!-- RESUMEN -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Detalle del pedido</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;border-radius:12px;margin-bottom:28px;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#0F172A;line-height:1.5;">${pedido.descripcion_items || '—'}</p>
            ${pedido.requiere_personalizacion ? `<p style="margin:8px 0 0;font-size:13px;color:#7C3AED;background:#F3E8FF;padding:8px 12px;border-radius:8px;">✨ Con grabado láser: <em>"${pedido.texto_personalizacion || ''}"</em></p>` : ''}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #E5E0D6;padding-top:12px;">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#64748B;">Total</td>
                <td style="padding:6px 0;text-align:right;font-size:18px;font-weight:800;color:${cfg.color};font-variant-numeric:tabular-nums;">$${(pedido.total || 0).toLocaleString('es-CL')}</td>
              </tr>
              ${pedido.ciudad ? `<tr><td style="padding:4px 0;font-size:13px;color:#64748B;">Despacho</td><td style="padding:4px 0;text-align:right;font-size:13px;color:#0F172A;">${pedido.ciudad}</td></tr>` : ''}
            </table>
          </td></tr>
        </table>

        ${isDelivered ? `
        <!-- REVIEW CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FEF3C7 0%,#FDE68A 100%);border:1px solid #FBBF24;border-radius:16px;margin-bottom:24px;">
          <tr><td style="padding:28px 24px;text-align:center;">
            <div style="font-size:32px;letter-spacing:6px;margin-bottom:10px;">⭐⭐⭐⭐⭐</div>
            <h3 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#78350F;">¿Cómo fue tu experiencia?</h3>
            <p style="margin:0 0 18px;font-size:14px;color:#78350F;line-height:1.5;">Tu opinión nos ayuda a mejorar y a otros clientes a decidirse.</p>
            <a href="${reviewUrl}" style="display:inline-block;background:#78350F;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(120,53,15,0.25);">Calificar mi pedido →</a>
          </td></tr>
        </table>` : `
        <!-- TRACKING CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr><td align="center">
            <a href="${seguimientoUrl}" style="display:inline-block;background:${cfg.color};color:#fff;padding:16px 32px;border-radius:14px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(15,139,108,0.25);">Ver seguimiento detallado →</a>
          </td></tr>
        </table>`}

        <!-- HELP -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E6;border-left:4px solid #F59E0B;border-radius:8px;margin-bottom:8px;">
          <tr><td style="padding:14px 18px;font-size:13px;color:#78350F;line-height:1.55;">
            <strong>¿Necesitas ayuda?</strong> Escríbenos por WhatsApp al
            <a href="https://wa.me/56935040242" style="color:#0F8B6C;text-decoration:none;font-weight:700;">+56 9 3504 0242</a> o responde este email.
          </td></tr>
        </table>

      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#0F172A;padding:28px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:13px;color:#fff;font-weight:700;">PEYU Chile · Plástico que renace 🐢</p>
        <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Productos 100% reciclados · Hechos en Santiago</p>
        <p style="margin:0;font-size:11px;">
          <a href="https://peyuchile.cl" style="color:#A7D9C9;text-decoration:none;">peyuchile.cl</a>
          <span style="color:#475569;margin:0 6px;">·</span>
          <a href="mailto:ventas@peyuchile.cl" style="color:#A7D9C9;text-decoration:none;">ventas@peyuchile.cl</a>
        </p>
      </td></tr>
    </table>

  </td></tr>
</table>

</body></html>`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data: pedido, changed_fields } = body;

    if (event?.type !== 'update') return Response.json({ ok: true, skip: 'no_update' });
    if (!changed_fields?.includes('estado')) return Response.json({ ok: true, skip: 'estado_unchanged' });

    const nuevoEstado = pedido?.estado;
    if (!STATUS_CONFIG[nuevoEstado]) return Response.json({ ok: true, skip: `estado_${nuevoEstado}_no_email` });
    if (!pedido?.cliente_email) return Response.json({ ok: true, skip: 'no_email' });

    const html = buildHtmlEmail(pedido, nuevoEstado);
    const cfg = STATUS_CONFIG[nuevoEstado];

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: pedido.cliente_email,
      from_name: 'PEYU Chile',
      subject: `${cfg.emoji} ${cfg.title} · Pedido ${pedido.numero_pedido}`,
      body: html,
    });

    return Response.json({ ok: true, estado: nuevoEstado, email_enviado: true });
  } catch (error) {
    console.error('onPedidoWebStatusChange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});