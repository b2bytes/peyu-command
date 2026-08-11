import { Inbox, KanbanSquare, Users, FileText, GraduationCap, Globe, TrendingDown } from 'lucide-react';

const TABS = [
  { id: 'inbox', label: 'Bandeja', icon: Inbox },
  { id: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
  { id: 'webchat', label: 'Chat web', icon: Globe },
  { id: 'analitica', label: 'Análisis', icon: TrendingDown },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'plantillas', label: 'Plantillas', icon: FileText },
  { id: 'bloques', label: 'Entrenamiento', icon: GraduationCap },
];

// Selector de vista del WhatsApp Studio. Compacto en el header (desktop) y
// full-width bajo el header en mobile.
export default function WhatsAppViewTabs({ view, onChange, variant = 'desktop' }) {
  const mobile = variant === 'mobile';
  return (
    <div
      className={mobile ? 'flex items-center gap-1.5 w-full overflow-x-auto scrollbar-hide' : 'flex items-center gap-0.5 p-0.5 rounded-full flex-shrink-0'}
      style={mobile ? undefined : { background: 'rgba(255,255,255,.06)' }}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const on = view === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`inline-flex items-center justify-center gap-1 rounded-full font-bold transition-all ${
              mobile ? 'flex-shrink-0 px-3 py-2 text-[11px] peyu-tap-sm' : 'px-3 py-1.5 text-[11px]'
            } ${
              on
                ? mobile ? 'bg-white/15 text-white' : 'bg-white text-[#075E54] shadow-sm'
                : mobile ? 'text-white/40' : 'text-white/60 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}