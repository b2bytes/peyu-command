import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
    const itemsHtml = items.map(i =>
      `<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0">${i.nombre || ''}</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #f0f0f0">${i.qty || i.cantidad} u.</td></tr>`
    ).join('');

    const anticipoMonto = prop.total ? Math.round(prop.total * (prop.anticipo_pct || 50) / 100) : null;

    // 1. Email to CLIENT — confirmation + next steps
    if (prop.email) {
      const clientBody = `<!DOCTYPE html><html lang="es"><body style="font-family:Inter,Arial,sans-serif;background:#F7F7F5;margin:0;padding:20px">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:linear-gradient(135deg,#0F172A,#006D5B);padding:28px 32px">
    <p style="color:#A7D9C9;font-size:11px;margin:0 0 4px;font-weight:600;letter-spacing:2px;text-transform:uppercase">PEYU CHILE</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">✅ ¡Propuesta aceptada! Iniciamos producción</h1>
  </div>
  <div style="padding:28px">
    <p style="color:#4B4F54;font-size:14px;margin:0 0 16px">Hola <strong>${prop.contacto}</strong>,</p>
    <p style="color:#4B4F54;font-size:14px;line-height:1.6;margin:0 0 20px">
      Confirmamos que recibimos tu aceptación de la propuesta para <strong>${prop.empresa}</strong>. 
      El equipo de producción de Peyu ya fue notificado y está listo para comenzar.
    </p>
    ${itemsHtml ? `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px"><tbody>${itemsHtml}</tbody></table>` : ''}
    <div style="background:#f0faf7;border-radius:12px;padding:20px;margin:0 0 24px">
      <p style="color:#006D5B;font-weight:700;font-size:14px;margin:0 0 12px">📋 Próximos pasos</p>
      <div style="color:#4B4F54;font-size:13px;line-height:1.8">
        1️⃣ <strong>Anticipo ${prop.anticipo_pct || 50}%</strong>${anticipoMonto ? ` — $${anticipoMonto.toLocaleString('es-CL')} CLP` : ''}<br>
        &nbsp;&nbsp;&nbsp;&nbsp;Transferencia a: <strong>Banco Estado · Cta Corriente 123456789 · Peyu Chile SPA</strong><br>
        2️⃣ Confirmar archivo de logo en alta resolución (AI, SVG o PNG 300dpi)<br>
        3️⃣ Producción inicia dentro de 48h hábiles desde anticipo recibido<br>
        4️⃣ Entrega en <strong>${prop.lead_time_dias || 10} días hábiles</strong> desde inicio
      </div>
    </div>
    <div style="text-align:center">
      <a href="https://wa.me/56935040242?text=${encodeURIComponent(`Hola Carlos, acabo de aceptar la propuesta #${prop.numero || ''} para ${prop.empresa}. Coordino el anticipo.`)}" 
         style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px">
        💬 Coordinar por WhatsApp
      </a>
    </div>
    <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">
      Peyu Chile SPA · +56 9 3504 0242 · ventas@peyuchile.cl
    </p>
  </div>
</div></body></html>`;

      await base44.integrations.Core.SendEmail({
        to: prop.email,
        subject: `¡Producción iniciada! Propuesta ${prop.numero || ''} — ${prop.empresa}`,
        body: clientBody,
        from_name: 'Carlos · Peyu Chile',
      });
    }

    // 2. Internal notification email (admin)
    const adminBody = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;padding:20px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:2px solid #0F8B6C;padding:24px">
  <h2 style="color:#006D5B;margin:0 0 12px">🎉 Propuesta Aceptada — Acción Requerida</h2>
  <p style="color:#4B4F54;font-size:14px"><strong>${prop.empresa}</strong> aceptó la propuesta ${prop.numero ? '#' + prop.numero : ''}</p>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0">
    <tr><td style="color:#6b7280">Cliente:</td><td><strong>${prop.contacto}</strong> · ${prop.email || ''}</td></tr>
    <tr><td style="color:#6b7280">Total:</td><td><strong style="color:#006D5B">$${prop.total?.toLocaleString('es-CL')} CLP</strong></td></tr>
    ${anticipoMonto ? `<tr><td style="color:#6b7280">Anticipo 50%:</td><td><strong>$${anticipoMonto.toLocaleString('es-CL')} CLP</strong></td></tr>` : ''}
    <tr><td style="color:#6b7280">Lead time:</td><td>${prop.lead_time_dias || '?'} días hábiles</td></tr>
  </table>
  <div style="background:#fff3cd;border-radius:8px;padding:12px;font-size:13px;color:#856404">
    ⚠️ <strong>Acciones inmediatas:</strong><br>
    1. Confirmar anticipo del cliente<br>
    2. Crear Orden de Producción en el sistema<br>
    3. Solicitar logo en alta resolución si no está disponible
  </div>
</div></body></html>`;

    await base44.integrations.Core.SendEmail({
      to: 'ventas@peyuchile.cl',
      subject: `🎉 ACEPTADA: Propuesta ${prop.empresa} — $${prop.total?.toLocaleString('es-CL')} CLP`,
      body: adminBody,
      from_name: 'Sistema Peyu',
    });

    // 3. Auto-create OrdenProduccion
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