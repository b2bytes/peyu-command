// ════════════════════════════════════════════════════════════════════════
// personalizar-journey — Persistencia del viaje del cliente en /personalizar.
// Guarda automáticamente cada decisión (paso, producto, color, diseño, texto,
// cantidad, mockup) en localStorage para que sobreviva recargas y salidas.
// Se limpia al agregar al carrito (viaje completado).
// ════════════════════════════════════════════════════════════════════════
const KEY = 'peyu_personalizar_journey_v1';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

export function saveJourney(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, _savedAt: Date.now() }));
  } catch { /* storage lleno o bloqueado: el flujo sigue sin persistencia */ }
}

export function loadJourney() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (data._savedAt && Date.now() - data._savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearJourney() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}