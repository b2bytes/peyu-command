// ============================================================================
// lib/meta-pixel.js · Helper centralizado para disparar eventos del Meta Pixel
// (fbq) desde el frontend. El código base del pixel (init + PageView) vive en
// index.html. Aquí se exponen funciones tipadas para los eventos estándar de
// e-commerce de PEYU, con guardas para que nunca rompan si fbq aún no cargó.
//
// COBERTURA DOBLE (browser + server): cada evento de recorrido se dispara por
// el pixel del navegador Y, en espejo, por la Conversions API server-side con
// el MISMO event_id. Meta deduplica por event_id y cuenta una sola vez. Esto
// resuelve el diagnóstico "aumenta la cobertura por Conversions API" y registra
// el recorrido con exactitud aunque el navegador bloquee el pixel.
// ============================================================================
import { base44 } from '@/api/base44Client';

// Espejo server-side vía Conversions API. Best-effort: nunca bloquea ni rompe
// la UI. Reusa el event_id del pixel del navegador para deduplicar. Toma el
// email/teléfono conocidos del visitante (si los entregó) para Advanced Matching.
function mirrorToCapi({ event_name, event_id, value, contents, content_name }) {
  if (typeof window === 'undefined') return;
  try {
    let email, phone;
    try {
      email = localStorage.getItem('peyu_user_email') || undefined;
    } catch { /* storage bloqueado */ }
    base44.functions.invoke('metaConversionsAPI', {
      internal: true,
      event_name,
      event_id,
      pixel_id: '769018551017679', // pixel PEYU fijo → evita el lookup extra a adspixels
      value: value != null ? Number(value) : undefined,
      currency: 'CLP',
      contents,
      content_name,
      email,
      phone,
      event_source_url: window.location.href,
    }).catch(() => {});
  } catch { /* fire-and-forget */ }
}

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
  const finalContents = contents || (id ? [{ id: String(id), quantity: 1, item_price: value != null ? Number(value) : undefined }] : undefined);
  track('ViewContent', {
    content_ids: id ? [String(id)] : undefined,
    content_name: name,
    content_type: 'product',
    contents: finalContents,
    value: value != null ? Number(value) : undefined,
    currency,
  }, eventID);
  mirrorToCapi({ event_name: 'ViewContent', event_id: eventID, value, contents: finalContents, content_name: name });
  return eventID;
}

// Agregó al carrito
export function trackAddToCart({ id, name, value, quantity = 1, currency = 'CLP' } = {}) {
  const eventID = genEventID('atc');
  const finalContents = id ? [{ id: String(id), quantity: Number(quantity), item_price: value != null ? Number(value) / Math.max(1, Number(quantity)) : undefined }] : undefined;
  track('AddToCart', {
    content_ids: id ? [String(id)] : undefined,
    content_name: name,
    content_type: 'product',
    contents: finalContents,
    value: value != null ? Number(value) : undefined,
    currency,
  }, eventID);
  mirrorToCapi({ event_name: 'AddToCart', event_id: eventID, value, contents: finalContents, content_name: name });
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
  mirrorToCapi({ event_name: 'InitiateCheckout', event_id: eventID, value, contents: contents || undefined });
  return eventID;
}

// Lead B2B (formulario corporativo / cotización)
export function trackLead({ value, currency = 'CLP', content_name } = {}) {
  const eventID = genEventID('lead');
  track('Lead', {
    value: value != null ? Number(value) : undefined,
    currency,
    content_name,
  }, eventID);
  mirrorToCapi({ event_name: 'Lead', event_id: eventID, value, content_name });
  return eventID;
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