// 🧠 PEYU ASSIST — endpoint RAG para el chat del landing.
// Reemplaza/complementa al agente tradicional usando:
//   1) Memoria vectorial del Brain (productos, políticas, brand voice, ESG)
//   2) Memoria conversacional del usuario (si existe)
//   3) InvokeLLM con contexto enriquecido
//
// Payload: { query, user_email?, session_id?, history?: [...últimos mensajes...] }
// Devuelve: { reply, sources: [...hits usados...] }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INDEX_NAME = 'peyu-brain';
const BRAIN_NS = ['products', 'policies_faq', 'brand_voice', 'sustainability'];

async function getIndexHost(apiKey) {
  const r = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { 'Api-Key': apiKey, 'X-Pinecone-API-Version': '2025-01' }
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.host;
}

async function searchNs(host, apiKey, ns, query, topK) {
  try {
    const body = {
      query: { inputs: { text: query }, top_k: topK },
      rerank: { model: 'bge-reranker-v2-m3', rank_fields: ['chunk_text'], top_n: Math.min(topK, 3) },
    };
    const res = await fetch(`https://${host}/records/namespaces/${ns}/search`, {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json', 'X-Pinecone-API-Version': '2025-01' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.result?.hits || []).map(h => ({ namespace: ns, id: h._id, score: h._score, ...h.fields }));
  } catch { return []; }
}

const SYSTEM_PROMPT = `Eres Peyu 🐢, asistente comercial autónomo de PEYU Chile (gifting corporativo 100% sostenible con plástico reciclado chileno).

TU MISIÓN: cerrar la venta EN EL MISMO CHAT siempre que puedas: Interés → Descubrimiento → Recomendación visual → Carrito → Checkout.

═══ TAGS ESPECIALES (el frontend los renderiza como UI) ═══
- [[PRODUCTO:SKU]] → tarjeta visual del producto con precio, rating y botones
- [[CART:SKU:cantidad]] → agrega al carrito silenciosamente
- [[CHECKOUT]] → muestra checkout express en el chat
- [[NAV:/ruta|Etiqueta]] → botón de navegación interna
- [[ACTION:cotizar_b2b]] → abre formulario B2B
- [[ACTION:whatsapp]] → abre WhatsApp humano
- [[ACTION:ir_a_shop]] → lleva a /shop

REGLAS:
- MÁXIMO 3 [[PRODUCTO:]] por respuesta
- Cada tag en SU PROPIA LÍNEA
- NUNCA inventes SKUs — solo usa los del CONTEXTO RECUPERADO
- Español cálido, tipo WhatsApp, máximo 4 líneas por bloque
- Emojis moderados: 🐢 🌱 ♻️ 🎁 ✨ 💼 🇨🇱
- Sin markdown pesado (nada de **, ##, tablas). Solo guiones ( - ) para listas.
- Una pregunta corta al final

FLUJO B2C (1-9u): muestra productos → [[CART:SKU:qty]] + [[CHECKOUT]]
FLUJO B2B (50+u): muestra productos corporativos → [[ACTION:cotizar_b2b]] + menciona impacto ESG
DUDAS (envíos/cambios): usa [[NAV:/ruta]] correspondiente`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { query, user_email, history = [] } = await req.json();
    if (!query) return Response.json({ error: 'query requerido' }, { status: 400 });

    const apiKey = Deno.env.get('PINECONE_API_KEY');
    const host = apiKey ? await getIndexHost(apiKey) : null;

    // 1) Búsqueda paralela en el Brain (conocimiento)
    let brainHits = [];
    if (host) {
      const results = await Promise.all(
        BRAIN_NS.map(ns => searchNs(host, apiKey, ns, query, 4))
      );
      brainHits = results.flat().sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
    }

    // 2) Memoria conversacional del usuario (si tiene email)
    let userMemory = [];
    if (host && user_email) {
      userMemory = await searchNs(host, apiKey, 'conversations', query, 3);
    }

    // 3) Perfil del cliente (si existe)
    let customerProfile = null;
    if (host && user_email) {
      const profileHits = await searchNs(host, apiKey, 'customers', user_email, 1);
      if (profileHits.length > 0 && profileHits[0].score > 0.75) {
        customerProfile = profileHits[0];
      }
    }

    // Construir contexto para el LLM
    const contextBlock = brainHits.map((h, i) =>
      `[${i+1}] (${h.namespace}${h.sku ? '/' + h.sku : ''}) ${h.chunk_text}`
    ).join('\n\n');

    const memoryBlock = userMemory.length > 0
      ? '\n\n═══ HISTORIAL DEL CLIENTE (conversaciones previas) ═══\n' +
        userMemory.map(m => `• ${m.chunk_text}`).join('\n')
      : '';

    const profileBlock = customerProfile
      ? `\n\n═══ PERFIL DEL CLIENTE RECURRENTE ═══\n${customerProfile.chunk_text}`
      : '';

    const historyBlock = history.length > 0
      ? '\n\n═══ CONVERSACIÓN ACTUAL ═══\n' +
        history.slice(-6).map(m => `${m.role === 'user' ? '👤' : '🐢'}: ${m.content}`).join('\n')
      : '';

    const fullPrompt = `${SYSTEM_PROMPT}

═══ CONTEXTO RECUPERADO DEL BRAIN (usa solo estos productos/datos) ═══
${contextBlock || '(Sin resultados relevantes — responde honestamente y ofrece WhatsApp)'}
${profileBlock}${memoryBlock}${historyBlock}

═══ MENSAJE ACTUAL DEL USUARIO ═══
${query}

Responde ahora como Peyu, usando los tags especiales cuando corresponda. Si recomiendas un producto, USA EXACTAMENTE el SKU que aparece en el contexto.`;

    const llmRes = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
    });

    const reply = typeof llmRes === 'string' ? llmRes : (llmRes?.response || llmRes?.text || '');

    return Response.json({
      ok: true,
      reply,
      sources: brainHits.slice(0, 5).map(h => ({
        ns: h.namespace,
        id: h.id,
        sku: h.sku,
        score: h.score
      })),
      has_memory: userMemory.length > 0,
      has_profile: !!customerProfile,
    });
  } catch (error) {
    console.error('[peyuAssist]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});