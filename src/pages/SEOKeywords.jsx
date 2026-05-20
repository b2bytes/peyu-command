// ============================================================================
// SEOKeywords · Top queries reales de peyuchile.cl en Google Search Console.
// Rediseño 2026: mobile-first, fondo dark sólido (no transparente), contraste
// AAA, jerarquía visual fuerte. Se ve tanto en modo día como noche del sistema
// Liquid Dual porque usa colores propios opacos.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Search, RefreshCw, Loader2, TrendingUp, Eye, MousePointerClick,
  Globe, Image as ImageIcon, Compass, Newspaper, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import KeywordBucketSummary from '@/components/seo-keywords/KeywordBucketSummary';
import KeywordsTable from '@/components/seo-keywords/KeywordsTable';
import OptimizeMetaTagsButton from '@/components/seo-keywords/OptimizeMetaTagsButton';
import KeywordExplorer from '@/components/seo-keywords/KeywordExplorer';

const WINDOWS = [
  { label: '7d',  days: 7 },
  { label: '28d', days: 28 },
  { label: '90d', days: 90 },
];

const SEARCH_TYPES = [
  { label: 'Web',      value: 'web',      icon: Globe },
  { label: 'Imágenes', value: 'image',    icon: ImageIcon },
  { label: 'Discover', value: 'discover', icon: Compass },
  { label: 'Noticias', value: 'news',     icon: Newspaper },
];

export default function SEOKeywords() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(28);
  const [searchType, setSearchType] = useState('web');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('gscTopKeywords', {
        days, limit: 1000, country: 'chl', searchType,
      });
      if (res?.data?.ok) setData(res.data);
      else setError(res?.data?.error || 'Error desconocido');
    } catch (e) {
      setError(e?.message || 'Error de red');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days, searchType]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* ─── Header ─── */}
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30 flex-shrink-0">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-50" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h1 className="font-jakarta font-extrabold text-slate-50 text-xl md:text-2xl tracking-tight leading-tight">
                Palabras clave indexadas
              </h1>
              <p className="text-[13px] md:text-sm text-slate-400 font-inter mt-1 leading-relaxed">
                Top queries reales de <span className="text-teal-300 font-semibold">peyuchile.cl</span> en Google Chile · Search Console
              </p>
            </div>
          </div>

          {/* Controles · stack en mobile, fila en desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            {/* Tipo de búsqueda */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 overflow-x-auto scrollbar-hide">
              {SEARCH_TYPES.map(t => {
                const Icon = t.icon;
                const active = searchType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setSearchType(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold font-jakarta whitespace-nowrap transition-all ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                        : 'text-slate-300 hover:text-slate-50 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Ventana + refresh */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                {WINDOWS.map(w => (
                  <button
                    key={w.days}
                    onClick={() => setDays(w.days)}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-bold font-jakarta transition-all ${
                      days === w.days
                        ? 'bg-teal-500/20 text-teal-200 border border-teal-400/40'
                        : 'text-slate-300 hover:text-slate-50 border border-transparent'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={load}
                disabled={loading}
                className="h-9 w-9 p-0 text-slate-300 hover:text-slate-50 hover:bg-slate-800 border border-slate-800"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </header>

        {/* ─── Loading / Error ─── */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
            Cargando datos de Google Search Console…
          </div>
        )}
        {error && (
          <div className="bg-rose-950/50 border border-rose-500/30 rounded-xl p-4 text-rose-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ─── Contenido ─── */}
        {data && (
          <>
            {/* KPIs · 2 cols mobile, 4 desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
              <Card icon={Search} label="Queries" value={data.total_queries} tone="teal" />
              <Card icon={Eye} label="Impresiones" value={data.totals.impressions.toLocaleString('es-CL')} tone="cyan" />
              <Card icon={MousePointerClick} label="Clicks" value={data.totals.clicks.toLocaleString('es-CL')} tone="emerald" />
              <Card icon={TrendingUp} label="Pos. promedio" value={data.totals.avg_position.toFixed(1)} tone="amber" />
            </div>

            {/* Resumen por bucket */}
            <KeywordBucketSummary summary={data.summary} total={data.total_queries} />

            {/* Banda de oportunidad + acción IA */}
            {data.summary.top20 > 0 && (
              <div className="bg-gradient-to-br from-amber-950/40 to-amber-900/20 border border-amber-500/30 rounded-2xl p-4 md:p-5 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-jakarta font-bold text-amber-100 text-sm md:text-base">
                      Oportunidad rápida detectada
                    </p>
                    <p className="text-[12px] md:text-[13px] text-amber-200/80 font-inter mt-0.5 leading-relaxed">
                      <strong className="text-amber-100">{data.summary.top20} queries en página 2</strong> (pos 11-20).
                      Optimizar meta tags puede empujarlas a página 1 con poco esfuerzo.
                    </p>
                  </div>
                </div>
                <div className="md:flex-shrink-0">
                  <OptimizeMetaTagsButton days={days} onDone={load} />
                </div>
              </div>
            )}

            {/* Tabla / cards */}
            <KeywordsTable keywords={data.keywords} />

            {/* Explorador de oportunidades (semillas + IA + GSC) */}
            <KeywordExplorer />

            {/* Footer */}
            <p className="text-[11px] text-slate-500 font-inter text-center pt-2">
              Fuente: Google Search Console · {data.start_date} → {data.end_date} ·
              País: {data.country.toUpperCase()} · Tipo: {data.search_type || 'web'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── KPI card — fondo sólido, no transparente ───────────────────────────────
function Card({ icon: Icon, label, value, tone }) {
  const TONE = {
    teal:    { ring: 'border-teal-500/30',    icon: 'text-teal-300',    glow: 'bg-teal-500/10' },
    cyan:    { ring: 'border-cyan-500/30',    icon: 'text-cyan-300',    glow: 'bg-cyan-500/10' },
    emerald: { ring: 'border-emerald-500/30', icon: 'text-emerald-300', glow: 'bg-emerald-500/10' },
    amber:   { ring: 'border-amber-500/30',   icon: 'text-amber-300',   glow: 'bg-amber-500/10' },
  };
  const t = TONE[tone] || TONE.teal;
  return (
    <div className={`bg-slate-900 border ${t.ring} rounded-2xl p-3 md:p-4`}>
      <div className={`w-7 h-7 rounded-lg ${t.glow} flex items-center justify-center mb-2`}>
        <Icon className={`w-3.5 h-3.5 ${t.icon}`} />
      </div>
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 font-jakarta">{label}</p>
      <p className="font-jakarta font-extrabold text-xl md:text-2xl tracking-tight leading-none text-slate-50">{value}</p>
    </div>
  );
}