// Liquid Dual — sistema de tema dual día/noche auto-adaptativo PEYU 2026.
// Decide modo según:
//  1) Override manual del usuario (localStorage 'peyu_liquid_mode' = 'day' | 'night' | 'auto')
//  2) Hora local del usuario (06:00–18:59 → day, resto → night)
//
// API expuesta:
//  - getLiquidMode() : 'day' | 'night'
//  - getLiquidPreference() : 'day' | 'night' | 'auto'
//  - setLiquidPreference(pref)
//  - subscribeLiquidMode(cb) → unsubscribe
//
// El sistema aplica `data-liquid-mode="day|night"` en <html> para que CSS
// vars cambien tokens (background, foreground, glass, accent) sin remontar.

const STORAGE_KEY = 'peyu_liquid_mode';
const ATTR = 'data-liquid-mode';
const EVT = 'peyu:liquid-mode';

// Definición horaria PEYU 2026:
//   05:30–07:59 → dawn (día con tinte cálido)
//   08:00–17:29 → day pleno
//   17:30–19:29 → dusk (día con tinte cálido)
//   19:30–05:29 → night
// El sistema sigue siendo BINARIO (día/noche) en CSS, pero exponemos
// `getLiquidPhase()` para que componentes puedan reaccionar a dawn/dusk
// (p.ej. saludo "Buenos días" / "Buenas noches").
const isDayHour = (h, m = 0) => {
  const t = h * 60 + m; // minutos desde medianoche
  return t >= 5 * 60 + 30 && t < 19 * 60 + 30;
};

export function getLiquidPhase() {
  const d = new Date();
  const t = d.getHours() * 60 + d.getMinutes();
  if (t >= 5 * 60 + 30 && t < 8 * 60)        return 'dawn';
  if (t >= 8 * 60 && t < 17 * 60 + 30)       return 'day';
  if (t >= 17 * 60 + 30 && t < 19 * 60 + 30) return 'dusk';
  return 'night';
}

export function getLiquidPreference() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'day' || v === 'night' ? v : 'auto';
  } catch { return 'auto'; }
}

export function getLiquidMode() {
  const pref = getLiquidPreference();
  if (pref === 'day' || pref === 'night') return pref;
  const d = new Date();
  return isDayHour(d.getHours(), d.getMinutes()) ? 'day' : 'night';
}

export function setLiquidPreference(pref) {
  try {
    if (pref === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch { /* noop */ }
  applyLiquidMode();
  window.dispatchEvent(new CustomEvent(EVT, { detail: { mode: getLiquidMode(), pref: getLiquidPreference() } }));
}

export function applyLiquidMode() {
  const mode = getLiquidMode();
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute(ATTR, mode);
    // hint nativo a navegador para scrollbars / form controls
    document.documentElement.style.colorScheme = mode === 'night' ? 'dark' : 'light';
  }
  return mode;
}

export function subscribeLiquidMode(cb) {
  const handler = () => cb({ mode: getLiquidMode(), pref: getLiquidPreference() });
  window.addEventListener(EVT, handler);
  // Re-evalúa cada 5 min por si el usuario cruzó de día→noche con la pestaña abierta
  const interval = setInterval(() => {
    if (getLiquidPreference() === 'auto') {
      applyLiquidMode();
      handler();
    }
  }, 5 * 60 * 1000);
  return () => {
    window.removeEventListener(EVT, handler);
    clearInterval(interval);
  };
}