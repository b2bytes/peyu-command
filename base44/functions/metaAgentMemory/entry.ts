import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAgentMemory · Memoria a corto y largo plazo del Estratega de Meta Ads.
// ----------------------------------------------------------------------------
// Da al agente una memoria PERSISTENTE entre conversaciones. Recuerda
// decisiones, aprendizajes de campañas, qué creativo/público funcionó,
// presupuestos acordados, instrucciones del founder, etc.
//
// Doble capa, a prueba de fallos:
//   1) Pinecone (búsqueda semántica) si la API key está activa.
//   2) Entidad MetaAgentMemory (recuperación por keywords) SIEMPRE como
//      respaldo — así el agente nunca se queda sin memoria aunque Pinecone
//      no esté disponible.
//
// Payload:
//   { action: 'remember', text, kind?, meta? }   → guarda un recuerdo
//   { action: 'recall', query, top_k? }          → recupera recuerdos relevantes
//
// kind: 'decision'|'aprendizaje'|'instruccion'|'campaña'|'preferencia'|'resultado'|'contexto'
// ============================================================================

const INDEX_NAME = 'peyu-brain';
const NAMESPACE = 'meta_ads_memory';

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

    const { action, text, query, kind = 'contexto', meta = {}, top_k = 6 } = await req.json().catch(() => ({}));
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    let host = null;
    try { if (apiKey) host = await pineconeHost(apiKey); } catch { host = null; }

    if (action === 'remember') {
      if (!text || !text.trim()) return Response.json({ ok: false, error: 'Falta el texto a recordar.' });
      const clean = text.trim();
      const author = user.email || 'founder';

      // Capa 1 · Pinecone (best-effort)
      let vectorial = false;
      if (host) {
        try {
          const r = await fetch(`https://${host}/records/namespaces/${NAMESPACE}/upsert`, {
            method: 'POST',
            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/x-ndjson', 'X-Pinecone-API-Version': '2025-01' },
            body: JSON.stringify({ _id: `mem_${Date.now()}`, chunk_text: clean, kind, author, created_at: new Date().toISOString(), ...meta }),
          });
          vectorial = r.ok;
        } catch { vectorial = false; }
      }

      // Capa 2 · Entidad (respaldo SIEMPRE)
      await base44.asServiceRole.entities.MetaAgentMemory.create({
        texto: clean, kind, author, keywords: tokens(clean).slice(0, 24),
      });

      return Response.json({ ok: true, remembered: true, kind, vectorial });
    }

    if (action === 'recall') {
      if (!query || !query.trim()) return Response.json({ ok: false, error: 'Falta la consulta para recordar.' });

      // Capa 1 · Pinecone semántico
      if (host) {
        try {
          const r = await fetch(`https://${host}/records/namespaces/${NAMESPACE}/search`, {
            method: 'POST',
            headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2025-01' },
            body: JSON.stringify({ query: { inputs: { text: query.trim() }, top_k } }),
          });
          if (r.ok) {
            const data = await r.json();
            const memories = (data?.result?.hits || []).map((h) => ({
              text: h.fields?.chunk_text, kind: h.fields?.kind, created_at: h.fields?.created_at,
            }));
            if (memories.length) return Response.json({ ok: true, memories, count: memories.length, source: 'pinecone' });
          }
        } catch { /* cae al respaldo */ }
      }

      // Capa 2 · Entidad con scoring por keywords
      const all = await base44.asServiceRole.entities.MetaAgentMemory.list('-created_date', 200);
      const qTokens = new Set(tokens(query));
      const scored = all.map((m) => {
        const mk = new Set([...(m.keywords || []), ...tokens(m.texto)]);
        let score = 0;
        for (const t of qTokens) if (mk.has(t)) score += 1;
        return { m, score };
      }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
      const memories = (scored.length ? scored.slice(0, top_k) : all.slice(0, Math.min(top_k, 4)).map((m) => ({ m })))
        .map(({ m }) => ({ text: m.texto, kind: m.kind, created_at: m.created_date }));
      return Response.json({ ok: true, memories, count: memories.length, source: 'entity' });
    }

    return Response.json({ ok: false, error: "action debe ser 'remember' o 'recall'." });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});