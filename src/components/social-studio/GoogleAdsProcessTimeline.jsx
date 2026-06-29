// ============================================================================
// GoogleAdsProcessTimeline · Muestra EN VIVO los procesos que ejecuta el
// Estratega de Google Ads (generar campaña, forecast, export CSV, keywords,
// GA4 en vivo, análisis de rendimiento). Cada tool_call se traduce a un paso
// legible con su estado. Cuando una herramienta termina con datos ricos
// (campaña generada, forecast, keywords), despliega su resultado como cards
// hermosas dentro de la misma conversación.
// Tema oscuro (cyan/blue) coordinado con el panel de Google Ads.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Loader2, CheckCircle2, XCircle, Search, BarChart2, Megaphone, Target,
  ShoppingBag, Sparkles, Zap, Download, TrendingUp, KeyRound, Activity,
  ChevronDown, ChevronRight, Globe, FileSpreadsheet, Gauge,
} from 'lucide-react';

// Cada herramienta → label humano + ícono + verbo en gerundio (mientras corre).
const TOOL_META = {
  adsGenerateCampaign2026:   { label: 'Campaña generada',              running: 'Construyendo la campaña completa…',     icon: Megaphone },
  adsExportEditor:           { label: 'CSV para Google Ads Editor',    running: 'Exportando CSV de subida masiva…',      icon: FileSpreadsheet },
  adsForecastPerformance:    { label: 'Forecast de performance',       running: 'Proyectando KPIs esperados…',           icon: Gauge },
  adsAnalyzePerformance:     { label: 'Análisis de rendimiento',       running: 'Analizando campañas en vivo…',          icon: BarChart2 },
  exploreKeywordOpportunities:{ label: 'Oportunidades de keywords',    running: 'Investigando keywords reales…',         icon: KeyRound },
  gaFetchRealtime:           { label: 'Google Analytics en vivo',      running: 'Trayendo métricas GA4 en tiempo real…', icon: Activity },
  web_search:                { label: 'Búsqueda web profunda',         running: 'Rastreando la web en vivo…',            icon: Search },
};

function metaFor(name = '') {
  return TOOL_META[name] || { label: name || 'Procesando', running: 'Ejecutando…', icon: Zap };
}

function statusOf(tc) {
  const s = (tc?.status || 'pending').toLowerCase();
  if (s === 'completed' || s === 'success') return 'done';
  if (s === 'failed' || s === 'error') return 'failed';
  return 'running';
}

function safeParse(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return null; }
}

const CAMPAIGN_ICON = {
  Search: Search, Shopping: ShoppingBag, 'Performance Max': Zap, 'Demand Gen': Sparkles,
};

// ── Card de campaña generada (con export de CSV embebido) ────────────────────
function CampaignCard({ draft }) {
  const [exporting, setExporting] = useState(false);
  const [csvUrl, setCsvUrl] = useState(draft?.exported_csv_url || null);

  const exportar = async () => {
    if (!draft?.id) return;
    setExporting(true);
    try {
      const res = await base44.functions.invoke('adsExportEditor', { draft_id: draft.id });
      if (res?.data?.file_url) setCsvUrl(res.data.file_url);
    } finally { setExporting(false); }
  };

  const TypeIcon = CAMPAIGN_ICON[draft.campaign_type] || Megaphone;
  const adGroups = draft.ad_groups?.length || 0;
  const assetGroups = draft.asset_groups?.length || 0;
  const keywords = draft.keywords?.length || 0;

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-cyan-500/25 bg-gradient-to-br from-cyan-500/[0.08] to-blue-500/[0.04]">
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-white/[0.07]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <TypeIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-bold text-white/90 truncate flex-1">{draft.campaign_name}</span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 flex-shrink-0">{draft.campaign_type}</span>
      </div>
      <div className="p-3 space-y-2.5">
        {draft.daily_budget_clp && (
          <p className="text-[11px] text-white/55">
            Presupuesto <span className="text-white font-bold">${Number(draft.daily_budget_clp).toLocaleString('es-CL')}/día</span>
            {draft.bid_strategy && <> · {draft.bid_strategy}</>}
          </p>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: 'CTR esp.', v: draft.expected_ctr_pct ? `${draft.expected_ctr_pct}%` : '—', a: 'text-violet-300' },
            { l: 'CAC esp.', v: draft.expected_cac_clp ? '$' + Math.round(draft.expected_cac_clp).toLocaleString('es-CL') : '—', a: 'text-amber-300' },
            { l: 'Conv/sem', v: draft.expected_conversions_week || '—', a: 'text-emerald-300' },
          ].map(({ l, v, a }) => (
            <div key={l} className="rounded-lg bg-white/[0.05] border border-white/[0.06] p-2 text-center">
              <p className="text-[8px] text-white/40 uppercase tracking-wide">{l}</p>
              <p className={`text-xs font-black ${a}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 text-[9px]">
          {adGroups > 0 && <Chip><Target className="w-2.5 h-2.5" /> {adGroups} ad groups</Chip>}
          {assetGroups > 0 && <Chip><Sparkles className="w-2.5 h-2.5" /> {assetGroups} asset groups</Chip>}
          {keywords > 0 && <Chip><KeyRound className="w-2.5 h-2.5" /> {keywords} keywords</Chip>}
        </div>
        {csvUrl ? (
          <a href={csvUrl} download className="w-full h-9 rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition">
            <CheckCircle2 className="w-3.5 h-3.5" /> Descargar CSV para Google Ads
          </a>
        ) : (
          <button onClick={exportar} disabled={exporting} className="w-full h-9 rounded-lg bg-cyan-500/90 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exporting ? 'Exportando…' : 'Exportar a Google Ads Editor (CSV)'}
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({ children }) {
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/8 text-white/60 font-semibold">{children}</span>;
}

// ── Card de forecast ─────────────────────────────────────────────────────────
function ForecastCard({ data }) {
  const f = data.forecast || data;
  const verdict = (data.verdict || f.verdict || '').toUpperCase();
  const vCls = verdict.includes('WINNER') || verdict.includes('GANA') ? 'text-emerald-300 bg-emerald-500/15'
    : verdict.includes('LOSER') || verdict.includes('PIERDE') ? 'text-red-300 bg-red-500/15'
    : 'text-amber-300 bg-amber-500/15';
  const items = [
    { l: 'Impresiones/sem', v: f.impressions_week ?? f.impressions },
    { l: 'Clics/sem', v: f.clicks_week ?? f.clicks },
    { l: 'CTR', v: f.ctr_pct != null ? `${f.ctr_pct}%` : null },
    { l: 'Conv/sem', v: f.conversions_week ?? f.conversions },
    { l: 'CAC', v: f.cac_clp != null ? '$' + Math.round(f.cac_clp).toLocaleString('es-CL') : null },
    { l: 'ROAS', v: f.roas != null ? `${f.roas}x` : null },
  ].filter((x) => x.v != null && x.v !== '');
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-violet-500/25 bg-violet-500/[0.06]">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-white/[0.07]">
        <Gauge className="w-3.5 h-3.5 text-violet-300" />
        <span className="text-xs font-bold text-violet-200">Forecast de performance</span>
        {verdict && <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full ${vCls}`}>{verdict}</span>}
      </div>
      <div className="p-3 grid grid-cols-3 gap-1.5">
        {items.map(({ l, v }) => (
          <div key={l} className="rounded-lg bg-white/[0.05] p-2 text-center">
            <p className="text-[8px] text-white/40 uppercase tracking-wide">{l}</p>
            <p className="text-xs font-black text-white">{typeof v === 'number' ? v.toLocaleString('es-CL') : v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cards de keywords ────────────────────────────────────────────────────────
function KeywordsCard({ data }) {
  const kws = data.keywords || data.oportunidades || [];
  if (!kws.length) return null;
  const intCls = { transaccional: 'text-emerald-200 bg-emerald-500/12', comercial: 'text-blue-200 bg-blue-500/12', informacional: 'text-violet-200 bg-violet-500/12' };
  return (
    <div className="mt-2 space-y-1">
      {kws.slice(0, 12).map((k, i) => {
        const termino = k.termino || k.keyword || k.term || (typeof k === 'string' ? k : '');
        return (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5">
            <KeyRound className="w-3 h-3 text-cyan-300 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-white/85 flex-1 truncate">{termino}</span>
            {k.volumen && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/55 flex-shrink-0">{k.volumen} búsq</span>}
            {k.intencion && <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${intCls[k.intencion] || 'text-white/60 bg-white/[0.06]'}`}>{k.intencion}</span>}
          </div>
        );
      })}
    </div>
  );
}

function ProcessStep({ tc }) {
  const [open, setOpen] = useState(false);
  const meta = metaFor(tc.name);
  const Icon = meta.icon;
  const st = statusOf(tc);
  const results = safeParse(tc.results);

  // ¿Qué card rica podemos desplegar al terminar?
  const draft = st === 'done' ? (results?.draft || (results?.campaign_name ? results : null)) : null;
  const isForecast = st === 'done' && tc.name === 'adsForecastPerformance' && results;
  const isKeywords = st === 'done' && tc.name === 'exploreKeywordOpportunities' && (results?.keywords?.length || results?.oportunidades?.length);
  const canExpand = !!(draft || isForecast || isKeywords);

  return (
    <div className={`rounded-xl border overflow-hidden ${
      st === 'failed' ? 'border-red-500/25 bg-red-500/[0.05]'
        : st === 'done' ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
        : 'border-cyan-500/25 bg-cyan-500/[0.06]'
    }`}>
      <button
        onClick={() => canExpand && setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${st === 'failed' ? 'text-red-300' : st === 'done' ? 'text-emerald-300' : 'text-cyan-300'}`} />
        <span className="text-[11px] font-semibold text-white/85 flex-1 min-w-0 truncate">
          {st === 'running' ? meta.running : meta.label}
        </span>
        {st === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300 flex-shrink-0" />}
        {st === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
        {st === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
        {canExpand && (open ? <ChevronDown className="w-3.5 h-3.5 text-white/40 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />)}
      </button>
      {open && (
        <div className="px-2.5 pb-2.5 border-t border-white/10 pt-1">
          {draft && <CampaignCard draft={draft} />}
          {isForecast && <ForecastCard data={results} />}
          {isKeywords && <KeywordsCard data={results} />}
        </div>
      )}
    </div>
  );
}

export default function GoogleAdsProcessTimeline({ toolCalls }) {
  if (!toolCalls?.length) return null;
  const anyRunning = toolCalls.some((tc) => statusOf(tc) === 'running');
  // Campañas generadas que SIEMPRE se muestran abiertas (no plegadas), porque
  // son el entregable estrella del agente.
  const generatedDrafts = [];
  for (const tc of toolCalls) {
    if (tc.name === 'adsGenerateCampaign2026' && statusOf(tc) === 'done') {
      const r = safeParse(tc.results);
      const d = r?.draft || (r?.campaign_name ? r : null);
      if (d) generatedDrafts.push(d);
    }
  }
  return (
    <div className="space-y-1.5 mb-2">
      <div className="flex items-center gap-1.5 px-0.5">
        <Globe className={`w-3 h-3 ${anyRunning ? 'text-cyan-300 animate-pulse' : 'text-white/30'}`} />
        <span className="text-[9px] uppercase tracking-wider text-white/35 font-bold">
          {anyRunning ? 'Procesos en ejecución' : 'Procesos ejecutados'}
        </span>
      </div>
      {toolCalls.map((tc, i) => <ProcessStep key={i} tc={tc} />)}
      {/* Campañas generadas, siempre visibles como entregable destacado */}
      {generatedDrafts.map((d, i) => <CampaignCard key={`draft-${i}`} draft={d} />)}
    </div>
  );
}