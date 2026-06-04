import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ════════════════════════════════════════════════════════════════════
// captureB2BPartialLead — Captura PROGRESIVA del embudo /b2b/self-service.
// Guarda lo que el cliente B2B va rellenando A MEDIDA que avanza, aunque
// se vaya sin terminar. Idempotente por session_id (o email si ya lo dio).
// Cualquier dato basta para crear/actualizar el lead. Nunca borra nada.
// ════════════════════════════════════════════════════════════════════

function scoreLead({ company_name, qty_estimate, email, phone }) {
  let s = 30;
  if (email) s += 25;
  if (company_name) s += 20;
  if (phone) s += 10;
  if (qty_estimate && Number(qty_estimate) >= 10) s += 15;
  return Math.min(s, 100);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const sessionId = (body.session_id || '').toString().slice(0, 120) || null;
    const contact_name = (body.contact_name || '').toString().slice(0, 200) || undefined;
    const company_name = (body.company_name || '').toString().slice(0, 200) || undefined;
    const email = (body.email || '').toString().slice(0, 200).trim().toLowerCase() || undefined;
    const phone = (body.phone || '').toString().slice(0, 60) || undefined;
    const rut = (body.rut || '').toString().slice(0, 40) || undefined;
    const qty = body.qty_estimate ? Number(body.qty_estimate) : undefined;
    const product_interest = (body.product_interest || '').toString().slice(0, 400) || undefined;
    const stepLabel = (body.step_label || '').toString().slice(0, 60) || undefined;

    // Se necesita al menos algo identificable para anclar el lead.
    if (!sessionId && !email) {
      return Response.json({ ok: false, error: 'Sin identificador (session_id o email).' }, { status: 200 });
    }

    const nowIso = new Date().toISOString();
    const lead_score = scoreLead({ company_name, qty_estimate: qty, email, phone });
    const notes = `Lead B2B en progreso (self-service). Paso: ${stepLabel || 'N/D'}. ` +
      `Empresa: ${company_name || 'N/D'} · Cantidad: ${qty || 'N/D'} · Sesión: ${sessionId || 'N/D'}.`;

    const histEntry = {
      at: nowIso,
      type: 'note',
      actor: contact_name || email || sessionId || 'visitante',
      channel: 'web',
      detail: `Captura parcial self-service (${stepLabel || 'auto'})`,
      meta: { session_id: sessionId, lead_score, step: stepLabel },
    };

    // ─── IDEMPOTENCIA: buscar lead previo (por email o por sesión en notes) ───
    let existing = null;
    try {
      if (email) {
        const byEmail = await base44.asServiceRole.entities.B2BLead.filter({ email }, '-created_date', 5);
        existing = (byEmail || []).find(l => (l.notes || '').includes('self-service')) || (byEmail || [])[0] || null;
      }
      if (!existing && sessionId) {
        const recent = await base44.asServiceRole.entities.B2BLead.filter({ source: 'Formulario Web' }, '-created_date', 50);
        existing = (recent || []).find(l => (l.notes || '').includes(sessionId)) || null;
      }
    } catch { /* noop */ }

    // Solo seteamos campos que vinieron (no pisar con undefined/vacío).
    const patch = {};
    if (contact_name) patch.contact_name = contact_name;
    if (company_name) patch.company_name = company_name;
    if (email) patch.email = email;
    if (phone) patch.phone = phone;
    if (rut) patch.rut = rut;
    if (qty !== undefined) patch.qty_estimate = qty;
    if (product_interest) patch.product_interest = product_interest;

    let leadId;
    if (existing) {
      const prevHist = Array.isArray(existing.historial) ? existing.historial : [];
      const updated = await base44.asServiceRole.entities.B2BLead.update(existing.id, {
        ...patch,
        lead_score: Math.max(lead_score, existing.lead_score || 0),
        notes,
        historial: [...prevHist, histEntry],
      });
      leadId = updated?.id || existing.id;
    } else {
      const created = await base44.asServiceRole.entities.B2BLead.create({
        source: 'Formulario Web',
        contact_name: contact_name || 'Sin nombre aún',
        company_name: company_name || 'Empresa por confirmar',
        email,
        phone,
        rut,
        qty_estimate: qty,
        product_interest: product_interest || 'Cotización self-service',
        personalization_needs: true,
        lead_score,
        status: 'Nuevo',
        urgency: 'Normal',
        notes,
        historial: [histEntry],
      });
      leadId = created?.id;
    }

    return Response.json({ ok: true, lead_id: leadId, lead_score });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
});