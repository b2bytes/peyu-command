// ════════════════════════════════════════════════════════════════════════
// whatsappInbox — Puente del admin con las conversaciones de WhatsApp.
// ────────────────────────────────────────────────────────────────────────
// Las conversaciones del agente las crea el webhook con service role (no hay
// usuario logueado), así que el admin NO puede verlas con el SDK del navegador.
// Esta función se las entrega: lista, detalle y toma/devolución de control.
//
// Payload: { action: 'list' | 'get' | 'takeover', conversation_id?, human_takeover? }
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { AGENT_NAME } from '../../shared/evolution.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const sr = base44.asServiceRole;
    const { action = 'list', conversation_id, human_takeover } = await req.json().catch(() => ({}));

    // ── Detalle completo de una conversación ──
    if (action === 'get') {
      if (!conversation_id) return Response.json({ error: 'Falta conversation_id' }, { status: 400 });
      const conv = await sr.agents.getConversation(conversation_id);
      return Response.json({ ok: true, conversation: conv });
    }

    // ── Tomar o devolver el control al agente ──
    if (action === 'takeover') {
      if (!conversation_id) return Response.json({ error: 'Falta conversation_id' }, { status: 400 });
      const conv = await sr.agents.getConversation(conversation_id);
      const tomar = human_takeover === true;
      const updated = await sr.agents.updateConversation(conversation_id, {
        metadata: { ...(conv?.metadata || {}), human_takeover: tomar, escalated: tomar ? conv?.metadata?.escalated : false },
      });
      return Response.json({ ok: true, conversation: updated });
    }

    // ── Bandeja: conversaciones + etapas del pipeline ──
    const convs = (await sr.agents.listConversations({ agent_name: AGENT_NAME }).catch(() => [])) || [];
    const etapas = (await sr.entities.WhatsAppConvEtapa.list('-updated_date', 300).catch(() => [])) || [];

    const ligeras = convs.map((c) => {
      const msgs = c.messages || [];
      const last = msgs[msgs.length - 1] || null;
      return {
        id: c.id,
        metadata: c.metadata || {},
        updated_date: c.updated_date,
        created_date: c.created_date,
        mensajes_count: msgs.length,
        last_message: last ? { role: last.role, content: (last.content || '').slice(0, 160) } : null,
      };
    }).sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));

    return Response.json({ ok: true, conversations: ligeras, etapas });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});