// ============================================================================
// AgentLayout · Plantilla agentica de 3 columnas (estilo PEYU v2).
// Izquierda: acciones/categorías · Centro: conversación grande · Derecha: contexto.
// Ambas columnas laterales son COLAPSABLES para darle máximo aire al chat,
// que es lo principal. El estado de colapso se recuerda por cada agente.
// Reutilizable por cualquier agente de Social Studio (marketing, ads…).
// ============================================================================
import { useState, useEffect } from 'react';
import { RefreshCw, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function AgentLayout({
  accent = 'violet',              // 'violet' | 'cyan'
  title,
  subtitle,
  HeaderIcon,
  left,                            // contenido columna izquierda (acciones)
  children,                       // columna central (stream + input)
  right,                          // columna derecha (contexto)
  onReset,
  resetting = false,
  storageKey = 'default',         // para recordar el colapso por agente
}) {
  const accents = {
    violet: { grad: 'from-violet-500 to-pink-600', glow: 'shadow-violet-500/30', dot: 'bg-violet-400' },
    cyan:   { grad: 'from-cyan-500 to-blue-600',  glow: 'shadow-cyan-500/30',   dot: 'bg-cyan-400' },
  }[accent] || {};

  // Estado de colapso persistente por agente
  const KEY = `peyu_agentlayout_${storageKey}`;
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) { setLeftOpen(saved.left ?? true); setRightOpen(saved.right ?? true); }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [KEY]);

  const persist = (l, r) => {
    try { localStorage.setItem(KEY, JSON.stringify({ left: l, right: r })); } catch { /* noop */ }
  };
  const toggleLeft = () => { const v = !leftOpen; setLeftOpen(v); persist(v, rightOpen); };
  const toggleRight = () => { const v = !rightOpen; setRightOpen(v); persist(leftOpen, v); };

  return (
    <div className="h-full flex flex-col min-h-0 bg-black/25 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className={`flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-gradient-to-r ${accent === 'cyan' ? 'from-cyan-900/30 to-blue-900/20' : 'from-violet-900/30 to-pink-900/20'}`}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Toggle columna izquierda (solo en desktop, donde existe) */}
          <button
            onClick={toggleLeft}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title={leftOpen ? 'Ocultar acciones rápidas' : 'Mostrar acciones rápidas'}
          >
            {leftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          <div className="relative flex-shrink-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accents.grad} flex items-center justify-center shadow-lg ${accents.glow}`}>
              {HeaderIcon && <HeaderIcon className="w-4 h-4 text-white" />}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-950" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-none truncate">{title}</p>
            <p className="text-[10px] text-white/40 mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onReset && (
            <button
              onClick={onReset}
              disabled={resetting}
              className="text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30"
              title="Nueva conversación"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            </button>
          )}
          {/* Toggle columna derecha (solo donde existe) */}
          {right && (
            <button
              onClick={toggleRight}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title={rightOpen ? 'Ocultar panel de contexto' : 'Mostrar panel de contexto'}
            >
              {rightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* 3 columnas */}
      <div className="flex-1 min-h-0 flex">
        {/* Izquierda · acciones (colapsable) */}
        <aside
          className={`hidden md:flex flex-col flex-shrink-0 border-r border-white/[0.07] bg-white/[0.02] overflow-hidden transition-all duration-300 ease-out ${
            leftOpen ? 'w-56 lg:w-60 opacity-100' : 'w-0 opacity-0 border-r-0'
          }`}
        >
          <div className="w-56 lg:w-60 h-full overflow-y-auto peyu-scrollbar-light">
            {left}
          </div>
        </aside>

        {/* Centro · conversación (se expande al colapsar laterales) */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          {children}
        </main>

        {/* Derecha · contexto (colapsable) */}
        {right && (
          <aside
            className={`hidden lg:flex flex-col flex-shrink-0 border-l border-white/[0.07] bg-white/[0.02] overflow-hidden transition-all duration-300 ease-out ${
              rightOpen ? 'w-64 xl:w-72 opacity-100' : 'w-0 opacity-0 border-l-0'
            }`}
          >
            <div className="w-64 xl:w-72 h-full overflow-y-auto peyu-scrollbar-light">
              {right}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}