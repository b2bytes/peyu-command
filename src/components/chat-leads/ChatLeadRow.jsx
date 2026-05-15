import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2, User, Calendar, Package, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPO_COLORS = {
  'B2B': 'bg-blue-100 text-blue-700 border-blue-200',
  'B2C': 'bg-pink-100 text-pink-700 border-pink-200',
  'Sin clasificar': 'bg-slate-100 text-slate-600 border-slate-200',
};

const ESTADO_COLORS = {
  'Activo': 'bg-green-100 text-green-700',
  'Calificado': 'bg-amber-100 text-amber-700',
  'Convertido': 'bg-emerald-100 text-emerald-700',
  'Abandonado': 'bg-slate-100 text-slate-500',
  'Descartado': 'bg-red-100 text-red-700',
};

export default function ChatLeadRow({ lead, onClick }) {
  const dataPoints = [
    lead.nombre && { icon: User, value: lead.nombre },
    lead.email && { icon: Mail, value: lead.email },
    lead.telefono && { icon: Phone, value: lead.telefono },
    lead.empresa && { icon: Building2, value: lead.empresa },
    lead.cantidad_estimada && { icon: Package, value: `${lead.cantidad_estimada}u` },
    lead.fecha_requerida && { icon: Calendar, value: lead.fecha_requerida },
  ].filter(Boolean);

  const lastAt = lead.ultimo_mensaje_at
    ? formatDistanceToNow(new Date(lead.ultimo_mensaje_at), { locale: es, addSuffix: true })
    : '—';

  return (
    <button
      onClick={() => onClick(lead)}
      className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${TIPO_COLORS[lead.tipo]} border text-xs font-semibold`}>
            {lead.tipo}
          </Badge>
          <Badge className={`${ESTADO_COLORS[lead.estado]} text-xs`}>
            {lead.estado}
          </Badge>
          <span className="text-[11px] font-bold text-slate-600">
            Score: {lead.score || 0}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0">
          <MessageSquare className="w-3 h-3" />
          {lead.mensajes_count || 0} msgs · {lastAt}
        </div>
      </div>

      {dataPoints.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-2">
          {dataPoints.map((dp, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs text-slate-700">
              <dp.icon className="w-3 h-3 text-slate-400" />
              <span className="font-medium">{dp.value}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic mb-2">
          Sin datos capturados aún · conversación anónima
        </p>
      )}

      {lead.ultimo_mensaje_preview && (
        <p className="text-xs text-slate-500 line-clamp-1 italic">
          "{lead.ultimo_mensaje_preview}"
        </p>
      )}
    </button>
  );
}