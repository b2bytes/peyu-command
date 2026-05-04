// ============================================================================
// FunnelTimeline · Línea de tiempo cronológica de eventos del embudo
// ----------------------------------------------------------------------------
// Recibe un array `historial[]` (formato común: { at, type, actor, channel,
// detail, meta }) y lo renderiza como timeline visual. Reutilizable para
// B2BLead, PedidoWeb y CorporateProposal.
// ============================================================================
import {
  Plus, Mail, Eye, Bell, CheckCircle2, XCircle, Clock, AlertTriangle,
  Package, Truck, Hammer, Star, MessageSquare, Sparkles, FileText, Send,
} from 'lucide-react';

const TYPE_CONFIG = {
  // Genéricos
  created:           { icon: Plus,         color: 'bg-blue-500/15 text-blue-300 border-blue-400/30',     label: 'Creado' },
  status_changed:    { icon: Bell,         color: 'bg-slate-500/15 text-slate-300 border-slate-400/30', label: 'Cambio de estado' },
  note:              { icon: MessageSquare,color: 'bg-slate-500/15 text-slate-300 border-slate-400/30', label: 'Nota' },

  // B2BLead / Propuesta
  contacted:         { icon: MessageSquare,color: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30', label: 'Contactado' },
  scored:            { icon: Sparkles,     color: 'bg-amber-500/15 text-amber-300 border-amber-400/30',    label: 'Score IA' },
  mockup_generated:  { icon: Sparkles,     color: 'bg-violet-500/15 text-violet-300 border-violet-400/30', label: 'Mockup IA' },
  proposal_created:  { icon: FileText,     color: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',       label: 'Propuesta creada' },
  proposal_sent:     { icon: Send,         color: 'bg-teal-500/15 text-teal-300 border-teal-400/30',       label: 'Propuesta enviada' },
  proposal_viewed:   { icon: Eye,          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', label: 'Propuesta vista' },
  sent:              { icon: Send,         color: 'bg-teal-500/15 text-teal-300 border-teal-400/30',       label: 'Enviada' },
  viewed:            { icon: Eye,          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', label: 'Vista' },
  reminder_sent:     { icon: Bell,         color: 'bg-amber-500/15 text-amber-300 border-amber-400/30',    label: 'Recordatorio' },
  accepted:          { icon: CheckCircle2, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', label: 'Aceptada' },
  rejected:          { icon: XCircle,      color: 'bg-red-500/15 text-red-300 border-red-400/30',          label: 'Rechazada' },
  lost:              { icon: XCircle,      color: 'bg-red-500/15 text-red-300 border-red-400/30',          label: 'Perdido' },
  expired:           { icon: AlertTriangle,color: 'bg-orange-500/15 text-orange-300 border-orange-400/30', label: 'Vencida' },

  // PedidoWeb
  paid:              { icon: CheckCircle2, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', label: 'Pago confirmado' },
  confirmed:         { icon: CheckCircle2, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', label: 'Confirmado' },
  in_production:     { icon: Hammer,       color: 'bg-orange-500/15 text-orange-300 border-orange-400/30',   label: 'En producción' },
  ready_to_ship:     { icon: Package,      color: 'bg-blue-500/15 text-blue-300 border-blue-400/30',         label: 'Listo despacho' },
  shipped:           { icon: Truck,        color: 'bg-blue-500/15 text-blue-300 border-blue-400/30',         label: 'Despachado' },
  delivered:         { icon: CheckCircle2, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30', label: 'Entregado' },
  rated:             { icon: Star,         color: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',   label: 'Calificado' },
  cancelled:         { icon: XCircle,      color: 'bg-red-500/15 text-red-300 border-red-400/30',            label: 'Cancelado' },
  refunded:          { icon: XCircle,      color: 'bg-red-500/15 text-red-300 border-red-400/30',            label: 'Reembolsado' },
  email_sent:        { icon: Mail,         color: 'bg-teal-500/15 text-teal-300 border-teal-400/30',         label: 'Email' },
  tracking_added:    { icon: Truck,        color: 'bg-blue-500/15 text-blue-300 border-blue-400/30',         label: 'Tracking' },
};

const FALLBACK = { icon: Clock, color: 'bg-slate-500/15 text-slate-300 border-slate-400/30', label: 'Evento' };

function formatRelative(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'recién';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `hace ${diffD} d`;
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FunnelTimeline({ historial = [], emptyText = 'Sin eventos registrados todavía.' }) {
  if (!Array.isArray(historial) || historial.length === 0) {
    return (
      <div className="text-center py-8 text-white/40 text-sm italic border border-dashed border-white/10 rounded-xl">
        {emptyText}
      </div>
    );
  }

  // Orden cronológico inverso (más reciente arriba)
  const ordered = [...historial].sort((a, b) => {
    const ta = a?.at ? new Date(a.at).getTime() : 0;
    const tb = b?.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });

  return (
    <ol className="relative border-l border-white/10 ml-3 space-y-4 py-1">
      {ordered.map((evt, idx) => {
        const cfg = TYPE_CONFIG[evt?.type] || FALLBACK;
        const Icon = cfg.icon;
        const isoTitle = evt?.at ? new Date(evt.at).toLocaleString('es-CL') : '';
        return (
          <li key={idx} className="ml-4">
            <span
              className={`absolute -left-[13px] mt-1 w-6 h-6 rounded-full border flex items-center justify-center ${cfg.color}`}
              aria-hidden="true"
            >
              <Icon className="w-3 h-3" strokeWidth={2.2} />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-[13px] font-semibold text-white">{cfg.label}</p>
              <p className="text-[11px] text-white/40" title={isoTitle}>{formatRelative(evt?.at)}</p>
              {evt?.channel && evt.channel !== 'system' && (
                <span className="text-[10px] uppercase tracking-wider text-white/30">· {evt.channel}</span>
              )}
            </div>
            {evt?.detail && (
              <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{evt.detail}</p>
            )}
            {evt?.actor && evt.actor !== 'system' && (
              <p className="text-[10px] text-white/30 mt-0.5">por {evt.actor}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}