// ============================================================================
// SocialStudioHero · KPIs vivos al estilo 2027
// Big numbers, sparkline mood, glassmorphic cards
// ============================================================================
import { Sparkles, Clock, Check, Send, Image as ImageIcon, ArrowRight } from 'lucide-react';

export default function SocialStudioHero({ stats, onPendientesClick }) {
  return (
    <div className="flex-shrink-0">
      {/* Título + acción rápida */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-violet-500/20 border border-pink-400/30 text-[10px] font-bold text-pink-200 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Studio
            </span>
            <span className="text-[10px] text-white/40 font-mono">v2027.05</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-poppins font-black text-white tracking-tight leading-none">
            Social Studio
          </h1>
          <p className="text-white/55 text-xs lg:text-sm mt-1.5 max-w-xl">
            Genera, aprueba y publica visuales para Instagram, LinkedIn, Facebook y TikTok desde un solo lugar.
          </p>
        </div>

        {/* CTA inteligente — solo aparece si hay cola */}
        {stats.pendientes > 0 && (
          <button
            onClick={onPendientesClick}
            className="group relative flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-2xl bg-gradient-to-br from-amber-400/15 to-orange-500/15 border border-amber-300/30 hover:border-amber-300/60 transition-all"
          >
            <span className="relative flex w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center shadow-lg shadow-amber-500/30">
              <Clock className="w-4 h-4 text-white" />
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white text-orange-600">
                {stats.pendientes}
              </span>
            </span>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-amber-200/70 font-bold">Esperando tu visto bueno</p>
              <p className="text-sm font-bold text-white leading-tight">Revisar cola →</p>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-200 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Stat bar · 4 KPIs grandes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
    <div className={`group relative bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.06] ${urgent ? 'ring-1 ring-amber-300/40' : ''}`}>
      {/* Acento gradient sutil */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold mb-1">{label}</p>
          <p className={`text-4xl font-poppins font-black bg-gradient-to-br ${accent} bg-clip-text text-transparent leading-none`}>
            {value}
          </p>
          {subtitle && <p className="text-[10px] text-white/40 mt-1.5">{subtitle}</p>}
          {urgent && (
            <p className="text-[10px] text-amber-300 mt-1.5 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Requiere atención
            </p>
          )}
        </div>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg ${glows[glow]} flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}