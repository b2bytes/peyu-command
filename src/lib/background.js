// API simple para gestionar el fondo de la app.
// - Persiste la elección en localStorage.
// - Aplica el fondo globalmente vía CSS variable --app-bg en <html>.
// - Evita background-attachment: fixed en móvil (rompe iOS Safari).
// - Emite un evento para que cualquier componente pueda reaccionar al cambio.

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'peyu_app_bg_id';
const EVENT_NAME = 'peyu:bg-change';

// Catálogo de fondos disponibles. El primero es el default histórico para no romper nada.
export const BACKGROUNDS = [
  // ——— Temáticos / Campañas ———
  {
    id: 'dia-trabajador',
    name: 'Día del Trabajador',
    description: 'Homenaje a quienes construyen un futuro sostenible',
    category: 'Temas',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/cf9a410d7_generated_image.png',
  },

  // ——— Naturaleza ———
  {
    id: 'tropical-original',
    name: 'Tropical original',
    description: 'El fondo clásico de PEYU',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png',
  },
  {
    id: 'forest-canopy',
    name: 'Canopia selvática',
    description: 'Bosque tropical desde el aire, luz dorada',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/8e94ae04a_generated_image.png',
  },
  {
    id: 'ocean-rays',
    name: 'Océano profundo',
    description: 'Rayos de luz bajo el agua turquesa',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b41261247_generated_image.png',
  },
  {
    id: 'moss-macro',
    name: 'Musgo esmeralda',
    description: 'Detalle natural con rocío matinal',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/36c3ac81c_generated_image.png',
  },
  {
    id: 'andes-dawn',
    name: 'Andes al amanecer',
    description: 'Montañas neblinosas, calma total',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/97da95963_generated_image.png',
  },
  {
    id: 'fiber-organic',
    name: 'Fibras orgánicas',
    description: 'Textura artesanal y sostenible',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/0e285adb8_generated_image.png',
  },
  {
    id: 'patagonia-lake',
    name: 'Lago patagónico',
    description: 'Andes reflejados en agua turquesa al atardecer',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/485330aa0_generated_image.png',
  },
  {
    id: 'fern-emerald',
    name: 'Helecho esmeralda',
    description: 'Macro botánico con gotas de rocío',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/92f9418bb_generated_image.png',
  },
  {
    id: 'coral-aerial',
    name: 'Arrecife aéreo',
    description: 'Arrecife de coral visto desde arriba',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/0ec153883_generated_image.png',
  },
  {
    id: 'lavender-provence',
    name: 'Lavanda al atardecer',
    description: 'Campos de lavanda con luz dorada',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/9d80ea118_generated_image.png',
  },
  {
    id: 'autumn-canopy',
    name: 'Otoño japonés',
    description: 'Copas de árboles con hojas ámbar y rojo',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/57e22d910_generated_image.png',
  },
  {
    id: 'atacama-dusk',
    name: 'Atacama al ocaso',
    description: 'Dunas rosadas bajo cielo índigo',
    category: 'Naturaleza',
    url: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/76cf75175_generated_image.png',
  },
];

export const DEFAULT_BG_ID = BACKGROUNDS[0].id;

export function getBackgroundById(id) {
  return BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0];
}

// Gradient overlay (usado tanto en el CSS var como en los layouts específicos)
// Mantiene legibilidad idéntica al fondo actual de la app.
export const BG_OVERLAY =
  'linear-gradient(135deg, rgba(15, 23, 42, 0.80) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.80) 100%)';

export function buildBackgroundImageCSS(url) {
  return `${BG_OVERLAY}, url('${url}')`;
}

export function loadSavedBackgroundId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_BG_ID;
  } catch {
    return DEFAULT_BG_ID;
  }
}

// Aplica el fondo a nivel global vía CSS variable en <html>.
// Los layouts pueden leer `var(--app-bg)` o, si prefieren control fino,
// usar `buildBackgroundImageCSS(url)` directamente.
export function applyBackground(id) {
  const bg = getBackgroundById(id);
  const root = document.documentElement;
  root.style.setProperty('--app-bg', buildBackgroundImageCSS(bg.url));
  root.style.setProperty('--app-bg-url', `url('${bg.url}')`);
  root.setAttribute('data-bg-id', bg.id);
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