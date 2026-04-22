// Eliminar vectores por ID o namespace completo.
// Payload: { namespace, ids?: [], delete_all?: boolean }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';

async function getIndexHost(apiKey) {
  const descRes = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' }
  });
  const desc = await descRes.json();
  return desc.host;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('PINECONE_API_KEY');
    const { namespace, ids, delete_all } = await req.json();
    if (!namespace) return Response.json({ error: 'namespace requerido' }, { status: 400 });

    const host = await getIndexHost(apiKey);

    if (delete_all) {
      const res = await fetch(`https://${host}/namespaces/${namespace}`, {
        method: 'DELETE',
        headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' },
      });
      return Response.json({ ok: res.ok, status: res.status });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      const res = await fetch(`https://${host}/vectors/delete`, {
        method: 'POST',
        headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2025-01' },
        body: JSON.stringify({ ids, namespace }),
      });
      return Response.json({ ok: res.ok, deleted: ids.length });
    }

    return Response.json({ error: 'Provide ids[] or delete_all=true' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});