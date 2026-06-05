import { MessageSquare, Package, FileText, Users, X } from 'lucide-react';

// Drawer móvil del Agent OS: overlay a pantalla completa con los mismos
// accesos rápidos del sidebar. Cada acción dispara una pregunta al agente y
// cierra el drawer. Soluciona el "modo agente" en móvil (antes el botón ☰ no
// abría nada y la pantalla quedaba en negro).
const QUICK = [
  { id: 'pedidos', label: 'Pedidos pendientes', icon: Package, ask: 'Muéstrame los pedidos pendientes' },
  { id: 'cotizaciones', label: 'Cotizaciones B2B', icon: FileText, ask: 'Cotizaciones B2B recientes' },
  { id: 'clientes', label: 'Clientes nuevos', icon: Users, ask: 'Muéstrame los clientes nuevos' },
];

export default function AgentMobileDrawer({ open, onClose, onAsk, onNewThread }) {
  if (!open) return null;

  const handleAsk = (q) => { onAsk?.(q); onClose?.(); };

  return (
    <div className="md:hidden fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel deslizante */}
      <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[82vw] bg-ld-bg-soft border-r border-ld-border flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between h-16 px-4 border-b border-ld-border">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-ld-action-soft flex items-center justify-center text-lg">🐢</span>
            <span className="font-bold text-ld-fg">PEYU · Agent OS</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => { onNewThread?.(); onClose?.(); }}
            className="ld-btn-primary w-full rounded-xl text-sm font-medium flex items-center justify-center gap-2 px-3 py-3"
          >
            <MessageSquare className="w-4 h-4" /> Nuevo hilo
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {QUICK.map((q) => (
            <button
              key={q.id}
              onClick={() => handleAsk(q.ask)}
              className="w-full flex items-center gap-3 rounded-xl text-sm text-ld-fg-soft hover:bg-ld-bg-elevated hover:text-ld-fg transition-colors px-3 py-3"
            >
              <q.icon className="w-5 h-5 flex-shrink-0 text-ld-fg-muted" />
              {q.label}
            </button>
          ))}
        </nav>

        <div className="p-4 text-[11px] text-ld-fg-subtle italic border-t border-ld-border">
          Hasta que el plástico deje de ser basura
        </div>
      </aside>
    </div>
  );
}