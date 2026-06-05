// ════════════════════════════════════════════════════════════════════════
// phone-models-v2.js — Extrae el modelo/marca de teléfono desde el nombre de
// una carcasa, para el filtro visible por modelo del Catálogo v2 (Baymard).
// ════════════════════════════════════════════════════════════════════════

// Marcas/líneas reconocidas (orden = prioridad de match).
const MODELOS = [
  { key: 'iPhone 16', test: /iphone\s?16/i },
  { key: 'iPhone 15', test: /iphone\s?15/i },
  { key: 'iPhone 14', test: /iphone\s?14/i },
  { key: 'iPhone 13', test: /iphone\s?13/i },
  { key: 'iPhone 12', test: /iphone\s?12/i },
  { key: 'iPhone 11', test: /iphone\s?11/i },
  { key: 'Huawei P40', test: /p40/i },
  { key: 'Huawei P30', test: /p30/i },
  { key: 'AirPods', test: /airpod/i },
];

// Devuelve el modelo de un producto carcasa, o null si no aplica.
export function modeloDe(producto) {
  const n = producto?.nombre || '';
  const found = MODELOS.find((m) => m.test.test(n));
  return found?.key || null;
}

// Lista única y ordenada de modelos presentes en un set de productos.
export function modelosDisponibles(productos = []) {
  const set = new Set();
  productos.forEach((p) => {
    const m = modeloDe(p);
    if (m) set.add(m);
  });
  // Mantiene el orden de MODELOS para consistencia visual.
  return MODELOS.map((m) => m.key).filter((k) => set.has(k));
}