// ============================================================================
// linkConsultaToCliente — Une Consulta con Cliente / ChatLead por email
// ----------------------------------------------------------------------------
// Trigger entity al crear una Consulta. Busca Cliente y ChatLead por email
// y los enlaza. Permite al equipo de soporte ver historial 360° del contacto
// en un solo lugar.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const consultaId = body?.event?.entity_id || body?.data?.id;
    if (!consultaId) return Response.json({ ok: true, skipped: 'sin_id' });

    const consultas = await base44.asServiceRole.entities.Consulta.filter({ id: consultaId });
    const consulta = consultas?.[0];
    if (!consulta?.email) return Response.json({ ok: true, skipped: 'sin_email' });

    const patch = {};

    try {
      const clientes = await base44.asServiceRole.entities.Cliente.filter({ email: consulta.email });
      if (clientes?.[0]) patch.cliente_conocido_id = clientes[0].id;
    } catch {}

    try {
      const chatLeads = await base44.asServiceRole.entities.ChatLead.filter({ email: consulta.email });
      if (chatLeads?.[0]) patch.chat_lead_id = chatLeads[0].id;
    } catch {}

    if (Object.keys(patch).length === 0) {
      return Response.json({ ok: true, skipped: 'sin_match' });
    }

    await base44.asServiceRole.entities.Consulta.update(consultaId, patch);
    return Response.json({ ok: true, linked: patch });
  } catch (err) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
});