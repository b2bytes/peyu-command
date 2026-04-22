// Crea (idempotente) el índice 'peyu-brain' en Pinecone usando el modelo
// integrated multilingual-e5-large (1024 dims, Pinecone Inference).
// Solo admin.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';
const MODEL = 'multilingual-e5-large'; // 1024 dims, 100+ idiomas, gratis con Pinecone

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ error: 'PINECONE_API_KEY missing' }, { status: 500 });

    // 1) Listar índices existentes
    const listRes = await fetch('https://api.pinecone.io/indexes', {
      headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2024-10' }
    });
    const listData = await listRes.json();
    const existing = (listData?.indexes || []).find(i => i.name === INDEX_NAME);

    if (existing) {
      return Response.json({
        ok: true,
        message: 'Índice ya existe',
        index: existing,
        host: existing.host,
      });
    }

    // 2) Crear índice serverless con integrated embedding
    const createRes = await fetch('https://api.pinecone.io/indexes/create-for-model', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'X-Pinecone-API-Version': '2024-10',
      },
      body: JSON.stringify({
        name: INDEX_NAME,
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
          model: MODEL,
          field_map: { text: 'chunk_text' },
        },
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      return Response.json({ error: 'Create failed', details: createData }, { status: 500 });
    }

    return Response.json({
      ok: true,
      message: 'Índice creado exitosamente',
      index: createData,
      note: 'Puede tardar hasta 1 minuto en estar Ready. Revisa estado con pineconeStatus.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});