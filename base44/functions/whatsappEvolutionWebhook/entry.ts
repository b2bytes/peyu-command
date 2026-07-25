// ════════════════════════════════════════════════════════════════════════
// whatsappEvolutionWebhook — Corazón del middleware.
// Recibe cada mensaje que llega al número real de PEYU desde Evolution API,
// lo enruta al agente whatsapp_peyu y devuelve la respuesta por WhatsApp.
//
// Endpoint PÚBLICO (lo llama el servidor, no un usuario logueado) → se
// autentica con un secreto compartido en la query: ?secret=...
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  AGENT_NAME, getEvoConfig, fromJid, esGrupo, extraerTexto, tipoAdjunto,
  enviarTexto, enviarPresencia, partirEnBurbujas, delayHumano, formatearTelefonoCL,
} from '../../shared/evolution.ts';
import { clasificarConversacion } from '../../shared/whatsapp-pipeline.ts';

const ESPERA_MAX_MS = 55000;
const INTERVALO_POLL_MS = 1800;

/** Busca la conversación del teléfono, o la crea. */
async function obtenerConversacion(agents, telefono, nombreCliente) {
  const todas = await agents.listConversations({ agent_name: AGENT_NAME }).catch(() => []);
  const existente = (todas || []).find((c) => c?.metadata?.phone === telefono);
  if (existente) return await agents.getConversation(existente.id).catch(() => existente);

  return await agents.createConversation({
    agent_name: AGENT_NAME,
    metadata: {
      name: nombreCliente || formatearTelefonoCL(telefono),
      description: `WhatsApp ${formatearTelefonoCL(telefono)}`,
      phone: telefono,
      channel: 'evolution',
    },
  });
}

/** Espera la respuesta del agente y devuelve su texto. */
async function esperarRespuesta(agents, conversationId, mensajesAntes) {
  const limite = Date.now() + ESPERA_MAX_MS;
  while (Date.now() < limite) {
    await new Promise((r) => setTimeout(r, INTERVALO_POLL_MS));
    const conv = await agents.getConversation(conversationId).catch(() => null);
    const msgs = conv?.messages || [];
    if (msgs.length > mensajesAntes) {
      const ultimo = msgs[msgs.length - 1];
      // Solo cuando el agente terminó de escribir (último mensaje = assistant con texto)
      if (ultimo?.role === 'assistant' && (ultimo.content || '').trim()) {
        return ultimo.content.trim();
      }
    }
  }
  return '';
}

Deno.serve(async (req) => {
  try {
    const cfg = getEvoConfig();

    // 1 · Autenticidad del webhook
    const secretRecibido = new URL(req.url).searchParams.get('secret') || '';
    if (secretRecibido !== cfg.webhookSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const evento = payload.event || payload.Event || '';
    const data = payload.data || {};

    // 2 · Cambios de conexión: solo se registran, no se responden
    if (evento === 'connection.update' || evento === 'CONNECTION_UPDATE') {
      console.log(`[WhatsApp] Estado de conexión: ${data.state || data.connection || 'desconocido'}`);
      return Response.json({ ok: true, ignorado: 'connection_update' });
    }

    if (evento !== 'messages.upsert' && evento !== 'MESSAGES_UPSERT') {
      return Response.json({ ok: true, ignorado: evento });
    }

    // 3 · Filtros: mensajes propios, grupos y estados no se atienden
    const key = data.key || {};
    if (key.fromMe) return Response.json({ ok: true, ignorado: 'propio' });
    const jid = key.remoteJid || '';
    if (!jid || esGrupo(jid) || jid.includes('status@broadcast')) {
      return Response.json({ ok: true, ignorado: 'grupo_o_estado' });
    }

    const telefono = fromJid(jid);
    const nombreCliente = data.pushName || '';
    let texto = extraerTexto(data.message);

    // 4 · Adjuntos sin texto: se pide al cliente que escriba
    if (!texto) {
      const adjunto = tipoAdjunto(data.message);
      if (adjunto) {
        await enviarTexto(telefono, `¡Gracias! Recibí tu ${adjunto} 🐢 Por ahora leo mejor los mensajes escritos — cuéntame en texto qué necesitas y te ayudo al instante.`);
        return Response.json({ ok: true, respondido: 'aviso_adjunto' });
      }
      return Response.json({ ok: true, ignorado: 'sin_contenido' });
    }

    // 5 · Conversación del agente (service role: no hay usuario logueado)
    const base44 = createClientFromRequest(req);
    const agents = base44.asServiceRole.agents;
    const conversacion = await obtenerConversacion(agents, telefono, nombreCliente);
    if (!conversacion?.id) {
      return Response.json({ ok: false, error: 'No se pudo abrir la conversación del agente' }, { status: 500 });
    }

    // 6 · Control humano activo → el mensaje entra a la bandeja y el bot calla
    if (conversacion?.metadata?.human_takeover) {
      await agents.addMessage(conversacion, { role: 'user', content: texto });
      await clasificarConversacion(base44.asServiceRole, conversacion).catch(() => null);
      console.log(`[WhatsApp] ${telefono}: control humano activo, sin respuesta automática.`);
      return Response.json({ ok: true, modo: 'humano' });
    }

    // 7 · Al agente
    const mensajesAntes = (conversacion.messages || []).length;
    await enviarPresencia(telefono, 'composing', 1500);
    await agents.addMessage(conversacion, { role: 'user', content: texto });

    const respuesta = await esperarRespuesta(agents, conversacion.id, mensajesAntes + 1);

    if (!respuesta) {
      await enviarTexto(telefono, 'Estoy revisando eso con calma 🐢 Te respondo en un momento — si es urgente, escríbenos a ventas@peyuchile.cl.');
      return Response.json({ ok: true, respondido: 'timeout' });
    }

    // 8 · De vuelta a WhatsApp, en burbujas naturales
    const burbujas = partirEnBurbujas(respuesta);
    for (let i = 0; i < burbujas.length; i++) {
      if (i > 0) {
        await enviarPresencia(telefono, 'composing', 900);
        await new Promise((r) => setTimeout(r, 700));
      }
      await enviarTexto(telefono, burbujas[i], { delayMs: i === 0 ? delayHumano(burbujas[i]) : 400 });
    }

    // 9 · El agente mueve la tarjeta del pipeline según lo que acaba de pasar
    await clasificarConversacion(base44.asServiceRole, { id: conversacion.id }).catch(() => null);

    return Response.json({ ok: true, telefono, burbujas: burbujas.length });
  } catch (error) {
    console.error('[WhatsApp webhook] Error:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});