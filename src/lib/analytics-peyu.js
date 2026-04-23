// ============================================================================
// PEYU · Funnel analytics helper
// ----------------------------------------------------------------------------
// Dispara eventos GA4 estándar (add_to_cart, begin_checkout, purchase) vía gtag
// + espeja todo a base44.analytics.track para análisis interno.
// Nombres de eventos: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
// ============================================================================

import { base44 } from '@/api/base44Client';

const GA_KEY = 'peyu_ga4_measurement_id';

/** Obtiene el Measurement ID configurado (localStorage o prop). */
export const getMeasurementId = () => {
  try { return localStorage.getItem(GA_KEY) || ''; } catch { return ''; }
};

/** Inyecta el script gtag.js si aún no está cargado. Idempotente. */
export const ensureGtagLoaded = (measurementId) => {
  if (!measurementId || typeof window === 'undefined') return;
  if (window.__peyuGtagLoaded === measurementId) return;

  // dataLayer + gtag stub inmediato para no perder eventos tempranos
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: true });

  // Carga async del script externo
  if (!document.querySelector(`script[data-ga-id="${measurementId}"]`)) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    s.setAttribute('data-ga-id', measurementId);
    document.head.appendChild(s);
  }

  window.__peyuGtagLoaded = measurementId;
};

/** Emite un evento a GA4 + base44 analytics. */
const emit = (eventName, params = {}) => {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch { /* noop */ }

  try {
    // base44.analytics requiere valores primitivos; aplanamos items a count + total.
    const flat = {
      value: params.value ?? null,
      currency: params.currency ?? null,
      items_count: Array.isArray(params.items) ? params.items.length : null,
      transaction_id: params.transaction_id ?? null,
    };
    base44.analytics.track({ eventName, properties: flat });
  } catch { /* noop */ }
};

/** Normaliza un item de carrito al formato GA4. */
const toGaItem = (it) => ({
  item_id: String(it.productoId || it.id || it.sku || ''),
  item_name: it.nombre || 'item',
  item_category: it.categoria || undefined,
  item_variant: it.color || undefined,
  price: Number(it.precio || 0),
  quantity: Number(it.cantidad || 1),
});

// ── Eventos del funnel ─────────────────────────────────────────────────────
export const trackAddToCart = (item) => {
  const gi = toGaItem(item);
  emit('add_to_cart', {
    currency: 'CLP',
    value: gi.price * gi.quantity,
    items: [gi],
  });
};

export const trackBeginCheckout = (cart, subtotal) => {
  emit('begin_checkout', {
    currency: 'CLP',
    value: Number(subtotal || 0),
    items: (cart || []).map(toGaItem),
  });
};

export const trackPurchase = ({ transactionId, total, shipping, cart }) => {
  emit('purchase', {
    transaction_id: String(transactionId),
    currency: 'CLP',
    value: Number(total || 0),
    shipping: Number(shipping || 0),
    items: (cart || []).map(toGaItem),
  });
};

export const trackViewItem = (producto, price) => {
  emit('view_item', {
    currency: 'CLP',
    value: Number(price || producto?.precio_b2c || 0),
    items: [toGaItem({
      productoId: producto?.id,
      sku: producto?.sku,
      nombre: producto?.nombre,
      categoria: producto?.categoria,
      precio: price || producto?.precio_b2c,
      cantidad: 1,
    })],
  });
};