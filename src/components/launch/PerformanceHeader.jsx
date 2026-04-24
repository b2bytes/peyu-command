// ============================================================================
// PerformanceHeader — Tarjeta hero con KPIs agregados GSC de los últimos 28d
// ----------------------------------------------------------------------------
// Llama gscAuditSite para cada site y muestra KPIs grandes + top queries & pages.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, TrendingUp, Target, Award, RefreshCw, Loader2, ExternalLink,
} from 'lucide-react';

function KpiBig({ icon, label, value, trend, color = 'emerald' }) {
  return (
    <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100/40 rounded-xl p-3 border border-${color}-200`}>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-1">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {trend && <div className="text-[10px] text-slate-500 mt-0.5">{trend}</div>}
    </div>
  );
}

function SitePerfBlock({ site }) {
  const { site_url, label, data, loading, error } = site;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{label}</h3>
          <p className="text-xs text-slate-500">{site_url}</p>
        </div>
        {data && !error && (
          <a href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(site_url)}`}
             target="_blank" rel="noreferrer"
             className="text-xs text-teal-700 hover:underline flex items-center gap-1">
            Abrir GSC <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando datos de Search Console...
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          Error GSC: {error}
        </div>
      )}

      {data && !error && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <KpiBig icon={<BarChart3 className="w-3 h-3" />} label="Clicks 28d" value={data.performance_28d.clicks.toLocaleString()} color="emerald" />
            <KpiBig icon={<TrendingUp className="w-3 h-3" />} label="Impresiones" value={data.performance_28d.impressions.toLocaleString()} color="sky" />
            <KpiBig icon={<Target className="w-3 h-3" />} label="CTR" value={`${data.performance_28d.ctr_pct}%`} color="indigo" />
            <KpiBig icon={<Award className="w-3 h-3" />} label="Pos. prom." value={data.performance_28d.avg_position || '—'} color="amber" />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">🔍 Top queries (28d)</p>
              {data.top_queries?.length > 0 ? (
                <ul className="space-y-1 max-h-56 overflow-y-auto text-xs">
                  {data.top_queries.slice(0, 10).map((q, i) => (
                    <li key={i} className="flex justify-between gap-2 py-1 px-2 bg-slate-50 rounded hover:bg-slate-100">
                      <span className="truncate text-slate-700" title={q.query}>{q.query}</span>
                      <span className="flex-shrink-0 text-[10px] text-slate-500 tabular-nums">
                        <strong className="text-slate-800">{q.clicks}c</strong> · {q.impressions}i · pos {q.position}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Sin datos todavía.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">📄 Top páginas (28d)</p>
              {data.top_pages?.length > 0 ? (
                <ul className="space-y-1 max-h-56 overflow-y-auto text-xs">
                  {data.top_pages.slice(0, 10).map((p, i) => (
                    <li key={i} className="flex justify-between gap-2 py-1 px-2 bg-slate-50 rounded hover:bg-slate-100">
                      <a href={p.page} target="_blank" rel="noreferrer" className="truncate text-slate-700 hover:underline" title={p.page}>
                        {p.page.replace(site_url, '/') || '/'}
                      </a>
                      <span className="flex-shrink-0 text-[10px] text-slate-500 tabular-nums">
                        <strong className="text-slate-800">{p.clicks}c</strong> · {p.impressions}i
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Sin datos todavía.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PerformanceHeader({ sites }) {
  const [state, setState] = useState(() => sites.map(s => ({ ...s, data: null, loading: false, error: null })));

  const refresh = async () => {
    setState(sites.map(s => ({ ...s, data: null, loading: true, error: null })));
    const results = await Promise.all(sites.map(async (s) => {
      try {
        const res = await base44.functions.invoke('gscAuditSite', { site_url: s.url });
        if (res.data?.error) return { ...s, site_url: s.url, data: null, loading: false, error: res.data.error };
        return { ...s, site_url: s.url, data: res.data, loading: false, error: null };
      } catch (e) {
        return { ...s, site_url: s.url, data: null, loading: false, error: e?.message || 'error' };
      }
    }));
    setState(results.map(r => ({ ...r, site_url: r.url })));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyLoading = state.some(s => s.loading);

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Performance real · Search Console (últimos 28 días)
          </CardTitle>
          <Button onClick={refresh} size="sm" variant="outline" disabled={anyLoading} className="gap-1.5 h-8">
            {anyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refrescar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {state.map((s, i) => (
          <div key={s.url}>
            <SitePerfBlock site={{ ...s, site_url: s.url }} />
            {i < state.length - 1 && <div className="border-t border-slate-100 mt-6" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}