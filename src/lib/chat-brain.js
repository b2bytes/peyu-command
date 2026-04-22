// Cliente liviano para el endpoint RAG peyuAssist.
// Guarda/recupera conversation_id en localStorage y maneja cierre de sesión
// para persistir memoria conversacional vectorizada.

import { base44 } from '@/api/base44Client';

const CONV_KEY = 'peyu_brain_conversation_id';
const LAST_QUERY_KEY = 'peyu_brain_last_query';

export function getOrCreateConversationId() {
  let id = localStorage.getItem(CONV_KEY);
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(CONV_KEY, id);
  }
  return id;
}

export function resetConversation() {
  localStorage.removeItem(CONV_KEY);
  localStorage.removeItem(LAST_QUERY_KEY);
}

/**
 * Envía una query al Brain RAG y devuelve la respuesta del asistente.
 * @param {string} query - lo que escribió el usuario
 * @param {Array} history - últimos mensajes del chat ([{role, content}])
 * @param {string?} userEmail - email del usuario si lo conocemos (B2B logueado)
 */
export async function askBrain(query, history = [], userEmail = null) {
  localStorage.setItem(LAST_QUERY_KEY, query);
  const res = await base44.functions.invoke('peyuAssist', {
    query,
    user_email: userEmail,
    history,
  });
  return res.data;
}

/**
 * Cierra la conversación actual: envía los mensajes al backend para que
 * genere un resumen destilado y lo guarde como memoria vectorial.
 * Llamar al cerrar pestaña, tras compra, o cuando pasan varios minutos inactivos.
 */
export async function closeConversation(messages, userEmail = null) {
  const conversation_id = localStorage.getItem(CONV_KEY);
  const last_query = localStorage.getItem(LAST_QUERY_KEY);
  if (!conversation_id || messages.length < 2) return null;

  try {
    const res = await base44.functions.invoke('summarizeAndSaveConversation', {
      conversation_id,
      user_email: userEmail,
      messages,
      last_query,
    });
    resetConversation();
    return res.data;
  } catch (e) {
    console.warn('[closeConversation]', e);
    return null;
  }
}