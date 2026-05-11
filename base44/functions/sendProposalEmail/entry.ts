import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// sendProposalEmail — Email premium para propuestas B2B asistidas (Carlos)
// ============================================================================
// Diseño unificado con paleta PEYU, tipografía elegante, CTAs aceptar/rechazar
// destacados, y enlace al PDF online. Pensado para Gmail/Outlook/Apple Mail.
// ----------------------------------------------------------------------------

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL') + ' CLP';

function buildHtml({ prop, items, propUrl, acceptUrl, rejectUrl }) {
  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:14px 12px;border-bottom:1px solid #EEF1F0;font-size:14px;color:#0F172A;font-weight:600;">
        ${i.nombre || i.name || ''}
        ${i.personalizacion ? '<div style="font-size:11px;font-weight:500;color:#0F8B6C;margin-top:2px;">+ Personalización láser UV</div>' : ''}
      </td>
      <td style="padding:14px 8px;border-bottom:1px solid #EEF1F0;text-align:center;font-size:14px;color:#475569;font-variant-numeric:tabular-nums;">${i.qty || i.cantidad || 0}</td>
      <td style="padding:14px 8px;border-bottom:1px solid #EEF1F0;text-align:right;font-size:14px;color:#475569;font-variant-numeric:tabular-nums;">${fmtCLP(i.precio_unitario || 0).replace(' CLP','')}</td>
      <td style="padding:14px 12px;border-bottom:1px solid #EEF1F0;text-align:right;font-size:14px;font-weight:700;color:#0F172A;font-variant-numeric:tabular-nums;">${fmtCLP(i.line_total || (i.precio_unitario||0) * (i.qty||i.cantidad||0)).replace(' CLP','')}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Propuesta PEYU</title>
</head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;">Tu propuesta corporativa PEYU N° ${prop.numero || ''} por ${fmtCLP(prop.total)} está lista. Acepta o ajusta en un clic.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px;">
  <tr><td align="center">

    <!-- CONTAINER -->
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 6px 28px rgba(15,23,42,0.06);">

      <!-- HERO -->
      <tr><td style="background:linear-gradient(135deg,#0F172A 0%,#0A4A3D 60%,#0F8B6C 100%);padding:40px 40px 36px;color:#FFFFFF;position:relative;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;color:#A7D9C9;text-transform:uppercase;">PEYU · CORPORATE</p>
              <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">Tu propuesta está lista</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.5;">Preparada exclusivamente para <strong style="color:#fff;">${prop.empresa}</strong></p>
            </td>
            <td align="right" valign="top" style="white-space:nowrap;">
              <span style="display:inline-block;background:rgba(167,217,201,0.15);border:1px solid rgba(167,217,201,0.3);color:#A7D9C9;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.5px;">N° ${prop.numero || '—'}</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:36px 40px 8px;">
        <p style="margin:0 0 8px;font-size:16px;color:#0F172A;font-weight:600;">Hola ${prop.contacto},</p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
          Adjuntamos tu propuesta personalizada con regalos corporativos en plástico <strong>100% reciclado</strong>, fabricados localmente en Chile con grabado láser UV incluido.
        </p>

        <!-- TOTAL CARD -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F0FAF7 0%,#E0F2EB 100%);border:1px solid #C8E6DA;border-radius:16px;margin-bottom:24px;">
          <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#0F8B6C;text-transform:uppercase;">Inversión total</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:#0F172A;letter-spacing:-1px;line-height:1;font-variant-numeric:tabular-nums;">${fmtCLP(prop.total).replace(' CLP','')}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#64748B;">CLP · IVA incluido</p>
          </td></tr>
        </table>

        <!-- KEY INFO GRID -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td width="33%" style="padding:14px 8px;background:#FAFAF8;border-radius:12px;text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Lead time</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0F172A;">${prop.lead_time_dias || 7} días</p>
            </td>
            <td width="6"></td>
            <td width="33%" style="padding:14px 8px;background:#FAFAF8;border-radius:12px;text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Validez</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0F172A;">${prop.validity_days || 15} días</p>
            </td>
            <td width="6"></td>
            <td width="33%" style="padding:14px 8px;background:#FAFAF8;border-radius:12px;text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Anticipo</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0F172A;">${prop.anticipo_pct || 50}%</p>
            </td>
          </tr>
        </table>

        ${itemsHtml ? `
        <!-- ITEMS TABLE -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Detalle del pedido</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:32px;">
          <thead>
            <tr style="background:#0F172A;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px;color:#fff;text-transform:uppercase;border-radius:8px 0 0 8px;">Producto</th>
              <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.5px;color:#fff;text-transform:uppercase;">Cant.</th>
              <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px;color:#fff;text-transform:uppercase;">Unitario</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px;color:#fff;text-transform:uppercase;border-radius:0 8px 8px 0;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>` : ''}

        <!-- CTA PRIMARIO: ACEPTAR -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr><td align="center">
            <a href="${acceptUrl}" style="display:block;background:linear-gradient(135deg,#0F8B6C 0%,#0A6B54 100%);color:#FFFFFF;text-decoration:none;padding:18px 28px;border-radius:14px;font-weight:700;font-size:16px;letter-spacing:0.2px;box-shadow:0 6px 20px rgba(15,139,108,0.35);text-align:center;">
              Aceptar propuesta — ${fmtCLP(prop.total).replace(' CLP','')}
            </a>
          </td></tr>
        </table>

        <!-- CTAs SECUNDARIOS -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td width="49%" align="center" style="padding-right:6px;">
              <a href="${propUrl}" style="display:block;background:#F4F1EB;color:#0F172A;text-decoration:none;padding:14px 16px;border-radius:12px;font-weight:600;font-size:13px;border:1px solid #E5E0D6;text-align:center;">
                Ver detalle online
              </a>
            </td>
            <td width="49%" align="center" style="padding-left:6px;">
              <a href="${rejectUrl}" style="display:block;background:#FFFFFF;color:#94A3B8;text-decoration:none;padding:14px 16px;border-radius:12px;font-weight:600;font-size:13px;border:1px solid #E2E8F0;text-align:center;">
                Necesito ajustar
              </a>
            </td>
          </tr>
        </table>

        <!-- INFO BOX -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E6;border-left:4px solid #F59E0B;border-radius:8px;margin-bottom:28px;">
          <tr><td style="padding:14px 18px;">
            <p style="margin:0;font-size:13px;color:#78350F;line-height:1.55;">
              <strong>¿Algo que ajustar?</strong> Responde este email o escríbenos por WhatsApp al
              <a href="https://wa.me/56935040242" style="color:#0F8B6C;text-decoration:none;font-weight:700;">+56 9 3504 0242</a>. Atendemos en menos de 24h.
            </p>
          </td></tr>
        </table>

        <!-- BENEFITS -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Por qué PEYU</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td valign="top" style="padding:6px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32" valign="top"><div style="width:24px;height:24px;background:#E0F2EB;border-radius:6px;text-align:center;line-height:24px;font-size:13px;">♻️</div></td>
                  <td style="padding-left:10px;font-size:13px;color:#475569;line-height:1.5;"><strong style="color:#0F172A;">100% plástico reciclado</strong> · post-consumo rescatado</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td valign="top" style="padding:6px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32" valign="top"><div style="width:24px;height:24px;background:#E0F2EB;border-radius:6px;text-align:center;line-height:24px;font-size:13px;">🇨🇱</div></td>
                  <td style="padding-left:10px;font-size:13px;color:#475569;line-height:1.5;"><strong style="color:#0F172A;">Hecho en Chile</strong> · taller propio en Santiago</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td valign="top" style="padding:6px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32" valign="top"><div style="width:24px;height:24px;background:#E0F2EB;border-radius:6px;text-align:center;line-height:24px;font-size:13px;">⚡</div></td>
                  <td style="padding-left:10px;font-size:13px;color:#475569;line-height:1.5;"><strong style="color:#0F172A;">Láser UV gratis</strong> · desde 10 unidades, área 40×25mm</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td valign="top" style="padding:6px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="32" valign="top"><div style="width:24px;height:24px;background:#E0F2EB;border-radius:6px;text-align:center;line-height:24px;font-size:13px;">🛡️</div></td>
                  <td style="padding-left:10px;font-size:13px;color:#475569;line-height:1.5;"><strong style="color:#0F172A;">Garantía 10 años</strong> · cobertura total contra defectos</td>
                </tr>
              </table>
            </td>
          </tr>
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

    <!-- LEGAL -->
    <p style="margin:16px auto 0;max-width:600px;font-size:11px;color:#94A3B8;text-align:center;line-height:1.5;">
      Esta propuesta es válida por ${prop.validity_days || 15} días desde su emisión. Los precios incluyen IVA.<br>
      Si no eres ${prop.contacto}, ignora este email.
    </p>

  </td></tr>
</table>

</body></html>`;
}

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

    const baseUrl = (req.headers.get('origin') || 'https://peyuchile.cl').replace(/\/$/, '');
    const propUrl = `${baseUrl}/b2b/propuesta?id=${proposalId}`;
    const acceptUrl = `${baseUrl}/b2b/propuesta?id=${proposalId}&action=accept`;
    const rejectUrl = `${baseUrl}/b2b/propuesta?id=${proposalId}&action=adjust`;

    const items = (() => { try { return prop.items_json ? JSON.parse(prop.items_json) : []; } catch { return []; } })();

    const html = buildHtml({ prop, items, propUrl, acceptUrl, rejectUrl });

    const subject = `Propuesta PEYU N° ${prop.numero || proposalId.slice(-6)} · ${prop.empresa}`;

    // 1) Email al cliente
    await base44.integrations.Core.SendEmail({
      to: prop.email,
      subject,
      body: html,
      from_name: 'Carlos · PEYU Chile',
    });

    // 2) Copia interna al equipo comercial (visibilidad de qué se envió)
    const TEAM_INBOXES = ['jnilo@peyuchile.cl', 'ventas@peyuchile.cl'];
    await Promise.all(TEAM_INBOXES.map(to =>
      base44.integrations.Core.SendEmail({
        to,
        subject: `[COPIA] ${subject}`,
        body: html,
        from_name: 'PEYU · Propuestas enviadas',
      }).catch(e => console.warn(`Copia interna a ${to} falló:`, e.message))
    ));

    await base44.asServiceRole.entities.CorporateProposal.update(proposalId, {
      status: 'Enviada',
      fecha_envio: new Date().toISOString().split('T')[0],
    });

    return Response.json({ success: true, to: prop.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});