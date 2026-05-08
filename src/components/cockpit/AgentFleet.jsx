import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, ArrowRight, Cpu, Activity } from 'lucide-react';

/**
 * AgentFleet — flota de agentes IA como "empleados sintéticos".
 * Filosofía 2026: cada agente es un colega digital con KPIs propios.
 */
const STATUS_CONFIG = {
  active: { label: 'ACTIVO', dot: 'bg-emerald-400', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.6)]', text: 'text-emerald-400' },
  idle: { label: 'EN REPOSO', dot: 'bg-slate-500', glow: '', text: 'text-slate-400' },
  warning: { label: 'ATENCIÓN', dot: 'bg-amber-400 animate-pulse', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.6)]', text: 'text-amber-400' },
  awaiting_approval: { label: 'ESPERA HUMANA', dot: 'bg-violet-400 animate-pulse', glow: 'shadow-[0_0_8px_rgba(167,139,250,0.6)]', text: 'text-violet-400' },
};

const relativeTime = (date) => {
  if (!date) return null;
  const min = (Date.now() - new Date(date).getTime()) / 60000;
  if (min < 1) return 'ahora';
  if (min < 60) return `${Math.floor(min)}m`;
  if (min < 1440) return `${Math.floor(min / 60)}h`;
  return `${Math.floor(min / 1440)}d`;
};

export default function AgentFleet() {
  const [data, setData] = useState({ fleet: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await base44.functions.invoke('cockpitAgentFleet', {});
      const payload = res?.data || {};
      if (payload.fleet?.length > 0) {
        setData(payload);
        setError(null);
      } else if (payload.error) {
        setError(payload.error);
      }
    } catch (e) {
      console.warn('AgentFleet error:', e);
      setError(e?.response?.data?.error || e?.message || 'load_failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const summary = data.summary || {};
  const fleet = data.fleet || [];

  return (
    <div className="bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-violet-950/30 backdrop-blur-md rounded-2xl border border-violet-400/20 shadow-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/5 border-b border-violet-400/10">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-violet-300" />
          <h3 className="text-[11px] font-bold tracking-[0.2em] text-white">AGENT FLEET</h3>
          <span className="text-[9px] text-violet-300/60 font-mono">· {fleet.length} synthetic_workers</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          {summary.active > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" /> {summary.active} ON
            </span>
          )}
          {summary.warnings > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1 h-1 rounded-full bg-amber-400" /> {summary.warnings} WARN
            </span>
          )}
          {summary.awaiting_approval > 0 && (
            <span className="flex items-center gap-1 text-violet-400">
              <span className="w-1 h-1 rounded-full bg-violet-400" /> {summary.awaiting_approval} APPROVAL
            </span>
          )}
          <span className="text-cyan-300/70">${(summary.total_cost_today || 0).toFixed(3)}/día</span>
          <span className="text-white/40">{summary.total_calls_today || 0} calls</span>
        </div>
      </div>

      {/* Fleet grid */}
      {loading && fleet.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-violet-300/50">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-xs font-mono">booting fleet...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-32 text-red-300/70 px-4 text-center">
          <span className="text-xs font-mono mb-1">⚠ fleet_offline</span>
          <span className="text-[10px] text-white/40 font-mono">{error}</span>
        </div>
      ) : fleet.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-white/40">
          <span className="text-xs font-mono">no_agents_registered</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {fleet.map((agent) => {
            const cfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
            return (
              <Link
                key={agent.id}
                to={agent.link || '/admin'}
                className="p-3 hover:bg-white/[0.03] transition-all group relative border-r border-b border-white/5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center text-base shadow-lg shrink-0`}>
                      {agent.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white leading-tight truncate">{agent.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.glow}`} />
                        <span className={`text-[8px] font-mono tracking-wider ${cfg.text}`}>{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition" />
                </div>
                <p className="text-[10px] text-white/50 mb-2 line-clamp-1 font-mono">{agent.role}</p>
                <div className="space-y-0.5 border-t border-white/5 pt-2">
                  {agent.kpis.slice(0, 3).map((k, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-white/45 truncate font-mono">{k.label}</span>
                      <span className="text-white/95 font-bold font-poppins ml-2 tabular-nums">{k.value}</span>
                    </div>
                  ))}
                </div>
                {agent.last_action && (
                  <div className="mt-1.5 text-[9px] text-white/30 font-mono flex items-center gap-1">
                    <Activity className="w-2 h-2" /> {relativeTime(agent.last_action)}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}