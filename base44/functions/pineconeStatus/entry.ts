// Estado del índice peyu-brain + estadísticas por namespace.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ error: 'PINECONE_API_KEY missing' }, { status: 500 });

    // 1) Descripción del índice
    const descRes = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
      headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2024-10' }
    });
    if (descRes.status === 404) {
      return Response.json({ ok: false, exists: false, message: 'Índice no creado aún. Ejecuta pineconeInit.' });
    }
    const desc = await descRes.json();
    const host = desc.host;
    const ready = desc?.status?.ready;

    // 2) Stats (si está ready)
    let stats = null;
    if (ready && host) {
      const statsRes = await fetch(`https://${host}/describe_index_stats`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2024-10' },
        body: JSON.stringify({}),
      });
      stats = await statsRes.json();
    }

    return Response.json({
      ok: true,
      exists: true,
      ready,
      host,
      dimension: desc?.dimension,
      metric: desc?.metric,
      model: desc?.embed?.model,
      stats,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});