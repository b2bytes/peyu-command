import { MessageSquare, Package, FileText, Users, PanelLeftClose, PanelLeft } from 'lucide-react';
import AgentThreadsList from './AgentThreadsList';

// Sidebar izquierdo delgado y colapsable: logo PEYU + accesos rápidos.
// Los accesos disparan preguntas al agente (operan dentro del río), no navegan.
const QUICK = [
  { id: 'hilos', label: 'Hilos', icon: MessageSquare, ask: null },
  { id: 'pedidos', label: 'Pedidos', icon: Package, ask: 'Muéstrame los pedidos pendientes' },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText, ask: 'Cotizaciones B2B recientes' },
  { id: 'clientes', label: 'Clientes', icon: Users, ask: 'Muéstrame los clientes nuevos' },
];

export default function AgentSidebar({ open, onToggle, onAsk, onNewThread, userEmail, activeThreadId, threadsKey, onSelectThread }) {
  return (
    <aside
      className={`flex-shrink-0 flex flex-col border-r border-ld-border bg-ld-bg-soft/50 backdrop-blur-xl transition-all duration-300 ${
        open ? 'w-56' : 'w-16'
      } hidden md:flex`}
    >
      {/* Logo + collapse */}
      <div className="flex items-center justify-between h-16 px-3 border-b border-ld-border">
        {open && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-ld-action-soft flex items-center justify-center text-lg flex-shrink-0">🐢</span>
            <span className="font-bold text-ld-fg truncate">PEYU</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-9 h-9 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted hover:text-ld-fg transition-colors flex-shrink-0"
          aria-label={open ? 'Colapsar' : 'Expandir'}
        >
          {open ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeft className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* Nuevo hilo */}
      <div className="p-3">
        <button
          onClick={onNewThread}
          className={`ld-btn-primary w-full rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${open ? 'px-3 py-2.5' : 'p-2.5'}`}
        >
          <MessageSquare className="w-4 h-4" />
          {open && 'Nuevo hilo'}
        </button>
      </div>

      {/* Accesos rápidos */}
      <nav className="px-3 space-y-1">
        {QUICK.filter((q) => q.ask).map((q) => (
          <button
            key={q.id}
            onClick={() => onAsk?.(q.ask)}
            className={`w-full flex items-center gap-3 rounded-xl text-sm text-ld-fg-soft hover:bg-ld-bg-elevated hover:text-ld-fg transition-colors ${open ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
            title={q.label}
          >
            <q.icon className="w-4.5 h-4.5 flex-shrink-0 text-ld-fg-muted" />
            {open && q.label}
          </button>
        ))}
      </nav>

      {/* Hilos guardados de este admin */}
      <div className="flex-1 overflow-hidden mt-3">
        {open && (
          <AgentThreadsList
            userEmail={userEmail}
            activeId={activeThreadId}
            refreshKey={threadsKey}
            onSelect={onSelectThread}
          />
        )}
      </div>

      {open && (
        <div className="p-3 text-[11px] text-ld-fg-subtle italic border-t border-ld-border">
          Hasta que el plástico deje de ser basura
        </div>
      )}
    </aside>
  );
}