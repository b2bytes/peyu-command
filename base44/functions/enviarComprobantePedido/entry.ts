// ============================================================================
// enviarComprobantePedido — Envía el comprobante de compra al cliente vía
// Gmail SMTP (ti@peyuchile.cl). Idempotente: marca comprobante_enviado=true.
// ----------------------------------------------------------------------------
// Se invoca:
//   - desde mpWebhook / mpReconcilePending cuando un pedido pasa a "paid"
//   - manualmente con { pedido_id } para reprocesar un pedido puntual
//   - con { reprocesar_pagados: true } para barrer TODOS los pagados sin comprobante
//
// Diseño del correo: estética PEYU (tortuga, Warm Dusk), claro y profesional.
// Excluye emails de prueba.
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const EMAILS_PRUEBA = ['alfonsovambe@gmail.com', 'lyamundaca007@gmail.com'];
const clp = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

// Etiqueta legible por tipo de personalización (espejo de lib/personalizacion-config).
// No se puede importar el lib del frontend en Deno → se inlinea aquí.
const LABEL_PERSONALIZACION = {
  frase: 'Frase personalizada',
  peyu: 'Diseño PEYU',
  archivo: 'Diseño personalizado',
};

// ── Gmail API (inline, igual patrón que sendSelfServiceProposalEmail) ──
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
  const boundary = `peyu_comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
      // Línea del fee de personalización por ítem: muestra el monto cobrado o
      // "Gratis (≥10u)" cuando alcanzó el MOQ. Coincide 1:1 con el carrito.
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
  if (pedido.color) {
    return `<div style="padding:10px 0;border-bottom:1px solid #EAE3D9"><span style="font-weight:600;color:#1f2937">${(pedido.descripcion_items || 'Tu pedido').split('\n')[0]}</span><div style="font-size:12px;color:#6B7280;margin-top:2px">Color: <strong>${pedido.color}</strong></div></div>`;
  }
  return (pedido.descripcion_items || '')
    .split('\n').filter(Boolean)
    .map((l) => `<div style="padding:8px 0;border-bottom:1px solid #EAE3D9;font-size:13px;color:#1f2937">${l}</div>`).join('');
}

function buildHtml(pedido) {
  const itemsHtml = buildItemsHtml(pedido);
  // Personalización láser: si hubo cargo, lo desglosamos como línea con monto
  // (así Subtotal + Personalización + Envío = Total cuadra). Si el grabado fue
  // gratis (≥10u), lo mostramos como "Gratis". Si no hubo grabado, no se muestra.
  const tienePersonalizacion = !!pedido.texto_personalizacion || pedido.requiere_personalizacion;
  const feePers = Number(pedido.fee_personalizacion || 0);
  const personalizacion = feePers > 0
    ? `<tr><td style="padding:4px 0;color:#6B7280">Personalización láser</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${clp(feePers)}</td></tr>`
    : tienePersonalizacion
      ? `<tr><td style="padding:4px 0;color:#6B7280">Personalización láser</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#0F8B6C">Gratis</td></tr>`
      : '';
  const envio = pedido.costo_envio
    ? `<tr><td style="padding:4px 0;color:#6B7280">Envío</td><td style="padding:4px 0;text-align:right;font-weight:600;color:#1f2937">${clp(pedido.costo_envio)}</td></tr>` : '';
  const direccion = pedido.direccion_envio
    ? `<div style="margin:16px 0"><p style="font-weight:700;margin:0 0 4px;color:#3a3026">📦 Dirección de envío</p><p style="margin:0;color:#6B7280;font-size:13px">${pedido.direccion_envio}${pedido.ciudad ? `, ${pedido.ciudad}` : ''}</p></div>` : '';
  const courier = pedido.courier === 'Retiro en Tienda';
  const despacho = courier
    ? 'Te avisaremos cuando esté listo para retiro en tienda.'
    : 'Tiempo estimado de despacho: 2-5 días hábiles. Te enviaremos el código de tracking al despachar.';

  return `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#FBF6F0;padding:0;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0F8B6C 0%,#0B6E55 100%);padding:28px 24px;text-align:center">
      <div style="font-size:34px;line-height:1">🐢</div>
      <h1 style="color:#fff;margin:8px 0 2px;font-size:22px;letter-spacing:-0.5px">¡Compra confirmada!</h1>
      <p style="color:#A7D9C9;margin:0;font-size:13px">PEYU · Productos sostenibles hechos en Chile</p>
    </div>
    <div style="padding:24px;color:#3a3026">
      <p style="margin:0 0 14px">Hola <strong>${pedido.cliente_nombre || ''}</strong>, recibimos tu pago. ¡Gracias por elegir PEYU! 🌎</p>

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
        <tr><td style="padding:10px 0 0;font-weight:700;font-size:16px;color:#3a3026;border-top:2px solid #EAE3D9">Total pagado</td><td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:16px;color:#0F8B6C;border-top:2px solid #EAE3D9">${clp(pedido.total)}</td></tr>
      </table>

      ${direccion}

      <div style="background:#E6F4EF;border:1px solid #A7D9C9;border-radius:12px;padding:14px;margin:18px 0">
        <p style="margin:0;font-size:13px;color:#0B6E55">🚚 ${despacho}</p>
      </div>

      <p style="text-align:center;margin:22px 0 8px">
        <a href="https://peyuchile.cl/seguimiento" style="background:#0F8B6C;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Seguir mi pedido →</a>
      </p>
      <p style="color:#9A8C7A;font-size:11px;text-align:center;margin:18px 0 0">Cada PEYU saca plástico del vertedero. Garantía 10 años. 🌿<br/>PEYU Chile · ti@peyuchile.cl</p>
    </div>
  </div>`;
}

async function enviarUno(base44, accessToken, pedido) {
  const email = (pedido.cliente_email || '').trim().toLowerCase();
  if (!email) return { id: pedido.id, status: 'skip', reason: 'sin email' };
  if (EMAILS_PRUEBA.includes(email)) return { id: pedido.id, status: 'skip', reason: 'email de prueba' };
  if (pedido.comprobante_enviado) return { id: pedido.id, status: 'skip', reason: 'ya enviado' };

  const html = buildHtml(pedido);
  await sendViaGmail(accessToken, {
    to: pedido.cliente_email,
    subject: `🐢 Compra confirmada · Pedido ${pedido.numero_pedido || pedido.id}`,
    html,
    replyTo: 'ti@peyuchile.cl',
    fromName: 'PEYU Chile',
  });

  await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
    comprobante_enviado: true,
    comprobante_enviado_at: new Date().toISOString(),
    historial: [
      ...(pedido.historial || []),
      { at: new Date().toISOString(), type: 'email_sent', actor: 'enviarComprobantePedido', channel: 'email', detail: 'Comprobante de compra enviado (Gmail SMTP)' },
    ],
  });
  return { id: pedido.id, numero: pedido.numero_pedido, status: 'ok', to: pedido.cliente_email };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { pedido_id, reprocesar_pagados } = body;

    // Token OAuth del conector Gmail (compartido, del builder) — service role.
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Modo barrido: requiere admin (datos sensibles de todos los pedidos)
    if (reprocesar_pagados) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
      const todos = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 500);
      const objetivo = todos.filter(p => p.payment_status === 'paid' && !p.comprobante_enviado);
      const results = [];
      for (const p of objetivo) {
        try { results.push(await enviarUno(base44, accessToken, p)); }
        catch (e) { results.push({ id: p.id, status: 'error', error: e.message }); }
      }
      return Response.json({
        modo: 'reprocesar_pagados',
        candidatos: objetivo.length,
        enviados: results.filter(r => r.status === 'ok').length,
        results,
      });
    }

    // Modo individual (usado por webhook/reconcile/manual)
    if (!pedido_id) {
      return Response.json({ error: 'pedido_id o reprocesar_pagados requerido' }, { status: 400 });
    }
    const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedido_id);
    if (!pedido) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });

    const result = await enviarUno(base44, accessToken, pedido);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});