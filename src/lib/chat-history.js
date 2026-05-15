// Utilidades para persistir el historial de conversaciones del chat Peyu.
//
// Modelo:
// - peyu_chat_conversation_id → id de la conversación ACTIVA (la que se está usando ahora).
// - peyu_chat_history          → array [{ id, title, updated_at }] de conversaciones pasadas.
// - peyu_chat_session_alive    → marcador en sessionStorage. Si no existe al montar,
//                                significa que el usuario cerró la pestaña / app y volvió:
//                                archivamos la conversación activa al historial y arrancamos limpio.

const ACTIVE_KEY = 'peyu_chat_conversation_id';
const HISTORY_KEY = 'peyu_chat_history';
const SESSION_KEY = 'peyu_chat_session_alive';
const MAX_HISTORY = 20;

export function readHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function archiveActiveConversation(firstUserMessage = '') {
  const activeId = localStorage.getItem(ACTIVE_KEY);
  if (!activeId) return;
  const history = readHistory();
  // Si ya está en el historial, solo actualizar fecha
  const existingIdx = history.findIndex((h) => h.id === activeId);
  const title = (firstUserMessage || '').trim().slice(0, 60) || 'Conversación con Peyu';
  const entry = { id: activeId, title, updated_at: Date.now() };
  if (existingIdx >= 0) {
    history[existingIdx] = { ...history[existingIdx], ...entry };
  } else {
    history.unshift(entry);
  }
  const trimmed = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  localStorage.removeItem(ACTIVE_KEY);
}

export function addToHistory(id, title) {
  if (!id) return;
  const history = readHistory();
  const idx = history.findIndex((h) => h.id === id);
  const entry = { id, title: (title || 'Conversación con Peyu').slice(0, 60), updated_at: Date.now() };
  if (idx >= 0) history[idx] = { ...history[idx], ...entry };
  else history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function removeFromHistory(id) {
  const history = readHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Marca la sesión como viva y ARCHIVA la conversación activa al historial si
// existe una de una sesión anterior. Filosofía: cada visita nueva = chat nuevo
// (como abrir Cursor o ChatGPT en una pestaña nueva). Las conversaciones
// pasadas quedan accesibles desde el botón de historial.
// Retorna true si es una sesión recién iniciada (primera carga / nuevo tab).
export function ensureFreshSession() {
  const alive = sessionStorage.getItem(SESSION_KEY);
  if (alive) return false;
  sessionStorage.setItem(SESSION_KEY, '1');
  // Archivar la conversación activa heredada de la sesión anterior.
  // Buscamos el primer user message guardado en historial para usarlo como título,
  // y si no hay, dejamos un título genérico. Luego limpiamos el ACTIVE_KEY para
  // que el chat arranque desde cero.
  try {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (activeId) {
      const history = readHistory();
      const existing = history.find((h) => h.id === activeId);
      const title = existing?.title || 'Conversación con Peyu';
      archiveActiveConversation(title);
    }
  } catch { /* no-op */ }
  return true;
}