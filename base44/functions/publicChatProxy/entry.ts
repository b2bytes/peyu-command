// ============================================================================
// publicChatProxy — Proxy público para el chat de Peyu en el landing
// ----------------------------------------------------------------------------
// El SDK base44.agents.* requiere usuario autenticado, pero ShopLanding es
// público. Este proxy usa service role para que visitantes anónimos puedan
// chatear con el agente.
//
// Acciones soportadas (via "action" en el body):
//   - "create"   → crea conversación, retorna { conversation_id }
//   - "send"     → agrega mensaje { conversation_id, content }
//   - "get"      → obtiene conversación { conversation_id } → { messages }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const AGENT_NAME = 'asistente_compras';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body || {};

    if (action === 'create') {
      const conv = await base44.asServiceRole.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { context: body.context || 'landing', anonymous: true },
      });
      return Response.json({ conversation_id: conv.id });
    }

    if (action === 'send') {
      const { conversation_id, content } = body;
      if (!conversation_id || !content) {
        return Response.json({ error: 'conversation_id and content required' }, { status: 400 });
      }
      const conv = await base44.asServiceRole.agents.getConversation(conversation_id);
      await base44.asServiceRole.agents.addMessage(conv, { role: 'user', content });
      return Response.json({ ok: true });
    }

    if (action === 'get') {
      const { conversation_id } = body;
      if (!conversation_id) {
        return Response.json({ error: 'conversation_id required' }, { status: 400 });
      }
      const conv = await base44.asServiceRole.agents.getConversation(conversation_id);
      return Response.json({
        id: conv.id,
        messages: (conv.messages || []).map(m => ({ role: m.role, content: m.content })),
      });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
});