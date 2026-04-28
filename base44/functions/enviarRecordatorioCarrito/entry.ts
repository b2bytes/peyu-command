import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Envía recordatorios automáticos de carritos abandonados.
 * Diseñado para ser llamado por una automatización scheduled cada 15 min.
 *
 * Lógica:
 * 1. Busca CarritoAbandonado en estado "Pendiente" con captured_at > 1 hora.
 * 2. Antes de enviar, verifica si el cliente ya creó un PedidoWeb con ese email
 *    después de captured_at (significa que sí compró → marca como Convertido).
 * 3. En caso contrario, envía email con Gmail API y marca "Recordatorio Enviado".
 *
 * Solo admins pueden invocar manualmente. La automatización scheduled corre como
 * service role implícito (al ser invocada por el sistema), así que no requiere user.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // No enviar a carritos > 24h (probable expiración)

// ── Encoding helpers (mismo patrón que sendGmailEmail) ─────────────────
function encodeRFC2047(text) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(text)))}?=`;
}
function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildHtml({ nombre, items, total }) {
  const itemRows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;">
        ${i.imagen ? `<img src="${i.imagen}" alt="" width="56" height="56" style="border-radius:8px;object-fit:cover;display:block;" />` : ''}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a;font-size:14px;">
        <div style="font-weight:600;">${i.nombre}</div>
        ${i.personalizacion ? `<div style="font-size:12px;color:#7c3aed;margin-top:2px;">✨ "${i.personalizacion}"</div>` : ''}
        <div style="font-size:12px;color:#64748b;margin-top:2px;">x${i.cantidad}</div>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:Inter,Arial,sans-serif;color:#0f172a;font-size:14px;font-weight:600;">
        $${(Number(i.precio) * Number(i.cantidad)).toLocaleString('es-CL')}
      </td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
    <tr>
      <td style="background:linear-gradient(135deg,#0f8b6c,#0891b2);padding:32px 28px;text-align:center;color:#fff;">
        <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;">PEYU Chile</div>
        <div style="margin-top:8px;font-size:14px;opacity:0.85;">Sostenibilidad hecha en Chile 🇨🇱</div>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px;color:#0f172a;">
        <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;">¡Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}! 👋</h1>
        <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#475569;">
          Notamos que dejaste algunos productos en tu carrito hace un rato. ¡No queremos que se te escapen!
          Están disponibles y listos para enviar a todo Chile.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
          ${itemRows}
        </table>

        <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:16px;padding:16px;margin:20px 0;text-align:center;">
          <div style="font-size:13px;color:#0f766e;font-weight:600;">Total estimado</div>
          <div style="font-size:28px;font-weight:700;color:#0f172a;margin-top:4px;">$${Number(total).toLocaleString('es-CL')}</div>
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a href="https://peyuchile.cl/cart" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:14px;font-weight:600;font-size:15px;">
            Finalizar mi compra →
          </a>
        </div>

        <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:20px;font-size:13px;color:#64748b;line-height:1.6;">
          <strong style="color:#0f172a;">¿Por qué PEYU?</strong><br />
          ♻️ 100% plástico reciclado<br />
          🇨🇱 Hecho en Chile<br />
          🚚 Envío gratis sobre $40.000<br />
          🛡️ Garantía 10 años
        </div>

        <p style="margin:24px 0 0 0;font-size:12px;color:#94a3b8;text-align:center;">
          ¿Dudas? Escríbenos a WhatsApp <strong>+56 9 3504 0242</strong>.<br />
          Si ya completaste tu compra, ignora este correo.
        </p>
      </td>
    </tr>
  </table>
</body></html>`;
}

function buildPlain({ nombre, items, total }) {
  const lines = items
    .map((i) => `  • ${i.nombre} x${i.cantidad} — $${(Number(i.precio) * Number(i.cantidad)).toLocaleString('es-CL')}`)
    .join('\n');
  return `Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''},

Dejaste estos productos en tu carrito de PEYU Chile:

${lines}

Total: $${Number(total).toLocaleString('es-CL')}

Finaliza tu compra: https://peyuchile.cl/cart

¿Dudas? WhatsApp +56 9 3504 0242
`;
}

async function sendGmailReminder(accessToken, { to, nombre, items, total }) {
  const boundary = `peyu_reminder_${Date.now()}`;
  const subject = encodeRFC2047('🛒 Tus productos PEYU te están esperando');
  const fromName = encodeRFC2047('PEYU Chile');

  const message = [
    `From: ${fromName} <ti@peyuchile.cl>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    buildPlain({ nombre, items, total }),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    buildHtml({ nombre, items, total }),
    ``,
    `--${boundary}--`,
  ].join('\r\n');

  const raw = toBase64Url(message);
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail API ${res.status}: ${text}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Obtener access token de Gmail (shared connector — autorizado por el builder)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const now = Date.now();
    const cutoffOld = new Date(now - ONE_HOUR_MS).toISOString();
    const cutoffMax = new Date(now - MAX_AGE_MS).toISOString();

    // Buscar carritos pendientes
    const pendings = await base44.asServiceRole.entities.CarritoAbandonado.filter({
      estado: 'Pendiente',
    });

    const candidates = (pendings || []).filter(
      (c) => c.captured_at && c.captured_at < cutoffOld && c.captured_at > cutoffMax
    );

    let sent = 0;
    let converted = 0;
    let expired = 0;
    const errors = [];

    for (const cart of candidates) {
      try {
        // ¿El cliente ya completó la compra? Buscar pedido posterior a captured_at
        const pedidos = await base44.asServiceRole.entities.PedidoWeb.filter({
          cliente_email: cart.email,
        });
        const completed = (pedidos || []).find(
          (p) => p.created_date && p.created_date >= cart.captured_at
        );

        if (completed) {
          await base44.asServiceRole.entities.CarritoAbandonado.update(cart.id, {
            estado: 'Convertido',
            converted_at: new Date().toISOString(),
            pedido_id: completed.id,
          });
          converted++;
          continue;
        }

        // Enviar recordatorio
        await sendGmailReminder(accessToken, {
          to: cart.email,
          nombre: cart.nombre,
          items: cart.carrito_items || [],
          total: cart.total || cart.subtotal || 0,
        });

        await base44.asServiceRole.entities.CarritoAbandonado.update(cart.id, {
          estado: 'Recordatorio Enviado',
          reminder_sent_at: new Date().toISOString(),
        });
        sent++;
      } catch (err) {
        errors.push({ id: cart.id, email: cart.email, error: String(err?.message || err) });
      }
    }

    // Marcar como expirados los muy antiguos sin recordatorio
    const tooOld = (pendings || []).filter((c) => c.captured_at && c.captured_at <= cutoffMax);
    for (const cart of tooOld) {
      await base44.asServiceRole.entities.CarritoAbandonado.update(cart.id, { estado: 'Expirado' });
      expired++;
    }

    return Response.json({
      success: true,
      processed: candidates.length,
      sent,
      converted,
      expired,
      errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});