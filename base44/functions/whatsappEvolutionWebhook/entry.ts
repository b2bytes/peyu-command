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
import { interpretarAdjunto } from '../../shared/whatsapp-media.ts';
import { obtenerConversacion, esperarRespuesta } from '../../shared/whatsapp-agent.ts';

// ⛔ SERVICIO PAUSADO (cliente dio de baja el sistema). Para reactivar,
// eliminar este bloque de retorno temprano.
const SERVICIO_PAUSADO = true;

Deno.serve(async (req) => {
  try {
    if (SERVICIO_PAUSADO) {
      return Response.json({ ok: true, paused: true });
    }
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

    const base44 = createClientFromRequest(req);
    const agents = base44.asServiceRole.agents;

    // 4 · Adjuntos: notas de voz se transcriben y las fotos se "miran".
    const adjunto = tipoAdjunto(data.message);
    if (adjunto === 'audio' || adjunto === 'imagen') {
      await enviarPresencia(telefono, 'composing', 2500);
      const interpretado = await interpretarAdjunto(base44.asServiceRole, data, adjunto, texto).catch(() => '');
      if (interpretado) {
        texto = interpretado;
      } else if (!texto) {
        await enviarTexto(telefono, `Recibí tu ${adjunto} 🐢 pero no logré abrirlo bien. ¿Me lo cuentas en un mensaje escrito? Te ayudo al instante.`);
        return Response.json({ ok: true, respondido: 'adjunto_ilegible' });
      }
    } else if (!texto) {
      if (adjunto) {
        await enviarTexto(telefono, `¡Gracias! Recibí tu ${adjunto} 🐢 Cuéntame en texto qué necesitas y te ayudo al instante.`);
        return Response.json({ ok: true, respondido: 'aviso_adjunto' });
      }
      return Response.json({ ok: true, ignorado: 'sin_contenido' });
    }

    // 5 · Conversación del agente (service role: no hay usuario logueado)
    const conversacion = await obtenerConversacion(agents, telefono, nombreCliente, 'evolution');
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