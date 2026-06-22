import { RefreshCw, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

// ── Header móvil compacto del founder ───────────────────────────────────────
// Saludo + fecha + píldora de ventas hoy en vivo + toggle día/noche + refrescar.
// Pensado para la cabecera del Home de la app (Fase 3). Solo móvil.
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Buena madrugada';
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const fmtCompact = (n) => {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
};

export default function AdminMobileHeader({ ventasHoy, pedidosHoy, onRefresh, refreshing }) {
  const [mode, setMode] = useState('night');

  useEffect(() => {
    const cur = document.documentElement.getAttribute('data-liquid-mode') || 'night';
    setMode(cur);
  }, []);

  const toggleMode = () => {
    const next = mode === 'night' ? 'day' : 'night';
    document.documentElement.setAttribute('data-liquid-mode', next);
    setMode(next);
  };

  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-ld-action font-semibold">PEYU OS</p>
        <h1 className="text-2xl ld-display text-ld-fg mt-0.5 leading-tight">{getGreeting()}</h1>
        <p className="text-xs text-ld-fg-muted mt-0.5 capitalize">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {ventasHoy != null && (
          <div className="inline-flex items-center gap-2 mt-2 ld-glass-soft rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-ld-action animate-pulse" />
            <span className="text-[12px] font-semibold text-ld-fg">{fmtCompact(ventasHoy)} hoy</span>
            <span className="text-[11px] text-ld-fg-muted">· {pedidosHoy || 0} pedidos</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={toggleMode}
          className="w-10 h-10 rounded-full ld-glass-soft border border-ld-border flex items-center justify-center text-ld-fg-muted active:scale-95 transition"
          aria-label="Cambiar tema"
        >
          {mode === 'night' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="w-10 h-10 rounded-full ld-glass-soft border border-ld-border flex items-center justify-center text-ld-fg-muted active:scale-95 transition"
          aria-label="Actualizar"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}