import { RefreshCw, Menu, MessageCircle, LayoutDashboard, Eraser } from 'lucide-react';
import LiquidDualToggle from '@/components/LiquidDualToggle';

// Header compacto del Agent OS: marca PEYU + toggle Chat/Operaciones integrado
// (antes ocupaba una fila aparte y en móvil el header se desarmaba).
export default function AgentHeader({ onRefresh, refreshing, onMobileMenu, view, onView, onClear }) {
  return (
    <header className="flex-shrink-0 h-14 border-b border-ld-border bg-ld-bg-soft/60 backdrop-blur-xl">
      <div className="h-full px-2.5 sm:px-4 flex items-center gap-2">
        <button
          onClick={onMobileMenu}
          className="md:hidden w-9 h-9 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted flex-shrink-0"
          aria-label="Menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Marca */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-ld-action-soft flex items-center justify-center text-base flex-shrink-0">🐢</div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-ld-fg leading-none whitespace-nowrap">
              Peyu <span className="text-ld-action hidden min-[400px]:inline">Agent OS</span>
            </h1>
            <div className="hidden min-[480px]:flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ld-action animate-pulse" />
              <span className="text-[10px] text-ld-fg-muted whitespace-nowrap">En línea · PEYU Chile</span>
            </div>
          </div>
        </div>

        {/* Toggle Chat ↔ Operaciones — segmentado, integrado al header */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="flex items-center gap-0.5 p-0.5 rounded-full ld-glass-soft">
            <button
              onClick={() => onView('chat')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${view === 'chat' ? 'ld-btn-primary' : 'text-ld-fg-muted hover:text-ld-fg'}`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button
              onClick={() => onView('ops')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${view === 'ops' ? 'ld-btn-primary' : 'text-ld-fg-muted hover:text-ld-fg'}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Operaciones</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Limpiar chat — el hilo ya quedó guardado automáticamente */}
          {onClear && (
            <button
              onClick={onClear}
              className="w-9 h-9 rounded-lg hover:bg-ld-bg-elevated hidden min-[400px]:flex items-center justify-center text-ld-fg-muted hover:text-ld-fg transition-colors"
              title="Limpiar chat (el hilo queda guardado)"
              aria-label="Limpiar chat"
            >
              <Eraser className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:block"><LiquidDualToggle compact /></div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="w-9 h-9 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted hover:text-ld-fg transition-colors disabled:opacity-50"
            aria-label="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}