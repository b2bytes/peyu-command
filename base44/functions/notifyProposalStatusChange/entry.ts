// Automatización: se dispara cuando CorporateProposal cambia al status 'Aceptada' o 'Rechazada'.
// Envía un email al contacto de la empresa con el resumen y el link a la propuesta online.
//
// Payload esperado (entity automation):
//   { event: {type, entity_name, entity_id}, data: {...proposal}, old_data: {...}, changed_fields: [...] }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const APP_BASE_URL = 'https://peyuchile.com'; // fallback; si está en otro dominio el link seguirá siendo válido como ruta relativa

const TEMPLATES = {
  Aceptada: {
    subject: (numero) => `✅ Propuesta ${numero} aceptada — PEYU Chile`,
    heading: '¡Gracias por aceptar tu propuesta!',
    intro: 'Hemos recibido la confirmación de tu propuesta. A continuación te dejamos el resumen y los próximos pasos.',
    next_steps: [
      'Nuestro equipo se pondrá en contacto contigo en menos de 24 horas hábiles.',
      'Te enviaremos la orden de pago del anticipo (50%) para iniciar producción.',
      'Una vez recibido el anticipo, comenzamos la fabricación en nuestra planta en Chile.',
    ],
    cta_label: 'Ver propuesta online',
    color: '#0F8B6C',
  },
  Rechazada: {
    subject: (numero) => `Propuesta ${numero} — Actualización de estado`,
    heading: 'Hemos registrado tu respuesta',
    intro: 'Registramos que la propuesta no se ajusta a lo que buscas en este momento. Nos gustaría saber más para poder ayudarte mejor.',
    next_steps: [
      '¿Hubo algún aspecto que no se ajustó a tus necesidades? Cuéntanos por WhatsApp al +56 9 3504 0242.',
      'Si fue un tema de precio, cantidad o plazo, podemos ajustar una nueva propuesta sin costo.',
      'La propuesta seguirá disponible online por si necesitas revisarla o compartirla.',
    ],
    cta_label: 'Revisar propuesta',
    color: '#4B4F54',
  },
};

function buildEmailBody(proposal, template) {
  const items = (() => {
    try { return proposal.items_json ? JSON.parse(proposal.items_json) : []; }
    catch { return []; }
  })();

  const itemsHtml = items.slice(0, 10).map(it => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">
        ${it.nombre || it.name || it.sku || 'Item'}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">
        ${(it.cantidad || it.qty || 0).toLocaleString('es-CL')} u
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-family:monospace;">
        $${((it.line_total ?? ((it.precio_unitario || 0) * (it.cantidad || it.qty || 0))) || 0).toLocaleString('es-CL')}
      </td>
    </tr>
  `).join('');

  const moreItems = items.length > 10 ? `<p style="font-size:11px;color:#888;text-align:center;margin:6px 0 0;">+ ${items.length - 10} ítems más</p>` : '';

  const proposalUrl = `${APP_BASE_URL}/b2b/propuesta?id=${proposal.id}`;
  const nextStepsHtml = template.next_steps.map(s => `<li style="margin-bottom:6px;color:#4B4F54;font-size:13px;line-height:1.5;">${s}</li>`).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:${template.color};padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:22px;font-weight:700;">PEYU Chile</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:12px;">Regalos corporativos sostenibles</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:24px;color:#1f2937;font-weight:700;">${template.heading}</h1>
          <p style="margin:0 0 8px;color:#4B4F54;font-size:14px;">Hola <b>${proposal.contacto || 'equipo'}</b>,</p>
          <p style="margin:0 0 24px;color:#4B4F54;font-size:14px;line-height:1.6;">${template.intro}</p>

          <!-- Resumen -->
          <div style="background:#f7f5f0;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
            <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Resumen de propuesta</p>
            <p style="margin:0 0 12px;font-family:monospace;font-size:14px;color:#1f2937;font-weight:700;">${proposal.numero || proposal.id}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#6b7280;">Empresa</td>
                <td style="padding:4px 0;font-size:12px;color:#1f2937;text-align:right;font-weight:600;">${proposal.empresa || '—'}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#6b7280;">Total</td>
                <td style="padding:4px 0;font-size:14px;color:#0F8B6C;text-align:right;font-weight:700;">$${(proposal.total || 0).toLocaleString('es-CL')} CLP</td>
              </tr>
              ${proposal.lead_time_dias ? `
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#6b7280;">Lead time</td>
                <td style="padding:4px 0;font-size:12px;color:#1f2937;text-align:right;font-weight:600;">${proposal.lead_time_dias} días hábiles</td>
              </tr>` : ''}
              <tr>
                <td style="padding:4px 0;font-size:12px;color:#6b7280;">Estado</td>
                <td style="padding:4px 0;font-size:12px;color:${template.color};text-align:right;font-weight:700;text-transform:uppercase;">${proposal.status}</td>
              </tr>
            </table>
          </div>

          ${items.length > 0 ? `
          <!-- Items -->
          <div style="margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Detalle</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
              ${itemsHtml}
            </table>
            ${moreItems}
          </div>` : ''}

          <!-- Próximos pasos -->
          <div style="margin-bottom:24px;">
            <p style="margin:0 0 10px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Próximos pasos</p>
            <ul style="margin:0;padding-left:18px;">
              ${nextStepsHtml}
            </ul>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin:28px 0 8px;">
            <a href="${proposalUrl}" style="display:inline-block;background:${template.color};color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">
              ${template.cta_label} →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f7f5f0;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">PEYU Chile · Regalos corporativos 100% plástico reciclado · Fabricación local</p>
          <p style="margin:0;color:#9ca3af;font-size:11px;">
            <a href="https://wa.me/56935040242" style="color:#0F8B6C;text-decoration:none;">WhatsApp</a> ·
            <a href="${APP_BASE_URL}" style="color:#0F8B6C;text-decoration:none;">peyuchile.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let proposal = body?.data || null;
    const oldData = body?.old_data || null;
    const eventInfo = body?.event || {};
    const entityId = eventInfo.entity_id;

    // Si el payload vino truncado, cargamos la entidad completa
    if (body?.payload_too_large && entityId) {
      proposal = await base44.asServiceRole.entities.CorporateProposal.get(entityId);
    }

    if (!proposal) {
      return Response.json({ skipped: true, reason: 'no_proposal_data' });
    }

    const newStatus = proposal.status;
    const oldStatus = oldData?.status;

    // Validaciones: solo disparamos en cambio real a estos dos estados
    if (!['Aceptada', 'Rechazada'].includes(newStatus)) {
      return Response.json({ skipped: true, reason: `status_not_target: ${newStatus}` });
    }
    if (oldStatus && oldStatus === newStatus) {
      return Response.json({ skipped: true, reason: 'status_unchanged' });
    }
    if (!proposal.email) {
      return Response.json({ skipped: true, reason: 'no_email' });
    }

    const template = TEMPLATES[newStatus];
    const html = buildEmailBody(proposal, template);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: proposal.email,
      from_name: 'PEYU Chile',
      subject: template.subject(proposal.numero || proposal.id),
      body: html,
    });

    console.log(`Email ${newStatus} enviado a ${proposal.email} — propuesta ${proposal.numero}`);

    return Response.json({
      success: true,
      sent_to: proposal.email,
      proposal_numero: proposal.numero,
      status: newStatus,
    });
  } catch (error) {
    console.error('notifyProposalStatusChange error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});