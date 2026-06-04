// ============================================================================
// enviarConfirmacionPedido — Correo de confirmación INMEDIATO al crear un pedido
// ----------------------------------------------------------------------------
// A diferencia de enviarComprobantePedido (que se dispara cuando MP confirma el
// pago), esta función se llama JUSTO al crear el PedidoWeb, sin importar el
// medio de pago. Garantiza que el cliente SIEMPRE reciba un correo:
//   - Transferencia → incluye datos bancarios (Santander cta 94151872,
//     RUT 77.069.974-6) + número de pedido como referencia.
//   - MercadoPago / otros → confirma recepción del pedido, el comprobante de
//     pago llega después vía mpWebhook → enviarComprobantePedido.
//
// Idempotencia: marca email_confirmacion_enviado=true (no re-envía).
// Excluye emails de prueba. Best-effort: si falla NO bloquea el checkout.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const EMAILS_PRUEBA = ['alfonsovambe@gmail.com', 'lyamundaca007@gmail.com'];
const clp = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

const LABEL_PERSONALIZACION = {
  frase: 'Frase personalizada',
  peyu: 'Diseño PEYU',
  archivo: 'Diseño personalizado',
};

function encodeHeader(str) {
  if (!str) return '';
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}
function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function sendViaGmail(accessToken, { to, replyTo, subject, html, fromName = 'PEYU Chile' }) {
  const boundary = `peyu_conf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const plain = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const message = [
    `From: ${encodeHeader(fromName)} <ti@peyuchile.cl>`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    plain,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ].filter((l) => l !== null).join('\r\n');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toBase64Url(message) }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gmail API ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

function buildItemsHtml(pedido) {
  const detalle = Array.isArray(pedido.items_detalle) ? pedido.items_detalle : [];
  if (detalle.length > 0) {
    return detalle.map((it) => {
      const partes = [];
      if (it.color) partes.push(`Color: <strong>${it.color}</strong>`);
      if (it.personalizacion) {
        const tipoLabel = it.tipo_personalizacion && LABEL_PERSONALIZACION[it.tipo_personalizacion]
          ? ` (${LABEL_PERSONALIZACION[it.tipo_personalizacion]})` : '';
        partes.push(`Grabado${tipoLabel}: "${it.personalizacion}"`);
      }
      const sub = partes.length
        ? `<div style="font-size:12px;color:#6B7280;margin-top:2px">${partes.join(' · ')}</div>` : '';
      const fee = Number(it.fee_personalizacion || 0);
      const feeHtml = it.personalizacion
        ? (fee > 0
            ? `<div style="font-size:12px;color:#1f2937;margin-top:2px">✨ Personalización: <strong>+${clp(fee)}</strong></div>`
            : `<div style="font-size:12px;color:#0F8B6C;margin-top:2px">✨ Personalización gratis (10+ unidades)</div>`)
        : '';
      return `<div style="padding:10px 0;border-bottom:1px solid #EAE3D9">
        <span style="font-weight:600;color:#1f2937">${it.nombre || 'Producto'} × ${it.cantidad || 1}</span>${sub}${feeHtml}
      </div>`;
    }).join('');
  }
  return (pedido.descripcion_items || '')
    .split('\n').filter(Boolean)
    .map((l) => `<div style="padding:8px 0;border-bottom:1px solid #EAE3D9;font-size:13px;color:#1f2937">${l}</div>`).join('');
}

// Bloque de datos bancarios para pedidos por transferencia.
function buildTransferenciaHtml(pedido) {
  return `
  <div style="background:#FBF6F0;border:1px solid #EAE3D9;border-radius:12px;padding:18px;margin:18px 0">
    <p style="margin:0 0 10px;font-weight:700;color:#0B6E55;font-size:14px">🏦 Datos para tu transferencia</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#3a3026">
      <tr><td style="padding:3px 0;color:#6B7280">Titular</td><td style="padding:3px 0;text-align:right;font-weight:600">Peyu Chile SpA</td></tr>
      <tr><td style="padding:3px 0;color:#6B7280">RUT</td><td style="padding:3px 0;text-align:right;font-weight:600">77.069.974-6</td></tr>
      <tr><td style="padding:3px 0;color:#6B7280">Banco</td><td style="padding:3px 0;text-align:right;font-weight:600">Banco Santander</td></tr>
      <tr><td style="padding:3px 0;color:#6B7280">Tipo cuenta</td><td style="padding:3px 0;text-align:right;font-weight:600">Cuenta Corriente</td></tr>
      <tr><td style="padding:3px 0;color:#6B7280">N° de cuenta</td><td style="padding:3px 0;text-align:right;font-weight:700;font-size:16px;color:#0B6E55">94151872</td></tr>
      <tr><td style="padding:3px 0;color:#6B7280">Email</td><td style="padding:3px 0;text-align:right;font-weight:600">ventas@peyuchile.cl</td></tr>
    </table>
    <p style="margin:12px 0 0;font-size:12px;color:#6B7280;line-height:1.5">
      En el detalle de la transferencia indica el N° de pedido
      <strong style="color:#3a3026">${pedido.numero_pedido || pedido.id}</strong>.
      Envíanos el comprobante a <strong>ventas@peyuchile.cl</strong> o por WhatsApp
      <strong>+56 9 3504 0242</strong> y comenzamos producción 🐢.
    </p>
  </div>`;
}

function buildHtml(pedido) {
  const itemsHtml = buildItemsHtml(pedido);
  const esTransferencia = pedido.medio_pago === 'Transferencia';

  // Desglose claro: Subtotal + Personalización + Envío - Descuento = Total.
  const feePers = Number(pedido.fee_personalizacion || 0);
  const tienePersonalizacion = !!pedido.texto_personalizacion || pedido.requiere_personalizacion;
  const personalizacion = feePers > 0
    ? `<tr><td style="padding:4px 0;color:#6B7280">Personalización láser</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${clp(feePers)}</td></tr>`
    : tienePersonalizacion
      ? `<tr><td style="padding:4px 0;color:#6B7280">Personalización láser</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#0F8B6C">Gratis</td></tr>`
      : '';
  const envio = pedido.costo_envio
    ? `<tr><td style="padding:4px 0;color:#6B7280">Envío</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${clp(pedido.costo_envio)}</td></tr>` : '';
  const descuento = Number(pedido.descuento || 0) > 0
    ? `<tr><td style="padding:4px 0;color:#0B6E55">Descuentos</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#0B6E55">−${clp(pedido.descuento)}</td></tr>` : '';
  const direccion = pedido.direccion_envio
    ? `<div style="margin:16px 0"><p style="font-weight:700;margin:0 0 4px;color:#3a3026">📦 Dirección de envío</p><p style="margin:0;color:#6B7280;font-size:13px">${pedido.direccion_envio}${pedido.ciudad ? `, ${pedido.ciudad}` : ''}</p></div>` : '';

  const intro = esTransferencia
    ? 'recibimos tu pedido. Para confirmarlo, realiza la transferencia con los datos de abajo.'
    : 'recibimos tu pedido. Te confirmaremos el pago en breve y comenzaremos a prepararlo.';
  const titulo = esTransferencia ? '¡Pedido recibido!' : '¡Pedido confirmado!';

  return `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#FBF6F0;padding:0;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0F8B6C 0%,#0B6E55 100%);padding:28px 24px;text-align:center">
      <div style="font-size:34px;line-height:1">🐢</div>
      <h1 style="color:#fff;margin:8px 0 2px;font-size:22px;letter-spacing:-0.5px">${titulo}</h1>
      <p style="color:#A7D9C9;margin:0;font-size:13px">PEYU · Productos sostenibles hechos en Chile</p>
    </div>
    <div style="padding:24px;color:#3a3026">
      <p style="margin:0 0 14px">Hola <strong>${pedido.cliente_nombre || ''}</strong>, ${intro}</p>

      <div style="background:#fff;border:1px solid #EAE3D9;border-radius:12px;padding:16px;margin:0 0 18px">
        <p style="margin:0;font-size:13px;color:#6B7280">N° de Pedido</p>
        <p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#0F8B6C">${pedido.numero_pedido || pedido.id}</p>
      </div>

      <p style="font-weight:700;margin:0 0 6px;color:#3a3026">Tu pedido</p>
      <div style="background:#fff;border:1px solid #EAE3D9;border-radius:12px;padding:4px 16px;margin:0 0 18px">
        ${itemsHtml}
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 6px">
        <tr><td style="padding:4px 0;color:#6B7280">Subtotal</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${clp(pedido.subtotal)}</td></tr>
        ${personalizacion}
        ${envio}
        ${descuento}
        <tr><td style="padding:10px 0 0;font-weight:700;font-size:16px;color:#3a3026;border-top:2px solid #EAE3D9">Total ${esTransferencia ? 'a transferir' : ''}</td><td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:16px;color:#0F8B6C;border-top:2px solid #EAE3D9">${clp(pedido.total)}</td></tr>
      </table>

      ${esTransferencia ? buildTransferenciaHtml(pedido) : ''}
      ${direccion}

      <p style="text-align:center;margin:22px 0 8px">
        <a href="https://peyuchile.cl/seguimiento" style="background:#0F8B6C;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Seguir mi pedido →</a>
      </p>
      <p style="color:#9A8C7A;font-size:11px;text-align:center;margin:18px 0 0">Cada PEYU saca plástico del vertedero. Garantía 10 años. 🌿<br/>PEYU Chile · ti@peyuchile.cl</p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { pedido_id } = await req.json().catch(() => ({}));
    if (!pedido_id) return Response.json({ error: 'pedido_id requerido' }, { status: 400 });

    const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id);
    if (!pedido) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });

    const email = (pedido.cliente_email || '').trim().toLowerCase();
    if (!email) return Response.json({ status: 'skip', reason: 'sin email' });
    if (EMAILS_PRUEBA.includes(email)) return Response.json({ status: 'skip', reason: 'email de prueba' });
    // Idempotencia: no re-enviamos la confirmación inicial.
    if (pedido.email_confirmacion_enviado) return Response.json({ status: 'skip', reason: 'ya enviado' });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const html = buildHtml(pedido);
    const esTransferencia = pedido.medio_pago === 'Transferencia';

    await sendViaGmail(accessToken, {
      to: pedido.cliente_email,
      subject: esTransferencia
        ? `🐢 Pedido recibido · ${pedido.numero_pedido || pedido.id} · Datos para transferir`
        : `🐢 Pedido confirmado · ${pedido.numero_pedido || pedido.id}`,
      html,
      replyTo: 'ti@peyuchile.cl',
      fromName: 'PEYU Chile',
    });

    await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
      email_confirmacion_enviado: true,
      email_confirmacion_enviado_at: new Date().toISOString(),
      historial: [
        ...(pedido.historial || []),
        { at: new Date().toISOString(), type: 'email_sent', actor: 'enviarConfirmacionPedido', channel: 'email', detail: `Confirmación de pedido enviada (${esTransferencia ? 'transferencia + datos bancarios' : pedido.medio_pago})` },
      ],
    });

    return Response.json({ status: 'ok', to: pedido.cliente_email, transferencia: esTransferencia });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});