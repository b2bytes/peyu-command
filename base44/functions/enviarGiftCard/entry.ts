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

function buildEmailHTML({ codigo, monto, destinatario_nombre, comprador_nombre, mensaje, diseno_url }) {
  const montoFmt = new Intl.NumberFormat('es-CL').format(monto);
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Tu Gift Card PEYU</title></head>
<body style="margin:0;padding:0;background:#f6f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#3a3a3a;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <p style="font-size:13px;color:#7a7a7a;letter-spacing:2px;text-transform:uppercase;margin:0;">Has recibido un regalo</p>
      <h1 style="font-family:Georgia,serif;font-size:28px;color:#0F8B6C;margin:8px 0 4px;">¡Hola ${destinatario_nombre || ''}!</h1>
      <p style="font-size:15px;color:#5a5a5a;margin:0;">${comprador_nombre || 'Alguien especial'} te regaló una Gift Card PEYU</p>
    </div>

    <div style="background:#fff;border-radius:16px;padding:8px;box-shadow:0 4px 24px rgba(0,0,0,.08);margin-bottom:24px;">
      <img src="${diseno_url}" alt="Gift Card PEYU $${montoFmt}" style="width:100%;border-radius:12px;display:block;" />
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
        Vigencia: 12 meses · Válida en toda la tienda PEYU · Acumulable con descuentos.
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
    let emailOk = false;
    let emailError = null;
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
      const html = buildEmailHTML({
        codigo,
        monto,
        destinatario_nombre,
        comprador_nombre,
        mensaje,
        diseno_url,
      });

      const subject = `🎁 ${comprador_nombre || 'Alguien'} te regaló una Gift Card PEYU de $${new Intl.NumberFormat('es-CL').format(monto)}`;
      const boundary = `peyu-${Date.now()}`;
      const subjectB64 = btoa(unescape(encodeURIComponent(subject)));
      const fromEncoded = `=?UTF-8?B?${btoa(unescape(encodeURIComponent('PEYU Chile')))}?= <ti@peyuchile.cl>`;

      const mime = [
        `From: ${fromEncoded}`,
        `To: ${destinatario_email}`,
        comprador_email ? `Reply-To: ${comprador_email}` : null,
        `Subject: =?UTF-8?B?${subjectB64}?=`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        `Tu código Gift Card PEYU: ${codigo} (saldo $${monto} CLP). Canjéalo en https://peyuchile.cl/canjear?code=${codigo}`,
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

      if (sendRes.ok) {
        emailOk = true;
        await base44.asServiceRole.entities.GiftCard.update(gc.id, { email_enviado: true });
      } else {
        emailError = await sendRes.text();
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
      email_error: emailError,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});