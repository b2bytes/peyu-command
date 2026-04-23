import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, FlaskConical, Eye, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

const STATUS_COLORS = {
  'Draft IA': 'bg-slate-100 text-slate-700',
  'Revisada': 'bg-blue-100 text-blue-700',
  'Exportada CSV': 'bg-amber-100 text-amber-700',
  'Subida a Ads': 'bg-purple-100 text-purple-700',
  'Activa': 'bg-emerald-100 text-emerald-700',
  'Pausada': 'bg-slate-100 text-slate-700',
  'Ganadora': 'bg-gradient-to-r from-yellow-300 to-amber-400 text-yellow-900',
  'Perdedora': 'bg-red-100 text-red-700',
};

export default function CampaignDraftCard({ draft, onExported, onAnalyzed }) {
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [metrics, setMetrics] = useState({ impressions: '', clicks: '', conversions: '', cost_clp: '', revenue_clp: '' });
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke('adsExportEditor', { draft_id: draft.id });
      const csv = res?.data?.csv_content;
      const filename = res?.data?.filename || 'campaign.csv';
      if (csv) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onExported?.();
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await base44.functions.invoke('adsAnalyzePerformance', {
        draft_id: draft.id,
        real_metrics: {
          impressions: Number(metrics.impressions || 0),
          clicks: Number(metrics.clicks || 0),
          conversions: Number(metrics.conversions || 0),
          cost_clp: Number(metrics.cost_clp || 0),
          revenue_clp: Number(metrics.revenue_clp || 0),
        },
      });
      setAnalysisResult(res?.data?.analysis);
      onAnalyzed?.();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const badgeClass = STATUS_COLORS[draft.status] || 'bg-slate-100 text-slate-700';

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-red-600">{draft.codename}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>{draft.status}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-1">{draft.campaign_name}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {draft.campaign_type} · {draft.objective} · {draft.audience_segment} · ${draft.daily_budget_usd} USD/día
            </p>
          </div>
        </div>

        {/* KPIs esperados */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center p-2 rounded bg-slate-50">
            <p className="text-[9px] text-slate-500 uppercase font-semibold">CTR esp.</p>
            <p className="text-sm font-bold text-slate-900">{draft.expected_ctr_pct}%</p>
          </div>
          <div className="text-center p-2 rounded bg-slate-50">
            <p className="text-[9px] text-slate-500 uppercase font-semibold">CPC esp.</p>
            <p className="text-sm font-bold text-slate-900">${draft.expected_cpc_clp}</p>
          </div>
          <div className="text-center p-2 rounded bg-slate-50">
            <p className="text-[9px] text-slate-500 uppercase font-semibold">Conv/sem</p>
            <p className="text-sm font-bold text-slate-900">{draft.expected_conversions_week}</p>
          </div>
          <div className="text-center p-2 rounded bg-slate-50">
            <p className="text-[9px] text-slate-500 uppercase font-semibold">CAC esp.</p>
            <p className="text-sm font-bold text-slate-900">${draft.expected_cac_clp?.toLocaleString()}</p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setExpanded(!expanded)} className="gap-1.5 text-xs">
            <Eye className="w-3.5 h-3.5" />
            {expanded ? 'Ocultar' : 'Ver táctica'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5 text-xs">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Exportar CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAnalyze(!showAnalyze)} className="gap-1.5 text-xs">
            <FlaskConical className="w-3.5 h-3.5" />
            Analizar (Scientist)
          </Button>
        </div>
      </div>

      {/* Detalles expandidos */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3 text-xs">
          <div>
            <p className="font-bold text-slate-700 mb-1">🎯 Racional estratégico</p>
            <p className="text-slate-600 italic">{draft.strategic_rationale}</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">🧪 Hipótesis científica</p>
            <p className="text-slate-600 italic">{draft.scientific_hypothesis}</p>
          </div>

          <details className="cursor-pointer">
            <summary className="font-bold text-slate-700">🔑 Keywords ({draft.keywords?.length || 0})</summary>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {(draft.keywords || []).map((k, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-50">
                  <span className="text-slate-800 truncate">{k.text}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-slate-600 font-semibold">{k.match_type}</span>
                </div>
              ))}
            </div>
          </details>

          <details className="cursor-pointer">
            <summary className="font-bold text-slate-700">🚫 Negative keywords ({draft.negative_keywords?.length || 0})</summary>
            <div className="mt-2 flex flex-wrap gap-1">
              {(draft.negative_keywords || []).map((nk, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px]">-{nk}</span>
              ))}
            </div>
          </details>

          <details className="cursor-pointer">
            <summary className="font-bold text-slate-700">📣 Responsive Search Ads ({draft.responsive_search_ads?.length || 0})</summary>
            <div className="mt-2 space-y-2">
              {(draft.responsive_search_ads || []).map((rsa, i) => (
                <div key={i} className="p-2 rounded bg-slate-50">
                  <p className="font-bold text-slate-700 text-[11px]">Ad Group: {rsa.ad_group}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Headlines ({rsa.headlines?.length}):</p>
                  <ul className="text-[11px] list-disc pl-4">
                    {(rsa.headlines || []).slice(0, 5).map((h, j) => <li key={j}>{h}</li>)}
                    {rsa.headlines?.length > 5 && <li className="text-slate-400">+ {rsa.headlines.length - 5} más</li>}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Panel análisis */}
      {showAnalyze && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 bg-purple-50/40">
          <p className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4" /> Ingresa métricas reales de Google Ads
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['impressions', 'clicks', 'conversions', 'cost_clp', 'revenue_clp'].map(f => (
              <div key={f}>
                <label className="text-[10px] text-slate-600 uppercase font-semibold">{f.replace('_', ' ')}</label>
                <input
                  type="number"
                  value={metrics[f]}
                  onChange={(e) => setMetrics(m => ({ ...m, [f]: e.target.value }))}
                  className="w-full h-8 px-2 rounded border border-slate-200 text-xs"
                />
              </div>
            ))}
          </div>
          <Button size="sm" onClick={handleAnalyze} disabled={analyzing} className="mt-2 gap-1.5 bg-purple-600 hover:bg-purple-700">
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
            {analyzing ? 'Analizando...' : 'Analizar con Scientist'}
          </Button>

          {analysisResult && (
            <div className="mt-3 p-3 rounded-lg bg-white border border-purple-200 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <strong className="text-purple-900">Verdict: {analysisResult.verdict}</strong>
                <span className="text-slate-500">({analysisResult.confidence_pct}% confianza)</span>
              </div>
              <p><strong>Hipótesis:</strong> {analysisResult.hypothesis_result}</p>
              <p><strong>Score:</strong> {analysisResult.performance_score}/100 · QS estimado: {analysisResult.quality_score_estimate}/10</p>
              <p className="text-slate-700 italic">{analysisResult.executive_summary}</p>
              <div>
                <p className="font-bold mt-2">Plan de optimización:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {(analysisResult.optimization_plan || []).map((p, i) => (
                    <li key={i}><strong>[{p.priority}]</strong> {p.action} → <span className="text-emerald-700">{p.expected_impact}</span></li>
                  ))}
                </ul>
              </div>
              <p className="mt-2"><strong>Decisión:</strong> <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">{analysisResult.scale_decision}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}