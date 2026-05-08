import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Loader2, Eye, TrendingDown, TrendingUp, AlertTriangle, Clock, UserX, PackageX, ArrowUpRight, CheckCircle2
} from 'lucide-react';

const ICONS = { TrendingDown, TrendingUp, AlertTriangle, Clock, UserX, PackageX };

const SEV = {
  critical: { border: 'border-l-red-400', text: 'text-red-300' },
  high: { border: 'border-l-amber-400', text: 'text-amber-300' },
  medium: { border: 'border-l-blue-400', text: 'text-blue-300' },
  low: { border: 'border-l-emerald-400', text: 'text-emerald-300' },
};

export default function ForesightPanel() {
  const [data, setData] = useState({ insights: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('cockpitForesight', {});
        setData(res?.data || { insights: [] });
      } catch (e) {
        console.warn('Foresight:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const insights = data.insights || [];

  return (
    <div className="bg-gradient-to-br from-slate-950/80 to-cyan-950/20 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-cyan-500/5 border-b border-cyan-400/10">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-cyan-300" />
          <h3 className="text-[11px] font-bold tracking-[0.2em] text-white">FORESIGHT</h3>
          <span className="text-[9px] text-cyan-300/60 font-mono">· lookahead_14d</span>
        </div>
        {!loading && <span className="text-[9px] text-cyan-300/40 font-mono">{insights.length} signals</span>}
      </div>

      <div className="p-2.5">
        {loading ? (
          <div className="flex items-center justify-center h-20 text-cyan-300/50">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-xs font-mono">analyzing...</span>
          </div>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-white/40">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/40 mb-2" />
            <p className="text-xs font-medium text-white/60">Sin alertas predictivas</p>
            <p className="text-[10px] mt-0.5 text-white/30 font-mono">forecast_clean · all_signals_green</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {insights.map((ins) => {
              const cfg = SEV[ins.severity] || SEV.medium;
              const Icon = ICONS[ins.icon] || AlertTriangle;
              return (
                <Link
                  key={ins.id}
                  to={ins.link || '/admin'}
                  className={`flex items-start gap-2.5 p-2.5 border-l-2 ${cfg.border} bg-white/[0.02] hover:bg-white/[0.05] rounded-r-lg transition group`}
                >
                  <Icon className={`w-3.5 h-3.5 ${cfg.text} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold tracking-wider ${cfg.text} mb-0.5`}>{ins.title}</p>
                    <p className="text-[10px] text-white/70 leading-tight">{ins.message}</p>
                    {ins.action && (
                      <p className={`text-[9px] mt-1 ${cfg.text} font-mono flex items-center gap-1`}>
                        → {ins.action}
                        <ArrowUpRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition" />
                      </p>
                    )}
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