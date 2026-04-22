// 🧠 Cierra una conversación: genera resumen con LLM y lo vectoriza en Pinecone.
// Se llama cuando el usuario abandona el chat o se cierra la sesión.
//
// Payload: { conversation_id, user_email?, messages: [...], last_query? }
// El resumen destilado es lo que se persiste como memoria de largo plazo.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';

async function getIndexHost(apiKey) {
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' }
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.host;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, skip: 'no api key' });

    const { conversation_id, user_email, messages = [], last_query } = await req.json();
    if (!conversation_id || messages.length < 2) {
      return Response.json({ ok: false, skip: 'conversación muy corta' });
    }

    // 1) Generar resumen destilado con LLM
    const transcript = messages.slice(-20).map(m => `${m.role === 'user' ? 'Usuario' : 'Peyu'}: ${m.content}`).join('\n');
    const prompt = `Resume esta conversación de chat comercial de PEYU Chile (gifting sostenible) en 2-3 frases densas para memoria de largo plazo. Destaca: qué buscaba el usuario (ocasión, cantidad, material), qué productos se recomendaron (SKU), si compró/cotizó/abandonó, y preferencias clave.

Transcript:
${transcript}

Devuelve SOLO el resumen en formato JSON.`;

    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Resumen denso de 2-3 frases' },
          outcome: { type: 'string', enum: ['purchased', 'quoted', 'abandoned', 'info_only'] },
          key_interests: { type: 'array', items: { type: 'string' } },
        },
        required: ['summary', 'outcome'],
      },
    });

    const summary = llmRes?.summary || 'Conversación sin resumen claro';
    const outcome = llmRes?.outcome || 'info_only';

    // 2) Vectorizar en Pinecone
    const host = await getIndexHost(apiKey);
    if (!host) return Response.json({ ok: false, skip: 'brain offline' });

    const now = new Date().toISOString();
    const record = {
      _id: `conv-${conversation_id}`,
      chunk_text: [
        `Conversación del ${now.slice(0, 10)}`,
        user_email ? `Usuario: ${user_email}` : 'Usuario anónimo',
        `Consulta clave: ${last_query || '(sin query)'}`,
        `Resumen: ${summary}`,
        `Resultado: ${outcome}`,
        llmRes?.key_interests?.length ? `Intereses: ${llmRes.key_interests.join(', ')}` : '',
      ].filter(Boolean).join('. '),
      conversation_id,
      user_email: user_email || '',
      outcome,
      timestamp: now,
      entity_type: 'conversation',
    };

    const upsertRes = await fetch(`https://${host}/records/namespaces/conversations/upsert`, {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2025-01' },
      body: JSON.stringify(record),
    });

    if (!upsertRes.ok) {
      const err = await upsertRes.text();
      return Response.json({ ok: false, error: err }, { status: 500 });
    }

    return Response.json({ ok: true, conversation_id, summary, outcome });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});