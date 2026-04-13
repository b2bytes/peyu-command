import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const proposals = await base44.asServiceRole.entities.CorporateProposal.list('-created_date', 200);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const expiring = proposals.filter(p => {
      if (!['Enviada', 'Borrador'].includes(p.status)) return false;
      if (!p.fecha_vencimiento) return false;
      const expDate = new Date(p.fecha_vencimiento);
      const daysLeft = Math.round((expDate - today) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 3; // 0-3 days left
    });

    const expired = proposals.filter(p => {
      if (!['Enviada', 'Borrador'].includes(p.status)) return false;
      if (!p.fecha_vencimiento) return false;
      return p.fecha_vencimiento < todayStr;
    });

    // Mark expired
    for (const p of expired) {
      await base44.asServiceRole.entities.CorporateProposal.update(p.id, { status: 'Vencida' });
    }

    // Notify for expiring ones - send reminder emails
    let emailsSent = 0;
    for (const prop of expiring) {
      if (!prop.email) continue;
      const expDate = new Date(prop.fecha_vencimiento);
      const daysLeft = Math.round((expDate - today) / (1000 * 60 * 60 * 24));

      const propUrl = `https://peyuchile.cl/b2b/propuesta?id=${prop.id}`;
      const body = `
<!DOCTYPE html><html lang="es"><body style="font-family:Inter,Arial,sans-serif;background:#F7F7F5;margin:0;padding:20px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#D96B4D;padding:24px 32px">
    <p style="color:#fff;font-size:12px;margin:0 0 4px;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE</p>
    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">⏰ Tu propuesta vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}</h1>
  </div>
  <div style="padding:28px">
    <p style="color:#4B4F54;font-size:14px;margin:0 0 16px">Hola <strong>${prop.contacto}</strong>,</p>
    <p style="color:#4B4F54;font-size:14px;line-height:1.6;margin:0 0 20px">
      Tu propuesta para <strong>${prop.empresa}</strong>${prop.total ? ` por $${prop.total.toLocaleString('es-CL')} CLP` : ''} vence el <strong>${prop.fecha_vencimiento}</strong>.
      Puedes aceptarla con un clic:
    </p>
    <div style="text-align:center;margin:24px 0">
      <a href="${propUrl}" style="display:inline-block;background:#006D5B;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px">
        Ver y aceptar propuesta →
      </a>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
      ¿Necesitas ajustar algo? WhatsApp: +56 9 3504 0242
    </p>
  </div>
</div></body></html>`;

      await base44.integrations.Core.SendEmail({
        to: prop.email,
        subject: `Recordatorio: tu propuesta Peyu vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
        body,
        from_name: 'Carlos · Peyu Chile',
      });
      emailsSent++;
    }

    return Response.json({
      success: true,
      expired_marked: expired.length,
      expiring_reminders_sent: emailsSent,
      checked_at: todayStr,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});