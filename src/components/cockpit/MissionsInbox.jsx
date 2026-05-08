import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, Target, AlertTriangle, ArrowUpRight, ChevronRight } from 'lucide-react';

/**
 * MissionsInbox — la bandeja de misiones que requieren decisión humana.
 * Cada misión = una propuesta de un agente IA esperando aprobación / acción.
 * Filosofía co-pilot híbrido.
 */
const PRIORITY = {
  critical: { label: 'CRÍTICO', color: 'border-red-400/60 bg-red-500/10', dot: 'bg-red-400 animate-pulse', text: 'text-red-300' },
  high: { label: 'ALTO', color: 'border-amber-400/40 bg-amber-500/10', dot: 'bg-amber-400', text: 'text-amber-300' },
  medium: { label: 'MEDIO', color: 'border-blue-400/40 bg-blue-500/10', dot: 'bg-blue-400', text: 'text-blue-300' },
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const res = await base44.functions.invoke('cockpitMissions', {});
      setData(res?.data || { missions: [], by_priority: {} });
    } catch (e) {
      console.warn('Missions:', e);
      setData({ missions: [], by_priority: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const missions = (data?.missions || []).filter(m => filter === 'all' || m.priority === filter);

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-amber-950/30 backdrop-blur-md rounded-2xl border border-amber-400/20 p-4 shadow-xl flex flex-col h-[480px]">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-300" />
          <h3 className="font-poppins font-semibold text-white text-sm">MISIONES</h3>
          <span className="text-[10px] text-amber-300/70">· requieren tu decisión</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          {[
            { k: 'all', l: 'Todas', n: data?.total || 0 },
            { k: 'critical', l: 'Crítico', n: data?.by_priority?.critical || 0, c: 'text-red-300' },
            { k: 'high', l: 'Alto', n: data?.by_priority?.high || 0, c: 'text-amber-300' },
          ].map(b => (
            <button
              key={b.k}
              onClick={() => setFilter(b.k)}
              className={`px-2 py-0.5 rounded-full transition ${
                filter === b.k ? 'bg-white/15 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
              } ${b.c || ''}`}
            >
              {b.l} {b.n > 0 && <span className="opacity-70">({b.n})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar-light pr-1 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-amber-300/60">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/40 text-sm">
            <span className="text-3xl mb-2">🎯</span>
            <p>Sin misiones pendientes</p>
            <p className="text-[10px] mt-1">Tu flota tiene todo bajo control.</p>
          </div>
        ) : (
          missions.map((m) => {
            const cfg = PRIORITY[m.priority] || PRIORITY.medium;
            return (
              <Link
                key={m.id}
                to={m.action_target}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${cfg.color} hover:bg-white/10 transition group`}
              >
                <span className="text-base mt-0.5">{TYPE_ICON[m.type] || '⚡'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-[9px] font-bold tracking-wider ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-[9px] text-white/40">· {m.agent}</span>
                  </div>
                  <p className="text-xs text-white font-medium leading-tight line-clamp-1">{m.title}</p>
                  <p className="text-[10px] text-white/60 leading-tight line-clamp-2 mt-0.5">{m.subtitle}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0 mt-1" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}