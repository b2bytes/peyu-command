import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// whatsappB2BCotizacion — Flujo B2B COMPLETO en una sola llamada.
// ----------------------------------------------------------------------------
// Resuelve los 3 problemas del flujo B2B por WhatsApp:
//   1. Crea el B2BLead (source: WhatsApp) — el agente no puede crearlo directo
//      porque el RLS exige role admin. Usa asServiceRole.
//   2. Invoca generateChatQuotePDF para generar el PDF + enviarlo al email.
//   3. Actualiza el lead a 'Propuesta enviada' y devuelve dónde verlo en admin.
//
// El agente llama UNA sola función y obtiene: lead_id, cotizacion_numero,
// total, email_enviado, admin_url. Todo el flujo B2B real en 1 paso.
//
// Payload:
//   { sku, qty, empresa, contacto, email, telefono?, fecha_requerida?,
//     personalizacion?, conversation_id? }
// ============================================================================

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { sku, qty, empresa, contacto, email, telefono, fecha_requerida, personalizacion, conversation_id } = body;

    // Validaciones
    const faltan = [];
    if (!sku) faltan.push('sku');
    if (!qty) faltan.push('qty');
    if (!empresa) faltan.push('empresa');
    if (!contacto) faltan.push('contacto');
    if (!email) faltan.push('email');
    if (faltan.length) {
      return Response.json({ error: `Faltan datos: ${faltan.join(', ')}. Pídeselos al cliente.` }, { status: 400 });
    }

    // 1 · Crear B2BLead (source: WhatsApp)
    const qtyNum = Math.max(1, Math.round(Number(qty)));
    const nowIso = new Date().toISOString();

    // Buscar si ya existe lead por email (idempotente)
    const existing = await base44.asServiceRole.entities.B2BLead.filter({ email }, '-created_date', 3).catch(() => []);
    let leadId;
    let leadStatus = 'Nuevo';

    if (existing && existing.length > 0) {
      const prev = existing[0];
      const prevHist = Array.isArray(prev.historial) ? prev.historial : [];
      const updated = await base44.asServiceRole.entities.B2BLead.update(prev.id, {
        contact_name: contacto,
        company_name: empresa,
        phone: telefono || prev.phone,
        product_interest: sku,
        qty_estimate: qtyNum,
        delivery_date: fecha_requerida || prev.delivery_date,
        personalization_needs: !!personalizacion && personalizacion !== 'Sin personalización',
        status: 'Propuesta enviada',
        notes: `Lead B2B desde WhatsApp. Cotización solicitada: ${qtyNum}u de ${sku}. ${fecha_requerida ? `Fecha req: ${fecha_requerida}.` : ''} ${personalizacion ? `Personalización: ${personalizacion}.` : ''}`,
        historial: [...prevHist, {
          at: nowIso, type: 'proposal_sent', actor: 'agente_whatsapp',
          channel: 'whatsapp', detail: `Cotización solicitada desde WhatsApp: ${qtyNum}u ${sku}`,
        }],
      });
      leadId = updated?.id || prev.id;
    } else {
      const created = await base44.asServiceRole.entities.B2BLead.create({
        source: 'WhatsApp',
        contact_name: contacto,
        company_name: empresa,
        email,
        phone: telefono || '',
        product_interest: sku,
        qty_estimate: qtyNum,
        delivery_date: fecha_requerida || '',
        personalization_needs: !!personalizacion && personalizacion !== 'Sin personalización',
        lead_score: Math.min(100, 50 + (empresa ? 20 : 0) + (qtyNum >= 10 ? 20 : 0) + (personalizacion ? 10 : 0)),
        status: 'Propuesta enviada',
        urgency: qtyNum >= 100 ? 'Alta' : 'Normal',
        notes: `Lead B2B desde WhatsApp. Cotización solicitada: ${qtyNum}u de ${sku}. ${fecha_requerida ? `Fecha req: ${fecha_requerida}.` : ''} ${personalizacion ? `Personalización: ${personalizacion}.` : ''}`,
        historial: [{
          at: nowIso, type: 'created', actor: 'agente_whatsapp',
          channel: 'whatsapp', detail: `Lead capturado desde WhatsApp: ${empresa} quiere ${qtyNum}u de ${sku}`,
        }, {
          at: nowIso, type: 'proposal_sent', actor: 'agente_whatsapp',
          channel: 'whatsapp', detail: `Cotización enviada al email ${email}`,
        }],
      });
      leadId = created?.id;
    }

    // 2 · Invocar generateChatQuotePDF para generar PDF + enviar email
    let pdfResult = null;
    let pdfError = null;
    try {
      const invokeRes = await base44.functions.invoke('generateChatQuotePDF', {
        sku,
        qty: qtyNum,
        empresa,
        contacto,
        email,
        telefono,
        fecha_requerida,
        personalizacion: personalizacion || 'Láser UV',
        conversation_id,
      });
      pdfResult = invokeRes?.data || invokeRes;
    } catch (e) {
      pdfError = e?.message || String(e);
    }

    // 3 · Si el PDF falló, igual retornamos el lead creado + el error para que el agente lo sepa
    if (pdfError || !pdfResult?.ok) {
      return Response.json({
        ok: true,
        lead_id: leadId,
        lead_creado: true,
        cotizacion_pdf: false,
        error_pdf: pdfError || 'generateChatQuotePDF no retornó ok',
        admin_url_pipeline: '/admin/pipeline',
        mensaje_cliente: `¡Listo ${contacto}! 📋 Tu solicitud de cotización para ${empresa} quedó registrada. Te envío los detalles al email ${email} en unos minutos. El equipo PEYU te contactará hoy mismo para finalizar. 🐢`,
        mensaje_founder: `⚠️ Lead B2B creado para ${empresa} (${email}) pero el PDF falló: ${pdfError}. Revisa manualmente en /admin/pipeline y envía la cotización desde /admin/cotizaciones.`,
      });
    }

    // 4 · Todo OK — devolver resultado completo
    return Response.json({
      ok: true,
      lead_id: leadId,
      lead_creado: true,
      cotizacion_id: pdfResult.cotizacion_id,
      cotizacion_numero: pdfResult.numero,
      total: pdfResult.total,
      email_enviado: pdfResult.email_enviado,
      admin_url_pipeline: '/admin/pipeline',
      admin_url_cotizaciones: '/admin/cotizaciones',
      mensaje_cliente: `¡Listo ${contacto}! 📄✅\n\nTe envié la cotización *${pdfResult.numero}* al email ${email}.\n\n💰 Total: $${(pdfResult.total || 0).toLocaleString('es-CL')} CLP (IVA incl.)\n📦 ${qtyNum}u · ${sku}\n\nEl equipo PEYU te contactará hoy para finalizar. ¿Algo más en lo que pueda ayudarte? 🐢`,
      mensaje_founder: `📋 Lead B2B creado: ${empresa} (${email}) → /admin/pipeline\n📄 Cotización ${pdfResult.numero} ($${(pdfResult.total || 0).toLocaleString('es-CL')}) → /admin/cotizaciones\n📧 Email ${pdfResult.email_enviado ? 'enviado ✅' : 'NO enviado ⚠️'}`,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});