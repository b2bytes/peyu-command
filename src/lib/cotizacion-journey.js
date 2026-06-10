// ════════════════════════════════════════════════════════════════════════
// cotizacion-journey — Persistencia del viaje B2B en /CotizacionRapida.
// Guarda automáticamente items (sku+qty), datos de empresa, paso y logo en
// localStorage: sobrevive recargas y salidas. Se limpia al enviar la
// cotización (viaje completado) o al reiniciar.
// ════════════════════════════════════════════════════════════════════════
const KEY = 'peyu_cotizacion_journey_v1';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

export function saveQuoteJourney(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, _savedAt: Date.now() }));
  } catch { /* storage lleno o bloqueado: el flujo sigue sin persistencia */ }
}

export function loadQuoteJourney() {
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

export function clearQuoteJourney() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}