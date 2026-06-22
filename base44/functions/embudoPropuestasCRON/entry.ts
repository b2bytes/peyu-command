// ════════════════════════════════════════════════════════════════════════
// embudoPropuestasCRON — Secuencia de embudo post-aprobación (toques diferidos)
// ────────────────────────────────────────────────────────────────────────
// Corre cada hora. Recorre las Cotizaciones "Aceptadas" cuyo pago aún NO está
// confirmado y envía recordatorios escalonados para cerrar la conversión:
//   · Toque 1  (≈24h tras aprobar, sin pago): recordatorio cálido + datos pago.
//   · Toque 2  (≈72h tras aprobar, sin pago): último aviso + urgencia suave.
// Idempotente: cada toque se marca en embudo.toque_N_at y no se repite.
// Si pago_confirmado=true o estado≠Aceptada, la secuencia se detiene sola.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');
const PEYU = { email: 'corporativos@peyuchile.cl', wsp: '56979471933', razon: 'PEYUCHILE SpA', rut: '77.069.974-6' };
const H = (ms) => ms / (1000 * 60 * 60);

function buildToqueHtml({ cot, toque, anticipo }) {
  const total = cot.total || 0;
  const esUltimo = toque === 2;
  const titulo = esUltimo ? '¿Avanzamos con tu pedido?' : 'Tu propuesta sigue lista 🌱';
  const intro = esUltimo
    ? `Tu propuesta ${cot.numero} sigue reservada, pero está por vencer. Apenas confirmes el pago, tu logo empieza a grabarse sobre plástico que rescatamos del mar.`
    : `Gracias por aprobar tu propuesta ${cot.numero}. Para iniciar la producción solo falta confirmar el pago. Cada unidad nace de tapitas recicladas: tu marca eligiendo cuidar el planeta.`;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#F4F1EB;font-family:-apple-system,Segoe UI,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,.06)">
  <tr><td style="background:linear-gradient(135deg,#0F8B6C,#0A6B54);padding:32px 36px;color:#fff">
    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;color:#A7D9C9;text-transform:uppercase">${esUltimo ? 'Último aviso' : 'Recordatorio'}</p>
    <h1 style="margin:0;font-size:21px;font-weight:800;color:#fff">${titulo}</h1>
  </td></tr>
  <tr><td style="padding:30px 36px">
    <p style="margin:0 0 6px;font-size:15px;color:#0F172A;font-weight:600">Hola ${cot.contacto || ''}</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569">${intro}</p>
    <table width="100%" style="background:#F0FAF7;border:1px solid #C8E6DA;border-radius:12px;margin-bottom:20px"><tr><td style="padding:16px 20px;font-size:13px;color:#0F172A;line-height:1.8">
      <strong>${cot.sku}</strong> × ${cot.cantidad}u — Total ${fmtCLP(total)} (IVA incl.)<br>
      <span style="color:#0F8B6C;font-weight:700">Retiro:</span> 50% ahora (${fmtCLP(anticipo)}) · <span style="color:#0F8B6C;font-weight:700">Despacho:</span> abono 100%
    </td></tr></table>
    <table width="100%"><tr><td align="center">
      <a href="https://wa.me/${PEYU.wsp}?text=${encodeURIComponent(`Hola PEYU, quiero confirmar el pago de mi propuesta ${cot.numero}.`)}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:14px 26px;border-radius:13px;font-weight:700;font-size:15px">💬 Confirmar pago por WhatsApp</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#0F172A;padding:20px 36px;text-align:center">
    <p style="margin:0;font-size:11px;color:#94A3B8">${PEYU.razon} · RUT ${PEYU.rut} · ${PEYU.email}</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

async function postResend({ to, subject, html }) {
  const KEY = Deno.env.get('RESEND_API_KEY');
  if (!KEY) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'PEYU Chile <ventas@peyuchile.cl>', to: [to], subject, html, reply_to: PEYU.email }),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const aceptadas = await sr.entities.Cotizacion.filter({ estado: 'Aceptada' }, '-aprobada_at', 200);
    const ahora = Date.now();
    let enviados = 0;
    const detalle = [];

    for (const cot of aceptadas) {
      if (cot.pago_confirmado) continue;            // ya pagó → no molestar
      if (!cot.email || !/\S+@\S+\.\S+/.test(cot.email)) continue;
      const aprob = cot.aprobada_at ? new Date(cot.aprobada_at).getTime() : null;
      if (!aprob) continue;
      const horas = H(ahora - aprob);
      const emb = cot.embudo || {};
      const anticipo = Math.round((cot.total || 0) * 0.5);

      let toque = null;
      if (horas >= 72 && !emb.toque_2_at) toque = 2;
      else if (horas >= 24 && !emb.toque_1_at) toque = 1;
      if (!toque) continue;

      const ok = await postResend({
        to: cot.email,
        subject: toque === 2
          ? `⏳ Último aviso · tu propuesta ${cot.numero} está por vencer`
          : `🌱 ¿Confirmamos tu propuesta ${cot.numero}?`,
        html: buildToqueHtml({ cot, toque, anticipo }),
      }).catch(() => false);

      if (ok) {
        await sr.entities.Cotizacion.update(cot.id, {
          embudo: { ...emb, [`toque_${toque}_at`]: new Date().toISOString() },
        });
        enviados++;
        detalle.push({ numero: cot.numero, toque });
      }
    }

    return Response.json({ ok: true, revisadas: aceptadas.length, enviados, detalle });
  } catch (error) {
    console.error('embudoPropuestasCRON error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});