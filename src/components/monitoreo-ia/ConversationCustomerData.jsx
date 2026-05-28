// ============================================================================
// ConversationCustomerData · Muestra los datos del cliente capturados durante
// una conversación (ChatLead) junto al log/conversation_id. Da visibilidad
// inmediata de qué tan bien el agente está pidiendo datos.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Mail, Phone, Building2, ShoppingBag, Calendar, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';

const FIELDS = [
  { key: 'nombre',             icon: User,         label: 'Nombre',     points: 20 },
  { key: 'email',              icon: Mail,         label: 'Email',      points: 25 },
  { key: 'telefono',           icon: Phone,        label: 'Teléfono',   points: 25 },
  { key: 'empresa',            icon: Building2,    label: 'Empresa',    points: 15 },
  { key: 'cantidad_estimada',  icon: ShoppingBag,  label: 'Cantidad',   points: 10 },
  { key: 'fecha_requerida',    icon: Calendar,     label: 'Fecha',      points: 5 },
];

export default function ConversationCustomerData({ conversationId }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const arr = await base44.entities.ChatLead.filter({ conversation_id: conversationId });
        if (!alive) return;
        setLead(Array.isArray(arr) && arr.length ? arr[0] : null);
      } catch {
        if (alive) setLead(null);
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [conversationId]);

  if (loading) {
    return (
      <div className="ld-card p-3 text-xs text-ld-fg-muted">Cargando datos del cliente…</div>
    );
  }

  if (!lead) {
    return (
      <div className="ld-card p-4 flex items-center gap-2.5 border-l-4" style={{ borderLeftColor: 'var(--ld-highlight)' }}>
        <AlertCircle className="w-4 h-4" style={{ color: 'var(--ld-highlight)' }} />
        <p className="text-xs text-ld-fg">
          <strong>Sin lead capturado.</strong> El agente no extrajo ningún dato del cliente en esta conversación.
        </p>
      </div>
    );
  }

  const captured = FIELDS.filter(f => lead[f.key]);
  const missing = FIELDS.filter(f => !lead[f.key]);
  const score = lead.score || 0;
  const scoreColor = score >= 60 ? 'var(--ld-action)' : score >= 30 ? 'var(--ld-highlight)' : '#ef4444';

  return (
    <div className="ld-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: scoreColor }} />
          <p className="text-xs font-bold text-ld-fg uppercase tracking-wider">Datos del cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-ld-fg-muted font-bold">Score</p>
            <p className="text-lg font-black leading-none" style={{ color: scoreColor }}>{score}<span className="text-xs text-ld-fg-muted">/100</span></p>
          </div>
          {lead.tipo && (
            <span
              className="px-2 py-1 rounded-full text-[10px] font-bold border"
              style={{
                background: lead.tipo === 'B2B' ? '#ede9fe' : lead.tipo === 'B2C' ? '#e0f2fe' : 'var(--ld-bg-soft)',
                color: lead.tipo === 'B2B' ? '#5b21b6' : lead.tipo === 'B2C' ? '#0c4a6e' : 'var(--ld-fg-muted)',
                borderColor: 'var(--ld-border)',
              }}
            >
              {lead.tipo}
            </span>
          )}
        </div>
      </div>

      {/* Datos capturados */}
      {captured.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {captured.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--ld-action-soft)' }}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--ld-action)' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-wider text-ld-fg-muted font-bold leading-none">{f.label}</p>
                  <p className="text-xs font-semibold text-ld-fg truncate mt-0.5">{String(lead[f.key])}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Datos pendientes */}
      {missing.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ld-fg-muted font-bold mb-1.5">El agente NO pidió:</p>
          <div className="flex flex-wrap gap-1">
            {missing.map(f => {
              const Icon = f.icon;
              return (
                <span key={f.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-ld-bg-soft border border-ld-border text-ld-fg-muted">
                  <Icon className="w-2.5 h-2.5" /> {f.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-ld-border text-[10px] text-ld-fg-muted">
        <span>{lead.mensajes_count || 0} mensajes</span>
        <a href="/admin/chat-leads" className="inline-flex items-center gap-1 font-semibold hover:underline" style={{ color: 'var(--ld-action)' }}>
          Ver en ChatLeads <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}