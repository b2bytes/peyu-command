// Upsert de registros con integrated embedding (el modelo e5 vectoriza
// automáticamente el campo chunk_text).
//
// Payload:
// {
//   namespace: 'products' | 'customers' | 'policies_faq' | ...,
//   records: [ { _id, chunk_text, ...metadata }, ... ]
// }
//
// Accesible vía base44.functions.invoke('pineconeUpsert', { namespace, records })
// o llamado desde otras funciones backend con base44.asServiceRole.functions.invoke.
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

    const { namespace, records } = await req.json();
    if (!namespace || !Array.isArray(records) || records.length === 0) {
      return Response.json({ error: 'namespace y records[] son requeridos' }, { status: 400 });
    }

    const host = await getIndexHost(apiKey);

    // Upsert en batches de 96 (límite seguro Pinecone)
    const chunks = [];
    for (let i = 0; i < records.length; i += 96) chunks.push(records.slice(i, i + 96));

    let total = 0;
    for (const batch of chunks) {
      const res = await fetch(`https://${host}/records/namespaces/${namespace}/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/x-ndjson',
          'X-Pinecone-API-Version': '2025-01',
        },
        // Formato NDJSON: un JSON por línea
        body: batch.map(r => JSON.stringify(r)).join('\n'),
      });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: 'Upsert failed', details: err, batch: total }, { status: 500 });
      }
      total += batch.length;
    }

    return Response.json({ ok: true, upserted: total, namespace });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});