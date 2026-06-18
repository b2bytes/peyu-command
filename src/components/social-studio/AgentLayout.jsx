// ============================================================================
// AgentLayout · Plantilla agentica de 3 columnas (estilo PEYU v2).
// Izquierda: acciones/categorías · Centro: conversación grande · Derecha: contexto.
// Reutilizable por cualquier agente de Social Studio (marketing, ads…).
// ============================================================================
import { RefreshCw } from 'lucide-react';

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
}) {
  const accents = {
    violet: { grad: 'from-violet-500 to-pink-600', glow: 'shadow-violet-500/30', dot: 'bg-violet-400' },
    cyan:   { grad: 'from-cyan-500 to-blue-600',  glow: 'shadow-cyan-500/30',   dot: 'bg-cyan-400' },
  }[accent] || {};

  return (
    <div className="h-full flex flex-col min-h-0 bg-black/25 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className={`flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-gradient-to-r ${accent === 'cyan' ? 'from-cyan-900/30 to-blue-900/20' : 'from-violet-900/30 to-pink-900/20'}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accents.grad} flex items-center justify-center shadow-lg ${accents.glow}`}>
              {HeaderIcon && <HeaderIcon className="w-4 h-4 text-white" />}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">{title}</p>
            <p className="text-[10px] text-white/40 mt-0.5">{subtitle}</p>
          </div>
        </div>
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
      </div>

      {/* 3 columnas */}
      <div className="flex-1 min-h-0 flex">
        {/* Izquierda · acciones */}
        <aside className="hidden md:flex flex-col w-56 lg:w-60 flex-shrink-0 border-r border-white/[0.07] bg-white/[0.02] overflow-y-auto peyu-scrollbar-light">
          {left}
        </aside>

        {/* Centro · conversación */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          {children}
        </main>

        {/* Derecha · contexto */}
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 border-l border-white/[0.07] bg-white/[0.02] overflow-y-auto peyu-scrollbar-light">
          {right}
        </aside>
      </div>
    </div>
  );
}