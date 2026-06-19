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

// ID de evento estable y único por disparo. Meta deduplica el evento del
// navegador contra el del server (Conversions API) cuando comparten event_id.
// Para Purchase usamos el nº de pedido (pedido-N) → matchea al server. Para el
// resto generamos un ID único de navegador que el server-side puede reusar.
function genEventID(prefix) {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rnd}`;
}

// Vio un producto (ficha de detalle). Devuelve el eventID para que el
// server-side (metaConversionsAPI) pueda reusarlo y deduplicar.
export function trackViewContent({ id, name, value, currency = 'CLP', contents } = {}) {
  const eventID = genEventID('vc');
  track('ViewContent', {
    content_ids: id ? [String(id)] : undefined,
    content_name: name,
    content_type: 'product',
    contents: contents || (id ? [{ id: String(id), quantity: 1, item_price: value != null ? Number(value) : undefined }] : undefined),
    value: value != null ? Number(value) : undefined,
    currency,
  }, eventID);
  return eventID;
}

// Agregó al carrito
export function trackAddToCart({ id, name, value, quantity = 1, currency = 'CLP' } = {}) {
  const eventID = genEventID('atc');
  track('AddToCart', {
    content_ids: id ? [String(id)] : undefined,
    content_name: name,
    content_type: 'product',
    contents: id ? [{ id: String(id), quantity: Number(quantity), item_price: value != null ? Number(value) / Math.max(1, Number(quantity)) : undefined }] : undefined,
    value: value != null ? Number(value) : undefined,
    currency,
  }, eventID);
  return eventID;
}

// Inició el checkout
export function trackInitiateCheckout({ value, num_items, contents, currency = 'CLP' } = {}) {
  const eventID = genEventID('ic');
  track('InitiateCheckout', {
    value: value != null ? Number(value) : undefined,
    num_items: num_items != null ? Number(num_items) : undefined,
    contents: contents || undefined,
    content_type: 'product',
    currency,
  }, eventID);
  return eventID;
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