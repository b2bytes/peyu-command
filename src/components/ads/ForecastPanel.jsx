// ============================================================================
// ForecastPanel — Predicción IA de rendimiento del draft antes de publicar
// ----------------------------------------------------------------------------
// Muestra el resultado de adsForecastPerformance:
//   - Score esperado + verdict (ship_it / review / pivot / kill)
//   - Rangos pesimista/esperado/optimista para 5 KPIs
//   - Fortalezas, riesgos y sugerencias accionables
// Si no hay forecast aún, ofrece botón para correr el análisis.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Loader2, TrendingUp, TrendingDown, MinusCircle, Target as TargetIcon,
  AlertTriangle, CheckCircle2, Sparkles, Wand2, Activity, Zap, Skull, RefreshCw
} from 'lucide-react';

const ForecastIcon = Activity;

const VERDICT_STYLES = {
  ship_it: { bg: 'bg-emerald-500', border: 'border-emerald-200', text: 'text-emerald-700', label: 'LANZAR', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  review:  { bg: 'bg-amber-500',   border: 'border-amber-200',   text: 'text-amber-700',   label: 'REVISAR', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  pivot:   { bg: 'bg-orange-500',  border: 'border-orange-200',  text: 'text-orange-700',  label: 'PIVOTAR', icon: <Wand2 className="w-3.5 h-3.5" /> },
  kill:    { bg: 'bg-red-500',     border: 'border-red-200',     text: 'text-red-700',     label: 'MATAR',   icon: <Skull className="w-3.5 h-3.5" /> },
};

const IMPACT_COLORS = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-slate-500' };

const fmtClp = (n) => n ? `$${Math.round(n).toLocaleString('es-CL')}` : '—';
const fmtNum = (n) => n != null ? Math.round(n).toLocaleString('es-CL') : '—';
const fmtPct = (n) => n != null ? `${(+n).toFixed(2)}%` : '—';
const fmtRoas = (n) => n != null ? `${(+n).toFixed(2)}x` : '—';

export default function ForecastPanel({ draft, onUpdated }) {
  const [running, setRunning] = useState(false);
  const forecast = draft.forecast;

  const runForecast = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke('adsForecastPerformance', { draft_id: draft.id });
      if (onUpdated) onUpdated();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  // Estado vacío: ofrecer correr forecast
  if (!forecast) {
    return (
      <div className="p-3 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0">
              <ForecastIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                Ads Performance Forecaster
                <span className="text-[9px] font-bold bg-violet-600 text-white px-1.5 py-0.5 rounded-full">IA</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                Predice CTR, conversiones, CAC y ROAS antes de publicar. Compara contra históricos PEYU.
              </p>
            </div>
          </div>
          <Button
            onClick={runForecast}
            disabled={running}
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex-shrink-0"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Predecir
          </Button>
        </div>
      </div>
    );
  }

  const verdictStyle = VERDICT_STYLES[forecast.verdict] || VERDICT_STYLES.review;

  return (
    <div className={`bg-gradient-to-br from-violet-50 to-indigo-50 border ${verdictStyle.border} rounded-xl overflow-hidden`}>
      {/* Header */}
      <div className="p-3 border-b border-violet-200/60 bg-white/50">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0">
              <ForecastIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-xs text-slate-900">Forecast IA</div>
              <div className="text-[10px] text-slate-500">
                Confianza {forecast.confidence_score}% · {forecast.historical_n || 0} campañas históricas
              </div>
            </div>
          </div>
          <button
            onClick={runForecast}
            disabled={running}
            className="text-[10px] flex items-center gap-1 text-violet-700 hover:text-violet-900 font-semibold"
            title="Re-correr forecast"
          >
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Re-analizar
          </button>
        </div>

        {/* Verdict + Score */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-white text-[10px] font-bold ${verdictStyle.bg}`}>
            {verdictStyle.icon} {verdictStyle.label}
          </span>
          <div className="flex-1">
            <div className="text-[10px] text-slate-600">Performance score</div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${verdictStyle.bg}`}
                  style={{ width: `${forecast.performance_score || 0}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-900">{forecast.performance_score}/100</span>
            </div>
          </div>
        </div>

        {/* Headline */}
        {forecast.headline && (
          <p className="text-[11px] text-slate-700 italic mt-2 leading-snug">"{forecast.headline}"</p>
        )}
      </div>

      {/* KPI ranges */}
      <div className="p-3 space-y-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Predicción semanal (rango)</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
          <KpiRange label="Impresiones" range={forecast.impressions_weekly} fmt={fmtNum} icon={<TrendingUp className="w-3 h-3" />} />
          <KpiRange label="CTR" range={forecast.ctr_pct} fmt={fmtPct} icon={<Activity className="w-3 h-3" />} />
          <KpiRange label="Conversiones" range={forecast.conversions_weekly} fmt={fmtNum} icon={<TargetIcon className="w-3 h-3" />} highlight />
          <KpiRange label="CAC" range={forecast.cac_clp} fmt={fmtClp} icon={<TrendingDown className="w-3 h-3" />} inverted />
          <KpiRange label="ROAS" range={forecast.roas} fmt={fmtRoas} icon={<Zap className="w-3 h-3" />} />
        </div>

        {/* Fortalezas */}
        {forecast.strengths?.length > 0 && (
          <div className="mt-2">
            <div className="text-[10px] font-bold text-emerald-700 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fortalezas
            </div>
            <ul className="text-[10px] text-slate-700 space-y-0.5 list-disc list-inside">
              {forecast.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {/* Riesgos */}
        {forecast.risk_flags?.length > 0 && (
          <div className="mt-2">
            <div className="text-[10px] font-bold text-red-700 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Riesgos detectados
            </div>
            <div className="flex flex-wrap gap-1">
              {forecast.risk_flags.map((r, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded">{r}</span>
              ))}
            </div>
          </div>
        )}

        {/* Sugerencias accionables */}
        {forecast.optimization_suggestions?.length > 0 && (
          <details className="mt-2" open>
            <summary className="cursor-pointer text-[10px] font-bold text-violet-700 flex items-center gap-1">
              <Wand2 className="w-3 h-3" /> {forecast.optimization_suggestions.length} optimizaciones antes de lanzar
            </summary>
            <ul className="mt-1.5 space-y-1">
              {forecast.optimization_suggestions.map((s, i) => (
                <li key={i} className="text-[10px] bg-white border border-violet-100 rounded p-1.5">
                  <div className="flex items-start gap-1.5">
                    <span className={`font-bold ${IMPACT_COLORS[s.impact] || ''}`}>
                      {s.impact === 'high' ? '🔥' : s.impact === 'medium' ? '⚡' : '·'}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800">{s.area}:</span>{' '}
                      <span className="text-slate-700">{s.suggestion}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Comparables */}
        {forecast.comparable_campaigns?.length > 0 && (
          <details className="mt-1">
            <summary className="cursor-pointer text-[10px] font-bold text-slate-500">
              Campañas comparables ({forecast.comparable_campaigns.length})
            </summary>
            <ul className="text-[10px] text-slate-600 mt-1 list-disc list-inside">
              {forecast.comparable_campaigns.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

function KpiRange({ label, range, fmt, icon, inverted = false, highlight = false }) {
  if (!range || range.expected == null) {
    return (
      <div className="bg-slate-50 rounded p-1.5 border border-slate-100">
        <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-0.5">{icon}{label}</div>
        <div className="text-[10px] text-slate-400">Sin datos</div>
      </div>
    );
  }
  return (
    <div className={`rounded p-1.5 border ${highlight ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-100'}`}>
      <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-0.5">{icon}{label}</div>
      <div className="text-sm font-bold text-slate-900 leading-tight">{fmt(range.expected)}</div>
      <div className={`text-[9px] flex items-center gap-1 mt-0.5 ${inverted ? '' : 'text-slate-500'}`}>
        <MinusCircle className="w-2.5 h-2.5" />
        <span className={inverted ? 'text-emerald-600' : 'text-red-500'}>{fmt(range.pessimistic)}</span>
        <span>→</span>
        <span className={inverted ? 'text-red-500' : 'text-emerald-600'}>{fmt(range.optimistic)}</span>
      </div>
    </div>
  );
}