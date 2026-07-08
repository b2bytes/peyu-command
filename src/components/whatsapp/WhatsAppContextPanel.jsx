import { Link } from 'react-router-dom';
import {
  MessageCircle, User, AlertTriangle, TrendingUp,
  Building2, ShoppingBag, Sparkles, ArrowUpRight,
} from 'lucide-react';

const AVATAR_COLORS = ['#128C7E', '#34B7F1', '#FF8C42', '#9C27B0', '#E91E63', '#5C6BC0'];
const avatarColor = (id = '') => AVATAR_COLORS[(id.charCodeAt(id.length - 1) || 0) % AVATAR_COLORS.length];

const STAGE_INFO = {
  nuevo: { label: 'Nuevo', color: '#64748B' },
  explorando: { label: 'Explorando catálogo', color: '#0EA5E9' },
  datos: { label: 'Capturando datos', color: '#8B5CF6' },
  cotizado: { label: 'Cotización B2B', color: '#F59E0B' },
  pago: { label: 'Link de pago', color: '#F97316' },
  convertido: { label: 'Convertido', color: '#10B981' },
  postventa: { label: 'Postventa', color: '#14B8A6' },
  escalado: { label: 'Escalado', color: '#EF4444' },
};

// ════════════════════════════════════════════════════════════════════════
// WhatsAppContextPanel — Columna derecha del cockpit WhatsApp Studio.
// Contexto vivo del cliente seleccionado: identidad, etapa del pipeline,
// badges de estado, stats de actividad y enlace a Social Studio.
// ════════════════════════════════════════════════════════════════════════
export default function WhatsAppContextPanel({ active, etapa, onOpenPipeline }) {
  if (!active) {
    return (
      <div className="p-4">
        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-3 px-0.5">Contexto</p>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white/25" />
          </div>
          <p className="text-xs text-white/40 leading-relaxed">
            Selecciona una conversación para ver el contexto del cliente aquí.
          </p>
        </div>
        <SocialStudioLink />
      </div>
    );
  }

  const nombre = active.metadata?.name || `Cliente ${active.id?.slice(-5)}`;
  const humanMode = active.metadata?.human_takeover === true;
  const escalated = active.metadata?.escalated === true;
  const stageInfo = etapa ? (STAGE_INFO[etapa.etapa] || STAGE_INFO.nuevo) : null;
  const msgCount = active.messages?.length || etapa?.mensajes_count || 0;
  const color = avatarColor(active.id);

  return (
    <div className="p-4 space-y-3">
      <p className="text-[9px] text-white/30 uppercase tracking-wider px-0.5">Contexto del cliente</p>

      {/* ── Client identity card ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md" style={{ background: color }}>
            {nombre.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate leading-tight">{nombre}</p>
            {etapa?.telefono && <p className="text-[10px] text-white/40 truncate mt-0.5">{etapa.telefono}</p>}
          </div>
        </div>
        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {humanMode && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/20">
              <User className="w-2.5 h-2.5" /> Humano
            </span>
          )}
          {escalated && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/20">
              <AlertTriangle className="w-2.5 h-2.5" /> Escalado
            </span>
          )}
          {etapa?.tipo && etapa.tipo !== 'Sin clasificar' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
              {etapa.tipo === 'B2B' ? <Building2 className="w-2.5 h-2.5" /> : <ShoppingBag className="w-2.5 h-2.5" />}
              {etapa.tipo}
            </span>
          )}
          {!humanMode && !escalated && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
              🐢 Agente activo
            </span>
          )}
        </div>
        {etapa?.resumen && (
          <p className="text-[10px] text-white/40 mt-2.5 leading-snug line-clamp-2 italic">"{etapa.resumen}"</p>
        )}
      </div>

      {/* ── Pipeline stage ───────────────────────────────────────────────── */}
      {stageInfo && (
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5">
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Etapa del pipeline</p>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${stageInfo.color}22` }}>
              <TrendingUp className="w-4 h-4" style={{ color: stageInfo.color }} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white leading-tight">{stageInfo.label}</p>
              {etapa?.monto_clp != null && etapa.monto_clp > 0 && (
                <p className="text-[10px] text-white/40 mt-0.5">${etapa.monto_clp.toLocaleString('es-CL')} CLP</p>
              )}
            </div>
          </div>
          {onOpenPipeline && (
            <button onClick={onOpenPipeline} className="mt-2.5 w-full text-[10px] text-white/40 hover:text-white/80 transition-colors text-left">
              Ver en pipeline →
            </button>
          )}
        </div>
      )}

      {/* ── Activity stats ───────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5">
        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Actividad</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-lg font-bold text-white leading-none">{msgCount}</p>
            <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wide">mensajes</p>
          </div>
          {etapa?.ultimo_mensaje_at && (
            <div>
              <p className="text-[11px] font-bold text-white leading-none">
                {new Date(etapa.ultimo_mensaje_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wide">último msg</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Social Studio link ──────────────────────────────────────────── */}
      <SocialStudioLink />
    </div>
  );
}

function SocialStudioLink() {
  return (
    <div>
      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2 px-0.5">Estudio conectado</p>
      <Link
        to="/admin/social-studio"
        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-violet-500/15 to-pink-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-all group text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white leading-tight">Social Studio</p>
          <p className="text-[10px] text-white/40 leading-tight">Centro de comandos</p>
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-violet-400 group-hover:text-violet-300 flex-shrink-0" />
      </Link>
    </div>
  );
}