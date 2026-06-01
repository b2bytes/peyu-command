// "Vistos recientemente" para /v2 — persistencia local aislada.
const KEY = 'v2_recent_views';
const MAX = 8;

export function getRecentViews() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function pushRecentView(p) {
  if (!p?.sku) return;
  try {
    const list = getRecentViews().filter((x) => x.sku !== p.sku);
    list.unshift({ sku: p.sku, nombre: p.nombre, imagen_url: p.imagen_url, precio_b2c: p.precio_b2c, categoria_v2: p.categoria_v2 });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new Event('v2:recent-updated'));
  } catch { /* noop */ }
}