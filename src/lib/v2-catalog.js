// Helpers AISLADOS para la vista /v2 "Peyu Commerce OS".
// No reutilizan lógica de la tienda viva para mantener total independencia.

export const V2_CATEGORIES = ['Cachos', 'Escritorio', 'Paletas', 'Hogar'];

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