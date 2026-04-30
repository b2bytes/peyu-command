// ============================================================================
// enviarGiftCard — Genera código único, crea entidad GiftCard y envía por email
// ============================================================================
// Flujo:
//   1. Frontend invoca con { monto, comprador, destinatario, mensaje, diseno_url }
//   2. Backend genera código único PEYU-XXXX-XXXX
//   3. Crea registro GiftCard en BD (service role)
//   4. Envía email HTML al destinatario vía Gmail API
//   5. Retorna { codigo, gift_card_id }
// ----------------------------------------------------------------------------

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0/I/1 para evitar confusión
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PEYU-${seg(4)}-${seg(4)}`;
}

function buildEmailHTML({ codigo, monto, destinatario_nombre, comprador_nombre, mensaje, esCopiaComprador = false }) {
  const montoFmt = new Intl.NumberFormat('es-CL').format(monto);
  // Variantes de color según monto (mismas que GiftCardVisual)
  const variantes = {
    10000:  { from: '#92400e', to: '#7c2d12', accent: '#FCD34D', tag: 'DETALLE' },
    20000:  { from: '#0f766e', to: '#155e75', accent: '#5EEAD4', tag: 'POPULAR' },
    50000:  { from: '#1e293b', to: '#000000', accent: '#D4AF37', tag: 'PREMIUM' },
    100000: { from: '#065f46', to: '#0f172a', accent: '#A7F3D0', tag: 'CORPORATIVO' },
  };
  const v = variantes[monto] || variantes[20000];
  const logoUrl = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png';

  // Preheader (texto que aparece en el preview de Gmail/Outlook antes de abrir)
  const preheader = esCopiaComprador
    ? `Copia de tu regalo: Gift Card PEYU $${montoFmt} para ${destinatario_nombre || ''}.`
    : `${comprador_nombre || 'Alguien'} te regaló una Gift Card PEYU de $${montoFmt}. Código: ${codigo}`;

  const expira = new Date();
  expira.setFullYear(expira.getFullYear() + 1);
  const expiraFmt = expira.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  const headerTexto = esCopiaComprador
    ? { eyebrow: 'Copia de tu regalo', title: '¡Tu Gift Card está enviada!', subtitle: `Le acabamos de enviar el regalo a ${destinatario_nombre || 'tu destinatario'}. Aquí tienes una copia para ti.` }
    : { eyebrow: 'Has recibido un regalo', title: `¡Hola ${destinatario_nombre || ''}!`, subtitle: `${comprador_nombre || 'Alguien especial'} te regaló una Gift Card PEYU` };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Tu Gift Card PEYU</title>
</head>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#3a3a3a;">
  <!-- Preheader oculto para preview de Gmail / Outlook -->
  <div style="display:none;font-size:1px;color:#f6f3ee;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>

  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <p style="font-size:13px;color:#7a7a7a;letter-spacing:2px;text-transform:uppercase;margin:0;">${headerTexto.eyebrow}</p>
      <h1 style="font-family:Georgia,serif;font-size:28px;color:#0F8B6C;margin:8px 0 4px;">${headerTexto.title}</h1>
      <p style="font-size:15px;color:#5a5a5a;margin:0;">${headerTexto.subtitle}</p>
    </div>

    <!-- Gift Card Visual (HTML/CSS — sin imagen externa) -->
    <div style="background:linear-gradient(135deg, ${v.from} 0%, ${v.to} 100%);border-radius:20px;padding:32px 28px;margin-bottom:24px;position:relative;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.25);">
      <div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:50%;background:${v.accent};opacity:.18;filter:blur(40px);"></div>
      <div style="border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:22px;position:relative;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="left" valign="top">
              <img src="${logoUrl}" alt="PEYU" style="height:32px;width:auto;display:block;filter:invert(1) brightness(1.15);" />
            </td>
            <td align="right" valign="top">
              <span style="font-size:9px;font-weight:bold;letter-spacing:3px;color:#fff;background:${v.accent}30;border:1px solid rgba(255,255,255,.3);padding:5px 10px;border-radius:999px;">${v.tag}</span><br/>
              <span style="font-size:9px;letter-spacing:1px;color:rgba(255,255,255,.55);text-transform:uppercase;margin-top:4px;display:inline-block;">🎁 Gift Card</span>
            </td>
          </tr>
        </table>
        <div style="text-align:center;margin:12px 0 16px;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,.5);">Valor</p>
          <p style="margin:0;font-size:48px;font-weight:bold;color:#fff;letter-spacing:-1px;line-height:1;">$${montoFmt}</p>
          <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,.6);letter-spacing:1px;">CLP · Saldo disponible</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
          <tr>
            <td align="left" valign="bottom">
              <p style="margin:0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.45);">Para</p>
              <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:#fff;">${destinatario_nombre || ''}</p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,.6);">De: ${comprador_nombre || 'Alguien especial'}</p>
            </td>
            <td align="right" valign="bottom">
              <p style="margin:0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.45);">Código</p>
              <p style="margin:2px 0 0;font-family:'Courier New',monospace;font-size:13px;font-weight:bold;letter-spacing:2px;color:${v.accent};">${codigo}</p>
            </td>
          </tr>
        </table>
      </div>
    </div>

    ${mensaje ? `
    <div style="background:#fffaf2;border-left:4px solid #D96B4D;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0;font-style:italic;color:#5a5a5a;font-size:15px;line-height:1.6;">"${mensaje}"</p>
      <p style="margin:8px 0 0;font-size:12px;color:#9a9a9a;">— ${comprador_nombre || ''}</p>
    </div>` : ''}

    <div style="background:#E7D8C6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#5a4a3a;letter-spacing:2px;text-transform:uppercase;">Tu código de canje</p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:28px;font-weight:bold;color:#0F8B6C;letter-spacing:3px;">${codigo}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#7a6a5a;">Saldo: <strong>$${montoFmt} CLP</strong></p>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://peyuchile.cl/canjear?code=${codigo}"
         style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:bold;font-size:15px;">
        🎁 Canjear ahora en peyuchile.cl
      </a>
    </div>

    <div style="border-top:1px solid #e0d8cc;padding-top:20px;font-size:13px;color:#8a8a8a;line-height:1.6;">
      <p style="margin:0 0 8px;"><strong style="color:#5a5a5a;">¿Cómo se usa?</strong></p>
      <ol style="margin:0;padding-left:20px;">
        <li>Visita <a href="https://peyuchile.cl/shop" style="color:#0F8B6C;">peyuchile.cl/shop</a> y elige tus productos</li>
        <li>En el checkout, ingresa tu código <strong>${codigo}</strong></li>
        <li>El monto se descuenta automáticamente del total</li>
      </ol>
      <p style="margin:16px 0 0;font-size:12px;color:#a0a0a0;">
        Vigente hasta <strong style="color:#5a5a5a;">${expiraFmt}</strong> · Válida en toda la tienda PEYU · Acumulable con descuentos.
      </p>
    </div>

    <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #e0d8cc;">
      <p style="margin:0;font-size:12px;color:#a0a0a0;">PEYU Chile · Regalos sostenibles 100% reciclados</p>
      <p style="margin:4px 0 0;font-size:12px;"><a href="https://peyuchile.cl" style="color:#0F8B6C;text-decoration:none;">peyuchile.cl</a></p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      monto,
      comprador_nombre,
      comprador_email,
      destinatario_nombre,
      destinatario_email,
      mensaje,
      diseno_url,
      pedido_origen_id,
    } = body;

    if (!monto || !destinatario_email || !comprador_email) {
      return Response.json(
        { error: 'Faltan campos requeridos: monto, destinatario_email, comprador_email' },
        { status: 400 }
      );
    }

    // 1. Generar código único (reintentar si choca)
    let codigo = generarCodigo();
    for (let i = 0; i < 5; i++) {
      const existing = await base44.asServiceRole.entities.GiftCard.filter({ codigo });
      if (!existing || existing.length === 0) break;
      codigo = generarCodigo();
    }

    // 2. Crear registro GiftCard
    const ahora = new Date();
    const expira = new Date(ahora);
    expira.setFullYear(expira.getFullYear() + 1);

    const gc = await base44.asServiceRole.entities.GiftCard.create({
      codigo,
      monto_clp: Number(monto),
      saldo_clp: Number(monto),
      estado: 'Activa',
      comprador_nombre: comprador_nombre || '',
      comprador_email,
      destinatario_nombre: destinatario_nombre || '',
      destinatario_email,
      mensaje: mensaje || '',
      fecha_emision: ahora.toISOString(),
      fecha_expiracion: expira.toISOString(),
      diseno_url: diseno_url || '',
      pedido_origen_id: pedido_origen_id || '',
      email_enviado: false,
    });

    // 3. Enviar email vía Gmail API (service role: no necesita user logueado)
    //    a) Email AL DESTINATARIO  → con el regalo
    //    b) Email COPIA AL COMPRADOR → confirmación + copia del diseño
    let emailOk = false;
    let emailCopiaOk = false;
    let emailError = null;

    // Helper: construye un MIME multipart/alternative y lo envía vía Gmail.
    const sendGmail = async ({ accessToken, to, subject, html, replyTo }) => {
      const boundary = `peyu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const subjectB64 = btoa(unescape(encodeURIComponent(subject)));
      const fromEncoded = `=?UTF-8?B?${btoa(unescape(encodeURIComponent('PEYU Chile')))}?= <ti@peyuchile.cl>`;
      const plain = `Gift Card PEYU - Código: ${codigo} (saldo $${new Intl.NumberFormat('es-CL').format(monto)} CLP). Canjéalo en https://peyuchile.cl/canjear?code=${codigo}`;

      const mime = [
        `From: ${fromEncoded}`,
        `To: ${to}`,
        replyTo ? `Reply-To: ${replyTo}` : null,
        `Subject: =?UTF-8?B?${subjectB64}?=`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        plain,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        html,
        '',
        `--${boundary}--`,
      ].filter(Boolean).join('\r\n');

      const raw = btoa(unescape(encodeURIComponent(mime)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const sendRes = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw }),
        }
      );
      return { ok: sendRes.ok, error: sendRes.ok ? null : await sendRes.text() };
    };

    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

      // — Email principal al destinatario —
      const htmlDestinatario = buildEmailHTML({
        codigo, monto, destinatario_nombre, comprador_nombre, mensaje,
        esCopiaComprador: false,
      });
      const montoFmt = new Intl.NumberFormat('es-CL').format(monto);
      const subjectDest = `🎁 ${comprador_nombre || 'Alguien'} te regaló una Gift Card PEYU de $${montoFmt}`;

      const r1 = await sendGmail({
        accessToken,
        to: destinatario_email,
        subject: subjectDest,
        html: htmlDestinatario,
        replyTo: comprador_email,
      });
      if (r1.ok) {
        emailOk = true;
        await base44.asServiceRole.entities.GiftCard.update(gc.id, { email_enviado: true });
      } else {
        emailError = r1.error;
      }

      // — Copia al comprador (no bloqueante: si el principal funcionó, la copia es bonus) —
      if (comprador_email && comprador_email !== destinatario_email) {
        const htmlCopia = buildEmailHTML({
          codigo, monto, destinatario_nombre, comprador_nombre, mensaje,
          esCopiaComprador: true,
        });
        const subjectCopia = `✅ Copia de tu regalo · Gift Card PEYU $${montoFmt} enviada a ${destinatario_nombre || destinatario_email}`;
        const r2 = await sendGmail({
          accessToken,
          to: comprador_email,
          subject: subjectCopia,
          html: htmlCopia,
        });
        if (r2.ok) emailCopiaOk = true;
      }
    } catch (e) {
      emailError = e.message;
    }

    return Response.json({
      ok: true,
      gift_card_id: gc.id,
      codigo,
      monto_clp: Number(monto),
      email_enviado: emailOk,
      email_copia_comprador: emailCopiaOk,
      email_error: emailError,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});