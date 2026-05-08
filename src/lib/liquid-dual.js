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

const isDayHour = (h) => h >= 6 && h < 19;

export function getLiquidPreference() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'day' || v === 'night' ? v : 'auto';
  } catch { return 'auto'; }
}

export function getLiquidMode() {
  const pref = getLiquidPreference();
  if (pref === 'day' || pref === 'night') return pref;
  const h = new Date().getHours();
  return isDayHour(h) ? 'day' : 'night';
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