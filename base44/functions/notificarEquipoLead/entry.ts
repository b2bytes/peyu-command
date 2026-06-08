import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Notifica al equipo cuando entra un nuevo lead
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || event.type !== 'created') {
      return Response.json({ ok: true });
    }

    const leadData = data;
    const urgency = leadData.urgency || 'Normal';
    const source = leadData.source || 'Desconocida';
    const contacto = `${leadData.contact_name || 'Sin nombre'} · ${leadData.company_name || 'Empresa desconocida'}`;
    const email = leadData.email || 'Sin email';
    const phone = leadData.phone || 'Sin teléfono';

    // Enviar notificación por email al equipo
    const emailBody = `
<h2>🚨 Nuevo Lead B2B Recibido</h2>
<p><strong>Fuente:</strong> ${source}</p>
<p><strong>Urgencia:</strong> ${urgency}</p>
<hr />
<h3>${contacto}</h3>
<ul>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Teléfono:</strong> ${phone}</li>
  ${leadData.product_interest ? `<li><strong>Producto de interés:</strong> ${leadData.product_interest}</li>` : ''}
  ${leadData.qty_estimate ? `<li><strong>Cantidad estimada:</strong> ${leadData.qty_estimate} u</li>` : ''}
  ${leadData.delivery_date ? `<li><strong>Fecha requerida:</strong> ${leadData.delivery_date}</li>` : ''}
</ul>
${leadData.notes ? `<p><strong>Notas:</strong> ${leadData.notes}</p>` : ''}
<hr />
<p><strong>Acción:</strong> Ingresa a PiplineB2B para contactar y asignar.</p>
    `;

    // Enviar email al equipo PEYU
    await base44.integrations.Core.SendEmail({
      to: 'ventas@peyuchile.cl',
      subject: `🔥 Nuevo Lead: ${urgency} · ${contacto}`,
      html: emailBody,
      from: 'notificaciones@peyuchile.cl',
    });

    // Log de éxito
    console.log(`Notificación enviada para lead: ${email}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Error notificando lead:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});