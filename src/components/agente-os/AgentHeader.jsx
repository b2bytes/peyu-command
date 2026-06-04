import { RefreshCw, Menu } from 'lucide-react';
import LiquidDualToggle from '@/components/LiquidDualToggle';

// Header minimal: nombre, estado en línea, toggle tema, refrescar.
export default function AgentHeader({ onRefresh, refreshing, onMobileMenu }) {
  return (
    <header className="flex-shrink-0 h-16 border-b border-ld-border bg-ld-bg-soft/60 backdrop-blur-xl">
      <div className="h-full px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMobileMenu}
            className="md:hidden w-9 h-9 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted"
            aria-label="Menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-ld-fg leading-none flex items-center gap-2">
              Peyu <span className="text-ld-fg-subtle font-normal">·</span> <span className="text-ld-action">Agent OS</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ld-action animate-pulse" />
              <span className="text-[11px] text-ld-fg-muted">En línea</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <LiquidDualToggle compact />
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