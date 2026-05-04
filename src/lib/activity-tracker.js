// ============================================================================
// activity-tracker · Cliente liviano para Trazabilidad 360° (frontend público)
// ----------------------------------------------------------------------------
// Registra eventos en la entidad ActivityLog de forma no-bloqueante. Cruza
// session_id anónimo con email cuando el usuario lo entrega (form, checkout).
//
// Uso:
//   import { trackEvent } from '@/lib/activity-tracker';
//   trackEvent('product_view', { entity_type: 'Producto', entity_id: prod.id, page_path: location.pathname });
// ============================================================================
import { base44 } from '@/api/base44Client';

const SESSION_KEY = 'peyu_session_id';
const EMAIL_KEY = 'peyu_user_email';
const NAME_KEY = 'peyu_user_name';

// ── Session ID anónimo persistente ──────────────────────────────────
function getSessionId() {
  if (typeof window === 'undefined') return null;
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

// ── Identificación blanda (cuando el usuario completa un formulario) ──
export function identifyUser({ email, name } = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email);
    if (name) localStorage.setItem(NAME_KEY, name);
  } catch {}
}

function getKnownIdentity() {
  if (typeof window === 'undefined') return {};
  try {
    return {
      email: localStorage.getItem(EMAIL_KEY) || null,
      name: localStorage.getItem(NAME_KEY) || null,
    };
  } catch {
    return {};
  }
}

// ── Detección de dispositivo ────────────────────────────────────────
function getDevice() {
  if (typeof window === 'undefined') return 'unknown';
  const w = window.innerWidth || 0;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

// ── UTM extraction (lee URL una vez por sesión y persiste) ──────────
function getUTMs() {
  if (typeof window === 'undefined') return {};
  try {
    const cached = sessionStorage.getItem('peyu_utms');
    if (cached) return JSON.parse(cached);
    const url = new URL(window.location.href);
    const utms = {
      utm_source: url.searchParams.get('utm_source') || '',
      utm_medium: url.searchParams.get('utm_medium') || '',
      utm_campaign: url.searchParams.get('utm_campaign') || '',
    };
    sessionStorage.setItem('peyu_utms', JSON.stringify(utms));
    return utms;
  } catch {
    return {};
  }
}

// ── Categoría inferida desde event_type (puede sobrescribirse) ──────
const CATEGORY_MAP = {
  product_view: 'B2C', add_to_cart: 'B2C', remove_from_cart: 'B2C',
  checkout_start: 'B2C', checkout_complete: 'B2C', tracking_view: 'B2C',
  review_submit: 'B2C', giftcard_purchase: 'B2C', giftcard_redeem: 'B2C',
  b2b_form_submit: 'B2B', b2b_proposal_view: 'B2B',
  b2b_proposal_accept: 'B2B', b2b_proposal_reject: 'B2B',
  personalization_request: 'B2B',
  blog_view: 'Contenido', newsletter_signup: 'Contenido', search: 'Contenido',
  chat_message: 'Soporte',
};

// ── Track principal ─────────────────────────────────────────────────
export function trackEvent(event_type, payload = {}) {
  if (typeof window === 'undefined') return;
  if (!event_type) return;

  const identity = getKnownIdentity();
  const device = getDevice();
  const utms = getUTMs();

  const data = {
    event_type,
    category: payload.category || CATEGORY_MAP[event_type] || 'Sistema',
    user_email: payload.user_email || identity.email || '',
    user_name: payload.user_name || identity.name || '',
    session_id: getSessionId() || '',
    page_path: payload.page_path || window.location.pathname,
    referrer: document.referrer || '',
    device,
    user_agent: (navigator.userAgent || '').slice(0, 200),
    ...utms,
    ...payload, // permite overrides explícitos
  };

  // Persistir email si lo trae el evento (mejora identificación futura)
  if (payload.user_email) identifyUser({ email: payload.user_email });

  // Fire-and-forget: nunca bloquea la UI ni rompe si falla
  try {
    base44.entities.ActivityLog.create(data).catch(() => {});
  } catch {}
}

// ── Helpers tipados (azúcar sintáctica) ─────────────────────────────
export const track = {
  pageView: (path) => trackEvent('page_view', { page_path: path }),
  productView: (producto) => trackEvent('product_view', {
    entity_type: 'Producto',
    entity_id: producto?.id,
    meta: { sku: producto?.sku, nombre: producto?.nombre, precio: producto?.precio_b2c },
  }),
  addToCart: (item) => trackEvent('add_to_cart', {
    entity_type: 'Producto',
    entity_id: item?.id,
    value_clp: (item?.precio || 0) * (item?.cantidad || 1),
    meta: { sku: item?.sku, cantidad: item?.cantidad },
  }),
  checkoutStart: (cart) => trackEvent('checkout_start', {
    value_clp: cart?.total || 0,
    meta: { items: cart?.items?.length || 0 },
  }),
  checkoutComplete: ({ pedidoId, total, email, name }) => trackEvent('checkout_complete', {
    entity_type: 'PedidoWeb',
    entity_id: pedidoId,
    value_clp: total || 0,
    user_email: email,
    user_name: name,
  }),
  b2bFormSubmit: ({ leadId, company, email, name, qty }) => trackEvent('b2b_form_submit', {
    entity_type: 'B2BLead',
    entity_id: leadId,
    user_email: email,
    user_name: name,
    meta: { company, qty },
  }),
  b2bProposalView: ({ proposalId, empresa }) => trackEvent('b2b_proposal_view', {
    entity_type: 'CorporateProposal',
    entity_id: proposalId,
    meta: { empresa },
  }),
  b2bProposalAccept: ({ proposalId, total }) => trackEvent('b2b_proposal_accept', {
    entity_type: 'CorporateProposal',
    entity_id: proposalId,
    value_clp: total,
  }),
  b2bProposalReject: ({ proposalId, reason }) => trackEvent('b2b_proposal_reject', {
    entity_type: 'CorporateProposal',
    entity_id: proposalId,
    meta: { reason },
  }),
  trackingView: (numeroPedido) => trackEvent('tracking_view', {
    meta: { numero_pedido: numeroPedido },
  }),
  giftcardPurchase: ({ codigo, monto, email }) => trackEvent('giftcard_purchase', {
    entity_type: 'GiftCard',
    user_email: email,
    value_clp: monto,
    meta: { codigo },
  }),
  giftcardRedeem: ({ codigo, email }) => trackEvent('giftcard_redeem', {
    entity_type: 'GiftCard',
    user_email: email,
    meta: { codigo },
  }),
  blogView: (slug) => trackEvent('blog_view', { meta: { slug } }),
  search: (query) => trackEvent('search', { meta: { query } }),
};