import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { PWA_UTILS } from '@/lib/pwa-utils';

// ── Banner de instalación PWA · solo para fundadores/admin ───────────────────
// Aparece SOLO dentro de /admin (no en la tienda pública). Invita a instalar
// "PEYU OS" en el celular. Distinto del PWAInstallBanner público (ese se oculta
// en rutas de compra y vive en el storefront).
const DISMISS_KEY = 'peyu-os-install-dismissed';

export default function AdminInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState(null);
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    if (PWA_UTILS.isStandalone()) return; // ya instalada
    const dismissed = (() => {
      try {
        const t = localStorage.getItem(DISMISS_KEY);
        return t ? (Date.now() - parseInt(t)) / 86400000 < 7 : false;
      } catch { return false; }
    })();
    if (dismissed) return;

    const p = PWA_UTILS.getPlatform();
    setPlatform(p);

    if (p === 'ios') { setShow(true); return; }
    if (p === 'android') {
      if (window.pwaPrompt) { setDeferred(window.pwaPrompt); setShow(true); }
      const onPrompt = (e) => { e.preventDefault(); window.pwaPrompt = e; setDeferred(e); setShow(true); };
      window.addEventListener('beforeinstallprompt', onPrompt);
      return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch { /* noop */ }
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') dismiss();
    setDeferred(null);
  };

  if (!show) return null;
  const isIOS = platform === 'ios';
  const canAndroid = platform === 'android' && deferred;
  if (!isIOS && !canAndroid) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[60] px-3"
      style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
    >
      <div className="ld-glass-strong border border-ld-border rounded-2xl shadow-2xl max-w-md mx-auto p-3">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-xl flex-shrink-0 shadow-md">🐢</span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-ld-fg text-sm leading-tight">Instala PEYU OS</h3>
            <p className="text-ld-fg-muted text-xs leading-snug mt-0.5">
              Tu centro de mando en el celular. Acceso directo al Agente, pedidos y todo el negocio.
            </p>
          </div>
          <button onClick={dismiss} className="p-1 rounded-lg hover:bg-ld-bg-elevated text-ld-fg-muted flex-shrink-0">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-2.5 ld-card rounded-xl px-3 py-2 text-xs text-ld-fg-soft flex items-center gap-2">
            <Share className="w-4 h-4 text-ld-action flex-shrink-0" />
            <span>Toca <strong>Compartir</strong> → <strong>“Agregar a inicio”</strong></span>
          </div>
        ) : (
          <button
            onClick={install}
            className="ld-btn-primary w-full mt-2.5 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Instalar app
          </button>
        )}
      </div>
    </div>
  );
}