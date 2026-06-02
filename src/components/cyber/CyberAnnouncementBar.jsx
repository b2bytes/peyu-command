import { useState } from 'react';
import { X } from 'lucide-react';
import { isCyberActive, CYBER_COPY } from '@/lib/cyber-campaign';

/**
 * Banda de anuncio fina, sutil y cerrable de la campaña "CYBER PEYU".
 * Va arriba del header. Acento cálido (highlight Warm), altura baja,
 * no invasiva. Se oculta sola si la campaña no está activa o si el
 * usuario la cierra (recordado en sessionStorage).
 */
export default function CyberAnnouncementBar() {
  const [closed, setClosed] = useState(() => {
    try { return sessionStorage.getItem('cyber_bar_closed') === '1'; } catch { return false; }
  });

  if (!isCyberActive() || closed) return null;

  const handleClose = () => {
    setClosed(true);
    try { sessionStorage.setItem('cyber_bar_closed', '1'); } catch { /* ignore */ }
  };

  return (
    <div
      className="relative w-full text-center px-9 py-1.5 text-[11px] sm:text-xs font-semibold tracking-wide"
      style={{
        background: 'linear-gradient(90deg, var(--ld-highlight-soft) 0%, var(--ld-action-soft) 100%)',
        color: 'var(--ld-fg)',
        borderBottom: '1px solid var(--ld-border)',
      }}
      role="region"
      aria-label="Anuncio campaña Cyber"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="font-bold" style={{ color: 'var(--ld-highlight)' }}>{CYBER_COPY.bar}</span>
      </span>
      <button
        onClick={handleClose}
        aria-label="Cerrar anuncio"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 transition"
      >
        <X className="w-3.5 h-3.5 text-ld-fg-muted" />
      </button>
    </div>
  );
}