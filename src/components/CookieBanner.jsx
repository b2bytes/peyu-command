import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

const CONSENT_KEY = 'peyu_cookie_consent_v1';
const CONSENT_EVENT = 'peyu:cookie-consent';

/**
 * Banner de consentimiento de cookies (Ley 21.096 Chile / LGPD-friendly).
 * Persiste la decisión en localStorage. Emite evento `peyu:cookie-consent`
 * con `{ analytics: bool, marketing: bool }` para que GA4 / Meta pixel
 * puedan inicializarse de forma condicional.
 *
 * Diseño: minimal, compatible con el dark glass del sitio. NO bloquea la
 * navegación (estilo "soft consent" — ya cumple con la ley chilena).
 */
export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) {
        // Mostramos el banner luego de 1.5s para no romper LCP
        const t = setTimeout(() => setOpen(true), 1500);
        return () => clearTimeout(t);
      }
    } catch { /* noop */ }
  }, []);

  const persist = (decision) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...decision, at: Date.now() }));
      window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: decision }));
    } catch { /* noop */ }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-[80] p-3 sm:p-4 lg:bottom-4 lg:left-4 lg:right-auto lg:max-w-md"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 sm:p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/25 border border-teal-400/30 flex items-center justify-center flex-shrink-0">
            <Cookie className="w-4 h-4 text-teal-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-poppins font-bold text-sm">Usamos cookies 🍪</p>
            <p className="text-xs text-white/65 leading-relaxed mt-1">
              Para que el carrito, el chat y las analíticas funcionen. Puedes leer la{' '}
              <Link to="/cookies" className="text-teal-300 hover:text-teal-200 underline">política de cookies</Link>.
            </p>
          </div>
          <button
            onClick={() => persist({ analytics: false, marketing: false })}
            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition"
            aria-label="Cerrar y rechazar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => persist({ analytics: false, marketing: false })}
            className="flex-1 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition"
          >
            Solo necesarias
          </button>
          <button
            onClick={() => persist({ analytics: true, marketing: true })}
            className="flex-1 h-9 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-xs font-bold shadow-lg transition"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}

/** Helper para que GA4 y otros lean el consentimiento. */
export const readCookieConsent = () => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};