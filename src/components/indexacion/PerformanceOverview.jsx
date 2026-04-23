import { TrendingUp, Eye, MousePointerClick, Target } from 'lucide-react';

const Stat = ({ icon: Icon, label, value, color }) => (
  <div className={`p-3 rounded-xl border border-slate-200 bg-gradient-to-br ${color}`}>
    <div className="flex items-center gap-2 text-slate-600 text-[10px] font-semibold uppercase tracking-wide">
      <Icon className="w-3 h-3" />
      {label}
    </div>
    <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
  </div>
);

export default function PerformanceOverview({ totals, topQueries, topPages }) {
  if (!totals) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat icon={Eye} label="Impresiones 28d" value={totals.impressions?.toLocaleString() || 0} color="from-blue-50 to-white" />
        <Stat icon={MousePointerClick} label="Clicks 28d" value={totals.clicks?.toLocaleString() || 0} color="from-teal-50 to-white" />
        <Stat icon={TrendingUp} label="CTR prom." value={`${totals.avg_ctr_pct?.toFixed(2) || 0}%`} color="from-emerald-50 to-white" />
        <Stat icon={Target} label="Queries top" value={topQueries?.length || 0} color="from-amber-50 to-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Top queries */}
        <div className="p-3 rounded-xl border border-slate-200 bg-white">
          <h4 className="text-xs font-bold text-slate-900 mb-2">Top queries (28d)</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {(topQueries || []).slice(0, 10).map((q, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-slate-100 last:border-0">
                <span className="truncate text-slate-700 flex-1">{q.query}</span>
                <span className="text-slate-500 tabular-nums">{q.clicks}c</span>
                <span className="text-slate-400 tabular-nums">#{q.position}</span>
              </div>
            ))}
            {(topQueries || []).length === 0 && (
              <p className="text-xs text-slate-400 italic">Sin queries aún. El sitio es nuevo para Google.</p>
            )}
          </div>
        </div>

        {/* Top pages */}
        <div className="p-3 rounded-xl border border-slate-200 bg-white">
          <h4 className="text-xs font-bold text-slate-900 mb-2">Top pages (28d)</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {(topPages || []).slice(0, 10).map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-slate-100 last:border-0">
                <span className="truncate text-slate-700 flex-1">{p.url.replace(/^https?:\/\/[^/]+/, '')}</span>
                <span className="text-slate-500 tabular-nums">{p.clicks}c</span>
                <span className="text-slate-400 tabular-nums">#{p.position}</span>
              </div>
            ))}
            {(topPages || []).length === 0 && (
              <p className="text-xs text-slate-400 italic">Sin data. Google aún no rankea el sitio.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}