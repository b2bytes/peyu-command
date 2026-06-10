// ════════════════════════════════════════════════════════════════════════
// phone-models-v2.js — Taxonomía de carcasas: MARCA (categoría) → MODELO
// (subcategoría). Extrae ambos desde el nombre del producto para el filtro
// de dos niveles del Catálogo v2.
// ════════════════════════════════════════════════════════════════════════

// Modelos reconocidos (orden = prioridad de match: lo más específico primero).
const MODELOS = [
  // ── iPhone ──
  { key: 'iPhone 16', marca: 'iPhone', test: /iphone\s?16/i },
  { key: 'iPhone 15', marca: 'iPhone', test: /iphone\s?15/i },
  { key: 'iPhone 14', marca: 'iPhone', test: /iphone\s?14/i },
  { key: 'iPhone 13', marca: 'iPhone', test: /iphone\s?13/i },
  { key: 'iPhone 12', marca: 'iPhone', test: /iphone\s?12/i },
  { key: 'iPhone 11', marca: 'iPhone', test: /iphone\s?11/i },
  // ── Samsung ──
  { key: 'Samsung Galaxy', marca: 'Samsung', test: /samsung|galaxy/i },
  // ── Huawei (específico antes que genérico) ──
  { key: 'Huawei P40 Pro', marca: 'Huawei', test: /p40\s?pro/i },
  { key: 'Huawei P40 Lite', marca: 'Huawei', test: /p40\s?lite/i },
  { key: 'Huawei P40', marca: 'Huawei', test: /p40/i },
  { key: 'Huawei P30 Pro', marca: 'Huawei', test: /p30\s?pro/i },
  { key: 'Huawei P30 Lite', marca: 'Huawei', test: /p30\s?lite/i },
  { key: 'Huawei P30', marca: 'Huawei', test: /p30/i },
  // ── AirPods ──
  { key: 'AirPods Pro', marca: 'AirPods', test: /airpods?\s?pro/i },
  { key: 'AirPods', marca: 'AirPods', test: /airpod/i },
];

// Orden canónico de marcas para la UI.
const MARCAS_ORDEN = ['iPhone', 'Samsung', 'Huawei', 'AirPods'];

// Devuelve el modelo de un producto carcasa, o null si no aplica.
export function modeloDe(producto) {
  const n = producto?.nombre || '';
  const found = MODELOS.find((m) => m.test.test(n));
  return found?.key || null;
}

// Devuelve la marca de un producto carcasa, o null si no aplica.
export function marcaDe(producto) {
  const n = producto?.nombre || '';
  const found = MODELOS.find((m) => m.test.test(n));
  return found?.marca || null;
}

// Lista única y ordenada de marcas presentes en un set de productos.
export function marcasDisponibles(productos = []) {
  const set = new Set();
  productos.forEach((p) => {
    const m = marcaDe(p);
    if (m) set.add(m);
  });
  return MARCAS_ORDEN.filter((m) => set.has(m));
}

// Lista única y ordenada de modelos presentes en un set de productos.
// Si se pasa `marca`, solo devuelve los modelos de esa marca.
export function modelosDisponibles(productos = [], marca = null) {
  const set = new Set();
  productos.forEach((p) => {
    const m = modeloDe(p);
    if (m) set.add(m);
  });
  return MODELOS
    .filter((m) => !marca || m.marca === marca)
    .map((m) => m.key)
    .filter((k) => set.has(k));
}