// 💭 Guarda en Pinecone un resumen vectorizado de una conversación cerrada.
// Se llama desde el frontend cuando el usuario cierra/navega tras una sesión de chat.
//
// Payload: { conversation_id, user_email?, summary, last_query, outcome? }
// outcome: 'purchased' | 'quoted' | 'abandoned' | 'info_only'
//
// La memoria conversacional permite que el próximo chat del mismo usuario
// recupere contexto útil ("la última vez buscabas regalos navidad para 200u").
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';

async function getIndexHost(apiKey) {
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' }
  });
  if (!r.ok) throw new Error('Índice no encontrado');
  const d = await r.json();
  return d.host;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, skip: 'no api key' });

    const { conversation_id, user_email, summary, last_query, outcome } = await req.json();
    if (!conversation_id || !summary) {
      return Response.json({ error: 'conversation_id y summary requeridos' }, { status: 400 });
    }

    const host = await getIndexHost(apiKey);
    const now = new Date().toISOString();

    const record = {
      _id: `conv-${conversation_id}`,
      chunk_text: [
        `Conversación del ${now.slice(0, 10)}`,
        user_email ? `Usuario: ${user_email}` : 'Usuario anónimo',
        `Consulta clave: ${last_query || '(sin query)'}`,
        `Resumen: ${summary}`,
        outcome ? `Resultado: ${outcome}` : '',
      ].filter(Boolean).join('. '),
      conversation_id,
      user_email: user_email || '',
      outcome: outcome || 'info_only',
      timestamp: now,
      entity_type: 'conversation',
    };

    const res = await fetch(`https://${host}/records/namespaces/conversations/upsert`, {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2025-01' },
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ ok: false, error: err }, { status: 500 });
    }

    return Response.json({ ok: true, conversation_id });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});