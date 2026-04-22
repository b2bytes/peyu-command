// 🧠 ASK PEYU BRAIN — RAG endpoint unificado.
// Llamable desde cualquier agente o frontend para obtener respuestas
// con contexto enriquecido desde la memoria vectorial.
//
// Payload:
// {
//   query: 'regalo navidad empresa 200u',
//   namespaces: ['products', 'policies_faq'], // opcional - default todos
//   top_k: 5,
//   filter: {...},
//   format: 'json' | 'context' // default json (para humanos). context = bloque listo para prompt.
// }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';
const ALL_NS = ['products', 'policies_faq', 'brand_voice', 'sustainability'];

async function getIndexHost(apiKey) {
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' }
  });
  if (!r.ok) throw new Error('Índice no encontrado');
  const d = await r.json();
  return d.host;
}

async function searchNs(host, apiKey, ns, query, topK, filter) {
  const body = {
    query: { inputs: { text: query }, top_k: topK, ...(filter ? { filter } : {}) },
    rerank: { model: 'bge-reranker-v2-m3', rank_fields: ['chunk_text'], top_n: Math.min(topK, 3) },
  };
  const res = await fetch(`https://${host}/records/namespaces/${ns}/search`, {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2025-01' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.result?.hits || []).map(h => ({
    namespace: ns,
    id: h._id,
    score: h._score,
    ...h.fields,
  }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ error: 'PINECONE_API_KEY missing' }, { status: 500 });

    const { query, namespaces, top_k = 4, filter, format = 'json' } = await req.json();
    if (!query) return Response.json({ error: 'query requerido' }, { status: 400 });

    const host = await getIndexHost(apiKey);
    const nsList = namespaces || ALL_NS;

    // Búsqueda paralela en todos los namespaces
    const results = await Promise.all(
      nsList.map(ns => searchNs(host, apiKey, ns, query, top_k, filter))
    );
    const hits = results.flat().sort((a, b) => (b.score || 0) - (a.score || 0));

    if (format === 'context') {
      // Bloque de texto listo para inyectar en prompt de agente
      const contextBlock = hits.slice(0, 8).map((h, i) =>
        `[${i+1}] (${h.namespace}) ${h.chunk_text}`
      ).join('\n\n');
      return Response.json({ ok: true, context: contextBlock, hits_count: hits.length });
    }

    return Response.json({ ok: true, hits });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});