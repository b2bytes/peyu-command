import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Sparkles, Loader2, Download, CheckCircle2, TrendingUp, Target,
  RefreshCw, AlertCircle,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// CampanaCard — Tarjeta de una campaña Google Ads PEYU. Flujo:
//   1. "Generar con IA" → adsGenerateCampaign2026 (campaña completa).
//   2. Muestra resumen (forecast, ad groups/asset groups, keywords).
//   3. "Descargar CSV" → adsExportEditor (archivo Google Ads Editor).
// Reutiliza las funciones backend existentes, no duplica lógica.
// ════════════════════════════════════════════════════════════════════════
const fmtCLP = (n) => '$' + Math.round(n || 0).toLocaleString('es-CL');

export default function CampanaCard({ campana }) {
  const { titulo, subtitulo, icon, color, config } = campana;
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [draft, setDraft] = useState(null);
  const [csvUrl, setCsvUrl] = useState(null);
  const [error, setError] = useState(null);

  const generar = async () => {
    setLoading(true);
    setError(null);
    setCsvUrl(null);
    try {
      const res = await base44.functions.invoke('adsGenerateCampaign2026', config);
      if (res?.data?.draft) setDraft(res.data.draft);
      else setError(res?.data?.error || 'No se pudo generar la campaña.');
    } catch (e) {
      setError(e?.message || 'Error al generar la campaña.');
    } finally {
      setLoading(false);
    }
  };

  const exportar = async () => {
    if (!draft) return;
    setExporting(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('adsExportEditor', { draft_id: draft.id });
      if (res?.data?.file_url) setCsvUrl(res.data.file_url);
      else setError(res?.data?.error || 'No se pudo exportar el CSV.');
    } catch (e) {
      setError(e?.message || 'Error al exportar el CSV.');
    } finally {
      setExporting(false);
    }
  };

  const adGroups = draft?.ad_groups?.length || 0;
  const assetGroups = draft?.asset_groups?.length || 0;
  const keywords = draft?.keywords?.length || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* header */}
      <div className="p-5 flex items-start gap-3 border-b border-slate-100">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: color + '18' }}>{icon}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-poppins font-bold text-slate-900 leading-tight">{titulo}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: color + '18', color }}>
              {config.campaign_type}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {fmtCLP(config.daily_budget_clp)}/día
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {!draft && !loading && (
          <p className="text-xs text-slate-500 leading-relaxed">{config.operation_brief.slice(0, 160)}…</p>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color }} />
            <p className="text-xs text-slate-500">Generando campaña profesional con IA…</p>
            <p className="text-[10px] text-slate-400">Esto toma ~30-60s {config.generate_visuals ? '(incluye visuales)' : ''}</p>
          </div>
        )}

        {draft && !loading && (
          <>
            {/* forecast */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: TrendingUp, label: 'CTR', val: draft.expected_ctr_pct ? `${draft.expected_ctr_pct}%` : '—' },
                { icon: Target, label: 'CAC', val: draft.expected_cac_clp ? fmtCLP(draft.expected_cac_clp) : '—' },
                { icon: Sparkles, label: 'Conv/sem', val: draft.expected_conversions_week || '—' },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-2 text-center">
                  <Icon className="w-3.5 h-3.5 mx-auto mb-0.5" style={{ color }} />
                  <p className="text-[9px] text-slate-500 uppercase">{label}</p>
                  <p className="text-xs font-bold text-slate-900">{val}</p>
                </div>
              ))}
            </div>

            {/* estructura */}
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {adGroups > 0 && <Chip>{adGroups} ad groups</Chip>}
              {assetGroups > 0 && <Chip>{assetGroups} asset groups</Chip>}
              {keywords > 0 && <Chip>{keywords} keywords</Chip>}
              {draft.sitelinks?.length > 0 && <Chip>{draft.sitelinks.length} sitelinks</Chip>}
              {draft.callouts?.length > 0 && <Chip>{draft.callouts.length} callouts</Chip>}
              <Chip>{draft.bid_strategy}</Chip>
            </div>

            {draft.strategic_rationale && (
              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3 italic">
                "{draft.strategic_rationale}"
              </p>
            )}
          </>
        )}
      </div>

      {/* acciones */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        {!draft ? (
          <button
            onClick={generar}
            disabled={loading}
            className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-60"
            style={{ background: color }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generando…' : 'Generar campaña con IA'}
          </button>
        ) : (
          <>
            {csvUrl ? (
              <a
                href={csvUrl}
                download
                className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95"
                style={{ background: '#0F8B6C' }}
              >
                <CheckCircle2 className="w-4 h-4" /> Descargar CSV para Google Ads
              </a>
            ) : (
              <button
                onClick={exportar}
                disabled={exporting}
                className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-60"
                style={{ background: color }}
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting ? 'Exportando…' : 'Exportar a Google Ads Editor (CSV)'}
              </button>
            )}
            <button
              onClick={generar}
              disabled={loading}
              className="w-full h-9 rounded-xl text-slate-600 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">{children}</span>
  );
}