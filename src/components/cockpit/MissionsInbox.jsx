import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Target, ChevronRight, CheckCircle2 } from 'lucide-react';

/**
 * MissionsInbox — inbox priorizado de decisiones humanas (co-pilot híbrido).
 */
const PRIORITY = {
  critical: { label: 'CRÍTICO', border: 'border-l-red-400', bg: 'hover:bg-red-500/5', dot: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]', text: 'text-red-300' },
  high: { label: 'ALTO', border: 'border-l-amber-400', bg: 'hover:bg-amber-500/5', dot: 'bg-amber-400', text: 'text-amber-300' },
  medium: { label: 'MEDIO', border: 'border-l-blue-400', bg: 'hover:bg-blue-500/5', dot: 'bg-blue-400', text: 'text-blue-300' },
};

const TYPE_ICON = {
  price_suggestion: '💰',
  hot_lead: '🔥',
  stale_proposal: '📄',
  new_order: '🛒',
  shipment_exception: '🚚',
  low_stock: '📦',
  stale_inquiry: '💬',
  negative_review: '⭐',
};

export default function MissionsInbox() {
  const [data, setData] = useState({ missions: [], by_priority: {}, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const res = await base44.functions.invoke('cockpitMissions', {});
      const payload = res?.data || {};
      if (payload.missions !== undefined) {
        setData(payload);
        setError(null);
      } else if (payload.error) {
        setError(payload.error);
      }
    } catch (e) {
      console.warn('Missions error:', e);
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

  const missions = (data.missions || []).filter(m => filter === 'all' || m.priority === filter);

  return (
    <div className="bg-gradient-to-br from-slate-950/80 to-amber-950/20 backdrop-blur-md rounded-2xl border border-amber-400/20 shadow-xl flex flex-col h-[420px] lg:h-[520px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-amber-500/5 border-b border-amber-400/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-amber-300" />
          <h3 className="text-[11px] font-bold tracking-[0.2em] text-white">MISSIONS</h3>
          <span className="text-[9px] text-amber-300/60 font-mono">· require_decision</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-mono">
          {[
            { k: 'all', l: 'all', n: data.total || 0, c: 'text-white' },
            { k: 'critical', l: 'crit', n: data.by_priority?.critical || 0, c: 'text-red-300' },
            { k: 'high', l: 'high', n: data.by_priority?.high || 0, c: 'text-amber-300' },
            { k: 'medium', l: 'med', n: data.by_priority?.medium || 0, c: 'text-blue-300' },
          ].map(b => (
            <button
              key={b.k}
              onClick={() => setFilter(b.k)}
              className={`px-2 py-0.5 rounded transition tracking-wider ${
                filter === b.k ? 'bg-white/10 text-white' : `${b.c} opacity-50 hover:opacity-100`
              }`}
            >
              {b.l}·{b.n}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar-light">
        {loading ? (
          <div className="flex items-center justify-center h-full text-amber-300/50">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-xs font-mono">scanning...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-300/70 px-4 text-center">
            <span className="text-xs font-mono mb-1">⚠ missions_offline</span>
            <span className="text-[10px] text-white/40 font-mono">{error}</span>
          </div>
        ) : missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/40 px-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/40 mb-2" />
            <p className="text-sm font-medium text-white/60">Inbox limpio</p>
            <p className="text-[10px] mt-1 text-white/40 font-mono">all_systems_nominal · agents_running_autonomous</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {missions.map((m) => {
              const cfg = PRIORITY[m.priority] || PRIORITY.medium;
              return (
                <Link
                  key={m.id}
                  to={m.action_target}
                  className={`flex items-start gap-2.5 p-3 border-l-2 ${cfg.border} ${cfg.bg} transition group`}
                >
                  <span className="text-lg leading-none mt-0.5">{TYPE_ICON[m.type] || '⚡'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                      <span className={`text-[8px] font-mono tracking-widest ${cfg.text}`}>{cfg.label}</span>
                      <span className="text-[8px] text-white/30 font-mono">·</span>
                      <span className="text-[9px] text-white/45 font-mono">{m.agent}</span>
                    </div>
                    <p className="text-xs text-white font-medium leading-tight">{m.title}</p>
                    <p className="text-[10px] text-white/55 leading-tight mt-0.5 line-clamp-2">{m.subtitle}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] text-amber-300/80 font-mono group-hover:text-amber-200">{m.action_label}</span>
                    <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}