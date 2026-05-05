// API simple para gestionar el fondo de la app.
// - Persiste la elección en localStorage.
// - Aplica el fondo globalmente vía CSS variable --app-bg en <html>.
// - Evita background-attachment: fixed en móvil (rompe iOS Safari).
// - Emite un evento para que cualquier componente pueda reaccionar al cambio.
//
// ⚡ v2: Cada fondo tiene su PROPIA paleta gradient (overlay + accent + tint)
// para que el landing cambie de "humor cromático" según el fondo elegido.

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'peyu_app_bg_id';
const EVENT_NAME = 'peyu:bg-change';

// Catálogo de fondos — cada uno con paleta única 2027.
// `gradient` = string CSS listo para usar en el overlay del landing.
// `accent`   = color único para CTAs/chat/brillos secundarios.
// `tint`     = color base del viewport (se ve si la imagen no carga).
export const BACKGROUNDS = [
  // ══════════════ Temáticos / Campañas ══════════════
  {
    id: 'dia-trabajador-editorial',
    name: '1° de Mayo · Editorial',
    description: 'Manos que construyen un futuro sostenible',
    category: 'Temas',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/87c8679a9_generated_image.png',
    accent: '#F4A261',
    tint: '#3a2818',
    gradient: 'linear-gradient(135deg, rgba(58,24,16,0.82) 0%, rgba(120,53,15,0.72) 50%, rgba(58,24,16,0.88) 100%)',
  },
  {
    id: 'dia-trabajador-poster',
    name: '1° de Mayo · Poster',
    description: 'Hecho con manos chilenas. Hecho con propósito.',
    category: 'Temas',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/d6cae8fb6_generated_image.png',
    accent: '#F4A261',
    tint: '#1e2a3a',
    gradient: 'linear-gradient(135deg, rgba(30,42,58,0.85) 0%, rgba(120,53,15,0.65) 55%, rgba(30,42,58,0.88) 100%)',
  },

  // ══════════════ Naturaleza — cada una con gradient único ══════════════
  {
    id: 'tropical-original',
    name: 'Tropical original',
    description: 'El fondo clásico PEYU · teal profundo',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png',
    accent: '#14B8A6',
    tint: '#0f172a',
    gradient: 'linear-gradient(135deg, rgba(15,23,42,0.80) 0%, rgba(15,78,137,0.72) 50%, rgba(15,23,42,0.82) 100%)',
  },
  {
    id: 'forest-canopy',
    name: 'Canopia selvática',
    description: 'Esmeralda + dorado · luz filtrada por hojas',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/8e94ae04a_generated_image.png',
    accent: '#84CC16',
    tint: '#052e16',
    gradient: 'linear-gradient(135deg, rgba(5,46,22,0.85) 0%, rgba(22,101,52,0.70) 50%, rgba(6,78,59,0.85) 100%)',
  },
  {
    id: 'ocean-rays',
    name: 'Océano profundo',
    description: 'Turquesa cristalino · rayos submarinos',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b41261247_generated_image.png',
    accent: '#06B6D4',
    tint: '#164e63',
    gradient: 'linear-gradient(135deg, rgba(8,47,73,0.78) 0%, rgba(14,116,144,0.62) 50%, rgba(8,47,73,0.82) 100%)',
  },
  {
    id: 'moss-macro',
    name: 'Musgo esmeralda',
    description: 'Verde bosque · frescura matinal con rocío',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/36c3ac81c_generated_image.png',
    accent: '#22C55E',
    tint: '#14532d',
    gradient: 'linear-gradient(135deg, rgba(20,83,45,0.82) 0%, rgba(5,46,22,0.72) 50%, rgba(20,83,45,0.85) 100%)',
  },
  {
    id: 'andes-dawn',
    name: 'Andes al amanecer',
    description: 'Lavanda + rosado nacarado · calma total',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/97da95963_generated_image.png',
    accent: '#A78BFA',
    tint: '#312e81',
    gradient: 'linear-gradient(135deg, rgba(49,46,129,0.72) 0%, rgba(192,132,252,0.38) 50%, rgba(49,46,129,0.80) 100%)',
  },
  {
    id: 'fiber-organic',
    name: 'Fibras orgánicas',
    description: 'Tierra cálida · texturas artesanales',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/0e285adb8_generated_image.png',
    accent: '#D97706',
    tint: '#451a03',
    gradient: 'linear-gradient(135deg, rgba(69,26,3,0.80) 0%, rgba(146,64,14,0.60) 50%, rgba(69,26,3,0.85) 100%)',
  },
  {
    id: 'patagonia-lake',
    name: 'Lago patagónico',
    description: 'Cian glaciar · montañas en espejo de agua',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/485330aa0_generated_image.png',
    accent: '#0EA5E9',
    tint: '#0c4a6e',
    gradient: 'linear-gradient(135deg, rgba(12,74,110,0.80) 0%, rgba(8,145,178,0.60) 50%, rgba(12,74,110,0.85) 100%)',
  },
  {
    id: 'fern-emerald',
    name: 'Helecho esmeralda',
    description: 'Verde botánico puro · macro con rocío',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/92f9418bb_generated_image.png',
    accent: '#10B981',
    tint: '#064e3b',
    gradient: 'linear-gradient(135deg, rgba(6,78,59,0.82) 0%, rgba(16,185,129,0.45) 50%, rgba(6,78,59,0.88) 100%)',
  },
  {
    id: 'coral-aerial',
    name: 'Arrecife aéreo',
    description: 'Coral + aguamarina · vista cenital',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/0ec153883_generated_image.png',
    accent: '#F97316',
    tint: '#164e63',
    gradient: 'linear-gradient(135deg, rgba(22,78,99,0.78) 0%, rgba(249,115,22,0.35) 50%, rgba(22,78,99,0.82) 100%)',
  },
  {
    id: 'lavender-provence',
    name: 'Lavanda al atardecer',
    description: 'Violeta mágico · horas doradas',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/9d80ea118_generated_image.png',
    accent: '#C084FC',
    tint: '#4c1d95',
    gradient: 'linear-gradient(135deg, rgba(76,29,149,0.78) 0%, rgba(234,179,8,0.35) 50%, rgba(76,29,149,0.85) 100%)',
  },
  {
    id: 'autumn-canopy',
    name: 'Otoño japonés',
    description: 'Ámbar + carmesí · copas de arce',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/57e22d910_generated_image.png',
    accent: '#F59E0B',
    tint: '#7c2d12',
    gradient: 'linear-gradient(135deg, rgba(124,45,18,0.82) 0%, rgba(245,158,11,0.45) 50%, rgba(124,45,18,0.88) 100%)',
  },
  {
    id: 'atacama-dusk',
    name: 'Atacama al ocaso',
    description: 'Rosa desierto · índigo estrellado',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/76cf75175_generated_image.png',
    accent: '#FB7185',
    tint: '#1e1b4b',
    gradient: 'linear-gradient(135deg, rgba(30,27,75,0.80) 0%, rgba(251,113,133,0.38) 50%, rgba(30,27,75,0.85) 100%)',
  },
];

// Default = "Helecho esmeralda" — sin letras, naturaleza pura, verde botánico
// elegante que conecta con el ADN sostenible de PEYU.
export const DEFAULT_BG_ID = 'fern-emerald';

export function getBackgroundById(id) {
  return BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0];
}

// Overlay default (fallback si un fondo no define gradient propio).
export const BG_OVERLAY =
  'linear-gradient(135deg, rgba(15, 23, 42, 0.80) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.80) 100%)';

// Overlay para fondos temáticos (posters con texto fuerte).
export const THEME_OVERLAY =
  'linear-gradient(135deg, rgba(20, 14, 8, 0.88) 0%, rgba(40, 24, 14, 0.82) 50%, rgba(20, 14, 8, 0.88) 100%)';

// Construye la imagen de fondo con el gradient SPECÍFICO del fondo elegido
// (o el default). Acepta opcionalmente el id para usar el gradient custom.
export function buildBackgroundImageCSS(url, gradient) {
  const overlay = gradient || BG_OVERLAY;
  return `${overlay}, url('${url}')`;
}

export function loadSavedBackgroundId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_BG_ID;
  } catch {
    return DEFAULT_BG_ID;
  }
}

// Aplica el fondo a nivel global vía CSS variables en <html>.
export function applyBackground(id) {
  const bg = getBackgroundById(id);
  const root = document.documentElement;
  root.style.setProperty('--app-bg', buildBackgroundImageCSS(bg.url, bg.gradient));
  root.style.setProperty('--app-bg-url', `url('${bg.url}')`);
  root.style.setProperty('--app-gradient', bg.gradient || BG_OVERLAY);
  root.style.setProperty('--app-accent', bg.accent || '#14B8A6');
  root.style.setProperty('--app-tint', bg.tint || '#0f172a');
  root.setAttribute('data-bg-id', bg.id);
  root.setAttribute('data-bg-category', bg.category || 'Naturaleza');
}

export function setBackground(id) {
  const bg = getBackgroundById(id);
  try {
    localStorage.setItem(STORAGE_KEY, bg.id);
  } catch { /* ignore */ }
  applyBackground(bg.id);
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { id: bg.id } }));
  } catch { /* ignore */ }
  return bg;
}

// Hook: devuelve [bgId, setBgId] y mantiene sincronía entre pestañas/componentes.
export function useAppBackground() {
  const [id, setId] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_BG_ID;
    return loadSavedBackgroundId();
  });

  useEffect(() => {
    applyBackground(id);
  }, [id]);

  useEffect(() => {
    const onChange = (e) => {
      const next = e?.detail?.id;
      if (next && next !== id) setId(next);
    };
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue && e.newValue !== id) setId(e.newValue);
    };
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [id]);

  const update = (next) => {
    setId(next);
    setBackground(next);
  };

  return [id, update];
}