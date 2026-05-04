import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// sendSelfServiceProposalEmail — Email B2B auto-generado (self-service)
// ============================================================================
// Mismo lenguaje visual que sendProposalEmail. Envía vía Resend (permite
// destinatarios externos sin necesidad de dominio verificado).
// ----------------------------------------------------------------------------

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

function buildClientHtml({ proposal, items, proposalUrl, acceptUrl }) {
  const rows = items.map(it => `
    <tr>
      <td style="padding:14px 12px;border-bottom:1px solid #EEF1F0;font-size:14px;color:#0F172A;font-weight:600;">
        ${it.nombre || it.name || '-'}
        ${it.personalizacion ? '<div style="font-size:11px;font-weight:500;color:#0F8B6C;margin-top:2px;">+ Personalización láser UV</div>' : ''}
      </td>
      <td style="padding:14px 8px;border-bottom:1px solid #EEF1F0;text-align:center;font-size:14px;color:#475569;font-variant-numeric:tabular-nums;">${it.cantidad || it.qty || 0}</td>
      <td style="padding:14px 8px;border-bottom:1px solid #EEF1F0;text-align:right;font-size:14px;color:#475569;font-variant-numeric:tabular-nums;">${fmtCLP(it.precio_unitario)}</td>
      <td style="padding:14px 8px;border-bottom:1px solid #EEF1F0;text-align:right;font-size:13px;color:#0F8B6C;font-weight:600;">${it.descuento_pct ? '-' + it.descuento_pct + '%' : '—'}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #EEF1F0;text-align:right;font-size:14px;font-weight:700;color:#0F172A;font-variant-numeric:tabular-nums;">${fmtCLP(it.line_total)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px;">
  <tr><td align="center">

    <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 6px 28px rgba(15,23,42,0.06);">

      <!-- HERO -->
      <tr><td style="background:linear-gradient(135deg,#0F172A 0%,#0A4A3D 60%,#0F8B6C 100%);padding:40px;color:#fff;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;color:#A7D9C9;text-transform:uppercase;">PEYU · COTIZACIÓN INSTANTÁNEA</p>
        <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-0.5px;">Tu propuesta auto-generada está lista</h1>
        <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.5;">Propuesta <strong style="color:#fff;">N° ${proposal.numero}</strong> · Precios por volumen aplicados</p>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:36px 40px 8px;">
        <p style="margin:0 0 8px;font-size:16px;color:#0F172A;font-weight:600;">Hola ${proposal.contacto},</p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
          Generamos tu propuesta al instante. Aquí está el detalle con descuentos por volumen ya aplicados.
        </p>

        <!-- TOTAL CARD -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F0FAF7 0%,#E0F2EB 100%);border:1px solid #C8E6DA;border-radius:16px;margin-bottom:24px;">
          <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#0F8B6C;text-transform:uppercase;">Inversión total</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:#0F172A;letter-spacing:-1px;line-height:1;font-variant-numeric:tabular-nums;">${fmtCLP(proposal.total)}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#64748B;">CLP · IVA incluido</p>
          </td></tr>
        </table>

        <!-- KEY INFO -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td width="33%" style="padding:14px 8px;background:#FAFAF8;border-radius:12px;text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Lead time</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0F172A;">${proposal.lead_time_dias} días</p>
            </td>
            <td width="6"></td>
            <td width="33%" style="padding:14px 8px;background:#FAFAF8;border-radius:12px;text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Validez</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0F172A;">${proposal.validity_days || 15} días</p>
            </td>
            <td width="6"></td>
            <td width="33%" style="padding:14px 8px;background:#FAFAF8;border-radius:12px;text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Anticipo</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0F172A;">${proposal.anticipo_pct || 50}%</p>
            </td>
          </tr>
        </table>

        <!-- ITEMS TABLE -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Detalle del pedido</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:32px;">
          <thead>
            <tr style="background:#0F172A;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;border-radius:8px 0 0 8px;">Producto</th>
              <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;">Cant.</th>
              <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;">Unit.</th>
              <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;">Desc.</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;border-radius:0 8px 8px 0;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <!-- CTA PRIMARIO -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr><td align="center">
            <a href="${acceptUrl}" style="display:block;background:linear-gradient(135deg,#0F8B6C 0%,#0A6B54 100%);color:#FFFFFF;text-decoration:none;padding:18px 28px;border-radius:14px;font-weight:700;font-size:16px;box-shadow:0 6px 20px rgba(15,139,108,0.35);text-align:center;">
              Aceptar propuesta — ${fmtCLP(proposal.total)}
            </a>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr><td align="center">
            <a href="${proposalUrl}" style="display:inline-block;color:#0F8B6C;text-decoration:none;padding:10px 16px;font-weight:600;font-size:13px;">
              Ver detalle online y descargar PDF →
            </a>
          </td></tr>
        </table>

        <!-- WHATSAPP BOX -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E6;border-left:4px solid #F59E0B;border-radius:8px;margin-bottom:28px;">
          <tr><td style="padding:14px 18px;">
            <p style="margin:0;font-size:13px;color:#78350F;line-height:1.55;">
              <strong>¿Quieres ajustar algo?</strong> Responde este email o escríbenos por WhatsApp al
              <a href="https://wa.me/56935040242" style="color:#0F8B6C;text-decoration:none;font-weight:700;">+56 9 3504 0242</a>. Te atendemos en menos de 24h.
            </p>
          </td></tr>
        </table>

        <!-- TÉRMINOS -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Condiciones</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${[
            `Anticipo ${proposal.anticipo_pct || 50}% para iniciar producción · saldo contra despacho.`,
            `Garantía 10 años en plástico 100% reciclado.`,
            `Fabricación local en Chile · láser UV gratis desde 10 u.`,
            `Despacho a todo Chile vía Starken/Chilexpress/BlueExpress.`,
          ].map(c => `
          <tr><td style="padding:5px 0;font-size:13px;color:#475569;line-height:1.5;">
            <span style="color:#0F8B6C;font-weight:700;">✓</span>&nbsp;&nbsp;${c}
          </td></tr>`).join('')}
        </table>

      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#0F172A;padding:28px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:13px;color:#FFFFFF;font-weight:700;">PEYU Chile SpA</p>
        <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Plástico que renace 🐢 · Providencia · Macul</p>
        <p style="margin:0;font-size:11px;">
          <a href="https://peyuchile.cl" style="color:#A7D9C9;text-decoration:none;">peyuchile.cl</a>
          <span style="color:#475569;margin:0 6px;">·</span>
          <a href="mailto:ventas@peyuchile.cl" style="color:#A7D9C9;text-decoration:none;">ventas@peyuchile.cl</a>
          <span style="color:#475569;margin:0 6px;">·</span>
          <a href="https://wa.me/56935040242" style="color:#A7D9C9;text-decoration:none;">+56 9 3504 0242</a>
        </p>
      </td></tr>
    </table>

  </td></tr>
</table>

</body></html>`;
}

function buildInternalHtml({ proposal, items, form }) {
  const rows = items.map(it =>
    `<li style="margin-bottom:6px;"><strong>${it.nombre}</strong> × ${it.cantidad || it.qty} @ ${fmtCLP(it.precio_unitario)} = <strong style="color:#0F8B6C;">${fmtCLP(it.line_total)}</strong>${it.personalizacion ? ' <em style="color:#7c3aed;">(personalización)</em>' : ''}</li>`
  ).join('');
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:600px;background:#fff;padding:32px;border-radius:12px;border:2px solid #0F8B6C;">
  <h2 style="color:#0F8B6C;margin:0 0 16px;font-size:20px;">🎯 Nueva propuesta auto-generada · ${proposal.numero}</h2>
  <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;">
    <tr><td style="padding:6px 0;color:#64748b;width:140px;">Empresa:</td><td><strong>${form.company_name}</strong> ${form.rut ? '· ' + form.rut : ''}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Contacto:</td><td>${form.contact_name} · ${form.email} ${form.phone ? '· ' + form.phone : ''}</td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Total:</td><td><strong style="color:#0F8B6C;font-size:18px;">${fmtCLP(proposal.total)}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#64748b;">Lead time:</td><td>${proposal.lead_time_dias} días</td></tr>
  </table>
  <h3 style="color:#0F172A;margin:20px 0 8px;font-size:14px;">Detalle</h3>
  <ul style="margin:0;padding-left:20px;color:#475569;font-size:13px;">${rows}</ul>
  ${form.notes ? `<p style="margin-top:16px;padding:12px;background:#FFF8E6;border-radius:8px;color:#78350F;font-size:13px;"><strong>Notas:</strong> ${form.notes}</p>` : ''}
  <p style="margin-top:20px;color:#64748b;font-size:12px;">⚡ Contactar al cliente en menos de 24h para cerrar.</p>
</div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { proposalId, form } = await req.json();

    if (!proposalId) return Response.json({ error: 'proposalId requerido' }, { status: 400 });

    const list = await base44.asServiceRole.entities.CorporateProposal.filter({ id: proposalId });
    if (!list || list.length === 0) return Response.json({ error: 'Propuesta no encontrada' }, { status: 404 });
    const proposal = list[0];
    const items = (() => { try { return proposal.items_json ? JSON.parse(proposal.items_json) : []; } catch { return []; } })();

    const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://peyuchile.cl';
    const baseUrl = origin.replace(/\/$/, '').split('/').slice(0, 3).join('/');
    const proposalUrl = `${baseUrl}/b2b/propuesta?id=${proposal.id}`;
    const acceptUrl = `${baseUrl}/b2b/propuesta?id=${proposal.id}&action=accept`;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) return Response.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 });
    const FROM_ADDR = 'PEYU Chile <onboarding@resend.dev>';

    const sendViaResend = async ({ to, subject, html }) => {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_ADDR, to: [to], subject, html }),
      });
      if (!r.ok) {
        const err = await r.text();
        throw new Error(`Resend ${r.status}: ${err}`);
      }
      return r.json();
    };

    if (proposal.email) {
      await sendViaResend({
        to: proposal.email,
        subject: `Propuesta PEYU N° ${proposal.numero} · ${fmtCLP(proposal.total)}`,
        html: buildClientHtml({ proposal, items, proposalUrl, acceptUrl }),
      });
    }

    try {
      await sendViaResend({
        to: 'ventas@peyuchile.cl',
        subject: `[Nueva propuesta] ${proposal.numero} · ${proposal.empresa} · ${fmtCLP(proposal.total)}`,
        html: buildInternalHtml({ proposal, items, form: form || { contact_name: proposal.contacto, company_name: proposal.empresa, email: proposal.email } }),
      });
    } catch (e) {
      console.warn('Email interno falló (no bloquea al cliente):', e?.message);
    }

    return Response.json({ success: true, sent_to: proposal.email });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});