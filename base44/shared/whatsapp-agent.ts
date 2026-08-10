// ════════════════════════════════════════════════════════════════════════
// Puente compartido entre WhatsApp y el agente whatsapp_peyu.
// Lo usan tanto el canal oficial (Cloud API) como el legacy (Evolution),
// para que la conversación del cliente sea la misma sin importar el canal.
// ════════════════════════════════════════════════════════════════════════
import { AGENT_NAME, formatearTelefonoCL } from './evolution.ts';

const ESPERA_MAX_MS = 55000;
const INTERVALO_POLL_MS = 1800;

/** Busca la conversación del teléfono, o la crea. */
export async function obtenerConversacion(agents, telefono, nombreCliente, canal = 'cloud') {
  const todas = await agents.listConversations({ agent_name: AGENT_NAME }).catch(() => []);
  const existente = (todas || []).find((c) => c?.metadata?.phone === telefono);
  if (existente) return await agents.getConversation(existente.id).catch(() => existente);

  return await agents.createConversation({
    agent_name: AGENT_NAME,
    metadata: {
      name: nombreCliente || formatearTelefonoCL(telefono),
      description: `WhatsApp ${formatearTelefonoCL(telefono)}`,
      phone: telefono,
      channel: canal,
    },
  });
}

/** Espera la respuesta del agente y devuelve su texto ('' si se agota). */
export async function esperarRespuesta(agents, conversationId, mensajesAntes) {
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