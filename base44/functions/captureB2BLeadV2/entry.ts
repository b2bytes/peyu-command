import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════
// captureB2BLeadV2 — Paso 4. Captura B2B inteligente desde el chat /v2.
// ADITIVO: crea (o actualiza si ya existe) un B2BLead y vincula el ChatLead
// de la conversación con convertido_a_b2b_lead_id + tipo="B2B".
// Idempotente por conversation_id / email. Nunca borra nada. No toca B2C.
// ════════════════════════════════════════════════════════════════════

function scoreLead({ company_name, qty_estimate, logo_url }) {
  let s = 50; // base B2B
  if (company_name) s += 20;
  if (qty_estimate && Number(qty_estimate) >= 10) s += 20;
  if (logo_url) s += 10;
  return Math.min(s, 100);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const conversationId = (body.conversation_id || '').toString().slice(0, 120) || null;
    const sessionId = (body.session_id || '').toString().slice(0, 120) || null;
    const contact_name = (body.contact_name || '').toString().slice(0, 200);
    const company_name = (body.company_name || '').toString().slice(0, 200);
    const email = (body.email || '').toString().slice(0, 200);
    const phone = (body.phone || '').toString().slice(0, 60) || undefined;
    const qty = body.qty_estimate ? Number(body.qty_estimate) : undefined;
    const product_interest = (body.product_interest || '').toString().slice(0, 200) || 'Cotización /v2';
    const logo_url = (body.logo_url || '').toString() || undefined;

    if (!contact_name || !company_name || !email) {
      return Response.json({ error: 'Faltan datos mínimos (nombre, empresa, email).' }, { status: 400 });
    }

    const lead_score = scoreLead({ company_name, qty_estimate: qty, logo_url });
    const nowIso = new Date().toISOString();
    const notes = `Lead capturado desde el chat /v2 (Peyu Commerce OS). ` +
      `Empresa: ${company_name}. Cantidad estimada: ${qty || 'N/D'}. ` +
      `Conversación: ${conversationId || 'N/D'}.`;

    const histEntry = {
      at: nowIso,
      type: 'created',
      actor: contact_name || email,
      channel: 'web',
      detail: 'Captura B2B inteligente desde chat /v2',
      meta: { conversation_id: conversationId, session_id: sessionId, lead_score },
    };

    // ─── IDEMPOTENCIA: buscar B2BLead previo por email (mismo hilo/cliente) ───
    let existingLead = null;
    try {
      const found = await base44.asServiceRole.entities.B2BLead.filter(
        { email }, '-created_date', 5
      );
      // Preferimos el que vino del chat /v2 si existe.
      existingLead = (found || []).find((l) => (l.notes || '').includes('/v2')) || (found || [])[0] || null;
    } catch { /* noop */ }

    let leadId;
    if (existingLead) {
      const prevHist = Array.isArray(existingLead.historial) ? existingLead.historial : [];
      const updated = await base44.asServiceRole.entities.B2BLead.update(existingLead.id, {
        contact_name,
        company_name,
        phone: phone ?? existingLead.phone,
        qty_estimate: qty ?? existingLead.qty_estimate,
        product_interest: product_interest || existingLead.product_interest,
        logo_url: logo_url ?? existingLead.logo_url,
        lead_score,
        notes,
        historial: [...prevHist, { ...histEntry, type: 'note', detail: 'Actualizado desde chat /v2' }],
      });
      leadId = updated?.id || existingLead.id;
    } else {
      const created = await base44.asServiceRole.entities.B2BLead.create({
        source: 'Otro',
        contact_name,
        company_name,
        email,
        phone,
        qty_estimate: qty,
        product_interest,
        personalization_needs: true,
        logo_url,
        lead_score,
        status: 'Nuevo',
        urgency: 'Normal',
        notes,
        historial: [histEntry],
      });
      leadId = created?.id;
    }

    // ─── VÍNCULO: actualizar ChatLead de esta conversación (no duplicar) ───
    if (conversationId) {
      try {
        const cls = await base44.asServiceRole.entities.ChatLead.filter(
          { conversation_id: conversationId }, '-created_date', 1
        );
        if (cls && cls[0]) {
          await base44.asServiceRole.entities.ChatLead.update(cls[0].id, {
            tipo: 'B2B',
            estado: 'Calificado',
            nombre: contact_name,
            email,
            telefono: phone,
            empresa: company_name,
            cantidad_estimada: qty,
            convertido_a_b2b_lead_id: leadId,
          });
        } else {
          await base44.asServiceRole.entities.ChatLead.create({
            conversation_id: conversationId,
            session_id: sessionId,
            tipo: 'B2B',
            estado: 'Calificado',
            nombre: contact_name,
            email,
            telefono: phone,
            empresa: company_name,
            cantidad_estimada: qty,
            convertido_a_b2b_lead_id: leadId,
            page_origen: '/v2',
          });
        }
      } catch { /* best-effort */ }
    }

    return Response.json({ ok: true, lead_id: leadId, lead_score });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
});