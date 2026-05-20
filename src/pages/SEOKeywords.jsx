// ============================================================================
// SEOKeywords · Top queries reales de peyuchile.cl según Google Search Console
// ----------------------------------------------------------------------------
// Pide a /functions/gscTopKeywords las queries indexadas en google.cl,
// agrupa por bucket de posición y muestra dónde estamos rankeando hoy.
// Cada query tiene un link a "probar en google.cl" para validar manualmente.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, RefreshCw, Loader2, TrendingUp, Eye, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import KeywordBucketSummary from '@/components/seo-keywords/KeywordBucketSummary';
import KeywordsTable from '@/components/seo-keywords/KeywordsTable';

const WINDOWS = [
  { label: '7 días',  days: 7 },
  { label: '28 días', days: 28 },
  { label: '90 días', days: 90 },
];

export default function SEOKeywords() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(28);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('gscTopKeywords', { days, limit: 50, country: 'chl' });
      if (res?.data?.ok) setData(res.data);
      else setError(res?.data?.error || 'Error desconocido');
    } catch (e) {
      setError(e?.message || 'Error de red');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  return (
    <div className="min-h-screen p-5 md:p-8 space-y-6">
      {/* ─── Header ─── */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-jakarta font-extrabold text-white text-2xl tracking-tight leading-none">
              Palabras clave indexadas
            </h1>
            <p className="text-sm text-white/55 font-inter mt-1.5 max-w-2xl">
              Top queries reales donde <strong className="text-teal-300">peyuchile.cl</strong> aparece en Google Chile
              según Search Console. Click en el ícono externo para probar la búsqueda en google.cl.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            {WINDOWS.map(w => (
              <button
                key={w.days}
                onClick={() => setDays(w.days)}
                className={`px-3 py-1 rounded-md text-xs font-bold font-jakarta transition-all ${
                  days === w.days
                    ? 'bg-teal-500/20 text-teal-200 border border-teal-400/30'
                    : 'text-white/50 hover:text-white'
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
            className="h-9 text-white/60 hover:text-white hover:bg-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* ─── Loading / Error ─── */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20 text-white/50 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando datos de Google Search Console…
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-400/25 rounded-xl p-4 text-rose-200 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ─── Contenido ─── */}
      {data && (
        <>
          {/* Totales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card icon={Search} label="Queries únicas" value={data.total_queries} tone="teal" />
            <Card icon={Eye} label="Impresiones" value={data.totals.impressions.toLocaleString('es-CL')} tone="cyan" />
            <Card icon={MousePointerClick} label="Clicks" value={data.totals.clicks.toLocaleString('es-CL')} tone="emerald" />
            <Card icon={TrendingUp} label="Posición promedio" value={data.totals.avg_position.toFixed(1)} tone="amber" />
          </div>

          {/* Resumen por bucket */}
          <KeywordBucketSummary summary={data.summary} total={data.total_queries} />

          {/* Banda de insight rápido */}
          {data.summary.top20 > 0 && (
            <div className="bg-amber-500/10 border border-amber-400/25 rounded-xl p-4">
              <p className="text-[13px] text-amber-100/90 leading-relaxed font-inter">
                💡 <strong className="text-amber-200">Oportunidad rápida:</strong> tienes{' '}
                <strong>{data.summary.top20} queries en página 2 (posición 11-20)</strong>. Optimizar contenido y meta tags
                para esas queries puede empujarlas a página 1 con poco esfuerzo.
              </p>
            </div>
          )}

          {/* Tabla */}
          <KeywordsTable keywords={data.keywords} />

          {/* Footer info */}
          <p className="text-[11px] text-white/35 font-inter text-center">
            Fuente: Google Search Console · Ventana {data.start_date} → {data.end_date} · Filtro geográfico:{' '}
            {data.country.toUpperCase()} · Sitio: {data.site}
          </p>
        </>
      )}
    </div>
  );
}

function Card({ icon: Icon, label, value, tone }) {
  const TONE = {
    teal: 'text-teal-300',
    cyan: 'text-cyan-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
  };
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
      <Icon className={`w-4 h-4 ${TONE[tone]} mb-2`} />
      <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1 font-jakarta">{label}</p>
      <p className="font-jakarta font-extrabold text-2xl tracking-tight leading-none text-white">{value}</p>
    </div>
  );
}