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

// ─── Sanitización del mensaje del cliente ──────────────────────────
// El frontend antepone bloques [CONTEXTO] y [BRAIN] con datos técnicos
// (top_skus, page, chat_intent, etc.). Para extraer datos reales y guardar
// el preview legible debemos quitarlos SIEMPRE antes de procesar.
function stripContextBlocks(raw) {
  if (!raw) return '';
  let t = String(raw);
  // Quitar bloque [CONTEXTO] ... hasta \n\n o fin
  t = t.replace(/\[CONTEXTO\][\s\S]*?(?=\n\s*\[(?:CONTEXTO|BRAIN|PRODUCTOS|CATALOGO|MEMORIA)\]|\n\n|$)/gi, '');
  // Quitar bloque [BRAIN] ...
  t = t.replace(/\[BRAIN\][\s\S]*?(?=\n\s*\[(?:CONTEXTO|BRAIN|PRODUCTOS|CATALOGO|MEMORIA)\]|\n\n|$)/gi, '');
  // Quitar líneas residuales tipo "[1] ..." del Brain
  t = t.replace(/^\s*\[\d+\]\s.*$/gm, '');
  // Colapsar saltos triples
  t = t.replace(/\n{3,}/g, '\n\n').trim();
  return t;
}

// ─── Regex de extracción progresiva ─────────────────────────────────
const EMAIL_REGEX = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i;
const PHONE_REGEX = /(\+?56\s?9[\s-]?\d{4}[\s-]?\d{4}|\b9\s?\d{4}\s?\d{4}\b|\b\d{9}\b)/;
// Nombre tras frase introductoria explícita ("Soy Juan", "Me llamo Pedro").
// Case-insensitive en la frase introductoria, pero exige que el nombre
// empiece en mayúscula. Soporta nombre simple o compuesto (hasta 3 palabras).
const NAME_REGEX = /\b(?:soy|me\s+llamo|mi\s+nombre\s+es|aqu[íi]\s+habla|habla)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/i;
// 🆕 Nombre suelto cuando el cliente responde "Juan" o "Juan Pérez" como
// respuesta corta (1-2 palabras capitalizadas en mensaje muy breve). Solo
// se aplica si el mensaje tiene <= 4 palabras para evitar falsos positivos.
const NAME_SHORT_REGEX = /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,20}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,20})?)[\s.!?¿¡]*$/;
// Palabras comunes que NO son nombres aunque vengan capitalizadas.
const NAME_BLACKLIST = /^(hola|holi|holaa|buenas|gracias|listo|dale|ok|sí|no|tal|vez|claro|perfecto|excelente|santiago|chile|navidad|cumpleaños|aniversario|regalo|pack|set)$/i;
// 🛡️ Solo aceptamos empresa si viene tras frase explícita ("soy de X", "trabajo en X").
// Capturamos máximo 5 palabras tras la frase y cortamos en " y ", " para ", " que ", " con "
// para evitar pegar el resto de la frase. Ej: "trabajo en Microsoft Chile y necesito 50…"
// → empresa = "Microsoft Chile".
const EMPRESA_REGEX = /\b(?:soy de|trabajo en|nuestra empresa es|empresa[: ]+|de la empresa)\s+([A-ZÁÉÍÓÚÑ][A-Za-z0-9\s&.'-]{1,40}?)(?=\s+(?:y|para|que|con|porque|necesit|busc|quier|cotiz|tenemos)\b|[,.\n]|$)/i;
// QTY ahora detecta también palabras de producto como "cachos", "carcasas", "lámparas",
// "maceteros", "kits" — para que "50 cachos" / "200 carcasas" gatille B2B.
const QTY_REGEX = /\b(\d{1,5})\s*(u\.?|unidades?|pcs|piezas|regalos|personas|empleados?|colaboradores?|cachos?|carcasas?|l[áa]mparas?|maceteros?|kits?|sets?|paneras?|productos?|art[íi]culos?|items?)\b/i;
const DATE_REGEX = /\b(\d{1,2})\s?(?:de\s)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i;
const RUT_REGEX = /\b(\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK])\b/;

const B2B_KW = /\b(empresa|empleados?|equipo|colaboradores?|corporativo|oficina|rrhh|cliente[s]?|proveedor(es)?|evento|fin de a[ñn]o|logo|marca|branded|masivo|cotizaci[oó]n)\b/i;
const B2C_KW = /\b(para m[ií]|uno solo|individual|mi (mam[áa]|pap[áa]|pareja|polola|pololo|amig[oa]|herman[oa]|hij[oa]|jefe|sobrin[oa])|cumplea[ñn]os|aniversario|regalo personal)\b/i;

// 🚫 Lista negra: palabras que NUNCA son nombre de empresa real.
// Si la regex EMPRESA_REGEX caza "Cumpleaños" o "Escritorio Pro" (del [CONTEXTO]),
// las descartamos. "Escritorio Pro" es un nombre de producto del catálogo.
const EMPRESA_BLACKLIST = /^(cumplea[ñn]os|aniversario|regalo|escritorio pro|escritorio|hogar|entretenimiento|corporativo|pack|set|carcasas?)$/i;

function extractData(rawMsg) {
  // 🧹 Limpiar [CONTEXTO]/[BRAIN] ANTES de aplicar regex — esto evita que
  // tokens como top_skus="...|cumpleaños|..." se interpreten como empresa.
  const msg = stripContextBlocks(rawMsg);
  if (!msg) return {};
  const out = {};
  const m1 = msg.match(EMAIL_REGEX); if (m1) out.email = m1[1].toLowerCase();
  const m2 = msg.match(PHONE_REGEX); if (m2) out.telefono = m2[1].replace(/\s+/g, ' ').trim();
  const m3 = msg.match(NAME_REGEX);
  if (m3) {
    const candidato = m3[1].trim();
    if (!NAME_BLACKLIST.test(candidato.split(' ')[0])) out.nombre = candidato;
  } else {
    // Si el mensaje es corto (1-4 palabras) y parece un nombre suelto.
    // Casos: "Juan", "Carolina Pérez", "Soy María".
    const words = msg.trim().split(/\s+/);
    if (words.length >= 1 && words.length <= 4) {
      const m3b = msg.trim().match(NAME_SHORT_REGEX);
      if (m3b) {
        const candidato = m3b[1].trim();
        const primera = candidato.split(' ')[0];
        if (!NAME_BLACKLIST.test(primera)) out.nombre = candidato;
      }
    }
  }
  const m4 = msg.match(EMPRESA_REGEX);
  if (m4) {
    const empresa = m4[1].split(/[,.\n]/)[0].trim().slice(0, 50);
    if (empresa && !EMPRESA_BLACKLIST.test(empresa)) out.empresa = empresa;
  }
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
  // 🧹 Limpiamos el mensaje ANTES de procesar para que el preview y la
  // detección de tipo usen lo que el cliente REALMENTE escribió.
  const cleanContent = stripContextBlocks(content);
  const extracted = extractData(content);
  const tipoDetectado = detectTipo(cleanContent, extracted.cantidad_estimada);

  let existing = null;
  try {
    const arr = await base44.asServiceRole.entities.ChatLead.filter({ conversation_id });
    existing = Array.isArray(arr) && arr.length ? arr[0] : null;
  } catch { /* ignore */ }

  const now = new Date().toISOString();
  // 📝 Preview = mensaje real del cliente (sin [CONTEXTO]). Si el cliente solo
  // envió contexto (primer turno automático), guardamos marca explícita.
  const preview = cleanContent
    ? cleanContent.slice(0, 140)
    : '(solo apertura del chat — sin mensaje del cliente todavía)';

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
      // ⚡ SOLO esperamos lo imprescindible para que el agente empiece a pensar:
      // entregar el mensaje del usuario a la conversación. Todo lo demás
      // (captura de lead, ActivityLog, AILog) es analítica que el usuario NO
      // necesita esperar — antes corría en serie y sumaba latencia inútil al chat.
      const conv = await base44.asServiceRole.agents.getConversation(conversation_id);
      await base44.asServiceRole.agents.addMessage(conv, { role: 'user', content });

      // 🔄 Registro en background: lead + logs sin bloquear la respuesta.
      const cleanedForLog = stripContextBlocks(content);
      const userMessageForLog = cleanedForLog
        || '(solo apertura del chat — sin mensaje del cliente todavía)';

      const recordInBackground = (async () => {
        // Captura progresiva de lead
        await upsertChatLead(base44, { conversation_id, session_id, page_path, referrer, content }).catch(() => {});
        // Trazabilidad 360°
        if (session_id) {
          await base44.asServiceRole.entities.ActivityLog.create({
            event_type: 'chat_message',
            category: 'Soporte',
            session_id,
            page_path: page_path || null,
            entity_type: 'Conversation',
            entity_id: conversation_id,
            meta: { agent: AGENT_NAME, text_preview: String(content).slice(0, 140) },
          }).catch(() => {});
        }
        // Auditoría AILog
        await base44.asServiceRole.entities.AILog.create({
          agent_name: AGENT_NAME,
          model: 'agent_sdk',
          task_type: 'chat',
          user_message: userMessageForLog.slice(0, 1000),
          ai_response: '(respuesta del agente — abrir conversación para ver)',
          conversation_id,
          session_id: session_id || null,
          system_context: page_path ? `page=${page_path}` : null,
          status: 'success',
          tags: ['chat_publico', 'landing'],
        }).catch(() => {});
      })();
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(recordInBackground);
      }

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