// ============================================================================
// SeoGeoBlastCard — One-click full SEO/GEO blast
// ----------------------------------------------------------------------------
// Botón único que ejecuta el operativo completo:
//  · Regenera sitemap.xml
//  · IndexNow ping a Bing/Yandex/Seznam (todos los productos)
//  · Submit sitemap a Google Search Console
//  · Auditoría GSC últimos 28 días (clicks, impresiones, queries top)
//  · Confirma feed Google Merchant activo
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Rocket, Loader2, CheckCircle2, AlertTriangle, ExternalLink,
  Globe, Zap, FileSearch, ShoppingBag, TrendingUp, Copy, Check,
} from 'lucide-react';

export default function SeoGeoBlastCard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const ejecutar = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('seoGeoBlast', {
        indexnow_key: 'peyu2026indexnow',
      });
      const data = res?.data;
      if (!data) throw new Error('Sin respuesta del backend');
      setResult(data);
      if (!data.success) setError(data.errors?.join(' · ') || 'Errores parciales');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyFeedUrl = async () => {
    await navigator.clipboard.writeText('https://peyuchile.cl/feed/google-merchant.xml');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 via-violet-500/5 to-pink-500/10 border border-violet-400/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-poppins font-bold text-white text-base">SEO/GEO Blast Completo</h3>
            <p className="text-xs text-white/60 mt-0.5">
              Sitemap + IndexNow + GSC submit + Auditoría + Feed Google Shopping en un click
            </p>
          </div>
        </div>
        <Button
          onClick={ejecutar}
          disabled={loading}
          className="gap-2 bg-gradient-to-r from-emerald-500 to-violet-600 hover:from-emerald-600 hover:to-violet-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'Ejecutando blast…' : 'Ejecutar blast'}
        </Button>
      </div>

      {/* Steps preview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <Step icon={Globe}      label="Sitemap"        result={result?.steps?.sitemap}     loading={loading} />
        <Step icon={Zap}        label="IndexNow"       result={result?.steps?.indexnow}    loading={loading} />
        <Step icon={FileSearch} label="GSC Submit"     result={result?.steps?.gsc_sitemap} loading={loading} />
        <Step icon={TrendingUp} label="GSC Audit"      result={result?.steps?.gsc_audit}   loading={loading} />
        <Step icon={ShoppingBag} label="Merchant Feed" result={result?.steps?.merchant_feed} loading={loading} />
      </div>

      {/* Result summary */}
      {result && (
        <div className={`rounded-xl p-3 border ${
          result.success
            ? 'bg-emerald-500/10 border-emerald-400/30'
            : 'bg-amber-500/10 border-amber-400/30'
        }`}>
          <p className="text-sm text-white/90 flex items-start gap-2">
            {result.success
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            }
            <span className="leading-relaxed">{result.summary}</span>
          </p>
          {result.steps?.indexnow && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <Stat label="URLs totales"   value={result.steps.indexnow.total_urls} />
              <Stat label="Enviadas"       value={result.steps.indexnow.sent} color="text-emerald-300" />
              <Stat label="Productos"      value={result.steps.indexnow.breakdown?.products} />
            </div>
          )}
          {result.steps?.gsc_audit?.ok && (
            <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
              <Stat label="Clicks 28d"     value={result.steps.gsc_audit.clicks ?? '—'} color="text-cyan-300" />
              <Stat label="Impresiones"    value={result.steps.gsc_audit.impressions ?? '—'} />
              <Stat label="CTR"            value={result.steps.gsc_audit.ctr ? `${(result.steps.gsc_audit.ctr * 100).toFixed(2)}%` : '—'} />
              <Stat label="Posición avg"   value={result.steps.gsc_audit.position?.toFixed(1) ?? '—'} />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg p-3 text-xs text-rose-200">
          ⚠️ {error}
        </div>
      )}

      {/* Feed Google Merchant — siempre visible */}
      <div className="bg-black/20 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold flex items-center gap-1.5">
            <ShoppingBag className="w-3 h-3" /> Feed Google Shopping / Facebook / Pinterest
          </p>
          <code className="text-xs text-emerald-300 break-all block mt-1">
            https://peyuchile.cl/feed/google-merchant.xml
          </code>
          <p className="text-[10px] text-white/40 mt-1">
            Configurar en Merchant Center → Feeds → Programado → cada 24h
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={copyFeedUrl}
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-1.5"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <a
            href="https://merchants.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Abrir GMC
          </a>
        </div>
      </div>
    </div>
  );
}

function Step({ icon: Icon, label, result, loading }) {
  const status = !result ? (loading ? 'loading' : 'idle') : (result.ok ? 'ok' : 'error');
  const styles = {
    loading: 'bg-violet-500/10 border-violet-400/30 text-violet-300',
    ok:      'bg-emerald-500/10 border-emerald-400/30 text-emerald-300',
    error:   'bg-rose-500/10 border-rose-400/30 text-rose-300',
    idle:    'bg-white/5 border-white/10 text-white/50',
  }[status];
  return (
    <div className={`border rounded-lg p-2 ${styles}`}>
      <div className="flex items-center gap-1.5">
        {status === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" />
          : status === 'ok' ? <CheckCircle2 className="w-3 h-3" />
          : status === 'error' ? <AlertTriangle className="w-3 h-3" />
          : <Icon className="w-3 h-3" />}
        <span className="text-[10px] font-bold uppercase tracking-wider truncate">{label}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-black/20 rounded-md p-1.5">
      <p className="text-[9px] uppercase tracking-wider text-white/40">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value ?? '—'}</p>
    </div>
  );
}