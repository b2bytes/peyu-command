// Helpers AISLADOS para la vista /v2 "Peyu Commerce OS".
// No reutilizan lógica de la tienda viva para mantener total independencia.
import { base44 } from '@/api/base44Client';

export const V2_CATEGORIES = ['Cachos', 'Escritorio', 'Paletas', 'Hogar'];

// Iconos emoji por categoría (sidebar de navegación).
export const V2_CATEGORY_ICON = {
  Cachos: '🎲',
  Escritorio: '🖊️',
  Paletas: '🏓',
  Hogar: '🪴',
};

// Rangos de precio rápidos (filtro lateral B2C).
export const V2_PRICE_RANGES = [
  { id: 'all', label: 'Todos', min: 0, max: Infinity },
  { id: 'lt15', label: 'Hasta $15.000', min: 0, max: 15000 },
  { id: '15-30', label: '$15.000 – $30.000', min: 15000, max: 30000 },
  { id: 'gt30', label: 'Más de $30.000', min: 30000, max: Infinity },
];

// Carga el catálogo madre canónico (SOLO mostrar_en_v2 === true) para los
// paneles laterales. Aislado de la tienda viva.
export async function fetchV2Catalog() {
  try {
    const productos = await base44.entities.Producto.filter({ mostrar_en_v2: true }, '-created_date', 100);
    return Array.isArray(productos) ? productos : [];
  } catch {
    return [];
  }
}

// Tramos B2B oficiales (8 llaves) con label legible para la tabla.
export const V2_B2B_TRAMOS = [
  { key: 'unitario', label: '1 unidad' },
  { key: 't10_49', label: '10 – 49' },
  { key: 't50_99', label: '50 – 99' },
  { key: 't100_249', label: '100 – 249' },
  { key: 't250_499', label: '250 – 499' },
  { key: 't500_999', label: '500 – 999' },
  { key: 't1000_1999', label: '1.000 – 1.999' },
  { key: 't2000_mas', label: '2.000 +' },
];

export const formatCLP = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString('es-CL');
};

// Qué incluye: prioriza incluye_v2, luego incluye, luego descripción.
export const getIncluye = (p) =>
  p.incluye_v2 || p.incluye || p.descripcion || '';

// Personalización: incluye_v2 o fallback genérico de marca.
export const getPersonalizacion = (p) =>
  p.personalizacion_v2 ||
  'Grabado láser de tu logo gratis desde 10 unidades. Empaque personalizado opcional.';

// Devuelve true si el producto tiene tabla B2B válida.
export const hasB2B = (p) =>
  p.precio_b2b_tramos && typeof p.precio_b2b_tramos === 'object' &&
  Object.keys(p.precio_b2b_tramos).length > 0;

// Agrupa productos por categoria_v2 en el orden oficial.
export const groupByCategoria = (productos) => {
  const groups = {};
  V2_CATEGORIES.forEach((c) => { groups[c] = []; });
  productos.forEach((p) => {
    const cat = V2_CATEGORIES.includes(p.categoria_v2) ? p.categoria_v2 : 'Hogar';
    groups[cat].push(p);
  });
  return groups;
};