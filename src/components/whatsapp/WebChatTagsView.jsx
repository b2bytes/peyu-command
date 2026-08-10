import { useState } from 'react';
import { MessageSquare, Building2, Mail, Phone } from 'lucide-react';
import { WEB_STAGES, clasificarChatLead } from '@/lib/webchat-pipeline';

// ════════════════════════════════════════════════════════════════════════
// Vista de etiquetas: todas las conversaciones del vendedor Peyu en una
// sola lista, cada una con su etiqueta de etapa del pipeline. Los chips de
// arriba filtran por etiqueta (ej: ver solo los clientes nuevos).
// ════════════════════════════════════════════════════════════════════════
export default function WebChatTagsView({ leads, onOpen }) {
  const [filtro, setFiltro] = useState('todos');

  const conEtiqueta = leads.map((l) => ({ lead: l, etapa: clasificarChatLead(l) }));
  const visibles = conEtiqueta
    .filter((x) => filtro === 'todos' || x.etapa === filtro)
    .sort((a, b) => new Date(b.lead.ultimo_mensaje_at || b.lead.created_date || 0) - new Date(a.lead.ultimo_mensaje_at || a.lead.created_date || 0));

  const chips = [
    { id: 'todos', label: 'Todas', color: '#94A3B8', count: conEtiqueta.length },
    ...WEB_STAGES.map((s) => ({ ...s, count: conEtiqueta.filter((x) => x.etapa === s.id).length })),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chips de etiquetas */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-ld-border">
        {chips.map((c) => {
          const on = filtro === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFiltro(c.id)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all peyu-tap-sm"
              style={on
                ? { background: c.color, color: '#fff' }
                : { background: `${c.color}18`, color: c.color, border: `1px solid ${c.color}30` }}
            >
              {c.label}
              <span className="opacity-70">{c.count}</span>
            </button>
          );
        })}
      </div>

      {/* Lista etiquetada */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 peyu-scrollbar">
        {visibles.map(({ lead, etapa }) => {
          const stage = WEB_STAGES.find((s) => s.id === etapa);
          const identificado = !!(lead.nombre || lead.empresa);
          const nombre = lead.nombre || lead.empresa || `Sin identificar · ${String(lead.conversation_id || '').slice(-5)}`;
          const cuando = lead.ultimo_mensaje_at || lead.created_date;
          return (
            <button
              key={lead.id}
              onClick={() => onOpen(lead)}
              className="w-full text-left rounded-xl p-2.5 flex items-center gap-3 transition-all hover:brightness-105"
              style={{ background: 'var(--ld-bg-elevated)', border: '1px solid var(--ld-border)' }}
            >
              <span className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full w-[120px] text-center truncate"
                style={{ background: `${stage.color}1A`, color: stage.color }}>
                {stage.label}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[12px] font-bold truncate ${identificado ? 'text-ld-fg' : 'text-ld-fg-muted italic'}`}>{nombre}</p>
                <p className="text-[10px] text-ld-fg-muted truncate">
                  {lead.ultimo_mensaje_preview || lead.producto_interes_nombre || 'Sin mensajes guardados'}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0 text-[9px] text-ld-fg-subtle">
                {lead.empresa && <span className="inline-flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" />{lead.empresa}</span>}
                {lead.email && <span className="inline-flex items-center gap-0.5 max-w-[150px] truncate"><Mail className="w-2.5 h-2.5" />{lead.email}</span>}
                {lead.telefono && <span className="inline-flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{lead.telefono}</span>}
                <span className="inline-flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{lead.mensajes_count || 0}</span>
                <span className="w-[74px] text-right">
                  {cuando ? new Date(cuando).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : ''}
                </span>
              </div>
            </button>
          );
        })}
        {visibles.length === 0 && (
          <p className="text-[11px] text-ld-fg-subtle text-center py-10">No hay conversaciones con esta etiqueta.</p>
        )}
      </div>
    </div>
  );
}