// ════════════════════════════════════════════════════════════════════════
// ruletaGirar — Ruleta de fidelización PEYU (spin-to-win con captura de email).
// ────────────────────────────────────────────────────────────────────────
// El premio se decide EN EL SERVIDOR (probabilidades escalonadas, nadie puede
// manipularlo desde el navegador). Reglas anti-abuso: 1 giro por email; si ya
// giró, se le devuelve su cupón vigente. Cada premio emite un cupón de UN SOLO
// USO, personal (email_asignado), con mínimo de compra y expiración a 7 días.
// Además captura al Suscriptor (origen 'ruleta') y envía el código por Gmail
// (best-effort: si el correo falla, el código igual se muestra en pantalla).
// El orden de PREMIOS debe calzar con los segmentos del widget RuletaWheel.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Índice = segmento de la rueda en el frontend. peso = probabilidad relativa.
const PREMIOS = [
  { label: '5% de descuento', tipo: 'porcentaje', valor: 5, peso: 30 },
  { label: '10% de descuento', tipo: 'porcentaje', valor: 10, peso: 25 },
  { label: '$2.000 de descuento', tipo: 'monto_fijo', valor: 2000, peso: 20 },
  { label: 'Envío gratis', tipo: 'envio_gratis', valor: 0, peso: 15 },
  { label: '15% de descuento', tipo: 'porcentaje', valor: 15, peso: 8 },
  { label: '$3.000 de descuento', tipo: 'monto_fijo', valor: 3000, peso: 2 },
];
const MINIMO_COMPRA = 15000; // protege margen (regla estándar de spin-to-win)
const DIAS_VIGENCIA = 7;     // urgencia: expira pronto

function elegirPremio() {
  const total = PREMIOS.reduce((s, p) => s + p.peso, 0);
  let r = Math.random() * total;
  for (let i = 0; i < PREMIOS.length; i++) {
    r -= PREMIOS[i].peso;
    if (r <= 0) return i;
  }
  return 0;
}

function encodeHeader(str: string) {
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}
function toBase64Url(str: string) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function enviarEmailCupon(base44: any, email: string, nombre: string, premio: any, codigo: string, expira: string) {
  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#F8F3ED;border-radius:16px;padding:28px;color:#2C1810">
    <h2 style="color:#0F8B6C;margin:0 0 4px">🎡 ¡Ganaste en la ruleta PEYU!</h2>
    <p>Hola${nombre ? ` ${nombre}` : ''} 🐢, tu premio es: <strong>${premio.label}</strong></p>
    <div style="background:#fff;border:2px dashed #C0785C;border-radius:12px;padding:18px;text-align:center;margin:16px 0">
      <p style="margin:0 0 6px;font-size:12px;color:#7A6050">Tu código (un solo uso, personal)</p>
      <p style="margin:0;font-size:26px;font-weight:bold;letter-spacing:2px;color:#C0785C;font-family:monospace">${codigo}</p>
    </div>
    <p style="font-size:13px;color:#7A6050">Válido hasta el <strong>${expira}</strong> · compra mínima $${MINIMO_COMPRA.toLocaleString('es-CL')} · aplícalo en el carrito.</p>
    <a href="https://peyuchile.cl/CatalogoNuevo" style="display:inline-block;background:#0F8B6C;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">Usar mi cupón 🛍️</a>
    <p style="font-size:11px;color:#A08070;margin-top:20px">PEYU Chile · «Hasta que el plástico deje de ser basura»</p>
  </div>`;
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const boundary = `peyu-${Date.now()}`;
  const mime = [
    `From: ${encodeHeader('PEYU Chile')} <ti@peyuchile.cl>`,
    `To: ${email}`,
    `Subject: ${encodeHeader(`🎁 Tu cupón ${premio.label} — PEYU`)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
    '',
    `--${boundary}--`,
  ].join('\r\n');
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toBase64Url(mime) }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const nombre = String(body.nombre || '').trim().slice(0, 80);

    if (!/^\S+@\S+\.\S{2,}$/.test(email)) {
      return Response.json({ error: 'Email inválido' }, { status: 400 });
    }

    // ── Anti-abuso: 1 giro por email. Si ya giró, devolvemos su cupón. ──
    const previos = await sr.entities.Cupon.filter({ origen: 'ruleta', email_asignado: email }).catch(() => []);
    if (previos.length > 0) {
      const c = previos[0];
      const idx = PREMIOS.findIndex((p) => p.tipo === c.tipo && p.valor === c.valor);
      return Response.json({
        ok: true,
        ya_jugado: true,
        segment_index: idx >= 0 ? idx : 0,
        premio: { label: c.descripcion || 'Tu premio', tipo: c.tipo, valor: c.valor },
        codigo: c.codigo,
        expira: c.fecha_expiracion,
      });
    }

    // ── Premio server-side + cupón personal de un uso ──
    const idx = elegirPremio();
    const premio = PREMIOS[idx];
    const codigo = `GIRO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const expiraDate = new Date(Date.now() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000);
    const expira = expiraDate.toISOString().slice(0, 10);

    await sr.entities.Cupon.create({
      codigo,
      descripcion: `Ruleta fidelización: ${premio.label} (${email})`,
      tipo: premio.tipo,
      valor: premio.valor,
      minimo_compra_clp: MINIMO_COMPRA,
      max_descuento_clp: premio.tipo === 'porcentaje' ? 10000 : undefined,
      usos_max: 1,
      usos_actuales: 0,
      uso_unico_por_email: true,
      origen: 'ruleta',
      email_asignado: email,
      fecha_expiracion: expira,
      activo: true,
    });

    // ── Captura del suscriptor (si no existe) ──
    const subs = await sr.entities.Suscriptor.filter({ email }).catch(() => []);
    if (subs.length === 0) {
      await sr.entities.Suscriptor.create({
        email,
        nombre,
        segmento: 'B2C',
        origen: 'ruleta',
        page_path: String(body.page_path || '/'),
        tags: ['ruleta'],
        estado: 'Activo',
      }).catch(() => {});
    } else if (nombre && !subs[0].nombre) {
      await sr.entities.Suscriptor.update(subs[0].id, { nombre }).catch(() => {});
    }

    // ── Email con el código (best-effort, el código igual va en la respuesta) ──
    let email_enviado = false;
    try {
      email_enviado = await enviarEmailCupon(base44, email, nombre, premio, codigo, expira);
    } catch (_) { /* el código se muestra en pantalla igual */ }

    return Response.json({
      ok: true,
      ya_jugado: false,
      segment_index: idx,
      premio: { label: premio.label, tipo: premio.tipo, valor: premio.valor },
      codigo,
      expira,
      email_enviado,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});