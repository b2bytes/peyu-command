// ════════════════════════════════════════════════════════════════════
// v2-cart — Fuente de verdad ÚNICA del carrito conversacional de /v2.
// Persistente en localStorage bajo la MISMA clave que la tienda viva
// ('carrito') para que /cart y /v2 compartan el carro sin romper nada.
// Reusa la lógica de descuento por volumen existente (volume-discount.js).
//
// Shape de cada item (idéntico al que usa la tienda /cart):
//   { id, sku, productoId, nombre, imagen, precio, cantidad, color }
// ════════════════════════════════════════════════════════════════════

import { computeQtyDiscountBySku } from '@/lib/volume-discount';

const CART_KEY = 'carrito';

function emitChange() {
  try {
    window.dispatchEvent(new Event('peyu:cart-added'));
    window.dispatchEvent(new Event('v2:cart-updated'));
  } catch { /* noop */ }
}

export function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* noop */ }
  emitChange();
  return items;
}

// Genera un id estable por línea (mismo producto + color = misma línea).
function lineId(producto, color) {
  const sku = producto.sku || producto.id || producto.productoId || 'item';
  return `${sku}__${(color || 'default').toString().toLowerCase()}`;
}

// Agrega un producto madre v2 al carrito. Si ya existe esa línea, suma cantidad.
export function addToCart(producto, { color = null, cantidad = 1 } = {}) {
  const items = readCart();
  const id = lineId(producto, color);
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx].cantidad = (items[idx].cantidad || 1) + cantidad;
  } else {
    items.push({
      id,
      sku: producto.sku || null,
      productoId: producto.id || producto.productoId || null,
      nombre: producto.nombre,
      imagen: producto.imagen_url || producto.imagen || null,
      precio: producto.precio_b2c ?? producto.precio ?? 0,
      cantidad,
      color: color || null,
    });
  }
  return writeCart(items);
}

export function setQty(id, cantidad) {
  const items = readCart();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return items;
  if (cantidad < 1) { items.splice(idx, 1); }
  else { items[idx].cantidad = cantidad; }
  return writeCart(items);
}

export function removeLine(id) {
  return writeCart(readCart().filter((i) => i.id !== id));
}

export function clearCart() {
  return writeCart([]);
}

// Totales del carrito B2C con descuento por cantidad POR SKU (misma lógica que /cart).
export function computeCartTotals(items = readCart()) {
  const subtotal = items.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
  const unidades = items.reduce((s, i) => s + (i.cantidad || 1), 0);
  const qty = computeQtyDiscountBySku({ carrito: items, hasCupon: false });
  const descuentoVolumen = qty.ahorroTotal;
  // % máximo aplicado entre las líneas (para mostrar un indicador resumido).
  const pctVolumen = qty.lineas.reduce((m, l) => Math.max(m, l.pct || 0), 0);
  const totalSinEnvio = Math.max(0, subtotal - descuentoVolumen);
  return {
    subtotal,
    unidades,
    descuentoVolumen,
    pctVolumen,
    lineasDescuento: qty.lineas,
    totalSinEnvio,
  };
}