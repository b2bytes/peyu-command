import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// onProposalAccepted — Trigger cuando una propuesta cambia a "Aceptada"
// ============================================================================
// 1. Email premium al cliente con próximos pasos y datos bancarios
// 2. Notificación interna al equipo
// 3. Crea OrdenProduccion automáticamente
// ----------------------------------------------------------------------------

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL') + ' CLP';

function buildClientHtml({ prop, items, anticipoMonto }) {
  const itemsHtml = items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #EEF1F0;font-size:13px;color:#0F172A;">${i.nombre || ''}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEF1F0;text-align:right;font-size:13px;color:#475569;font-variant-numeric:tabular-nums;">${i.qty || i.cantidad} u.</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F4F1EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px;">
  <tr><td align="center">

    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 28px rgba(15,23,42,0.06);">

      <!-- HERO con celebración -->
      <tr><td style="background:linear-gradient(135deg,#0F8B6C 0%,#0A6B54 100%);padding:40px 40px 36px;color:#fff;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">🎉</div>
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;color:#A7D9C9;text-transform:uppercase;">Propuesta aceptada</p>
        <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:800;color:#fff;letter-spacing:-0.5px;">¡Iniciamos tu producción!</h1>
        <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.5;">Propuesta N° ${prop.numero || '—'} · ${prop.empresa}</p>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:36px 40px 8px;">
        <p style="margin:0 0 8px;font-size:16px;color:#0F172A;font-weight:600;">Hola ${prop.contacto},</p>
        <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
          Confirmamos la aceptación de tu propuesta. El equipo de producción ya fue notificado y está listo para comenzar apenas recibamos el anticipo.
        </p>

        ${itemsHtml ? `
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">Resumen confirmado</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr><td colspan="2" style="padding-top:12px;text-align:right;">
              <span style="font-size:12px;color:#94A3B8;font-weight:600;letter-spacing:0.5px;">TOTAL: </span>
              <span style="font-size:18px;font-weight:800;color:#0F172A;font-variant-numeric:tabular-nums;">${fmtCLP(prop.total)}</span>
            </td></tr>
          </tfoot>
        </table>` : ''}

        <!-- NEXT STEPS -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F0FAF7 0%,#E0F2EB 100%);border:1px solid #C8E6DA;border-radius:16px;margin-bottom:24px;">
          <tr><td style="padding:24px 28px;">
            <p style="margin:0 0 18px;font-size:14px;font-weight:800;color:#0F172A;letter-spacing:0.3px;">📋 Próximos pasos</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td valign="top" style="padding:6px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="32" valign="top"><div style="width:24px;height:24px;background:#0F8B6C;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">1</div></td>
                    <td style="padding-left:12px;font-size:13px;color:#0F172A;line-height:1.5;">
                      <strong>Anticipo ${prop.anticipo_pct || 50}%</strong>${anticipoMonto ? ` · <strong style="color:#0F8B6C;">${fmtCLP(anticipoMonto)}</strong>` : ''}
                    </td>
                  </tr>
                </table>
              </td></tr>
              <tr><td valign="top" style="padding:6px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="32" valign="top"><div style="width:24px;height:24px;background:#0F8B6C;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">2</div></td>
                    <td style="padding-left:12px;font-size:13px;color:#0F172A;line-height:1.5;">Confirmación de archivo de logo en alta resolución (AI, SVG o PNG 300dpi)</td>
                  </tr>
                </table>
              </td></tr>
              <tr><td valign="top" style="padding:6px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="32" valign="top"><div style="width:24px;height:24px;background:#0F8B6C;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">3</div></td>
                    <td style="padding-left:12px;font-size:13px;color:#0F172A;line-height:1.5;">Producción inicia <strong>48h hábiles</strong> después del anticipo</td>
                  </tr>
                </table>
              </td></tr>
              <tr><td valign="top" style="padding:6px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="32" valign="top"><div style="width:24px;height:24px;background:#0F8B6C;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;">4</div></td>
                    <td style="padding-left:12px;font-size:13px;color:#0F172A;line-height:1.5;">Entrega en <strong>${prop.lead_time_dias || 10} días hábiles</strong> desde inicio</td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </td></tr>
        </table>

        <!-- DATOS BANCARIOS -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase;">💳 Datos para transferencia</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;border:1px solid #E5E0D6;border-radius:12px;margin-bottom:24px;">
          <tr><td style="padding:18px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
              <tr><td style="padding:4px 0;color:#64748B;">Beneficiario</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#0F172A;">PEYU Chile SpA</td></tr>
              <tr><td style="padding:4px 0;color:#64748B;">Banco</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#0F172A;">Banco Estado</td></tr>
              <tr><td style="padding:4px 0;color:#64748B;">Cuenta corriente</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#0F172A;font-variant-numeric:tabular-nums;">123456789</td></tr>
              <tr><td style="padding:4px 0;color:#64748B;">RUT</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#0F172A;font-variant-numeric:tabular-nums;">76.xxx.xxx-x</td></tr>
              <tr><td style="padding:4px 0;color:#64748B;">Email</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#0F172A;">ventas@peyuchile.cl</td></tr>
              ${prop.numero ? `<tr><td style="padding:4px 0;color:#64748B;">Glosa</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#0F8B6C;">PROP ${prop.numero}</td></tr>` : ''}
            </table>
          </td></tr>
        </table>

        <!-- WHATSAPP CTA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr><td align="center">
            <a href="https://wa.me/56935040242?text=${encodeURIComponent(`Hola Carlos, acabo de aceptar la propuesta ${prop.numero ? '#' + prop.numero : ''} para ${prop.empresa}. Coordino el anticipo.`)}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:16px 28px;border-radius:14px;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(37,211,102,0.3);">
              💬 Coordinar por WhatsApp
            </a>
          </td></tr>
        </table>

      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#0F172A;padding:28px 40px;text-align:center;">
        <p style="margin:0 0 6px;font-size:13px;color:#fff;font-weight:700;">PEYU Chile SpA</p>
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

function buildInternalHtml({ prop, anticipoMonto }) {
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#F4F1EB;padding:24px;margin:0;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:2px solid #0F8B6C;padding:28px;">
  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;color:#0F8B6C;text-transform:uppercase;">Acción requerida</p>
  <h2 style="color:#0F172A;margin:0 0 16px;font-size:22px;">🎉 Propuesta aceptada</h2>
  <p style="color:#475569;font-size:14px;margin:0 0 16px;line-height:1.5;"><strong style="color:#0F172A;">${prop.empresa}</strong> aceptó la propuesta ${prop.numero ? '#' + prop.numero : ''}</p>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;background:#FAFAF8;border-radius:12px;">
    <tr><td style="padding:10px 14px;color:#64748B;">Cliente:</td><td style="padding:10px 14px;text-align:right;"><strong>${prop.contacto}</strong></td></tr>
    <tr><td style="padding:10px 14px;color:#64748B;">Email:</td><td style="padding:10px 14px;text-align:right;color:#0F8B6C;">${prop.email || '—'}</td></tr>
    <tr><td style="padding:10px 14px;color:#64748B;">Total:</td><td style="padding:10px 14px;text-align:right;"><strong style="color:#0F8B6C;font-size:16px;">${fmtCLP(prop.total)}</strong></td></tr>
    ${anticipoMonto ? `<tr><td style="padding:10px 14px;color:#64748B;">Anticipo:</td><td style="padding:10px 14px;text-align:right;"><strong>${fmtCLP(anticipoMonto)}</strong></td></tr>` : ''}
    <tr><td style="padding:10px 14px;color:#64748B;">Lead time:</td><td style="padding:10px 14px;text-align:right;">${prop.lead_time_dias || '?'} días</td></tr>
  </table>
  <div style="background:#FFF8E6;border-left:4px solid #F59E0B;border-radius:8px;padding:14px 18px;font-size:13px;color:#78350F;line-height:1.6;">
    <strong>Acciones inmediatas:</strong><br>
    1. Confirmar recepción del anticipo<br>
    2. Crear Orden de Producción en el sistema<br>
    3. Solicitar logo en alta resolución
  </div>
</div></body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const proposalId = payload?.event?.entity_id || payload?.data?.id;
    if (!proposalId) return Response.json({ error: 'proposalId missing' }, { status: 400 });

    const list = await base44.asServiceRole.entities.CorporateProposal.filter({ id: proposalId });
    if (!list || list.length === 0) return Response.json({ ok: false });
    const prop = list[0];

    if (prop.status !== 'Aceptada') return Response.json({ ok: false, reason: 'Not accepted' });

    const items = (() => { try { return prop.items_json ? JSON.parse(prop.items_json) : []; } catch { return []; } })();
    const anticipoMonto = prop.total ? Math.round(prop.total * (prop.anticipo_pct || 50) / 100) : null;

    // 1. Email cliente
    if (prop.email) {
      await base44.integrations.Core.SendEmail({
        to: prop.email,
        subject: `🎉 ¡Producción iniciada! Propuesta ${prop.numero || ''} · ${prop.empresa}`,
        body: buildClientHtml({ prop, items, anticipoMonto }),
        from_name: 'Carlos · PEYU Chile',
      });
    }

    // 2. Email interno
    await base44.integrations.Core.SendEmail({
      to: 'ventas@peyuchile.cl',
      subject: `🎉 ACEPTADA · ${prop.empresa} · ${fmtCLP(prop.total)}`,
      body: buildInternalHtml({ prop, anticipoMonto }),
      from_name: 'Sistema PEYU',
    });

    // 3. OrdenProduccion
    await base44.asServiceRole.entities.OrdenProduccion.create({
      empresa: prop.empresa,
      sku: items[0]?.nombre || 'Ver propuesta',
      cantidad: items.reduce((s, i) => s + (i.qty || i.cantidad || 0), 0),
      estado: 'Pendiente',
      prioridad: 'Normal',
      personalizacion: items.some(i => i.personalizacion),
      anticipo_pagado: false,
      notas_produccion: prop.production_notes || `Propuesta ${prop.numero}. Anticipo ${prop.anticipo_pct || 50}% requerido para iniciar.`,
    });

    return Response.json({ success: true, emails_sent: prop.email ? 2 : 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});