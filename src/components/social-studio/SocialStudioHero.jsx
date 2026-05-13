// ============================================================================
// SocialStudioHero · KPIs vivos al estilo 2027
// Big numbers, sparkline mood, glassmorphic cards
// ============================================================================
import { Sparkles, Clock, Check, Send, Image as ImageIcon, ArrowRight } from 'lucide-react';

export default function SocialStudioHero({ stats, onPendientesClick }) {
  return (
    <div className="flex-shrink-0">
      {/* Título + KPIs en una sola fila — más fluido, menos vertical */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg lg:text-xl font-poppins font-black text-white tracking-tight leading-none">
                Social Studio
              </h1>
              <span className="text-[9px] text-white/30 font-mono">v2027.05</span>
            </div>
            <p className="text-white/45 text-[11px] mt-1 leading-tight">
              Genera, aprueba y publica para IG · LI · FB · TikTok
            </p>
          </div>
        </div>

        {/* CTA inteligente — solo aparece si hay cola */}
        {stats.pendientes > 0 && (
          <button
            onClick={onPendientesClick}
            className="group relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-gradient-to-br from-amber-400/15 to-orange-500/15 border border-amber-300/30 hover:border-amber-300/60 transition-all"
          >
            <span className="relative flex w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center shadow-md shadow-amber-500/30">
              <Clock className="w-3.5 h-3.5 text-white" />
              <span className="absolute -top-1 -right-1 px-1 py-px rounded-full text-[9px] font-black bg-white text-orange-600 leading-none">
                {stats.pendientes}
              </span>
            </span>
            <div className="text-left">
              <p className="text-[9px] uppercase tracking-wider text-amber-200/70 font-bold leading-none">Esperando aprobación</p>
              <p className="text-xs font-bold text-white leading-tight mt-0.5">Revisar cola →</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-amber-200 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Stat bar · 4 KPIs compactos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatCard
          label="En revisión"
          value={stats.pendientes}
          icon={Clock}
          accent="from-amber-400 to-orange-500"
          glow="amber"
          urgent={stats.pendientes > 5}
        />
        <StatCard
          label="Aprobados · listos"
          value={stats.aprobados}
          icon={Check}
          accent="from-emerald-400 to-teal-500"
          glow="emerald"
        />
        <StatCard
          label="Publicados hoy"
          value={stats.publicados_hoy}
          icon={Send}
          accent="from-pink-500 to-violet-500"
          glow="pink"
        />
        <StatCard
          label="Total piezas"
          value={stats.total}
          icon={ImageIcon}
          accent="from-cyan-400 to-blue-500"
          glow="cyan"
          subtitle="Histórico"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent, glow, urgent, subtitle }) {
  const glows = {
    amber:   'shadow-amber-500/20',
    emerald: 'shadow-emerald-500/20',
    pink:    'shadow-pink-500/20',
    cyan:    'shadow-cyan-500/20',
  };
  return (
    <div className={`group relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2.5 overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.06] ${urgent ? 'ring-1 ring-amber-300/40' : ''}`}>
      <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-wider text-white/45 font-bold leading-none mb-1">{label}</p>
          <p className={`text-2xl font-poppins font-black bg-gradient-to-br ${accent} bg-clip-text text-transparent leading-none`}>
            {value}
          </p>
          {subtitle && <p className="text-[9px] text-white/35 mt-1 leading-none">{subtitle}</p>}
          {urgent && (
            <p className="text-[9px] text-amber-300 mt-1 font-medium flex items-center gap-1 leading-none">
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
              Atención
            </p>
          )}
        </div>
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center shadow-md ${glows[glow]} flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}