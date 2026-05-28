// ============================================================================
// SocialStudioHero · Ultra-compact KPI strip (2027 trend)
// Una sola fila: título izq + 4 KPIs inline + CTA derecha
// ============================================================================
import { Sparkles, Clock, Check, Send, Image as ImageIcon, ArrowRight } from 'lucide-react';

export default function SocialStudioHero({ stats, onPendientesClick }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-3 flex-wrap">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="ld-display text-base lg:text-lg text-ld-fg tracking-tight leading-none">
            Social Studio
          </h1>
          <p className="text-ld-fg-muted text-[10px] mt-0.5 leading-none hidden sm:block">
            IG · LI · FB · TikTok
          </p>
        </div>
      </div>

      {/* KPI strip inline */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <KPIPill value={stats.pendientes} label="Revisión" color="amber" icon={Clock} urgent={stats.pendientes > 5} />
        <KPIPill value={stats.aprobados} label="Listos" color="emerald" icon={Check} />
        <KPIPill value={stats.publicados_hoy} label="Hoy" color="rose" icon={Send} />
        <KPIPill value={stats.total} label="Total" color="cyan" icon={ImageIcon} />
      </div>

      {/* CTA compacto */}
      {stats.pendientes > 0 && (
        <button
          onClick={onPendientesClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 border border-amber-400/30 hover:border-amber-400/60 text-amber-200 transition-all"
        >
          <span className="relative flex w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center">
            <span className="text-[9px] font-black text-white leading-none">{stats.pendientes}</span>
          </span>
          Revisar
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function KPIPill({ value, label, color, icon: Icon, urgent }) {
  const colors = {
    amber:   { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/20', icon: 'text-amber-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
    rose:    { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/20', icon: 'text-rose-400' },
    cyan:    { bg: 'bg-cyan-500/10', text: 'text-cyan-300', border: 'border-cyan-500/20', icon: 'text-cyan-400' },
  };
  const c = colors[color];
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${c.bg} border ${c.border} ${urgent ? 'ring-1 ring-amber-400/40' : ''}`}>
      <Icon className={`w-3 h-3 ${c.icon} flex-shrink-0`} />
      <span className={`text-sm font-bold ${c.text} leading-none`}>{value}</span>
      <span className="text-[9px] text-white/40 leading-none hidden lg:inline">{label}</span>
    </div>
  );
}