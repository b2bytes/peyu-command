// ════════════════════════════════════════════════════════════════════════
// shop-v2-checkout-store — Persistencia progresiva del checkout B2C (Shop v2).
// ----------------------------------------------------------------------------
// Guarda en localStorage TODO lo que el cliente va completando a lo largo de la
// compra (datos de envío + facturación + medio de pago) para que NO se pierda
// entre recargas, navegación atrás/adelante o cierres accidentales. Aislado del
// store de /v2 (peyu_v2_checkout) y del carrito (carrito_v2).
// ════════════════════════════════════════════════════════════════════════

const KEY = 'peyu_shopv2_checkout';

const EMPTY = {
  // Envío / contacto
  nombre: '', email: '', telefono: '',
  region: '', ciudad: '', direccion: '', referencia: '', codigo_postal: '',
  // Facturación
  tipo_documento: 'Boleta', razon_social: '', rut_empresa: '', giro: '',
  direccion_facturacion: '', comuna_facturacion: '',
  // Pago
  medio_pago: 'MercadoPago',
};

export function readShopCheckout() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...EMPTY, ...(raw && typeof raw === 'object' ? raw : {}) };
  } catch {
    return { ...EMPTY };
  }
}

export function writeShopCheckout(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* noop */ }
  return data;
}

export function mergeShopCheckout(patch) {
  const next = { ...readShopCheckout(), ...(patch || {}) };
  return writeShopCheckout(next);
}

export function clearShopCheckout() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}