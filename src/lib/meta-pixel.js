// ============================================================================
// lib/meta-pixel.js · Helper centralizado para disparar eventos del Meta Pixel
// (fbq) desde el frontend. El código base del pixel (init + PageView) vive en
// index.html. Aquí se exponen funciones tipadas para los eventos estándar de
// e-commerce de PEYU, con guardas para que nunca rompan si fbq aún no cargó.
// ============================================================================

function track(event, params, eventID) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    // El 4º argumento { eventID } permite deduplicar con la Conversions API
    // server-side (Meta cuenta una sola vez si el event_id coincide).
    if (eventID) {
      window.fbq('track', event, params || {}, { eventID });
    } else {
      window.fbq('track', event, params || {});
    }
  } catch {
    // fbq puede no estar listo o bloqueado por el navegador — silencioso.
  }
}

// Vio un producto (ficha de detalle)
export function trackViewContent({ id, name, value, currency = 'CLP' } = {}) {
  track('ViewContent', {
    content_ids: id ? [String(id)] : undefined,
    content_name: name,
    content_type: 'product',
    value: value != null ? Number(value) : undefined,
    currency,
  });
}

// Agregó al carrito
export function trackAddToCart({ id, name, value, quantity = 1, currency = 'CLP' } = {}) {
  track('AddToCart', {
    content_ids: id ? [String(id)] : undefined,
    content_name: name,
    content_type: 'product',
    contents: id ? [{ id: String(id), quantity: Number(quantity) }] : undefined,
    value: value != null ? Number(value) : undefined,
    currency,
  });
}

// Inició el checkout
export function trackInitiateCheckout({ value, num_items, currency = 'CLP' } = {}) {
  track('InitiateCheckout', {
    value: value != null ? Number(value) : undefined,
    num_items: num_items != null ? Number(num_items) : undefined,
    currency,
  });
}

// Lead B2B (formulario corporativo / cotización)
export function trackLead({ value, currency = 'CLP', content_name } = {}) {
  track('Lead', {
    value: value != null ? Number(value) : undefined,
    currency,
    content_name,
  });
}

// Compra confirmada (página de gracias). event_id permite deduplicar con el
// Purchase server-side que envía mpWebhook (mismo formato: pedido-{n°}).
export function trackPurchase({ value, currency = 'CLP', order_id } = {}) {
  const eventID = order_id ? `pedido-${order_id}` : undefined;
  track('Purchase', {
    value: value != null ? Number(value) : undefined,
    currency,
    content_type: 'product',
  }, eventID);
}

// Registro completado (suscripción a newsletter, creación de cuenta).
export function trackCompleteRegistration({ content_name, value, currency = 'CLP' } = {}) {
  track('CompleteRegistration', {
    content_name,
    value: value != null ? Number(value) : undefined,
    currency,
  });
}

// Búsqueda interna del sitio
export function trackSearch({ search_string } = {}) {
  track('Search', { search_string });
}

// Contacto (clic en botón de contacto / envío de formulario de consulta)
export function trackContact({ content_name } = {}) {
  track('Contact', { content_name });
}