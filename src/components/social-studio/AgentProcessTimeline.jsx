// ============================================================================
// AgentProcessTimeline · Muestra EN VIVO los procesos que ejecuta el agente Meta
// Ads (deep search, scraping, investigación de competencia, etc.). Cada tool_call
// se traduce a un paso legible con su estado (corriendo / hecho / falló) para que
// el founder vea que realmente está saliendo a internet y qué está haciendo.
// Cuando una herramienta de inteligencia de mercado termina, despliega sus
// resultados ordenados como vCards (competidores, keywords, tendencias).
// ============================================================================
import { useState } from 'react';
import {
  Loader2, CheckCircle2, XCircle, Search, Globe, BarChart2, ShieldCheck,
  Activity, Megaphone, Brain, ShoppingBag, Image as ImageIcon, Target,
  ChevronDown, ChevronRight, TrendingUp, Building2, KeyRound, Zap,
} from 'lucide-react';

// Cada herramienta → label humano + ícono + verbo en gerundio (mientras corre).
const TOOL_META = {
  metaAgentMarketIntel:    { label: 'Investigación de mercado en vivo', running: 'Buscando en internet (deep search)…', icon: Globe },
  metaAgentCatalogLinks:   { label: 'Catálogo de productos PEYU',       running: 'Leyendo todos los productos…',         icon: ShoppingBag },
  metaAgentMemory:         { label: 'Memoria del agente',               running: 'Recordando decisiones previas…',       icon: Brain },
  metaAccountIntelligence: { label: 'Informe ejecutivo de la cuenta',   running: 'Analizando la cuenta Meta…',           icon: BarChart2 },
  metaAdsDeepDive:         { label: 'Análisis profundo de campañas',    running: 'Profundizando en ad sets y anuncios…', icon: Target },
  metaAdsPerformance:      { label: 'Rendimiento de campañas',          running: 'Trayendo métricas reales…',            icon: BarChart2 },
  metaSetupAudit:          { label: 'Auditoría de setup',               running: 'Auditando pixel y audiencias…',        icon: ShieldCheck },
  metaConversionTracking:  { label: 'Rastreo de conversiones',          running: 'Cruzando Purchase y Lead…',            icon: Activity },
  metaAdsManage:           { label: 'Gestión de Meta Ads',              running: 'Operando en Ads Manager…',             icon: Megaphone },
  metaConversionsAPI:      { label: 'Conversions API',                  running: 'Enviando evento server-side…',         icon: Activity },
  agentGenerateMedia:      { label: 'Generación de creativo',           running: 'Creando el creativo con IA…',          icon: ImageIcon },
  metaAdsCreateCampaign:   { label: 'Creación de campaña',              running: 'Montando la campaña en Meta…',         icon: Megaphone },
  web_search:              { label: 'Búsqueda web profunda',            running: 'Rastreando la web en vivo…',           icon: Search },
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

// ── vCards de resultados de inteligencia de mercado ──────────────────────────
function CompetidorCard({ c }) {
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Building2 className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
        <span className="text-[12px] font-bold text-white/90 truncate">{c.nombre}</span>
        {c.tipo && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-200 font-semibold flex-shrink-0">{c.tipo}</span>}
      </div>
      {c.angulo && <p className="text-[11px] text-white/65 leading-snug"><span className="text-white/40">Ángulo:</span> {c.angulo}</p>}
      {c.presencia_meta && <p className="text-[11px] text-white/55 leading-snug mt-0.5"><span className="text-white/40">Meta/IG:</span> {c.presencia_meta}</p>}
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {c.precio_rango && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/60">{c.precio_rango}</span>}
        {c.debilidad && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/12 text-emerald-200">PEYU gana: {c.debilidad}</span>}
      </div>
    </div>
  );
}

function KeywordRow({ k }) {
  const intCls = { transaccional: 'text-emerald-200 bg-emerald-500/12', comercial: 'text-blue-200 bg-blue-500/12', informacional: 'text-violet-200 bg-violet-500/12' }[k.intencion] || 'text-white/60 bg-white/[0.06]';
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5">
      <KeyRound className="w-3 h-3 text-cyan-300 flex-shrink-0" />
      <span className="text-[11px] font-semibold text-white/85 flex-1 truncate">{k.termino}</span>
      {k.segmento && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/55 flex-shrink-0">{k.segmento}</span>}
      {k.intencion && <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${intCls}`}>{k.intencion}</span>}
      {k.uso && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-500/12 text-teal-200 flex-shrink-0 hidden sm:inline">{k.uso}</span>}
    </div>
  );
}

function TendenciaRow({ t }) {
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <TrendingUp className="w-3.5 h-3.5 text-violet-300 flex-shrink-0" />
        <span className="text-[12px] font-bold text-white/90">{t.tendencia}</span>
      </div>
      {t.por_que_importa && <p className="text-[11px] text-white/60 leading-snug">{t.por_que_importa}</p>}
      {t.accion_peyu && <p className="text-[11px] text-emerald-200/90 leading-snug mt-1">→ {t.accion_peyu}</p>}
    </div>
  );
}

// Renderiza el resultado de metaAgentMarketIntel ordenado por su modo.
function MarketIntelResults({ data }) {
  if (!data?.ok) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {data.resumen && <p className="text-[11px] text-white/70 italic leading-snug px-0.5">{data.resumen}</p>}
      {data.competidores?.length > 0 && (
        <div className="space-y-1.5">
          {data.competidores.map((c, i) => <CompetidorCard key={i} c={c} />)}
        </div>
      )}
      {data.oportunidades_peyu?.length > 0 && (
        <div className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 p-2.5">
          <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wide mb-1">Oportunidades PEYU</p>
          <ul className="space-y-0.5">
            {data.oportunidades_peyu.map((o, i) => (
              <li key={i} className="text-[11px] text-white/70 leading-snug flex gap-1.5">
                <span className="text-emerald-300">•</span> {o}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.keywords?.length > 0 && (
        <div className="space-y-1">
          {data.keywords.map((k, i) => <KeywordRow key={i} k={k} />)}
          {data.clusters_geo?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-[9px] text-white/40 uppercase tracking-wide self-center">GEO:</span>
              {data.clusters_geo.map((g, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/12 text-sky-200">{g}</span>
              ))}
            </div>
          )}
        </div>
      )}
      {data.tendencias?.length > 0 && (
        <div className="space-y-1.5">
          {data.tendencias.map((t, i) => <TendenciaRow key={i} t={t} />)}
        </div>
      )}
    </div>
  );
}

function ProcessStep({ tc }) {
  const [open, setOpen] = useState(false);
  const meta = metaFor(tc.name);
  const Icon = meta.icon;
  const st = statusOf(tc);
  const results = safeParse(tc.results);
  const isMarketIntel = tc.name === 'metaAgentMarketIntel' && st === 'done' && results?.ok;
  const canExpand = isMarketIntel;

  return (
    <div className={`rounded-xl border overflow-hidden ${
      st === 'failed' ? 'border-red-500/25 bg-red-500/[0.05]'
        : st === 'done' ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
        : 'border-blue-500/25 bg-blue-500/[0.06]'
    }`}>
      <button
        onClick={() => canExpand && setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left ${canExpand ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${st === 'failed' ? 'text-red-300' : st === 'done' ? 'text-emerald-300' : 'text-blue-300'}`} />
        <span className="text-[11px] font-semibold text-white/85 flex-1 min-w-0 truncate">
          {st === 'running' ? meta.running : meta.label}
        </span>
        {st === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300 flex-shrink-0" />}
        {st === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
        {st === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
        {canExpand && (open ? <ChevronDown className="w-3.5 h-3.5 text-white/40 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />)}
      </button>
      {open && isMarketIntel && (
        <div className="px-2.5 pb-2.5 border-t border-white/10 pt-2">
          <MarketIntelResults data={results} />
        </div>
      )}
    </div>
  );
}

export default function AgentProcessTimeline({ toolCalls }) {
  if (!toolCalls?.length) return null;
  const anyRunning = toolCalls.some((tc) => statusOf(tc) === 'running');
  return (
    <div className="space-y-1.5 mb-2">
      <div className="flex items-center gap-1.5 px-0.5">
        <Search className={`w-3 h-3 ${anyRunning ? 'text-blue-300 animate-pulse' : 'text-white/30'}`} />
        <span className="text-[9px] uppercase tracking-wider text-white/35 font-bold">
          {anyRunning ? 'Procesos en ejecución' : 'Procesos ejecutados'}
        </span>
      </div>
      {toolCalls.map((tc, i) => <ProcessStep key={i} tc={tc} />)}
    </div>
  );
}