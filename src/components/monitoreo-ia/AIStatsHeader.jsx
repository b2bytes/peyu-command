// ============================================================================
// AIStatsHeader · KPIs principales del monitoreo de IA
// ----------------------------------------------------------------------------
// Tarjetas con: tokens totales, costo, latencia promedio, tasa de éxito,
// cola de re-entrenamiento y casos pendientes de auditoría.
// ============================================================================
import { Cpu, Coins, Zap, ShieldCheck, AlertTriangle, GraduationCap } from 'lucide-react';

function formatNumber(n = 0) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('es-CL');
}

function StatCard({ icon: Icon, label, value, sub, accent = 'teal', alert }) {
  const accentMap = {
    teal: 'from-teal-500/15 to-cyan-500/10 border-teal-400/25 text-teal-300',
    amber: 'from-amber-500/15 to-yellow-500/10 border-amber-400/25 text-amber-300',
    rose: 'from-rose-500/15 to-pink-500/10 border-rose-400/25 text-rose-300',
    violet: 'from-violet-500/15 to-purple-500/10 border-violet-400/25 text-violet-300',
    emerald: 'from-emerald-500/15 to-teal-500/10 border-emerald-400/25 text-emerald-300',
    slate: 'from-slate-500/10 to-slate-600/10 border-white/15 text-slate-300',
  }[accent];

  return (
    <div className={`bg-gradient-to-br ${accentMap} backdrop-blur-sm border rounded-2xl p-4 relative overflow-hidden`}>
      {alert && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
      )}
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-widest font-jakarta font-bold opacity-80">{label}</span>
      </div>
      <div className="font-jakarta font-extrabold text-2xl text-white leading-none tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-white/50 mt-1.5">{sub}</div>}
    </div>
  );
}

export default function AIStatsHeader({ stats, loading }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[110px] bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const successPct = Math.round((stats.success_rate || 0) * 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        icon={Cpu}
        label="Llamadas"
        value={formatNumber(stats.total_calls)}
        sub={`Ventana ${Math.round((Date.now() - new Date(stats.window?.since).getTime()) / (24 * 3600 * 1000))} días`}
        accent="teal"
      />
      <StatCard
        icon={Zap}
        label="Tokens"
        value={formatNumber(stats.tokens?.total)}
        sub={`${formatNumber(stats.tokens?.input)} in · ${formatNumber(stats.tokens?.output)} out`}
        accent="violet"
      />
      <StatCard
        icon={Coins}
        label="Costo (USD)"
        value={`$${(stats.cost_usd || 0).toFixed(2)}`}
        sub="Estimado por modelos"
        accent="amber"
      />
      <StatCard
        icon={ShieldCheck}
        label="Tasa éxito"
        value={`${successPct}%`}
        sub={`${stats.errors || 0} errores`}
        accent={successPct >= 95 ? 'emerald' : successPct >= 80 ? 'amber' : 'rose'}
      />
      <StatCard
        icon={AlertTriangle}
        label="Pendientes auditar"
        value={formatNumber(stats.pending_review)}
        sub="Sin revisar aún"
        accent={stats.pending_review > 0 ? 'amber' : 'slate'}
        alert={stats.pending_review > 10}
      />
      <StatCard
        icon={GraduationCap}
        label="Cola re-train"
        value={formatNumber(stats.retrain_queue)}
        sub="Casos marcados"
        accent={stats.retrain_queue > 0 ? 'rose' : 'slate'}
        alert={stats.retrain_queue > 0}
      />
    </div>
  );
}