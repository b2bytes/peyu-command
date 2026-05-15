// ============================================================================
// getChatConversation — Lee la conversación completa de un ChatLead
// ----------------------------------------------------------------------------
// Solo admin. Devuelve los mensajes (user + assistant) de una conversación
// Base44 para mostrarla en el drawer del panel /admin/chat-leads.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { conversation_id } = await req.json();
    if (!conversation_id) return Response.json({ error: 'conversation_id required' }, { status: 400 });

    const conv = await base44.asServiceRole.agents.getConversation(conversation_id);
    return Response.json({
      id: conv.id,
      metadata: conv.metadata || {},
      messages: (conv.messages || []).map(m => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at || null,
      })),
    });
  } catch (err) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
});