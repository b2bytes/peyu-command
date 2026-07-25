// ════════════════════════════════════════════════════════════════════════
// whatsappEvolutionSend — Envío manual desde la bandeja del admin.
// Cuando un ejecutivo toma el control de una conversación, este es el canal
// por el que su mensaje sale al WhatsApp real del cliente. También registra
// el mensaje en la conversación del agente para que quede en el historial.
// ════════════════════════════════════════════════════════════════════════
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { AGENT_NAME, enviarTexto, enviarMedia, enviarPresencia } from '../../shared/evolution.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { conversation_id, telefono, texto, media_url, media_tipo, nombre_archivo } = body;

    // El teléfono puede venir directo o deducirse de la conversación
    let numero = telefono || '';
    let conversacion = null;
    if (conversation_id) {
      conversacion = await base44.asServiceRole.agents.getConversation(conversation_id).catch(() => null);
      if (!numero) numero = conversacion?.metadata?.phone || '';
    }
    if (!numero) {
      return Response.json({ error: 'Falta el teléfono del cliente (o la conversación no tiene uno guardado).' }, { status: 400 });
    }
    if (!texto && !media_url) {
      return Response.json({ error: 'Nada que enviar: incluye texto o un archivo.' }, { status: 400 });
    }

    await enviarPresencia(numero, 'composing', 600);

    let resultado;
    if (media_url) {
      resultado = await enviarMedia(numero, {
        url: media_url,
        tipo: media_tipo || 'image',
        caption: texto || '',
        nombreArchivo: nombre_archivo || '',
      });
    } else {
      resultado = await enviarTexto(numero, texto);
    }

    if (!resultado.ok) {
      return Response.json({
        ok: false,
        error: 'Evolution API no pudo enviar el mensaje. Revisa que el número esté vinculado.',
        detalle: resultado.data,
      }, { status: 502 });
    }

    // Queda en el hilo del agente para que la conversación no pierda contexto
    if (conversacion?.id) {
      await base44.asServiceRole.agents.addMessage(conversacion, {
        role: 'assistant',
        content: `_(${user.full_name || 'Equipo PEYU'})_ ${texto || '📎 Archivo enviado'}`,
      }).catch(() => null);
    }

    return Response.json({ ok: true, telefono: numero });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});