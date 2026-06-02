import { useState, useEffect } from 'react';
import { X, Zap, Clock } from 'lucide-react';
import { isCyberActive, CYBER_END } from '@/lib/cyber-campaign';

/**
 * Banner superior del catálogo en modo Cyber. Cálido, elegante (NADA de rojo
 * retail), cerrable y persistente en sesión. Countdown discreto (no parpadea).
 * Controlado por el flag central isCyberActive(). Se apaga solo al expirar.
 */
function timeLeft() {
  const diff = new Date(CYBER_END).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function CyberCatalogBanner() {
  const [closed, setClosed] = useState(() => {
    try { return sessionStorage.getItem('cyber_catalog_banner_closed') === '1'; } catch { return false; }
  });
  const [left, setLeft] = useState(timeLeft());

  useEffect(() => {
    const id = setInterval(() => setLeft(timeLeft()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!isCyberActive() || closed) return null;

  const close = () => {
    setClosed(true);
    try { sessionStorage.setItem('cyber_catalog_banner_closed', '1'); } catch { /* noop */ }
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl px-5 py-4 sm:px-7 sm:py-5 mb-5 sm:mb-6 border"
      style={{
        background: 'linear-gradient(120deg, var(--ld-action-soft) 0%, var(--ld-bg-elevated) 45%, var(--ld-highlight-soft) 100%)',
        borderColor: 'var(--ld-border)',
      }}
    >
      {/* glow cálido decorativo */}
      <div aria-hidden className="absolute -top-16 -right-10 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--ld-highlight-soft)', opacity: 0.7 }} />
      <div aria-hidden className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--ld-action-soft)', opacity: 0.6 }} />

      <button
        onClick={close}
        aria-label="Cerrar anuncio Cyber"
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center ld-glass-soft text-ld-fg-muted hover:text-ld-fg transition z-10"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 pr-8">
        <div className="flex-shrink-0">
          <span
            className="inline-flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md"
            style={{ background: 'var(--ld-grad-action)' }}
          >
            <Zap className="w-3.5 h-3.5" /> CYBER PEYU
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="ld-display text-xl sm:text-2xl text-ld-fg leading-tight">
            Regalos con causa,{' '}
            <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>precios especiales</span>
          </h2>
          <p className="text-ld-fg-muted text-sm mt-0.5">Solo hoy y mañana — el Cyber PEYU que el planeta también agradece ♻️</p>
        </div>
        {left && (
          <div className="flex-shrink-0">
            <div className="ld-glass-soft rounded-2xl px-3.5 py-2 flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
              <div className="leading-tight">
                <p className="text-[9px] uppercase tracking-wider text-ld-fg-muted font-bold">Termina en</p>
                <p className="text-sm font-bold text-ld-fg tabular-nums">{left}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}