// ============================================================================
// vendedorChatProxy — Proxy público para el vendedor IA de la tienda (Shop V2)
// ----------------------------------------------------------------------------
// El SDK base44.agents.* requiere usuario autenticado, pero la tienda es
// pública. Este proxy usa service role para que visitantes anónimos chateen
// con el agente vendedor_peyu desde la barra de chat persistente.
//
// Acciones: "create" → { conversation_id } · "send" { conversation_id, content }
//           · "get" { conversation_id } → { messages }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const AGENT_NAME = 'vendedor_peyu';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const body = await req.json();
    const { action } = body || {};

    if (action === 'create') {
      const conv = await sr.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: {
          context: 'tienda_v2',
          anonymous: true,
          page_path: body.page_path || null,
        },
      });
      return Response.json({ conversation_id: conv.id });
    }

    if (action === 'send') {
      const { conversation_id, content } = body;
      if (!conversation_id || !content) {
        return Response.json({ error: 'conversation_id and content required' }, { status: 400 });
      }
      const conv = await sr.agents.getConversation(conversation_id);
      await sr.agents.addMessage(conv, { role: 'user', content: String(content).slice(0, 3000) });
      return Response.json({ ok: true });
    }

    if (action === 'get') {
      const { conversation_id } = body;
      if (!conversation_id) {
        return Response.json({ error: 'conversation_id required' }, { status: 400 });
      }
      const conv = await sr.agents.getConversation(conversation_id);
      return Response.json({
        id: conv.id,
        messages: (conv.messages || []).map((m) => ({ role: m.role, content: m.content })),
      });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
});