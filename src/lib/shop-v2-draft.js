// ════════════════════════════════════════════════════════════════════════
// shop-v2-draft.js — Borrador AUTO-GUARDADO de la personalización (Shop v2).
// ----------------------------------------------------------------------------
// Persiste cada paso del configurador (modelo, color, personalización,
// posiciones de las capas, cantidad) en localStorage para que NO se pierda al
// recargar o navegar. Se restaura automáticamente al volver. AISLADO del
// carrito y del legacy (clave propia `pers_draft_v2`).
//
// El borrador es por PRODUCTO (productoId): así si el usuario cambia de modelo,
// cada uno conserva su propia configuración.
// ════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'pers_draft_v2';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage lleno / no disponible → ignorar, no rompemos el flujo */
  }
}

// Guarda (o reemplaza) el borrador de un producto concreto.
export function saveDraftV2(productoId, draft) {
  if (!productoId) return;
  const all = readAll();
  all[productoId] = { ...draft, _at: Date.now() };
  writeAll(all);
}

// Lee el borrador de un producto. Devuelve null si no existe.
export function loadDraftV2(productoId) {
  if (!productoId) return null;
  const all = readAll();
  return all[productoId] || null;
}

// Limpia el borrador de un producto (al agregar al carrito con éxito).
export function clearDraftV2(productoId) {
  if (!productoId) return;
  const all = readAll();
  if (all[productoId]) {
    delete all[productoId];
    writeAll(all);
  }
}