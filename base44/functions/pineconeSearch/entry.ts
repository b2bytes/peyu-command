// Búsqueda semántica con reranking opcional.
//
// Payload:
// {
//   namespace: 'products',
//   query: 'regalo navidad para empresa',
//   top_k: 5,                // default 5
//   filter: { categoria: 'Escritorio' }, // opcional
//   rerank: true             // opcional - usa bge-reranker-v2-m3
// }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';

async function getIndexHost(apiKey) {
  const descRes = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' }
  });
  if (!descRes.ok) throw new Error('Índice no encontrado');
  const desc = await descRes.json();
  return desc.host;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ error: 'PINECONE_API_KEY missing' }, { status: 500 });

    const { namespace, query, top_k = 5, filter, rerank = false, rerank_top_n = 3 } = await req.json();
    if (!namespace || !query) {
      return Response.json({ error: 'namespace y query son requeridos' }, { status: 400 });
    }

    const host = await getIndexHost(apiKey);

    const body = {
      query: {
        inputs: { text: query },
        top_k,
        ...(filter ? { filter } : {}),
      },
    };

    // Reranking opcional — mejora precisión 15-30%
    if (rerank) {
      body.rerank = {
        model: 'bge-reranker-v2-m3',
        rank_fields: ['chunk_text'],
        top_n: rerank_top_n,
      };
    }

    const res = await fetch(`https://${host}/records/namespaces/${namespace}/search`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'X-Pinecone-API-Version': '2025-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: 'Search failed', details: err }, { status: 500 });
    }

    const data = await res.json();
    // Normalizar hits para frontend/agente
    const hits = (data?.result?.hits || []).map(h => ({
      id: h._id,
      score: h._score,
      ...h.fields,
    }));

    return Response.json({ ok: true, hits, raw: data?.result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});