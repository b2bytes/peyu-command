// ============================================================================
// SiteAuditCard — Tarjeta que muestra y ejecuta auditoría GSC de un dominio
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Globe, Search, Loader2, CheckCircle2, XCircle, Upload, Zap,
  TrendingUp, BarChart3, ExternalLink
} from 'lucide-react';

export default function SiteAuditCard({ site_url, defaultSitemap }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sitemap, setSitemap] = useState(defaultSitemap || `${site_url}sitemap.xml`);
  const [sitemapMsg, setSitemapMsg] = useState(null);

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('gscAuditSite', { site_url });
      setAudit(res.data);
    } catch (e) {
      setAudit({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const submitSitemap = async () => {
    setSitemapMsg({ loading: true });
    try {
      const res = await base44.functions.invoke('gscSubmitSitemap', { site_url, sitemap_url: sitemap });
      setSitemapMsg(res.data);
    } catch (e) {
      setSitemapMsg({ error: e.message });
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="w-4 h-4 text-teal-600" />
          {site_url}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auditoría */}
        <div>
          <Button onClick={runAudit} disabled={loading} size="sm" className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Auditar Search Console
          </Button>

          {audit?.error && (
            <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {audit.error}
            </div>
          )}

          {audit && !audit.error && (
            <div className="mt-3 space-y-3">
              {/* KPIs 28d */}
              <div className="grid grid-cols-4 gap-2">
                <Kpi icon={<BarChart3 className="w-3 h-3" />} label="Clicks 28d" value={audit.performance_28d.clicks.toLocaleString()} />
                <Kpi icon={<TrendingUp className="w-3 h-3" />} label="Impresiones" value={audit.performance_28d.impressions.toLocaleString()} />
                <Kpi label="CTR" value={`${audit.performance_28d.ctr_pct}%`} />
                <Kpi label="Pos. prom." value={audit.performance_28d.avg_position} />
              </div>

              {/* Sitemaps registrados */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1.5">Sitemaps registrados ({audit.sitemaps.length})</p>
                {audit.sitemaps.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">⚠ Ningún sitemap registrado todavía.</p>
                ) : (
                  <ul className="text-xs space-y-1">
                    {audit.sitemaps.map((s, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{s.path}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Top queries */}
              {audit.top_queries?.length > 0 && (
                <details className="text-xs">
                  <summary className="font-semibold text-slate-700 cursor-pointer">Top queries ({audit.top_queries.length})</summary>
                  <ul className="mt-1.5 space-y-1">
                    {audit.top_queries.slice(0, 10).map((q, i) => (
                      <li key={i} className="flex justify-between text-slate-600">
                        <span className="truncate mr-2">{q.query}</span>
                        <span className="flex-shrink-0 text-slate-400">{q.clicks}c · {q.impressions}i · pos {q.position}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Submit sitemap */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 mb-1.5">Enviar sitemap a Google</p>
          <div className="flex gap-2">
            <Input value={sitemap} onChange={e => setSitemap(e.target.value)} className="text-xs h-8" />
            <Button onClick={submitSitemap} size="sm" className="gap-1.5 h-8" disabled={sitemapMsg?.loading}>
              {sitemapMsg?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Enviar
            </Button>
          </div>
          {sitemapMsg && !sitemapMsg.loading && (
            <p className={`mt-1.5 text-xs flex items-center gap-1 ${sitemapMsg.success ? 'text-emerald-700' : 'text-red-700'}`}>
              {sitemapMsg.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {sitemapMsg.message || sitemapMsg.error}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Kpi({ icon, label, value }) {
  return (
    <div className="bg-slate-50 rounded p-2 border border-slate-100">
      <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">{icon}{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}