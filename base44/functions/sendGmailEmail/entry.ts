// ============================================================================
// sendGmailEmail — Envía emails desde ti@peyuchile.cl vía Gmail API
// ============================================================================
// Construye un mensaje MIME RFC 2822 correctamente (soporta UTF-8, emojis,
// tildes y HTML) y lo envía vía Gmail API usando el token OAuth del conector.
//
// Uso típico desde frontend:
//   base44.functions.invoke('sendGmailEmail', {
//     to: 'cliente@empresa.cl',
//     subject: 'Tu propuesta PEYU',
//     html: '<h1>Hola</h1><p>...</p>',
//     cc: 'copia@peyuchile.cl',          // opcional
//     reply_to: 'ventas@peyuchile.cl',    // opcional
//     from_name: 'PEYU Chile',            // opcional (default: PEYU Chile)
//   })
// ----------------------------------------------------------------------------

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Codifica una cabecera con caracteres no-ASCII (RFC 2047).
 * Crítico para asuntos con tildes/emojis.
 */
function encodeHeader(str) {
  if (!str) return '';
  // Si solo tiene ASCII imprimible, devolver tal cual
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return `=?UTF-8?B?${b64}?=`;
}

/**
 * Convierte a base64url (formato requerido por Gmail API).
 */
function toBase64Url(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Construye un mensaje MIME multipart/alternative (text + html).
 */
function buildMimeMessage({ from, to, cc, replyTo, subject, html, text }) {
  const boundary = `peyu-boundary-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const plainText = text || html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean).join('\r\n');

  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    plainText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  return `${headers}\r\n\r\n${body}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      to,
      subject,
      html,
      text,
      cc,
      reply_to,
      from_name = 'PEYU Chile',
    } = await req.json();

    if (!to || !subject || !html) {
      return Response.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Obtener token OAuth de Gmail
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Construir header From con nombre amigable
    const from = `${encodeHeader(from_name)} <ti@peyuchile.cl>`;

    const mime = buildMimeMessage({
      from,
      to,
      cc,
      replyTo: reply_to,
      subject,
      html,
      text,
    });

    const raw = toBase64Url(mime);

    // Enviar vía Gmail API
    const res = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return Response.json(
        { error: `Gmail API error: ${res.status}`, detail: errText.slice(0, 500) },
        { status: 502 }
      );
    }

    const result = await res.json();

    return Response.json({
      ok: true,
      message_id: result.id,
      thread_id: result.threadId,
      sent_from: 'ti@peyuchile.cl',
      to,
      subject,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});