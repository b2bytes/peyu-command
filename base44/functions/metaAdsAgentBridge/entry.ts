import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsAgentBridge · Puente para que el Superagente (u otro agente/canal)
// le "hable" en lenguaje natural al agente Meta Ads de Social Studio
// (meta_ads_strategist), que tiene TODO el poder sobre Meta Ads.
//
// El Superagente solo necesita autorizar ESTA función (un único permiso) en
// vez de las ~20 funciones de Meta. Internamente abre una conversación con el
// agente Meta Ads, le envía la instrucción, espera su respuesta final y la
// devuelve como texto.
//
// Payload: { instruccion: string, conversation_id?: string }
//   - instruccion: lo que el founder quiere que haga/responda Meta Ads.
//   - conversation_id: opcional, para continuar una conversación existente.
// Respuesta: { ok, respuesta, conversation_id, tool_calls }
// ============================================================================

const AGENT_NAME = 'meta_ads_strategist';
const MAX_WAIT_MS = 110000;   // hasta ~110s; el agente investiga/ejecuta
const POLL_MS = 2500;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { instruccion, conversation_id } = await req.json().catch(() => ({}));
    if (!instruccion || !instruccion.trim()) {
      return Response.json({ ok: false, error: 'Falta la instrucción para el agente Meta Ads.' }, { status: 400 });
    }

    // Reutiliza la conversación si nos pasan un id; si no, crea una nueva.
    let conversation;
    if (conversation_id) {
      conversation = await base44.agents.getConversation(conversation_id).catch(() => null);
    }
    if (!conversation) {
      conversation = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Puente Superagente ${new Date().toLocaleString('es-CL')}` },
      });
    }

    const baselineCount = (conversation.messages || []).length;

    // Envía la instrucción del Superagente al agente Meta Ads.
    await base44.agents.addMessage(conversation, {
      role: 'user',
      content: instruccion.trim(),
    });

    // Espera la respuesta final del agente Meta Ads (con texto).
    const start = Date.now();
    let respuesta = '';
    let toolCalls = [];
    while (Date.now() - start < MAX_WAIT_MS) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const conv = await base44.agents.getConversation(conversation.id).catch(() => null);
      const msgs = conv?.messages || [];
      const nuevos = msgs.slice(baselineCount);
      const ultimoAsistente = [...nuevos].reverse().find(
        (m) => m.role === 'assistant' && m.content && m.content.trim()
      );
      if (ultimoAsistente) {
        respuesta = ultimoAsistente.content.trim();
        toolCalls = (ultimoAsistente.tool_calls || []).map((t) => ({
          name: t.name,
          status: t.status,
        }));
        break;
      }
    }

    if (!respuesta) {
      return Response.json({
        ok: false,
        conversation_id: conversation.id,
        error: 'El agente Meta Ads aún está trabajando. Vuelve a consultar con este conversation_id en unos segundos.',
      });
    }

    return Response.json({
      ok: true,
      respuesta,
      conversation_id: conversation.id,
      tool_calls: toolCalls,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});