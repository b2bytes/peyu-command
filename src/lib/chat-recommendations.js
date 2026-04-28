// Memoria de qué SKUs ya recomendó el agente en esta sesión.
// Permite rotar productos cuando el usuario hace click en otra ocasión
// o pide "más opciones", para no repetir el mismo producto una y otra vez.

const STORAGE_KEY = 'peyu_chat_shown_skus';
const OCCASION_KEY = 'peyu_chat_last_occasion';
const MAX_HISTORY = 20;

// Extrae SKUs de los tags [[PRODUCTO:sku]] que el agente inserta en sus respuestas.
export function extractSkusFromMessage(content) {
  if (!content || typeof content !== 'string') return [];
  const matches = content.match(/\[\[PRODUCTO:([^\]]+)\]\]/g) || [];
  return matches
    .map(m => m.replace(/\[\[PRODUCTO:|\]\]/g, '').trim())
    .filter(Boolean);
}

// Registra SKUs mostrados (los acumula sin duplicados, conserva últimos N).
export function recordShownSkus(skus) {
  if (!Array.isArray(skus) || skus.length === 0) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev = raw ? JSON.parse(raw) : [];
    const merged = [...new Set([...(Array.isArray(prev) ? prev : []), ...skus])];
    const trimmed = merged.slice(-MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* no-op */ }
}

// Recorre todos los mensajes del asistente y extrae todos los SKUs ya mostrados.
export function syncShownSkusFromMessages(messages) {
  if (!Array.isArray(messages)) return;
  const all = [];
  for (const m of messages) {
    if (m?.role === 'assistant' && m.content) {
      all.push(...extractSkusFromMessage(m.content));
    }
  }
  if (all.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(all)].slice(-MAX_HISTORY)));
    } catch { /* no-op */ }
  }
}

// Genera un prompt inteligente para click en ocasión, considerando si es
// la primera vez o si el usuario ya vio recomendaciones antes.
export function buildOccasionPrompt(occasionLabel) {
  let lastOccasion = null;
  let shownCount = 0;
  try {
    lastOccasion = localStorage.getItem(OCCASION_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) shownCount = (JSON.parse(raw) || []).length;
  } catch { /* no-op */ }

  // Guardar la ocasión actual para futuras comparaciones
  try { localStorage.setItem(OCCASION_KEY, occasionLabel); } catch { /* no-op */ }

  // Caso 1: primera consulta de la sesión
  if (shownCount === 0) {
    return `Me gustaría un regalo corporativo para ${occasionLabel}. ¿Cuáles son las opciones disponibles y qué me recomiendas?`;
  }

  // Caso 2: misma ocasión, pide más opciones → rotar
  if (lastOccasion === occasionLabel) {
    return `Muéstrame OTRAS opciones DIFERENTES para ${occasionLabel}, distintas a las que ya me recomendaste antes. Quiero ver más alternativas.`;
  }

  // Caso 3: cambio de ocasión → recomendar productos apropiados a la nueva, evitando repetir
  return `Ahora quiero ver opciones para ${occasionLabel}. Recomiéndame productos DISTINTOS a los anteriores, apropiados específicamente para esta ocasión.`;
}

export function clearShownSkus() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OCCASION_KEY);
  } catch { /* no-op */ }
}