import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Envía email automático al cliente y al equipo comercial con el resumen de la propuesta B2B.
// SendEmail no soporta adjuntos binarios, pero incluimos link a la propuesta online + detalle completo.
// El PDF se puede descargar desde el link.

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

function buildClientHtml({ proposal, items, proposalUrl }) {
  const rows = items.map(it => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">
        <strong style="color:#1e293b;">${it.nombre || it.name || '-'}</strong>
        ${it.personalizacion ? '<br><span style="color:#0F8B6C;font-size:11px;">+ Personalización láser UV</span>' : ''}
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;color:#1e293b;">${it.cantidad || it.qty || 0}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;color:#1e293b;">${fmtCLP(it.precio_unitario)}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;color:#0F8B6C;font-weight:600;">${it.descuento_pct ? '-' + it.descuento_pct + '%' : '-'}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;color:#1e293b;font-weight:700;">${fmtCLP(it.line_total)}</td>
    </tr>`).join('');

  return `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#f8fafc;padding:0;">
    <div style="background:linear-gradient(135deg,#0F8B6C 0%,#06634D 100%);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;">PEYU</h1>
      <p style="color:#A7D9C9;margin:6px 0 0;font-size:12px;letter-spacing:2px;">REGALOS CORPORATIVOS SOSTENIBLES</p>
    </div>
    <div style="background:#fff;padding:32px 24px;">
      <h2 style="color:#1e293b;margin:0 0 8px;font-size:22px;">Hola ${proposal.contacto},</h2>
      <p style="color:#64748b;line-height:1.6;margin:0 0 20px;">
        Gracias por cotizar con PEYU. Aquí está tu propuesta <strong style="color:#0F8B6C;">N° ${proposal.numero}</strong>, 
        generada al instante con precios por volumen aplicados.
      </p>

      <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:4px 0;color:#64748b;font-size:12px;text-transform:uppercase;">Total</td>
            <td style="padding:4px 0;text-align:right;color:#0F8B6C;font-size:24px;font-weight:700;">${fmtCLP(proposal.total)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#64748b;font-size:12px;text-transform:uppercase;">Lead time</td>
            <td style="padding:4px 0;text-align:right;color:#1e293b;font-weight:600;">${proposal.lead_time_dias} días hábiles</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#64748b;font-size:12px;text-transform:uppercase;">Validez</td>
            <td style="padding:4px 0;text-align:right;color:#1e293b;font-weight:600;">${proposal.validity_days || 15} días</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#64748b;font-size:12px;text-transform:uppercase;">Anticipo</td>
            <td style="padding:4px 0;text-align:right;color:#1e293b;font-weight:600;">${proposal.anticipo_pct || 50}%</td>
          </tr>
        </table>
      </div>

      <h3 style="color:#1e293b;margin:24px 0 12px;font-size:16px;">Detalle del pedido</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#1e293b;color:#fff;">
            <th style="padding:10px;text-align:left;font-size:11px;">Producto</th>
            <th style="padding:10px;text-align:center;font-size:11px;">Cant.</th>
            <th style="padding:10px;text-align:right;font-size:11px;">P. Unit</th>
            <th style="padding:10px;text-align:right;font-size:11px;">Desc.</th>
            <th style="padding:10px;text-align:right;font-size:11px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="text-align:center;margin:32px 0 20px;">
        <a href="${proposalUrl}"
           style="background:linear-gradient(135deg,#0F8B6C 0%,#06634D 100%);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;display:inline-block;box-shadow:0 4px 12px rgba(15,139,108,0.3);">
          Ver propuesta y descargar PDF
        </a>
      </div>

      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:20px 0;border-radius:6px;">
        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
          <strong>✨ ¿Quieres ajustar algo?</strong> Responde este correo o escríbenos al 
          <a href="https://wa.me/56935040242" style="color:#0F8B6C;">WhatsApp +56 9 3504 0242</a>. 
          Te atendemos en menos de 24h.
        </p>
      </div>

      <h4 style="color:#1e293b;margin:24px 0 8px;font-size:14px;">Condiciones</h4>
      <ul style="color:#64748b;font-size:12px;line-height:1.7;margin:0;padding-left:20px;">
        <li>Anticipo ${proposal.anticipo_pct || 50}% para iniciar producción. Saldo contra despacho.</li>
        <li>Garantía de 10 años en plástico 100% reciclado.</li>
        <li>Fabricación local en Chile · Láser UV gratis desde 10 unidades.</li>
        <li>Despacho a todo Chile vía Starken/Chilexpress.</li>
      </ul>
    </div>

    <div style="background:#1e293b;padding:20px;text-align:center;color:#A7D9C9;font-size:11px;">
      <p style="margin:0;">PEYU Chile SpA · Providencia · Macul · Santiago</p>
      <p style="margin:4px 0 0;">peyuchile.com · hola@peyuchile.com</p>
    </div>
  </div>`;
}

function buildInternalHtml({ proposal, items, form }) {
  const rows = items.map(it =>
    `<li><strong>${it.nombre}</strong> × ${it.cantidad || it.qty} @ ${fmtCLP(it.precio_unitario)} = <strong>${fmtCLP(it.line_total)}</strong>${it.personalizacion ? ' <em>(personalización)</em>' : ''}</li>`
  ).join('');
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;">
    <h2 style="color:#0F8B6C;">🎯 Nueva propuesta auto-generada: ${proposal.numero}</h2>
    <p><strong>Empresa:</strong> ${form.company_name} (${form.rut || 'sin RUT'})</p>
    <p><strong>Contacto:</strong> ${form.contact_name} · ${form.email} · ${form.phone || 'sin tel'}</p>
    <p><strong>Total:</strong> <span style="color:#0F8B6C;font-size:20px;font-weight:700;">${fmtCLP(proposal.total)}</span></p>
    <p><strong>Lead time:</strong> ${proposal.lead_time_dias} días · <strong>Items:</strong> ${items.length}</p>
    <h3>Detalle</h3>
    <ul>${rows}</ul>
    ${form.notes ? `<p><strong>Notas:</strong> ${form.notes}</p>` : ''}
    <p style="margin-top:20px;color:#64748b;font-size:12px;">⚡ Contactar al cliente en menos de 24h para cerrar.</p>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { proposalId, form } = await req.json();

    if (!proposalId) {
      return Response.json({ error: 'proposalId requerido' }, { status: 400 });
    }

    const list = await base44.asServiceRole.entities.CorporateProposal.filter({ id: proposalId });
    if (!list || list.length === 0) {
      return Response.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    }
    const proposal = list[0];
    const items = (() => { try { return proposal.items_json ? JSON.parse(proposal.items_json) : []; } catch { return []; } })();

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://peyuchile.com';
    const baseUrl = origin.replace(/\/$/, '').split('/').slice(0, 3).join('/');
    const proposalUrl = `${baseUrl}/b2b/propuesta?id=${proposal.id}`;

    // 1. Email al cliente (usa service role para permitir envío a emails externos)
    if (proposal.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'PEYU Chile',
        to: proposal.email,
        subject: `🌱 Tu propuesta PEYU N° ${proposal.numero} — ${fmtCLP(proposal.total)}`,
        body: buildClientHtml({ proposal, items, proposalUrl }),
      });
    }

    // 2. Notificación interna al equipo comercial
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'PEYU Self-Service',
        to: 'ventas@peyuchile.cl',
        subject: `[Nueva] ${proposal.numero} · ${proposal.empresa} · ${fmtCLP(proposal.total)}`,
        body: buildInternalHtml({ proposal, items, form: form || { contact_name: proposal.contacto, company_name: proposal.empresa, email: proposal.email } }),
      });
    } catch (e) {
      console.warn('Email interno falló (no bloquea al cliente):', e?.message);
    }

    return Response.json({ success: true, sent_to: proposal.email });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});