// ============================================================================
// brainRecall · PUERTA ÚNICA DE CONSULTA AL CEREBRO PEYU (RAG para agentes).
// ----------------------------------------------------------------------------
// Un agente hace UNA pregunta en lenguaje natural y recibe el contexto real de
// TODO el negocio: catálogo, clientes, ventas, propuestas, cotizaciones, leads,
// soporte, reseñas y las políticas del knowledge base. Busca en varios
// namespaces a la vez, reordena por relevancia real (reranker) y devuelve un
// contexto listo para razonar, con la fuente de cada dato.
//
// Payload: { pregunta, namespaces?, top_k?, por_namespace? }
//   pregunta      → texto libre ('¿qué le cotizamos a Falabella?')
//   namespaces    → opcional, limita la búsqueda (default: todos los útiles)
//   top_k         → máximo de recuerdos devueltos (default 8)
//   por_namespace → candidatos por namespace antes del ranking (default 4)
// ============================================================================
import { getIndexHost } from '../../shared/brain-records.ts';

const DEFAULT_NAMESPACES = [
  'knowledge_base', // políticas, precios, marca, reglas del negocio
  'products',       // catálogo real
  'customers',      // fichas de clientes
  'orders',         // ventas web y tienda
  'proposals',      // propuestas B2B
  'quotes',         // cotizaciones
  'leads',          // leads B2B y del chat
  'support',        // consultas y problemas
  'reviews',        // voz del cliente post-entrega
];

// Etiqueta legible de la fuente, para que el agente pueda citar de dónde salió.
const FUENTE: Record<string, string> = {
  knowledge_base: 'Política / conocimiento del negocio',
  products: 'Catálogo',
  customers: 'Ficha de cliente',
  orders: 'Historial de ventas',
  proposals: 'Propuesta B2B',
  quotes: 'Cotización',
  leads: 'Lead',
  support: 'Soporte',
  reviews: 'Reseña de cliente',
};

async function searchNamespace(host: string, apiKey: string, ns: string, pregunta: string, topK: number) {
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
    namespace: ns,
    fuente: FUENTE[ns] || ns,
    score: h._score,
    texto: h.fields?.chunk_text || '',
    id: h._id,
  }));
}

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get('PINECONE_API_KEY');
    if (!apiKey) return Response.json({ ok: false, error: 'PINECONE_API_KEY no configurada' }, { status: 500 });

    const { pregunta, namespaces, top_k = 8, por_namespace = 4 } = await req.json().catch(() => ({}));
    if (!pregunta || !String(pregunta).trim()) {
      return Response.json({ ok: false, error: 'Falta la pregunta a recordar.' }, { status: 400 });
    }

    const host = await getIndexHost(apiKey);
    const nss = Array.isArray(namespaces) && namespaces.length ? namespaces : DEFAULT_NAMESPACES;

    // Búsqueda en paralelo: la latencia es la del namespace más lento, no la suma.
    const resultados = await Promise.all(
      nss.map((ns: string) => searchNamespace(host, apiKey, ns, String(pregunta), Number(por_namespace) || 4).catch(() => []))
    );

    const recuerdos = resultados
      .flat()
      .filter((r) => r.texto)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, Math.min(Number(top_k) || 8, 20));

    return Response.json({
      ok: true,
      pregunta,
      encontrados: recuerdos.length,
      recuerdos,
      // Contexto ya armado: el agente puede inyectarlo directo en su razonamiento.
      contexto: recuerdos.map((r, i) => `[${i + 1}] (${r.fuente}) ${r.texto}`).join('\n\n'),
      nota: recuerdos.length
        ? 'Usa solo estos datos como verdad. Si algo no aparece aquí, dilo en vez de inventarlo.'
        : 'El cerebro no tiene información sobre esto. Dilo honestamente y pide el dato en vez de inventarlo.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});