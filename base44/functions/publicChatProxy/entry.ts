// ============================================================================
// publicChatProxy — Proxy público para el chat de Peyu en el landing
// ----------------------------------------------------------------------------
// El SDK base44.agents.* requiere usuario autenticado, pero ShopLanding es
// público. Este proxy usa service role para que visitantes anónimos puedan
// chatear con el agente.
//
// 🆕 CAPTURA PROGRESIVA DE LEADS (mayo 2026):
//   Cada vez que llega un mensaje del usuario, extraemos datos (nombre,
//   email, teléfono, empresa, fecha, cantidad) con regex y hacemos UPSERT
//   a la entidad ChatLead indexada por conversation_id. Basta con UN dato
//   para crear el lead — se va enriqueciendo turn a turn.
//
// Acciones soportadas (via "action" en el body):
//   - "create"   → crea conversación, retorna { conversation_id }
//   - "send"     → agrega mensaje + upsert ChatLead { conversation_id, content }
//   - "get"      → obtiene conversación { conversation_id } → { messages }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const AGENT_NAME = 'asistente_compras';

// ─── Regex de extracción progresiva ─────────────────────────────────
const EMAIL_REGEX = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i;
const PHONE_REGEX = /(\+?56\s?9[\s-]?\d{4}[\s-]?\d{4}|\b9\s?\d{4}\s?\d{4}\b|\b\d{9}\b)/;
const NAME_REGEX = /\b(?:soy|me llamo|mi nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/;
const EMPRESA_REGEX = /\b(?:soy de|trabajo en|nuestra empresa|empresa[: ]|de la empresa|de )\s*([A-ZÁÉÍÓÚÑ][\w\s&.,'-]{2,40})/;
const QTY_REGEX = /\b(\d{1,5})\s*(u\.?|unidades?|pcs|piezas|regalos|personas|empleados?|colaboradores?)\b/i;
const DATE_REGEX = /\b(\d{1,2})\s?(?:de\s)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i;
const RUT_REGEX = /\b(\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK])\b/;

const B2B_KW = /\b(empresa|empleados?|equipo|colaboradores?|corporativo|oficina|rrhh|cliente[s]?|proveedor(es)?|evento|fin de a[ñn]o|logo|marca|branded|masivo|cotizaci[oó]n)\b/i;
const B2C_KW = /\b(para m[ií]|uno solo|individual|mi (mam[áa]|pap[áa]|pareja|polola|pololo|amig[oa]|herman[oa]|hij[oa]|jefe|sobrin[oa])|cumplea[ñn]os|aniversario|regalo personal)\b/i;

function extractData(msg) {
  if (!msg) return {};
  const out = {};
  const m1 = msg.match(EMAIL_REGEX); if (m1) out.email = m1[1].toLowerCase();
  const m2 = msg.match(PHONE_REGEX); if (m2) out.telefono = m2[1].replace(/\s+/g, ' ').trim();
  const m3 = msg.match(NAME_REGEX); if (m3) out.nombre = m3[1].trim();
  const m4 = msg.match(EMPRESA_REGEX); if (m4) out.empresa = m4[1].split(/[,.\n]/)[0].trim().slice(0, 50);
  const m5 = msg.match(QTY_REGEX);
  if (m5) {
    const n = parseInt(m5[1], 10);
    if (n >= 1 && n <= 100000) out.cantidad_estimada = n;
  }
  const m6 = msg.match(DATE_REGEX); if (m6) out.fecha_requerida = `${m6[1]} de ${m6[2]}`;
  const m7 = msg.match(RUT_REGEX); if (m7) out.rut = m7[1];
  return out;
}

function detectTipo(msg, cantidad) {
  if (cantidad && cantidad >= 10) return 'B2B';
  if (cantidad && cantidad >= 1 && cantidad <= 9) return 'B2C';
  if (B2B_KW.test(msg || '')) return 'B2B';
  if (B2C_KW.test(msg || '')) return 'B2C';
  return null;
}

function calcScore(lead) {
  let s = 0;
  if (lead.nombre) s += 20;
  if (lead.email) s += 25;
  if (lead.telefono) s += 25;
  if (lead.empresa) s += 15;
  if (lead.cantidad_estimada) s += 10;
  if (lead.fecha_requerida) s += 5;
  return Math.min(s, 100);
}

// Upsert progresivo: si no existe lead para esta conversación lo crea con lo
// que haya. Si existe, completa SOLO los campos vacíos (nunca pisa datos).
async function upsertChatLead(base44, { conversation_id, session_id, page_path, referrer, content }) {
  if (!conversation_id) return;
  const extracted = extractData(content);
  const tipoDetectado = detectTipo(content, extracted.cantidad_estimada);

  let existing = null;
  try {
    const arr = await base44.asServiceRole.entities.ChatLead.filter({ conversation_id });
    existing = Array.isArray(arr) && arr.length ? arr[0] : null;
  } catch { /* ignore */ }

  const now = new Date().toISOString();
  const preview = String(content || '').slice(0, 140);

  if (!existing) {
    // Crear SIEMPRE — incluso si no extrajimos nada. La conversación es el lead.
    const datosLog = Object.entries(extracted).map(([campo, valor]) => ({
      campo, valor: String(valor), at: now,
    }));
    const newLead = {
      conversation_id,
      session_id: session_id || null,
      page_origen: page_path || null,
      referrer: referrer || null,
      tipo: tipoDetectado || 'Sin clasificar',
      estado: 'Activo',
      mensajes_count: 1,
      ultimo_mensaje_at: now,
      ultimo_mensaje_preview: preview,
      datos_capturados: datosLog,
      ...extracted,
    };
    newLead.score = calcScore(newLead);
    try {
      await base44.asServiceRole.entities.ChatLead.create(newLead);
    } catch (e) { console.error('[ChatLead create]', e?.message); }
    return;
  }

  // Update progresivo: completar campos vacíos sin pisar
  const patch = {
    mensajes_count: (existing.mensajes_count || 0) + 1,
    ultimo_mensaje_at: now,
    ultimo_mensaje_preview: preview,
  };
  const log = Array.isArray(existing.datos_capturados) ? [...existing.datos_capturados] : [];

  for (const [campo, valor] of Object.entries(extracted)) {
    if (!existing[campo]) {
      patch[campo] = valor;
      log.push({ campo, valor: String(valor), at: now });
    }
  }

  // Tipo: si estaba 'Sin clasificar' y ahora detectamos, actualizamos
  if ((!existing.tipo || existing.tipo === 'Sin clasificar') && tipoDetectado) {
    patch.tipo = tipoDetectado;
  }

  patch.datos_capturados = log;
  patch.score = calcScore({ ...existing, ...patch });

  try {
    await base44.asServiceRole.entities.ChatLead.update(existing.id, patch);
  } catch (e) { console.error('[ChatLead update]', e?.message); }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body || {};

    if (action === 'create') {
      const conv = await base44.asServiceRole.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: {
          context: body.context || 'landing',
          anonymous: true,
          session_id: body.session_id || null,
          page_path: body.page_path || null,
          referrer: body.referrer || null,
        },
      });
      return Response.json({ conversation_id: conv.id });
    }

    if (action === 'send') {
      const { conversation_id, content, session_id, page_path, referrer } = body;
      if (!conversation_id || !content) {
        return Response.json({ error: 'conversation_id and content required' }, { status: 400 });
      }
      const conv = await base44.asServiceRole.agents.getConversation(conversation_id);
      await base44.asServiceRole.agents.addMessage(conv, { role: 'user', content });

      // 🆕 CAPTURA PROGRESIVA: upsert ChatLead con datos extraídos del mensaje
      await upsertChatLead(base44, { conversation_id, session_id, page_path, referrer, content });

      // Trazabilidad 360°: registramos cada mensaje del usuario en ActivityLog
      if (session_id) {
        try {
          await base44.asServiceRole.entities.ActivityLog.create({
            event_type: 'chat_message',
            category: 'Soporte',
            session_id,
            page_path: page_path || null,
            entity_type: 'Conversation',
            entity_id: conversation_id,
            meta: {
              agent: AGENT_NAME,
              text_preview: String(content).slice(0, 140),
            },
          });
        } catch {}
      }

      // 🎯 Registrar en AILog para que aparezca en "Conversaciones en vivo"
      try {
        await base44.asServiceRole.entities.AILog.create({
          agent_name: AGENT_NAME,
          model: 'agent_sdk',
          task_type: 'chat',
          user_message: String(content).slice(0, 500),
          ai_response: '(esperando respuesta del agente…)',
          conversation_id,
          session_id: session_id || null,
          system_context: page_path ? `page=${page_path}` : null,
          status: 'success',
          tags: ['chat_publico', 'landing'],
        });
      } catch {}

      return Response.json({ ok: true });
    }

    if (action === 'get') {
      const { conversation_id } = body;
      if (!conversation_id) {
        return Response.json({ error: 'conversation_id required' }, { status: 400 });
      }
      const conv = await base44.asServiceRole.agents.getConversation(conversation_id);
      return Response.json({
        id: conv.id,
        messages: (conv.messages || []).map(m => ({ role: m.role, content: m.content })),
      });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
});