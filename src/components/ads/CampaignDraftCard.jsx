// ============================================================================
// CampaignDraftCard — Tarjeta detallada de campaña generada + export CSV
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target, Download, Loader2, ExternalLink, Brain, Microscope,
  DollarSign, TrendingUp
} from 'lucide-react';

const STATUS_COLORS = {
  'Draft IA': 'bg-blue-100 text-blue-700',
  'Revisada': 'bg-indigo-100 text-indigo-700',
  'Exportada CSV': 'bg-purple-100 text-purple-700',
  'Subida a Ads': 'bg-amber-100 text-amber-700',
  'Activa': 'bg-emerald-100 text-emerald-700',
  'Pausada': 'bg-slate-100 text-slate-700',
  'Ganadora': 'bg-green-100 text-green-800',
  'Perdedora': 'bg-red-100 text-red-700',
};

export default function CampaignDraftCard({ draft, onUpdated }) {
  const [exporting, setExporting] = useState(false);
  const [csvUrl, setCsvUrl] = useState(draft.exported_csv_url);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await base44.functions.invoke('adsExportEditor', { draft_id: draft.id });
      setCsvUrl(res.data.file_url);
      if (onUpdated) onUpdated();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <span className="truncate">{draft.campaign_name}</span>
            </CardTitle>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{draft.campaign_type}</Badge>
              <Badge variant="outline" className="text-[10px]">{draft.audience_segment}</Badge>
              <Badge variant="outline" className="text-[10px]">{draft.objective}</Badge>
              <Badge className={`text-[10px] ${STATUS_COLORS[draft.status] || ''}`}>{draft.status}</Badge>
              {draft.codename && <code className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded">{draft.codename}</code>}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* KPIs forecast */}
        <div className="grid grid-cols-4 gap-2">
          <ForecastKpi icon={<DollarSign className="w-3 h-3" />} label="Budget/día" value={`$${draft.daily_budget_usd || 0}`} />
          <ForecastKpi icon={<TrendingUp className="w-3 h-3" />} label="CTR esp." value={`${draft.expected_ctr_pct || '—'}%`} />
          <ForecastKpi label="CPC esp." value={draft.expected_cpc_clp ? `$${Math.round(draft.expected_cpc_clp).toLocaleString()}` : '—'} />
          <ForecastKpi label="Conv/sem" value={draft.expected_conversions_week || '—'} />
        </div>

        {/* Racional */}
        {draft.strategic_rationale && (
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded text-xs">
            <div className="flex items-center gap-1 mb-1 font-semibold text-indigo-900">
              <Brain className="w-3 h-3" /> Racional estratégico (Commander)
            </div>
            <p className="text-indigo-900/90 leading-relaxed">{draft.strategic_rationale}</p>
          </div>
        )}

        {/* Hipótesis */}
        {draft.scientific_hypothesis && (
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded text-xs">
            <div className="flex items-center gap-1 mb-1 font-semibold text-purple-900">
              <Microscope className="w-3 h-3" /> Hipótesis científica
            </div>
            <p className="text-purple-900/90 leading-relaxed">{draft.scientific_hypothesis}</p>
          </div>
        )}

        {/* Resumen ad groups */}
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-slate-700">
            {(draft.ad_groups || []).length} Ad Groups · {(draft.keywords || []).length} keywords · {(draft.negative_keywords || []).length} negatives
          </summary>
          <div className="mt-2 space-y-2">
            {(draft.ad_groups || []).map((ag, i) => (
              <div key={i} className="p-2 bg-slate-50 rounded border border-slate-100">
                <div className="font-semibold text-slate-800">{ag.name}</div>
                <div className="text-slate-500 text-[10px]">{ag.theme}</div>
                <div className="text-slate-600 mt-1 truncate">{(ag.keywords || []).slice(0, 5).join(' · ')}</div>
              </div>
            ))}
          </div>
        </details>

        {/* Scientist analysis */}
        {draft.scientist_analysis && (
          <div className="p-2.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200">
            <div className="flex items-center gap-1 mb-1 font-semibold text-orange-400">
              <Microscope className="w-3 h-3" /> Análisis del Scientist · score {draft.performance_score}/100
            </div>
            <pre className="whitespace-pre-wrap font-sans leading-relaxed">{draft.scientist_analysis}</pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <Button onClick={exportCSV} disabled={exporting} size="sm" className="gap-1.5 flex-1">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {csvUrl ? 'Re-exportar CSV' : 'Exportar a Google Ads Editor (CSV)'}
          </Button>
          {csvUrl && (
            <a href={csvUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Descargar
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastKpi({ icon, label, value }) {
  return (
    <div className="bg-slate-50 rounded p-2 border border-slate-100">
      <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">{icon}{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}