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
async function buildCatalogDigest(sr) {
  const prods = await sr.entities.Producto.filter({ activo: true }, 'categoria', 250);
  const lines = (prods || [])
    .filter((p) => p.sku && p.nombre)
    .map((p) => {
      const b2c = p.precio_b2c ? `$${p.precio_b2c}` : 'sin precio B2C';
      const t = p.precio_b2b_tramos || {};
      // Inyectamos TODOS los tramos B2B netos (sin IVA) para que el agente pueda
      // calcular el precio mayorista B2C exacto = tramo × 1.19 (idéntico al checkout).
      const tramos = [];
      if (t.unitario) tramos.push(`1-9u:$${t.unitario}`);
      if (t.t10_49) tramos.push(`10-49u:$${t.t10_49}`);
      if (t.t50_99) tramos.push(`50-99u:$${t.t50_99}`);
      if (t.t100_249) tramos.push(`100-249u:$${t.t100_249}`);
      if (t.t250_499) tramos.push(`250-499u:$${t.t250_499}`);
      if (t.t500_999) tramos.push(`500-999u:$${t.t500_999}`);
      if (t.t1000_1999) tramos.push(`1000-1999u:$${t.t1000_1999}`);
      if (t.t2000_mas) tramos.push(`2000+u:$${t.t2000_mas}`);
      const b2bInfo = tramos.length ? ` | B2B neto/u (sin IVA) por tramo: ${tramos.join(', ')}` : '';
      return `${p.sku} | ${p.nombre} | ${p.categoria} | ${b2c} | canal: ${p.canal || 'B2B + B2C'}${b2bInfo}`;
    });
  return `\n\n[CATALOGO] Este es el catálogo REAL y COMPLETO de la tienda (SKU | nombre | categoría | precio B2C IVA incl. | canal | ref B2B). Cualquier palabra del cliente que calce con un nombre de aquí ES un producto. Usa SOLO estos SKUs, nombres y precios. Los precios B2B por tramo son NETOS (sin IVA): para el precio MAYORISTA B2C con IVA multiplica el tramo correspondiente por 1,19:\n${lines.join('\n')}`;
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
      const conv = await sr.agents.getConversation(conversation_id);
      let text = String(content).slice(0, 3000);
      // Primer mensaje del hilo → adjunta el catálogo real completo (una vez).
      const yaHayUser = (conv.messages || []).some((m) => m.role === 'user');
      if (!yaHayUser) {
        try { text += await buildCatalogDigest(sr); } catch { /* sin digest: el agente usa la herramienta */ }
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