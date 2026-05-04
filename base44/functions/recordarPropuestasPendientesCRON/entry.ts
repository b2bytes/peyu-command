// ============================================================================
// recordarPropuestasPendientesCRON · v1
// ----------------------------------------------------------------------------
// CRON diario que detecta propuestas en estado "Enviada" sin actividad por más
// de 48 horas y envía un recordatorio por Gmail al cliente. Cada envío queda
// registrado en CorporateProposal.historial[] para trazabilidad.
//
// Reglas:
//   • Solo propuestas con status="Enviada" y email
//   • Última actividad (updated_date) > 48h
//   • No se recuerda más de 3 veces
//   • Spaceado mínimo de 48h entre recordatorios consecutivos
//   • Si la propuesta ya venció, no se recuerda (lo maneja checkExpiringProposals)
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const HOURS_PENDING = 48;
const MAX_REMINDERS = 3;
const APP_BASE_URL = 'https://peyuchile.com';

function hoursSince(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function buildReminderHtml(prop, recordatorioNum) {
  const proposalUrl = `${APP_BASE_URL}/b2b/propuesta?id=${prop.id}`;
  const tone = recordatorioNum === 1
    ? { titulo: 'Solo te queremos recordar tu propuesta',
        intro: 'Hace unos días te enviamos una propuesta personalizada. Queremos asegurarnos de que la recibiste y que tienes toda la información para decidir.' }
    : recordatorioNum === 2
    ? { titulo: '¿Necesitas que te ayudemos con algo?',
        intro: 'Tu propuesta sigue disponible online. Si hay algún punto que ajustar (precio, plazos, cantidades), respondemos por WhatsApp en minutos.' }
    : { titulo: 'Última nota antes de archivar tu propuesta',
        intro: 'Si tu proyecto cambió de prioridad lo entendemos perfectamente. Si aún te interesa, este es el último recordatorio antes de marcarla como inactiva.' };

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:#0F8B6C;padding:24px 32px;">
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">PEYU CHILE · Recordatorio ${recordatorioNum}/${MAX_REMINDERS}</p>
          <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:700;line-height:1.3;">${tone.titulo}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;color:#4B4F54;font-size:14px;">Hola <b>${prop.contacto || 'equipo'}</b>,</p>
          <p style="margin:0 0 20px;color:#4B4F54;font-size:14px;line-height:1.6;">${tone.intro}</p>

          <div style="background:#f7f5f0;border-radius:12px;padding:18px 22px;margin:0 0 24px;">
            <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Tu propuesta</p>
            <p style="margin:0 0 12px;font-family:monospace;font-size:14px;color:#1f2937;font-weight:700;">${prop.numero || prop.id}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#6b7280;">Empresa</td>
                <td style="padding:4px 0;font-size:12px;color:#1f2937;text-align:right;font-weight:600;">${prop.empresa || '—'}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#6b7280;">Total</td>
                <td style="padding:4px 0;font-size:14px;color:#0F8B6C;text-align:right;font-weight:700;">$${(prop.total || 0).toLocaleString('es-CL')} CLP</td>
              </tr>
              ${prop.fecha_vencimiento ? `<tr>
                <td style="padding:4px 0;font-size:12px;color:#6b7280;">Válida hasta</td>
                <td style="padding:4px 0;font-size:12px;color:#D96B4D;text-align:right;font-weight:700;">${prop.fecha_vencimiento}</td>
              </tr>` : ''}
            </table>
          </div>

          <div style="text-align:center;margin:28px 0 8px;">
            <a href="${proposalUrl}" style="display:inline-block;background:#0F8B6C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">
              Ver y aceptar propuesta →
            </a>
          </div>
          <p style="margin:18px 0 0;text-align:center;color:#9ca3af;font-size:12px;">
            ¿Prefieres conversarlo? <a href="https://wa.me/56935040242" style="color:#0F8B6C;text-decoration:none;font-weight:600;">WhatsApp +56 9 3504 0242</a>
          </p>
        </td></tr>

        <tr><td style="background:#f7f5f0;padding:18px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">PEYU Chile · Regalos corporativos 100% plástico reciclado · Fabricación local</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Obtener token Gmail (compartido del builder)
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: 'Gmail no autorizado', detail: e.message }, { status: 503 });
    }

    const all = await base44.asServiceRole.entities.CorporateProposal.list('-updated_date', 300);

    // Candidatas: enviadas, con email, sin actividad >48h, no expiradas, <3 recordatorios
    const today = new Date().toISOString().split('T')[0];
    const candidatas = all.filter(p => {
      if (p.status !== 'Enviada') return false;
      if (!p.email) return false;
      if (p.fecha_vencimiento && p.fecha_vencimiento < today) return false;
      if ((p.recordatorios_enviados || 0) >= MAX_REMINDERS) return false;
      // 48h desde última actualización (updated_date) Y desde último recordatorio
      if (hoursSince(p.updated_date) < HOURS_PENDING) return false;
      if (p.ultimo_recordatorio_at && hoursSince(p.ultimo_recordatorio_at) < HOURS_PENDING) return false;
      return true;
    });

    let sent = 0;
    let failed = 0;
    const detalles = [];

    for (const prop of candidatas) {
      const num = (prop.recordatorios_enviados || 0) + 1;
      const html = buildReminderHtml(prop, num);
      const subject = `Recordatorio: tu propuesta ${prop.numero || ''} sigue disponible`;

      try {
        // Construcción MIME inline para evitar dependencia de otras funciones
        const boundary = `peyu-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const fromHeader = `=?UTF-8?B?${btoa(unescape(encodeURIComponent('PEYU Chile')))}?= <ti@peyuchile.cl>`;
        const subjectHeader = /^[\x20-\x7E]*$/.test(subject)
          ? subject
          : `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

        const mime = [
          `From: ${fromHeader}`,
          `To: ${prop.email}`,
          `Subject: ${subjectHeader}`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset="UTF-8"',
          'Content-Transfer-Encoding: 7bit',
          '',
          html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
          '',
          `--${boundary}`,
          'Content-Type: text/html; charset="UTF-8"',
          'Content-Transfer-Encoding: 7bit',
          '',
          html,
          '',
          `--${boundary}--`,
        ].join('\r\n');

        const raw = btoa(unescape(encodeURIComponent(mime)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

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
          throw new Error(`Gmail ${res.status}: ${errText.slice(0, 200)}`);
        }
        const result = await res.json();
        const nowIso = new Date().toISOString();

        // Registrar en historial
        const historial = Array.isArray(prop.historial) ? [...prop.historial] : [];
        historial.push({
          at: nowIso,
          type: 'reminder_sent',
          actor: 'recordarPropuestasPendientesCRON',
          channel: 'email',
          detail: `Recordatorio ${num}/${MAX_REMINDERS} enviado a ${prop.email}`,
          meta: {
            gmail_message_id: result.id,
            gmail_thread_id: result.threadId,
            subject,
            reminder_number: num,
          },
        });

        await base44.asServiceRole.entities.CorporateProposal.update(prop.id, {
          recordatorios_enviados: num,
          ultimo_recordatorio_at: nowIso,
          historial,
        });

        sent++;
        detalles.push({ id: prop.id, numero: prop.numero, email: prop.email, recordatorio: num, ok: true });
      } catch (err) {
        failed++;
        detalles.push({ id: prop.id, numero: prop.numero, email: prop.email, ok: false, error: err.message });

        // Registrar el fallo también en el historial
        try {
          const historial = Array.isArray(prop.historial) ? [...prop.historial] : [];
          historial.push({
            at: new Date().toISOString(),
            type: 'note',
            actor: 'recordarPropuestasPendientesCRON',
            channel: 'system',
            detail: `Falló recordatorio ${num}: ${err.message.slice(0, 200)}`,
            meta: { error: true, reminder_number: num },
          });
          await base44.asServiceRole.entities.CorporateProposal.update(prop.id, { historial });
        } catch {}
      }
    }

    return Response.json({
      ok: true,
      checked: all.length,
      candidates: candidatas.length,
      sent,
      failed,
      detalles,
      ran_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});