// ════════════════════════════════════════════════════════════════════════
// cotizacionSeguimientoCRON — Secuencia de seguimiento post-cotización.
// ────────────────────────────────────────────────────────────────────────
// Corre a diario. Para cada Cotizacion generada desde el chat/WhatsApp que
// sigue sin aprobarse (Borrador/Enviada, sin pago ni aprobada_at), envía una
// secuencia de 3 correos de enganche vía Gmail (ti@peyuchile.cl):
//   · Toque 1 (día 2):  "¿Revisaste tu propuesta?" — recordatorio cálido + CTA
//   · Toque 2 (día 5):  "Tu precio preferente sigue reservado" — oportunidad
//   · Toque 3 (día 12): "Tu propuesta vence en 3 días" — urgencia + ayuda
// Idempotente: marca cada toque en cot.embudo.seguimiento_N_at.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function encodeHeader(str) {
  if (!str) return '';
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7E]*$/.test(str)) return str;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(str)))}?=`;
}

function buildMime({ to, subject, html }) {
  const boundary = `peyu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return [
    `From: ${encodeHeader('PEYU Chile')} <ti@peyuchile.cl>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`,
  ].join('\r\n');
}

// Plantilla base con branding PEYU + doble CTA (aprobar online / WhatsApp).
function renderEmail({ titulo, cuerpo, cot, pdfUrl, ctaLabel }) {
  const aprobarUrl = `https://peyuchile.cl/aprobar-propuesta?cot=${cot.id}`;
  const waUrl = `https://wa.me/56979471933?text=${encodeURIComponent(`Hola PEYU, quiero avanzar con mi propuesta ${cot.numero} 🐢`)}`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE8;padding:24px 0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
          <tr><td style="background:#0B4634;padding:26px 28px;border-radius:16px 16px 0 0">
            <p style="color:#fff;margin:0;font-size:22px;font-weight:800">PEYU 🐢</p>
            <p style="color:#fff;margin:14px 0 0;font-size:18px;font-weight:700">${titulo}</p>
          </td></tr>
          <tr><td style="background:#ffffff;padding:24px 28px;border:1px solid #E5DED2;border-top:0">
            ${cuerpo}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;background:#FAF6EE;border-radius:12px;margin:16px 0">
              <tr><td style="padding:9px 14px;color:#646E68">Propuesta</td><td style="padding:9px 14px;text-align:right;font-weight:700">${cot.numero}</td></tr>
              <tr><td style="padding:9px 14px;color:#646E68">Cantidad</td><td style="padding:9px 14px;text-align:right;font-weight:700">${cot.cantidad} unidades</td></tr>
              <tr><td style="padding:9px 14px;color:#0B4634;font-weight:800;border-top:2px solid #0F8B6C">Total (IVA incl.)</td><td style="padding:9px 14px;text-align:right;font-weight:800;font-size:16px;color:#0F8B6C;border-top:2px solid #0F8B6C">$${(cot.total || 0).toLocaleString('es-CL')}</td></tr>
            </table>
            ${cot.mockup_url ? `<div style="text-align:center;margin:14px 0"><img src="${cot.mockup_url}" alt="Tu grabado" width="320" style="max-width:100%;border-radius:12px;border:1px solid #E5DED2"/></div>` : ''}
            <div style="text-align:center;margin:20px 0 4px">
              <a href="${aprobarUrl}" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:13px 28px;border-radius:999px;font-weight:800;font-size:14px">${ctaLabel} →</a>
              <br/>
              <a href="${waUrl}" style="display:inline-block;margin-top:10px;color:#0B6E55;text-decoration:none;padding:10px 22px;border-radius:999px;font-weight:700;font-size:13px;border:2px solid #0F8B6C">💬 Conversemos por WhatsApp</a>
            </div>
            ${pdfUrl ? `<p style="font-size:12px;color:#8C9691;text-align:center;margin:12px 0 0"><a href="${pdfUrl}" style="color:#0B6E55">Volver a ver el PDF de tu propuesta</a></p>` : ''}
          </td></tr>
          <tr><td style="background:#121C18;padding:16px 28px;border-radius:0 0 16px 16px">
            <p style="color:#fff;font-size:12px;font-weight:700;margin:0">PEYUCHILE SpA · peyuchile.cl</p>
            <p style="color:#AADCCD;font-size:11px;margin:4px 0 0">corporativos@peyuchile.cl · +56 9 7947 1933</p>
          </td></tr>
        </table>
      </td></tr>
    </table>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Corre como automatización programada (sin usuario) o admin manual.
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cots = await base44.asServiceRole.entities.Cotizacion.filter(
      { estado: { $in: ['Borrador', 'Enviada'] } }, '-created_date', 200,
    );

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const now = Date.now();
    const resultados = [];
    const yaContactados = new Set(); // máx 1 correo por destinatario por corrida
    let enviados = 0;

    for (const cot of cots || []) {
      if (enviados >= 20) break; // límite por corrida
      const email = cot.email || '';
      if (!/\S+@\S+\.\S+/.test(email)) continue;
      const emailKey = email.toLowerCase().split(',')[0].trim();
      if (yaContactados.has(emailKey)) continue;
      if (cot.aprobada_at || cot.pago_confirmado) continue;
      if (/^TEST/i.test(cot.empresa || '')) continue;

      const ageDays = (now - new Date(cot.created_date).getTime()) / 86400000;
      const embudo = (cot.embudo && typeof cot.embudo === 'object') ? cot.embudo : {};

      let toque = null;
      if (ageDays >= 12 && !embudo.seguimiento_3_at) toque = 3;
      else if (ageDays >= 5 && !embudo.seguimiento_2_at) toque = 2;
      else if (ageDays >= 2 && !embudo.seguimiento_1_at) toque = 1;
      if (!toque) continue;

      // Vencida hace rato → no insistimos más allá del toque 3.
      if (ageDays > 16) continue;

      const contacto = cot.contacto || '';
      const pdfUrl = (cot.notas || '').match(/PDF:\s*(https?:\S+)/)?.[1] || '';
      const diasParaVencer = Math.max(1, Math.round(15 - ageDays));

      let subject, titulo, cuerpo, ctaLabel;
      if (toque === 1) {
        subject = `${contacto ? `${contacto}, ` : ''}¿revisaste tu propuesta PEYU ${cot.numero}? 🐢`;
        titulo = `¿Qué te pareció tu propuesta${contacto ? `, ${contacto}` : ''}?`;
        cuerpo = `<p style="font-size:14px;color:#333;line-height:1.6;margin:0">Hace un par de días te preparamos la propuesta de <strong>${cot.cantidad}u</strong> con tu personalización. Tu cupo de producción de esta semana sigue disponible — si apruebas hoy, entramos a producir de inmediato y cumples tu fecha sin apuros 🚀</p><p style="font-size:13px;color:#646E68;line-height:1.6;margin:12px 0 0">¿Dudas de cantidades, colores o grabado? Respóndeme este correo o escríbenos por WhatsApp y lo ajustamos al tiro.</p>`;
        ctaLabel = 'Aprobar mi propuesta';
      } else if (toque === 2) {
        subject = `Tu precio preferente de ${cot.numero} sigue reservado 💚`;
        titulo = 'Tu precio por volumen sigue reservado';
        cuerpo = `<p style="font-size:14px;color:#333;line-height:1.6;margin:0">Reservamos tu precio preferente por volumen${cot.cantidad >= 10 ? ' <strong>con grabado láser de tu logo GRATIS</strong>' : ''} mientras tu propuesta esté vigente (quedan ~${diasParaVencer} días). Después de esa fecha tendríamos que recotizar según agenda de producción.</p><p style="font-size:13px;color:#646E68;line-height:1.6;margin:12px 0 0">🌱 Dato: esta orden rescata ~${Math.round((cot.cantidad || 0) * 18).toLocaleString('es-CL')} tapitas plásticas. Tu marca cuenta esa historia en cada escritorio.</p>`;
        ctaLabel = 'Asegurar mi precio';
      } else {
        subject = `⏳ Tu propuesta ${cot.numero} vence en ${diasParaVencer} días`;
        titulo = `Tu propuesta vence en ${diasParaVencer} días`;
        cuerpo = `<p style="font-size:14px;color:#333;line-height:1.6;margin:0">Último recordatorio${contacto ? `, ${contacto}` : ''}: tu propuesta está por vencer. Si aún te interesa, apruébala hoy y agendamos tu producción de inmediato. Si algo no te cerró (precio, cantidades, plazos), cuéntanos — la ajustamos sin costo ni compromiso.</p>`;
        ctaLabel = 'Aprobar antes que venza';
      }

      const html = renderEmail({ titulo, cuerpo, cot, pdfUrl, ctaLabel });
      const raw = btoa(unescape(encodeURIComponent(buildMime({ to: email, subject, html }))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const gr = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
      });

      if (gr.ok) {
        enviados++;
        yaContactados.add(emailKey);
        await base44.asServiceRole.entities.Cotizacion.update(cot.id, {
          estado: 'Enviada',
          embudo: { ...embudo, [`seguimiento_${toque}_at`]: new Date().toISOString() },
        });
        resultados.push({ numero: cot.numero, email, toque });
      } else {
        console.error(`Gmail seguimiento ${cot.numero} error:`, (await gr.text()).slice(0, 300));
      }
    }

    return Response.json({ ok: true, enviados, resultados });
  } catch (error) {
    console.error('cotizacionSeguimientoCRON error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});