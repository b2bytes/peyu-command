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
  DollarSign, TrendingUp, Shield, Users, Image as ImageIcon, Sparkles, Eye
} from 'lucide-react';
import AdPreviewModal from './AdPreviewModal';
import PublishCampaignButton from './PublishCampaignButton';
import ForecastPanel from './ForecastPanel';

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
  const [previewOpen, setPreviewOpen] = useState(false);

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
              {draft.api_version_used && (
                <Badge className="text-[10px] bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0">
                  API {draft.api_version_used}
                </Badge>
              )}
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

        {/* Forecast IA — predicción de rendimiento antes de publicar */}
        <ForecastPanel draft={draft} onUpdated={onUpdated} />

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

        {/* Resumen ad groups (Search/Shopping) */}
        {(draft.ad_groups || []).length > 0 && (
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
        )}

        {/* Asset Groups (PMax / Demand Gen) */}
        {(draft.asset_groups || []).length > 0 && (
          <details className="text-xs" open>
            <summary className="cursor-pointer font-semibold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-pink-600" />
              {draft.asset_groups.length} Asset Groups · {draft.asset_groups.reduce((s, ag) => s + (ag.image_urls?.length || 0), 0)} visuales
            </summary>
            <div className="mt-2 space-y-2">
              {draft.asset_groups.map((ag, i) => (
                <div key={i} className="p-2.5 bg-gradient-to-br from-pink-50 to-purple-50 rounded border border-pink-100">
                  <div className="font-semibold text-slate-800">{ag.name}</div>
                  <div className="text-slate-500 text-[10px] mb-1.5">{ag.theme}</div>

                  {ag.headlines?.length > 0 && (
                    <div className="text-[10px] text-slate-600 mb-1">
                      <span className="font-bold">Headlines:</span> {ag.headlines.slice(0, 3).join(' · ')}{ag.headlines.length > 3 ? '…' : ''}
                    </div>
                  )}
                  {ag.call_to_action && (
                    <div className="text-[10px] text-slate-600 mb-1">
                      <span className="font-bold">CTA:</span> {ag.call_to_action}
                    </div>
                  )}

                  {/* Visuales IA */}
                  {ag.image_urls?.length > 0 && (
                    <div className="grid grid-cols-4 gap-1 mt-2">
                      {ag.image_urls.slice(0, 4).map((url, j) => (
                        <a key={j} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded overflow-hidden bg-white border border-pink-200 hover:border-pink-400">
                          <img src={url} alt={`asset ${j}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  {ag.image_prompts?.length > 0 && !ag.image_urls?.length && (
                    <details className="mt-1.5">
                      <summary className="text-[10px] text-pink-700 cursor-pointer font-semibold">Ver {ag.image_prompts.length} prompts visuales</summary>
                      <ul className="text-[10px] text-slate-600 mt-1 space-y-0.5 list-disc list-inside">
                        {ag.image_prompts.map((p, k) => <li key={k}>{p}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Audience Signals (PMax/Demand Gen) */}
        {(draft.audience_signals || []).length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              {draft.audience_signals.length} Audience signals
            </summary>
            <div className="mt-2 space-y-1.5">
              {draft.audience_signals.map((sig, i) => (
                <div key={i} className="p-2 bg-blue-50 rounded border border-blue-100">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px]">{sig.type}</Badge>
                    <span className="font-semibold text-slate-800 text-[11px]">{sig.name}</span>
                  </div>
                  {sig.signals?.length > 0 && (
                    <div className="text-[10px] text-slate-600 mt-1">{sig.signals.slice(0, 4).join(' · ')}</div>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Text Guidelines v23.1 — brand safety AI */}
        {(draft.text_guidelines?.term_exclusions?.length > 0 || draft.text_guidelines?.messaging_restrictions?.length > 0) && (
          <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-slate-700 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Brand Safety AI (v23.1) ·
              {draft.text_guidelines.term_exclusions?.length || 0} exclusions ·
              {draft.text_guidelines.messaging_restrictions?.length || 0} rules
            </summary>
            <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-100 space-y-1.5">
              {draft.text_guidelines.term_exclusions?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-emerald-900 mb-0.5">Términos prohibidos:</div>
                  <div className="flex flex-wrap gap-1">
                    {draft.text_guidelines.term_exclusions.map((t, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white border border-emerald-200 rounded text-emerald-800">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {draft.text_guidelines.messaging_restrictions?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-emerald-900 mb-0.5">Reglas de tono:</div>
                  <ul className="text-[10px] text-emerald-900 space-y-0.5 list-disc list-inside">
                    {draft.text_guidelines.messaging_restrictions.slice(0, 5).map((r, i) => <li key={i}>{r}</li>)}
                    {draft.text_guidelines.messaging_restrictions.length > 5 && (
                      <li className="text-emerald-700 italic">+ {draft.text_guidelines.messaging_restrictions.length - 5} más</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </details>
        )}

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
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {/* Botón híbrido publicar (API real → CSV fallback automático) */}
          <PublishCampaignButton draft={draft} onPublished={onUpdated} />

          {/* Acciones secundarias */}
          <div className="flex gap-2">
            <Button onClick={() => setPreviewOpen(true)} size="sm" variant="outline" className="gap-1.5 flex-1">
              <Eye className="w-3.5 h-3.5" /> Preview
            </Button>
            <Button onClick={exportCSV} disabled={exporting} size="sm" variant="outline" className="gap-1.5 flex-1">
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {csvUrl ? 'Re-exportar CSV' : 'Exportar CSV'}
            </Button>
            {csvUrl && (
              <a href={csvUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>

      <AdPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} draft={draft} />
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