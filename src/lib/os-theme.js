// ─── PEYU OS Theme · helper de thema conmutable ───
// Dirección activa fijada en Fase 0: "Warm Dusk OS".
// La app nueva (/v2) abre en OSCURO por defecto, pero el cliente puede
// conmutar a claro. Ambos themas leen de los tokens --os-* (styles/os-theme.css).

const STORAGE_KEY = 'peyu_os_theme';
export const OS_THEMES = ['dark', 'light'];
export const DEFAULT_OS_THEME = 'dark';

export function getOSTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* noop */ }
  return DEFAULT_OS_THEME;
}

export function applyOSTheme(theme) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-os-theme', t);
  try { localStorage.setItem(STORAGE_KEY, t); } catch { /* noop */ }
  return t;
}

export function toggleOSTheme() {
  const next = getOSTheme() === 'dark' ? 'light' : 'dark';
  return applyOSTheme(next);
}