// ============================================================================
// linkChatLeadToB2BLead — Cierra el loop chat → formulario B2B
// ----------------------------------------------------------------------------
// Trigger entity al crear un B2BLead. Si el lead viene del chat (utm_source
// contiene 'chat' o las notas indican origen chat), busca el ChatLead más
// reciente del mismo email/teléfono y lo marca como convertido.
//
// Esto cierra el embudo: el ChatLead deja de estar huérfano, sabemos que
// se convirtió en B2BLead formal y podemos medir tasa de conversión chat→form.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const leadId = body?.event?.entity_id || body?.data?.id;
    if (!leadId) return Response.json({ ok: true, skipped: 'sin_id' });

    const leads = await base44.asServiceRole.entities.B2BLead.filter({ id: leadId });
    const lead = leads?.[0];
    if (!lead) return Response.json({ ok: true, skipped: 'no_encontrado' });

    // Buscar ChatLead por email o teléfono (cualquiera que matchee)
    const candidates = [];
    if (lead.email) {
      const byEmail = await base44.asServiceRole.entities.ChatLead.filter({ email: lead.email });
      candidates.push(...(byEmail || []));
    }
    if (lead.phone) {
      const byPhone = await base44.asServiceRole.entities.ChatLead.filter({ telefono: lead.phone });
      candidates.push(...(byPhone || []));
    }

    if (candidates.length === 0) {
      return Response.json({ ok: true, skipped: 'sin_chat_lead' });
    }

    // Tomar el más reciente y NO convertido aún
    const mejor = candidates
      .filter(c => !c.convertido_a_b2b_lead_id)
      .sort((a, b) => new Date(b.ultimo_mensaje_at || b.created_date) - new Date(a.ultimo_mensaje_at || a.created_date))[0];

    if (!mejor) return Response.json({ ok: true, skipped: 'ya_convertido' });

    await base44.asServiceRole.entities.ChatLead.update(mejor.id, {
      convertido_a_b2b_lead_id: leadId,
      estado: 'Convertido',
    });

    return Response.json({ ok: true, chat_lead_id: mejor.id, b2b_lead_id: leadId });
  } catch (err) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
});