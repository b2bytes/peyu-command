// ════════════════════════════════════════════════════════════════════
// v2-checkout-store — Persistencia de los datos de envío del checkout /v2.
// Guarda nombre/email/teléfono/región/comuna/dirección/referencia en
// localStorage para que NO se pierdan entre re-renders ni al recargar.
// Aditivo: solo lo usa CardShipping en /v2.
// ════════════════════════════════════════════════════════════════════

const KEY = 'peyu_v2_checkout';

const EMPTY = {
  nombre: '', email: '', telefono: '',
  region: '', ciudad: '', direccion: '', referencia: '',
};

export function readCheckout() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...EMPTY, ...(raw && typeof raw === 'object' ? raw : {}) };
  } catch {
    return { ...EMPTY };
  }
}

export function writeCheckout(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* noop */ }
  return data;
}

export function mergeCheckout(patch) {
  const next = { ...readCheckout(), ...patch };
  return writeCheckout(next);
}