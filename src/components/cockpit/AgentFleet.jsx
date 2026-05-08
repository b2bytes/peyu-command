import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, ArrowRight, Cpu } from 'lucide-react';

/**
 * AgentFleet — flota de agentes IA como "empleados sintéticos".
 * Filosofía 2026: cada agente es un colega digital con KPIs propios.
 */
const STATUS_CONFIG = {
  active: { dot: 'bg-emerald-400', label: 'Activo', ring: 'ring-emerald-400/40' },
  idle: { dot: 'bg-slate-400', label: 'En reposo', ring: 'ring-slate-400/30' },
  warning: { dot: 'bg-amber-400 animate-pulse', label: 'Atención', ring: 'ring-amber-400/40' },
  awaiting_approval: { dot: 'bg-violet-400 animate-pulse', label: 'Espera aprobación', ring: 'ring-violet-400/40' },
};

const relativeTime = (date) => {
  if (!date) return null;
  const min = (Date.now() - new Date(date).getTime()) / 60000;
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${Math.floor(min)}m`;
  if (min < 1440) return `hace ${Math.floor(min / 60)}h`;
  return `hace ${Math.floor(min / 1440)}d`;
};

export default function AgentFleet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await base44.functions.invoke('cockpitAgentFleet', {});
      setData(res?.data || { fleet: [], summary: {} });
    } catch (e) {
      console.warn('AgentFleet:', e);
      setData({ fleet: [], summary: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const summary = data?.summary || {};

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-violet-950/40 backdrop-blur-md rounded-2xl border border-violet-400/20 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-violet-300" />
          <h3 className="font-poppins font-semibold text-white text-sm">FLOTA DE AGENTES IA</h3>
          <span className="text-[10px] text-violet-300/70">· {summary.total_agents || 0} empleados sintéticos</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-emerald-300">● {summary.active || 0} activos</span>
          {summary.warnings > 0 && <span className="text-amber-300">● {summary.warnings} atención</span>}
          {summary.awaiting_approval > 0 && <span className="text-violet-300">● {summary.awaiting_approval} en espera</span>}
          <span className="text-cyan-300/70 font-mono">${(summary.total_cost_today || 0).toFixed(3)} hoy</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-violet-300/60">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {(data?.fleet || []).map((agent) => {
            const cfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle;
            return (
              <Link
                key={agent.id}
                to={agent.link || '/admin'}
                className={`bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl p-3 transition-all group ring-1 ${cfg.ring}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center text-base shadow-lg`}>
                      {agent.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white leading-tight">{agent.name}</p>
                      <p className="text-[9px] text-white/50 leading-tight">{cfg.label}</p>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot} mt-1.5`} />
                </div>
                <p className="text-[10px] text-white/60 mb-2 line-clamp-1">{agent.role}</p>
                <div className="space-y-1">
                  {agent.kpis.slice(0, 3).map((k, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-white/50 truncate">{k.label}</span>
                      <span className="text-white font-bold ml-2">{k.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-white/40">
                  <span>{relativeTime(agent.last_action) || 'sin actividad hoy'}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}