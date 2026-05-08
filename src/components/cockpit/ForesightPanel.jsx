import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Loader2, Eye, TrendingDown, TrendingUp, AlertTriangle, Clock, UserX, PackageX, ArrowUpRight
} from 'lucide-react';

const ICONS = { TrendingDown, TrendingUp, AlertTriangle, Clock, UserX, PackageX };

const SEV = {
  critical: { color: 'border-red-400/50 bg-red-500/10', text: 'text-red-300', label: 'CRÍTICO' },
  high: { color: 'border-amber-400/50 bg-amber-500/10', text: 'text-amber-300', label: 'ALTO' },
  medium: { color: 'border-blue-400/50 bg-blue-500/10', text: 'text-blue-300', label: 'MEDIO' },
  low: { color: 'border-emerald-400/50 bg-emerald-500/10', text: 'text-emerald-300', label: 'INFO' },
};

/**
 * ForesightPanel — visión a futuro. Lo que VA a pasar si nada cambia.
 * Filosofía 2027+: no es analítica reactiva, es predicción accionable.
 */
export default function ForesightPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('cockpitForesight', {});
        setData(res?.data || { insights: [] });
      } catch (e) {
        console.warn('Foresight:', e);
        setData({ insights: [] });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-cyan-950/30 backdrop-blur-md rounded-2xl border border-cyan-400/20 p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-cyan-300" />
        <h3 className="font-poppins font-semibold text-white text-sm">FORESIGHT</h3>
        <span className="text-[10px] text-cyan-300/70">· lo que viene</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-20 text-cyan-300/60">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (data?.insights || []).length === 0 ? (
        <p className="text-xs text-white/40 text-center py-6">Sin alertas predictivas. Todo en verde.</p>
      ) : (
        <div className="space-y-2">
          {data.insights.map((ins) => {
            const cfg = SEV[ins.severity] || SEV.medium;
            const Icon = ICONS[ins.icon] || AlertTriangle;
            return (
              <Link
                key={ins.id}
                to={ins.link || '/admin'}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${cfg.color} hover:bg-white/10 transition group`}
              >
                <Icon className={`w-4 h-4 ${cfg.text} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-bold tracking-wider ${cfg.text}`}>{cfg.label}</span>
                    <span className="text-[9px] text-white/40">·</span>
                    <span className="text-[10px] text-white/70 font-medium">{ins.title}</span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-tight">{ins.message}</p>
                  {ins.action && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className={`text-[10px] font-medium ${cfg.text}`}>{ins.action}</span>
                      <ArrowUpRight className="w-3 h-3 text-white/40 group-hover:text-white transition" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}