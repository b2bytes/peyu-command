// ============================================================================
// brainRecallPublico · Consulta al cerebro para agentes que atienden PÚBLICO.
// ----------------------------------------------------------------------------
// Misma capacidad de recuerdo que brainRecall, pero con una frontera de
// privacidad IMPOSIBLE de saltar: solo lee namespaces sin datos personales
// (políticas del negocio, catálogo y reseñas publicables). Nunca clientes,
// pedidos, leads, cotizaciones ni soporte — así un cliente jamás puede
// provocar que el vendedor le cuente algo de otro cliente.
//
// Los datos del propio cliente que escribe se obtienen aparte, con
// whatsappBuscarCliente y su email/teléfono real.
//
// Payload: { pregunta, top_k? }
// ============================================================================
import { getIndexHost } from '../../shared/brain-records.ts';

// Frontera de privacidad: fija en código, no se recibe por parámetro.
const NAMESPACES_PUBLICOS = ['knowledge_base', 'products', 'reviews'];

const FUENTE: Record<string, string> = {
  knowledge_base: 'Política PEYU',
  products: 'Catálogo',
  reviews: 'Reseña de cliente',
};

async function search(host: string, apiKey: string, ns: string, pregunta: string, topK: number) {
  const res = await fetch(`https://${host}/records/namespaces/${ns}/search`, {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2025-01' },
    body: JSON.stringify({
      query: { inputs: { text: pregunta }, top_k: topK },
      rerank: { model: 'bge-reranker-v2-m3', rank_fields: ['chunk_text'], top_n: topK },
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.result?.hits || []).map((h: any) => ({
    fuente: FUENTE[ns] || ns,
    score: h._score,
    texto: h.fields?.chunk_text || '',
  }));
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, error: 'PINECONE_API_KEY no configurada' }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    // Acepta `pregunta` o `query`: los agentes a veces nombran el parámetro en inglés.
    const { top_k = 5 } = body;
    const pregunta = body.pregunta || body.query;
    if (!pregunta || !String(pregunta).trim()) {
      return Response.json({ ok: false, error: 'Falta la pregunta.' }, { status: 400 });
    }

    const host = await getIndexHost(apiKey);
    const resultados = await Promise.all(
      NAMESPACES_PUBLICOS.map((ns) => search(host, apiKey, ns, String(pregunta), 4).catch(() => []))
    );

    const recuerdos = resultados
      .flat()
      .filter((r) => r.texto)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, Math.min(Number(top_k) || 5, 10));

    return Response.json({
      ok: true,
      encontrados: recuerdos.length,
      contexto: recuerdos.map((r, i) => `[${i + 1}] (${r.fuente}) ${r.texto}`).join('\n\n'),
      nota: recuerdos.length
        ? 'Responde SOLO con esta información. Si el cliente pregunta algo que no está aquí, dile que lo confirmas con el equipo en vez de inventarlo.'
        : 'No hay información sobre esto en el cerebro. Sé honesto: dile que lo consultas con el equipo. NUNCA lo inventes.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});