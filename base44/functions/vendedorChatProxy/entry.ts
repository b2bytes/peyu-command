// ============================================================================
// vendedorChatProxy — Proxy público para el vendedor IA de la tienda (Shop V2)
// ----------------------------------------------------------------------------
// El SDK base44.agents.* requiere usuario autenticado, pero la tienda es
// pública. Este proxy usa service role para que visitantes anónimos chateen
// con el agente vendedor_peyu desde la barra de chat persistente.
//
// Acciones:
//   "create" → { conversation_id }
//   "send"   { conversation_id, content } — en el PRIMER mensaje del hilo
//             inyecta el [CATALOGO] real completo (SKU|nombre|categoría|precio)
//             para que el agente reconozca cualquier producto ("cachos",
//             "paletas"...) sin depender de búsquedas que pueden fallar.
//   "get"    { conversation_id } → { messages } (limpia bloques internos)
//   "lead"   { conversation_id, fields, page_path } — upsert progresivo del
//             ChatLead capturado por el agente vía tags [[LEAD:...]].
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const AGENT_NAME = 'vendedor_peyu';

// Construye el índice compacto del catálogo real (solo productos activos).
// Optimizado para VELOCIDAD: líneas cortas y tramos B2B compactados (menos
// tokens en el prompt → el agente responde más rápido sin perder info).
async function buildCatalogDigest(sr) {
  // Solo traemos los campos que el digest necesita → payload más liviano.
  const prods = await sr.entities.Producto.filter({ activo: true }, 'categoria', 250);
  const lines = (prods || [])
    .filter((p) => p.sku && p.nombre)
    .map((p) => {
      const b2c = p.precio_b2c ? `$${p.precio_b2c}` : '—';
      return `${p.sku}|${p.nombre}|${p.categoria}|B2C ${b2c}|${p.canal || 'B2B+B2C'}`;
    });
  return `\n\n[CATALOGO] Índice REAL y COMPLETO (SKU|nombre|categoría|precio B2C c/IVA|canal). Cualquier palabra del cliente que calce con un nombre de aquí ES un producto: usa SOLO estos SKUs/nombres/precios. Para tramos B2B, stock, colores o detalles usa la herramienta vendedorBuscarProductos (1 llamada, datos reales):\n${lines.join('\n')}`;
}

// Limpia bloques internos de los mensajes del usuario antes de devolverlos al front.
function cleanUserContent(text) {
  return String(text || '').split('\n\n[CATALOGO]')[0];
}

const LEAD_FIELD_MAP = {
  nombre: 'nombre',
  email: 'email',
  telefono: 'telefono',
  empresa: 'empresa',
  fecha: 'fecha_requerida',
  producto: 'producto_interes_nombre',
  sku: 'producto_interes_sku',
};

function computeScore(rec) {
  let s = 0;
  if (rec.nombre) s += 20;
  if (rec.email) s += 25;
  if (rec.telefono) s += 25;
  if (rec.empresa) s += 15;
  if (rec.cantidad_estimada || rec.fecha_requerida) s += 15;
  return Math.min(100, s);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const body = await req.json();
    const { action } = body || {};

    if (action === 'create') {
      const conv = await sr.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: {
          context: 'tienda_v2',
          anonymous: true,
          page_path: body.page_path || null,
        },
      });
      return Response.json({ conversation_id: conv.id });
    }

    if (action === 'send') {
      const { conversation_id, content } = body;
      if (!conversation_id || !content) {
        return Response.json({ error: 'conversation_id and content required' }, { status: 400 });
      }
      // Paraleliza: traer la conversación y construir el digest (solo si el
      // front indica primer mensaje) al mismo tiempo → menos latencia por turno.
      const esFirst = body.first === true;
      const [conv, digest] = await Promise.all([
        sr.agents.getConversation(conversation_id),
        esFirst ? buildCatalogDigest(sr).catch(() => '') : Promise.resolve(''),
      ]);
      let text = String(content).slice(0, 3000);
      const yaHayUser = (conv.messages || []).some((m) => m.role === 'user');
      if (!yaHayUser) {
        if (digest) text += digest;
        else { try { text += await buildCatalogDigest(sr); } catch { /* sin digest: usa la herramienta */ } }
      }
      await sr.agents.addMessage(conv, { role: 'user', content: text });
      return Response.json({ ok: true });
    }

    if (action === 'get') {
      const { conversation_id } = body;
      if (!conversation_id) {
        return Response.json({ error: 'conversation_id required' }, { status: 400 });
      }
      const conv = await sr.agents.getConversation(conversation_id);
      return Response.json({
        id: conv.id,
        messages: (conv.messages || []).map((m) => ({
          role: m.role,
          content: m.role === 'user' ? cleanUserContent(m.content) : m.content,
        })),
      });
    }

    if (action === 'lead') {
      const { conversation_id, fields } = body;
      if (!conversation_id || !fields || typeof fields !== 'object') {
        return Response.json({ error: 'conversation_id and fields required' }, { status: 400 });
      }
      const patch = {};
      const log = [];
      const now = new Date().toISOString();
      for (const [k, vRaw] of Object.entries(fields)) {
        const v = String(vRaw || '').trim().slice(0, 200);
        if (!v) continue;
        if (k === 'cantidad') {
          const n = parseInt(v.replace(/\D/g, ''), 10);
          if (n > 0) { patch.cantidad_estimada = n; log.push({ campo: k, valor: v, at: now }); }
        } else if (k === 'tipo') {
          if (['B2C', 'B2B'].includes(v.toUpperCase())) { patch.tipo = v.toUpperCase(); }
        } else if (LEAD_FIELD_MAP[k]) {
          patch[LEAD_FIELD_MAP[k]] = v;
          log.push({ campo: k, valor: v, at: now });
        }
      }
      if (!Object.keys(patch).length) return Response.json({ ok: true, skipped: true });

      const existing = await sr.entities.ChatLead.filter({ conversation_id }, undefined, 1);
      if (existing?.[0]) {
        const prev = existing[0];
        const merged = { ...prev, ...patch };
        await sr.entities.ChatLead.update(prev.id, {
          ...patch,
          score: computeScore(merged),
          estado: computeScore(merged) >= 45 ? 'Calificado' : (prev.estado || 'Activo'),
          datos_capturados: [...(prev.datos_capturados || []), ...log],
          ultimo_mensaje_at: now,
        });
      } else {
        await sr.entities.ChatLead.create({
          conversation_id,
          tipo: patch.tipo || 'Sin clasificar',
          estado: 'Activo',
          ...patch,
          score: computeScore(patch),
          datos_capturados: log,
          page_origen: body.page_path || null,
          ultimo_mensaje_at: now,
        });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
});