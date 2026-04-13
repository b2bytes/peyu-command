import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { proposalId } = await req.json();
    if (!proposalId) return Response.json({ error: 'proposalId requerido' }, { status: 400 });

    const list = await base44.asServiceRole.entities.CorporateProposal.filter({ id: proposalId });
    if (!list || list.length === 0) return Response.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    const prop = list[0];

    if (!prop.email) return Response.json({ error: 'La propuesta no tiene email del cliente' }, { status: 400 });

    const baseUrl = req.headers.get('origin') || 'https://app.base44.com';
    const propUrl = `${baseUrl}/b2b/propuesta?id=${proposalId}`;

    const items = (() => {
      try { return prop.items_json ? JSON.parse(prop.items_json) : []; } catch { return []; }
    })();

    const itemsHtml = items.map(i =>
      `<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:8px 0">${i.nombre || i.name || ''}</td><td style="padding:8px 0;text-align:right">${i.qty || i.cantidad} u.</td><td style="padding:8px 0;text-align:right">$${(i.precio_unitario || 0).toLocaleString('es-CL')}</td></tr>`
    ).join('');

    const body = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:Inter,Arial,sans-serif;background:#F7F7F5;margin:0;padding:20px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0F172A,#006D5B);padding:32px 32px 24px">
      <p style="color:#A7D9C9;font-size:12px;margin:0 0 4px;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE · REGALOS CORPORATIVOS SUSTENTABLES</p>
      <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0">Tu propuesta corporativa está lista 🌿</h1>
    </div>

    <div style="padding:32px">
      <p style="color:#4B4F54;font-size:15px;margin:0 0 20px">Hola <strong>${prop.contacto}</strong>,</p>
      <p style="color:#4B4F54;font-size:14px;line-height:1.6;margin:0 0 24px">
        Preparamos una propuesta personalizada para <strong>${prop.empresa}</strong> con productos de plástico 100% reciclado, fabricados aquí en Chile.
      </p>

      ${prop.total ? `
      <!-- Resumen -->
      <div style="background:#f0faf7;border-radius:12px;padding:20px;margin:0 0 24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="color:#4B4F54;font-size:13px">Total propuesta</span>
          <span style="color:#006D5B;font-size:22px;font-weight:700">$${prop.total.toLocaleString('es-CL')} CLP</span>
        </div>
        ${prop.lead_time_dias ? `<div style="color:#6b7280;font-size:12px">Lead time: ${prop.lead_time_dias} días hábiles · Anticipo ${prop.anticipo_pct || 50}% para iniciar</div>` : ''}
        ${prop.validity_days ? `<div style="color:#6b7280;font-size:12px">Validez: ${prop.validity_days} días desde hoy</div>` : ''}
      </div>` : ''}

      ${itemsHtml ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
        <thead><tr style="border-bottom:2px solid #f0f0f0">
          <th style="text-align:left;padding-bottom:8px;color:#6b7280;font-weight:600">Producto</th>
          <th style="text-align:right;padding-bottom:8px;color:#6b7280;font-weight:600">Cant.</th>
          <th style="text-align:right;padding-bottom:8px;color:#6b7280;font-weight:600">Precio u.</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>` : ''}

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0">
        <a href="${propUrl}" style="display:inline-block;background:#006D5B;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px">
          Ver y responder propuesta →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:12px 0 0">O copia este enlace: <a href="${propUrl}" style="color:#006D5B">${propUrl}</a></p>
      </div>

      <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
        ¿Tienes dudas? Escríbenos por WhatsApp al +56 9 3504 0242 · ventas@peyuchile.cl<br>
        Peyu Chile SPA · Fabricamos el futuro del plástico reciclado 🌎
      </p>
    </div>
  </div>
</body>
</html>`;

    await base44.integrations.Core.SendEmail({
      to: prop.email,
      subject: `Propuesta corporativa Peyu Chile — ${prop.empresa} #${prop.numero || proposalId.slice(-6)}`,
      body,
      from_name: 'Carlos · Peyu Chile',
    });

    // Update status to Enviada
    await base44.asServiceRole.entities.CorporateProposal.update(proposalId, {
      status: 'Enviada',
      fecha_envio: new Date().toISOString().split('T')[0],
    });

    return Response.json({ success: true, to: prop.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});