// ────────────────────────────────────────────────────────────────────────
// MerchantCenterSyncCard
// ────────────────────────────────────────────────────────────────────────
// Card admin que dispara `syncToMerchantCenter`: pingea Google + IndexNow
// con TODOS los productos elegibles del catálogo, en una sola acción.
//
// UX:
//  • Una sola acción visible — botón grande, no requiere configuración.
//  • Resultados en línea (ok / error por canal: Google, GSC, IndexNow).
//  • Link directo al feed XML para validar en Merchant Center.
// ────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, AlertCircle, ExternalLink, Loader2, ShoppingBag } from 'lucide-react';

export default function MerchantCenterSyncCard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('syncToMerchantCenter', {});
      setResult(res.data || res);
    } catch (e) {
      setError(e?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-poppins font-bold text-slate-900 text-lg">Google Merchant Center · Sync</h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Empuja todo el catálogo activo a Google Shopping, Bing, Yandex y otros motores en un solo click. Útil tras subir productos nuevos o actualizar precios.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          onClick={handleSync}
          disabled={loading}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 h-11 px-5"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Empujando catálogo…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Sincronizar todos los productos
            </>
          )}
        </Button>
        <a
          href="https://peyuchile.cl/googleMerchantFeed"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 h-11 rounded-md border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-700"
        >
          Ver Feed XML <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold">No se pudo sincronizar</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Productos enviados" value={result.eligible} tone="emerald" />
            <StatBox label="Catálogo total" value={result.total_products} tone="slate" />
            <StatBox label="Excluidos" value={result.skipped} tone="amber" hint="Inactivos / sin imagen / B2B exclusivo / sin precio" />
          </div>
          <div className="space-y-1.5 pt-1">
            <ChannelRow name="Google · ping sitemap" status={result.google_ping} />
            <ChannelRow name="Search Console · re-submit" status={result.gsc_sitemap} />
            <ChannelRow name="IndexNow · Bing/Yandex/Seznam" status={result.indexnow} extra={result.indexnow?.urls_sent ? `${result.indexnow.urls_sent} URLs` : null} />
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Google y Bing tardan entre 1h y 48h en re-indexar. Revisa el estado en Google Merchant Center → Productos → Diagnóstico.
          </p>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, tone, hint }) {
  const TONE = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    slate:   'bg-slate-50 border-slate-200 text-slate-900',
    amber:   'bg-amber-50 border-amber-200 text-amber-900',
  };
  return (
    <div className={`border rounded-xl p-3 ${TONE[tone]}`} title={hint}>
      <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">{label}</p>
      <p className="text-2xl font-poppins font-extrabold tabular-nums mt-0.5">{value ?? '—'}</p>
    </div>
  );
}

function ChannelRow({ name, status, extra }) {
  const ok = status?.ok;
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm">
      <span className="font-medium text-slate-700">{name}</span>
      <span className="flex items-center gap-1.5">
        {extra && <span className="text-[11px] text-slate-500 font-mono">{extra}</span>}
        {ok ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> OK {status?.status ? `· ${status.status}` : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-700 font-bold text-xs">
            <AlertCircle className="w-3.5 h-3.5" /> {status?.error || `Error ${status?.status || ''}`}
          </span>
        )}
      </span>
    </div>
  );
}