// ════════════════════════════════════════════════════════════════════════
// aprobarPropuestaChat — Disparador "Aprobar propuesta" del PDF/chat.
// ────────────────────────────────────────────────────────────────────────
// Endpoint PÚBLICO (sin auth): lo llama el cliente al hacer clic en "Aprobar
// propuesta" desde la página pública de la cotización (o el link del PDF).
//
// Flujo del embudo secuencial:
//   1. Marca la Cotizacion como "Aceptada" + registra evento.
//   2. Crea/actualiza un B2BLead en estado "Aceptado" (entra al pipeline B2B).
//   3. Crea OrdenProduccion (Pendiente, espera anticipo).
//   4. Dispara la SECUENCIA DE EMBUDO:
//        · Toque 0 (inmediato): "¡Aprobaste! Próximos pasos + datos pago".
//        · Toque 1/2 (diferidos): los maneja aprobarPropuestaSeguimientoCRON
//          leyendo el estado del embudo guardado en la Cotizacion.
//   5. Notifica al equipo PEYU.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');

// Datos legales/pago reales (Joaquín)
const PEYU = {
  razon: 'PEYUCHILE SpA',
  rut: '77.069.974-6',
  giro: 'Producción y reciclaje',
  email: 'corporativos@peyuchile.cl',
  wsp: '56979471933',
  dir: 'Pedro de Valdivia 6603, Macul, Santiago',
};

function buildClienteHtml({ cot, producto, anticipo }) {
  const total = cot.total || 0;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#F4F1EB;font-family:-apple-system,Segoe UI,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EB;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 6px 28px rgba(15,23,42,.06)">
  <tr><td style="background:linear-gradient(135deg,#0F8B6C,#0A6B54);padding:40px;text-align:center;color:#fff">
    <div style="font-size:46px;margin-bottom:6px">🌱</div>
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;color:#A7D9C9;text-transform:uppercase">Propuesta aprobada</p>
    <h1 style="margin:0;font-size:25px;font-weight:800;color:#fff">¡Tu regalo con propósito ya nace!</h1>
    <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,.85)">Propuesta ${cot.numero || ''}</p>
  </td></tr>
  <tr><td style="padding:34px 40px 8px">
    <p style="margin:0 0 8px;font-size:16px;color:#0F172A;font-weight:600">Hola ${cot.contacto || ''} 👋</p>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#475569">
      Gracias por elegir PEYU. Cada ${producto?.nombre || 'producto'} de tu orden nace de tapitas que rescatamos del mar y de la calle: las fundimos, moldeamos y grabamos tu logo. No regalas un objeto, regalas un gesto.
    </p>
    <table width="100%" style="background:#FAFAF8;border:1px solid #E5E0D6;border-radius:12px;margin-bottom:22px"><tr><td style="padding:18px 20px">
      <table width="100%" style="font-size:14px">
        <tr><td style="padding:5px 0;color:#666">Producto</td><td style="padding:5px 0;text-align:right;font-weight:700">${producto?.nombre || cot.sku}</td></tr>
        <tr><td style="padding:5px 0;color:#666">Cantidad</td><td style="padding:5px 0;text-align:right;font-weight:700">${cot.cantidad} u.</td></tr>
        <tr><td style="padding:5px 0;color:#666;border-top:2px solid #0F8B6C">Total (IVA incl.)</td><td style="padding:5px 0;text-align:right;font-weight:800;color:#0F8B6C;border-top:2px solid #0F8B6C">${fmtCLP(total)}</td></tr>
      </table>
    </td></tr></table>
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;color:#94A3B8;text-transform:uppercase">Próximos pasos</p>
    <table width="100%" style="background:linear-gradient(135deg,#F0FAF7,#E0F2EB);border:1px solid #C8E6DA;border-radius:14px;margin-bottom:22px"><tr><td style="padding:22px 26px;font-size:13px;color:#0F172A;line-height:1.9">
      <strong>1.</strong> Confirma el pago según modalidad:<br>
      &nbsp;&nbsp;• <strong>Retiro:</strong> 50% ahora (${fmtCLP(anticipo)}), 50% contra entrega.<br>
      &nbsp;&nbsp;• <strong>Despacho:</strong> abono del 100% (${fmtCLP(total)}).<br>
      <strong>2.</strong> Envíanos tu logo en alta resolución (AI/PDF/PNG 300dpi).<br>
      <strong>3.</strong> Producción inicia 48h hábiles después del pago.<br>
      <strong>4.</strong> Entrega en ${cot.lead_time_dias || 12} días hábiles.
    </td></tr></table>
    <table width="100%" style="margin-bottom:28px"><tr><td align="center">
      <a href="https://wa.me/${PEYU.wsp}?text=${encodeURIComponent(`Hola PEYU, aprobé la propuesta ${cot.numero}. Coordino el pago.`)}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:15px 28px;border-radius:14px;font-weight:700;font-size:15px">💬 Coordinar pago por WhatsApp</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#0F172A;padding:24px 40px;text-align:center">
    <p style="margin:0 0 4px;font-size:13px;color:#fff;font-weight:700">${PEYU.razon} · RUT ${PEYU.rut}</p>
    <p style="margin:0;font-size:11px;color:#94A3B8">${PEYU.dir} · ${PEYU.email}</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

async function postResend({ from, to, subject, html, replyTo }) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, reply_to: replyTo }),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { cotizacion_id, numero } = body || {};

    if (!cotizacion_id && !numero) {
      return Response.json({ error: 'Falta cotizacion_id o numero' }, { status: 400 });
    }

    // 1. Resolver la cotización
    const list = cotizacion_id
      ? await sr.entities.Cotizacion.filter({ id: cotizacion_id })
      : await sr.entities.Cotizacion.filter({ numero });
    if (!list?.length) return Response.json({ error: 'Cotización no encontrada' }, { status: 404 });
    const cot = list[0];

    // Idempotencia: ya aprobada → devolver OK sin re-disparar
    if (cot.estado === 'Aceptada') {
      return Response.json({ ok: true, ya_aprobada: true, numero: cot.numero });
    }

    const producto = cot.sku
      ? (await sr.entities.Producto.filter({ sku: cot.sku }, '-updated_date', 1))?.[0] || null
      : null;
    const anticipo = Math.round((cot.total || 0) * 0.5);

    // 2. Marcar Cotizacion como Aceptada + iniciar el embudo (toque 0)
    const nowIso = new Date().toISOString();
    await sr.entities.Cotizacion.update(cot.id, {
      estado: 'Aceptada',
      aprobada_at: nowIso,
      embudo: { ...(cot.embudo || {}), toque_0_at: nowIso },
    });

    // 3. Crear/avanzar B2BLead en el pipeline (estado Aceptado)
    let leadId = null;
    try {
      const existentes = cot.email ? await sr.entities.B2BLead.filter({ email: cot.email }, '-created_date', 1) : [];
      if (existentes?.length) {
        leadId = existentes[0].id;
        await sr.entities.B2BLead.update(leadId, {
          status: 'Aceptado',
          historial: [...(existentes[0].historial || []), {
            at: new Date().toISOString(), type: 'accepted', actor: 'cliente', channel: 'web',
            detail: `Aprobó propuesta ${cot.numero} (${fmtCLP(cot.total)})`,
          }],
        });
      } else {
        const lead = await sr.entities.B2BLead.create({
          source: 'Formulario Web',
          contact_name: cot.contacto || 'Cliente',
          company_name: cot.empresa || cot.contacto || 'Cliente',
          email: cot.email || '',
          product_interest: producto?.nombre || cot.sku || '',
          qty_estimate: cot.cantidad || 0,
          personalization_needs: cot.personalizacion_tipo && cot.personalizacion_tipo !== 'Sin personalización',
          status: 'Aceptado',
          urgency: 'Alta',
          tags: ['propuesta-aprobada', 'desde-chat'],
          notes: `Aprobó propuesta ${cot.numero} por ${fmtCLP(cot.total)}.`,
          historial: [{
            at: new Date().toISOString(), type: 'accepted', actor: 'cliente', channel: 'web',
            detail: `Aprobó propuesta ${cot.numero}`,
          }],
        });
        leadId = lead.id;
      }
    } catch (e) { console.error('B2BLead embudo:', e.message); }

    // 4. Crear OrdenProduccion (Pendiente, espera pago)
    try {
      await sr.entities.OrdenProduccion.create({
        empresa: cot.empresa || cot.contacto || 'Cliente',
        sku: producto?.nombre || cot.sku || 'Ver propuesta',
        cantidad: cot.cantidad || 0,
        estado: 'Pendiente',
        prioridad: 'Normal',
        personalizacion: !!(cot.personalizacion_tipo && cot.personalizacion_tipo !== 'Sin personalización'),
        anticipo_pagado: false,
        notas_produccion: `Propuesta ${cot.numero} aprobada. Pago pendiente para iniciar.`,
      });
    } catch (e) { console.error('OrdenProduccion embudo:', e.message); }

    // 5. SECUENCIA EMBUDO · Toque 0 inmediato al cliente
    let emailCliente = false;
    if (cot.email && /\S+@\S+\.\S+/.test(cot.email)) {
      emailCliente = await postResend({
        from: 'PEYU Chile <ventas@peyuchile.cl>',
        to: cot.email,
        subject: `🌱 ¡Aprobaste tu propuesta ${cot.numero}! Próximos pasos`,
        html: buildClienteHtml({ cot, producto, anticipo }),
        replyTo: PEYU.email,
      }).catch(() => false);
    }

    // Notificación interna al equipo
    await postResend({
      from: 'PEYU Chile <onboarding@resend.dev>',
      to: PEYU.email,
      subject: `✅ PROPUESTA APROBADA · ${cot.empresa || cot.contacto} · ${fmtCLP(cot.total)}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#0F8B6C">✅ Propuesta ${cot.numero} aprobada</h2>
        <p><strong>${cot.empresa || cot.contacto}</strong> aprobó su propuesta.</p>
        <ul style="font-size:14px;color:#444;line-height:1.8">
          <li>Producto: ${producto?.nombre || cot.sku} × ${cot.cantidad}u</li>
          <li>Total: <strong>${fmtCLP(cot.total)}</strong> (anticipo 50%: ${fmtCLP(anticipo)})</li>
          <li>Contacto: ${cot.contacto || '-'} · ${cot.email || '-'}</li>
        </ul>
        <p style="font-size:13px;color:#78350F;background:#FFF8E6;padding:12px;border-radius:8px">Acciones: confirmar pago → solicitar logo → iniciar producción.</p>
      </div>`,
    }).catch(() => null);

    return Response.json({
      ok: true,
      numero: cot.numero,
      lead_id: leadId,
      email_cliente: emailCliente,
      total: cot.total,
    });
  } catch (error) {
    console.error('aprobarPropuestaChat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});