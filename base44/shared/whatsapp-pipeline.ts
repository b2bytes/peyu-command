// ════════════════════════════════════════════════════════════════════════
// Clasificador del pipeline de WhatsApp (lógica compartida).
// ────────────────────────────────────────────────────────────────────────
// Deduce la etapa REAL de una conversación del agente whatsapp_peyu a partir
// de sus mensajes y de las herramientas que el agente usó, y la guarda en
// WhatsAppConvEtapa con historial de cambios.
//
// Lo usan:
//   · whatsappEvolutionWebhook  → mueve la tarjeta al instante, en cada mensaje
//   · whatsappPipelineSync      → barrido periódico de respaldo (CRON / manual)
// ════════════════════════════════════════════════════════════════════════

import { detectarIntencion } from './whatsapp-intent.ts';

const parseResult = (r) => {
  if (!r) return null;
  if (typeof r === 'object') return r;
  try { return JSON.parse(r); } catch { return null; }
};

/**
 * Clasifica UNA conversación y hace upsert de su etapa.
 * @param sr base44.asServiceRole
 * @param conv conversación (idealmente completa, con messages)
 * @param prevOpcional registro WhatsAppConvEtapa ya conocido (evita una query)
 * @returns { etapa, cambio }
 */
export async function clasificarConversacion(sr, conv, prevOpcional = null) {
  const full = conv?.messages ? conv : (await sr.agents.getConversation(conv.id).catch(() => conv));
  const msgs = full?.messages || [];

  let prev = prevOpcional;
  if (!prev) {
    const encontrados = await sr.entities.WhatsAppConvEtapa.filter({ conversation_id: conv.id }).catch(() => []);
    prev = encontrados?.[0] || null;
  }

  // ── Herramientas usadas y sus resultados ──
  const toolCalls = [];
  for (const m of msgs) for (const tc of (m.tool_calls || [])) toolCalls.push(tc);
  const names = toolCalls.map((t) => String(t.name || ''));
  const has = (s) => names.some((n) => n.toLowerCase().includes(s.toLowerCase()));
  const lastName = names.length ? names[names.length - 1] : '';

  const userMsgs = msgs.filter((m) => m.role === 'user');
  const userTexts = userMsgs.map((m) => m.content || '').join(' \n ');
  const hasEmail = /\S+@\S+\.\S+/.test(userTexts);

  let numeroPedido = '', numeroCot = '', monto = 0;
  for (const tc of toolCalls) {
    const r = parseResult(tc.results);
    if (!r) continue;
    if (r.numero && String(r.numero).startsWith('COT')) numeroCot = r.numero;
    if (r.numero_pedido) numeroPedido = r.numero_pedido;
    if (Number(r.total) > 0) monto = Number(r.total);
  }

  // ── Clasificación por prioridad (el último avance gana) ──
  let etapa = 'nuevo';
  let tipo = prev?.tipo && prev.tipo !== 'Sin clasificar' ? prev.tipo : 'Sin clasificar';
  if (userMsgs.length >= 2 || has('BuscarProductos') || has('Recomendar')) etapa = 'explorando';
  if (hasEmail) etapa = 'datos';

  // Intención declarada por el cliente: pide cotización o hace un reclamo.
  // Se detecta sobre TODO lo que ha escrito, con el último mensaje mandando.
  const intencion = detectarIntencion(userMsgs[userMsgs.length - 1]?.content) || detectarIntencion(userTexts);
  if (intencion === 'cotizacion') { etapa = 'cotizacion'; tipo = 'B2B'; }
  if (has('CheckoutLink') || has('CartCheckout')) { etapa = 'pago'; tipo = 'B2C'; }
  if (has('generateChatQuotePDF')) { etapa = 'cotizado'; tipo = 'B2B'; }
  if (lastName.toLowerCase().includes('estadopedido')) etapa = 'postventa';
  if (names.some((n) => /consulta/i.test(n))) etapa = 'escalado';
  // Un reclamo manda por sobre cualquier otro avance: va directo a su columna.
  if (intencion === 'reclamo') etapa = 'reclamo';
  if (full?.metadata?.human_takeover) etapa = 'escalado';

  // Convertido: hay pedido y ya está pagado
  if (numeroPedido && etapa !== 'escalado' && etapa !== 'reclamo') {
    const pedidos = await sr.entities.PedidoWeb.filter({ numero_pedido: numeroPedido }).catch(() => []);
    if (pedidos.length && pedidos[0].payment_status === 'paid') etapa = 'convertido';
  }

  const nowIso = new Date().toISOString();
  const lastUser = userMsgs[userMsgs.length - 1];
  const data = {
    conversation_id: conv.id,
    etapa,
    tipo,
    cliente_nombre: full?.metadata?.name || prev?.cliente_nombre || `Cliente ${String(conv.id).slice(-5)}`,
    telefono: full?.metadata?.phone || prev?.telefono || '',
    resumen: (lastUser?.content || '').slice(0, 140),
    mensajes_count: msgs.length,
    numero_pedido: numeroPedido || prev?.numero_pedido || '',
    numero_cotizacion: numeroCot || prev?.numero_cotizacion || '',
    monto_clp: monto || prev?.monto_clp || 0,
    ultimo_mensaje_at: full?.updated_date || nowIso,
    clasificado_at: nowIso,
  };

  let cambio = null;
  if (prev) {
    const hist = Array.isArray(prev.historial_etapas) ? prev.historial_etapas : [];
    if (prev.etapa !== etapa) {
      data.historial_etapas = [...hist, { etapa, at: nowIso }];
      cambio = { conversation_id: conv.id, de: prev.etapa, a: etapa };
    }
    await sr.entities.WhatsAppConvEtapa.update(prev.id, data);
  } else {
    data.historial_etapas = [{ etapa, at: nowIso }];
    await sr.entities.WhatsAppConvEtapa.create(data);
  }

  return { etapa, cambio };
}