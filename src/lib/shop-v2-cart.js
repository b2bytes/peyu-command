// ════════════════════════════════════════════════════════════════════════
// shop-v2-cart.js — Carrito AISLADO del Shop B2C v2.
// ----------------------------------------------------------------------------
// Usa su propia clave de storage `carrito_v2` para NO interferir con el carrito
// legacy (`carrito`). Mismo formato de item para reutilizar el checkout cuando
// se conecte. Emite un evento para que el header actualice el contador en vivo.
// ════════════════════════════════════════════════════════════════════════

import { trackAddToCart } from '@/lib/meta-pixel';

const STORAGE_KEY = 'carrito_v2';
const EVENT = 'carrito_v2_updated';

// Formato CLP unificado para todo el Shop v2.
export function fmtCLP(n) {
  return '$' + Math.round(n || 0).toLocaleString('es-CL');
}

export function getCartV2() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function addToCartV2(item) {
  const items = getCartV2();
  items.push({ id: Math.random().toString(36).slice(2), ...item });
  persist(items);
  // 📊 Meta Pixel — AddToCart con valor real de la línea.
  trackAddToCart({
    id: item.sku,
    name: item.nombre,
    value: (item.precio || 0) * (item.cantidad || 1),
    quantity: item.cantidad || 1,
  });
  return items;
}

export function updateCartItemV2(id, patch) {
  const items = getCartV2().map((i) => (i.id === id ? { ...i, ...patch } : i));
  persist(items);
  return items;
}

export function removeFromCartV2(id) {
  const items = getCartV2().filter((i) => i.id !== id);
  persist(items);
  return items;
}

export function clearCartV2() {
  persist([]);
}

export function cartCountV2() {
  return getCartV2().reduce((sum, i) => sum + (i.cantidad || 1), 0);
}

// Suscripción reactiva para el header / cart bubble.
export function subscribeCartV2(cb) {
  const handler = () => cb(getCartV2());
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}