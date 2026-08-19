// ════════════════════════════════════════════════════════════════════════
// whatsappCloudWebhook — Canal OFICIAL de WhatsApp (Meta Cloud API).
// Recibe cada mensaje que llega al número de PEYU, lo enruta al agente
// whatsapp_peyu y devuelve la respuesta por WhatsApp.
//
// Endpoint PÚBLICO (lo llama Meta, no un usuario logueado):
//   GET  → verificación del webhook (hub.challenge)
//   POST → mensajes, validados con la firma X-Hub-Signature-256
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  getCloudConfig, firmaValida, parsearMensajeEntrante, nombreAdjunto,
  marcarLeido, enviarTextoCloud,
} from '../../shared/whatsapp-cloud.ts';
import { partirEnBurbujas } from '../../shared/evolution.ts';
import { obtenerConversacion, esperarRespuesta } from '../../shared/whatsapp-agent.ts';
import { clasificarConversacion } from '../../shared/whatsapp-pipeline.ts';

// ⛔ SERVICIO PAUSADO (cliente dio de baja el sistema). Para reactivar,
// eliminar este bloque de retorno temprano.
const SERVICIO_PAUSADO = true;

export default async function (req) {
  try {
    if (SERVICIO_PAUSADO) {
      // 200 para que Meta no reintente ni marque el webhook como roto.
      return Response.json({ ok: true, paused: true });
    }
    const cfg = getCloudConfig();
    const url = new URL(req.url);

    // 1 · Verificación del webhook (Meta la hace una vez, con GET)
    if (req.method === 'GET') {
      const modo = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge') || '';
      if (modo === 'subscribe' && token === cfg.verifyToken) {
        return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
      return new Response('Forbidden', { status: 403 });
    }

    // 2 · Autenticidad: firma de Meta con la clave secreta de la app
    const rawBody = await req.text();
    const firmaOk = await firmaValida(rawBody, req.headers.get('x-hub-signature-256'));
    if (!firmaOk) {
      console.error('[WhatsApp Cloud] Firma inválida, webhook rechazado.');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload = {};
    try { payload = rawBody ? JSON.parse(rawBody) : {}; } catch { payload = {}; }

    // 3 · Solo mensajes de clientes: los estados (delivered/read) se ignoran
    const mensaje = parsearMensajeEntrante(payload);
    if (!mensaje || !mensaje.telefono) {
      return Response.json({ ok: true, ignorado: 'sin_mensaje' });
    }

    const { telefono, nombre, texto, tipo, id: messageId } = mensaje;
    const base44 = createClientFromRequest(req);
    const agents = base44.asServiceRole.agents;

    await marcarLeido(messageId).catch(() => null);

    // 4 · Sin texto (adjunto puro): pedimos que lo cuente por escrito
    if (!texto) {
      const etiqueta = nombreAdjunto(tipo);
      if (etiqueta) {
        await enviarTextoCloud(telefono, `¡Gracias! Recibí tu ${etiqueta} 🐢 Cuéntame en texto qué necesitas y te ayudo al instante.`);
        return Response.json({ ok: true, respondido: 'aviso_adjunto' });
      }
      return Response.json({ ok: true, ignorado: 'sin_contenido' });
    }

    // 5 · Conversación del agente (service role: no hay usuario logueado)
    const conversacion = await obtenerConversacion(agents, telefono, nombre, 'cloud');
    if (!conversacion?.id) {
      return Response.json({ ok: false, error: 'No se pudo abrir la conversación del agente' }, { status: 500 });
    }

    // 6 · Control humano activo → el mensaje entra a la bandeja y el bot calla
    if (conversacion?.metadata?.human_takeover) {
      await agents.addMessage(conversacion, { role: 'user', content: texto });
      await clasificarConversacion(base44.asServiceRole, conversacion).catch(() => null);
      console.log(`[WhatsApp Cloud] ${telefono}: control humano activo, sin respuesta automática.`);
      return Response.json({ ok: true, modo: 'humano' });
    }

    // 7 · Al agente
    const mensajesAntes = (conversacion.messages || []).length;
    await agents.addMessage(conversacion, { role: 'user', content: texto });
    const respuesta = await esperarRespuesta(agents, conversacion.id, mensajesAntes + 1);

    if (!respuesta) {
      await enviarTextoCloud(telefono, 'Estoy revisando eso con calma 🐢 Te respondo en un momento — si es urgente, escríbenos a ventas@peyuchile.cl.');
      return Response.json({ ok: true, respondido: 'timeout' });
    }

    // 8 · De vuelta a WhatsApp, en burbujas naturales
    const burbujas = partirEnBurbujas(respuesta);
    for (let i = 0; i < burbujas.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 700));
      await enviarTextoCloud(telefono, burbujas[i]);
    }

    // 9 · El agente mueve la tarjeta del pipeline según lo que acaba de pasar
    await clasificarConversacion(base44.asServiceRole, { id: conversacion.id }).catch(() => null);

    return Response.json({ ok: true, telefono, burbujas: burbujas.length });
  } catch (error) {
    console.error('[WhatsApp Cloud webhook] Error:', error.message);
    // 200 a propósito: si devolvemos 500, Meta reintenta y duplica respuestas.
    return Response.json({ ok: false, error: error.message });
  }
}