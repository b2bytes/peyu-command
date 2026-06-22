import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// saveKnowledge · Guarda una respuesta del agente como conocimiento validado
// de PEYU. Lo escribe en DOS capas:
//   1) Pinecone (índice peyu-brain, namespace 'knowledge_base') → búsqueda
//      semántica que cualquier agente puede recuperar después.
//   2) Entidad MetaAgentMemory (kind 'aprendizaje') → respaldo por keywords,
//      base de conocimiento general consultable aunque Pinecone falle.
//
// Payload: { text, source?, kind? }
//   text   → la respuesta del agente a guardar
//   source → 'meta_ads' | 'agente_os' (de qué agente vino)
//   kind   → tipo de recuerdo (default 'aprendizaje')
// ============================================================================

const INDEX_NAME = 'peyu-brain';
const NAMESPACE = 'knowledge_base';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const STOP = new Set(['de','la','el','los','las','un','una','que','con','para','por','del','y','o','a','en','mi','tu','su','me','se','lo','al','es','como']);
function tokens(s) {
  return norm(s).split(/[^a-z0-9áéíóúñ]+/).filter((w) => w.length > 2 && !STOP.has(w));
}

async function pineconeHost(apiKey) {
  const res = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' },
  });
  if (!res.ok) return null;
  const desc = await res.json();
  return desc?.status?.ready ? desc.host : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { text, source = 'agente_os', kind = 'aprendizaje' } = await req.json().catch(() => ({}));
    if (!text || !text.trim()) return Response.json({ ok: false, error: 'Falta el texto a guardar.' });

    const clean = text.trim().slice(0, 6000);
    const author = user.email || 'founder';
    const apiKey = Deno.env.get('PINECONE_API_KEY');

    // Capa 1 · Pinecone (best-effort)
    let vectorial = false;
    let host = null;
    try { if (apiKey) host = await pineconeHost(apiKey); } catch { host = null; }
    if (host) {
      try {
        const r = await fetch(`https://${host}/records/namespaces/${NAMESPACE}/upsert`, {
          method: 'POST',
          headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2025-01' },
          body: JSON.stringify({
            _id: `kb_${Date.now()}`,
            chunk_text: clean,
            kind,
            source,
            author,
            created_at: new Date().toISOString(),
          }),
        });
        vectorial = r.ok;
      } catch { vectorial = false; }
    }

    // Capa 2 · Entidad MetaAgentMemory (respaldo SIEMPRE)
    await base44.asServiceRole.entities.MetaAgentMemory.create({
      texto: clean,
      kind,
      author: `${author} · ${source}`,
      keywords: tokens(clean).slice(0, 24),
    });

    return Response.json({ ok: true, saved: true, vectorial });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});