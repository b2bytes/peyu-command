// ============================================================================
// AdsAgentPanel · Agente de Ads PAGADOS (Google Ads + Meta) con poder real.
// Layout agentico de 3 columnas (estilo PEYU v2): acciones · chat · contexto.
// Genera campañas (4 variantes), exporta CSV de Google Ads, forecastea.
// ============================================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Send, Loader2, Bot, User, Megaphone, Target, ShoppingBag,
  Sparkles, Search, CheckCircle2, Download, TrendingUp, BarChart2, Zap,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AgentLayout from './AgentLayout';

const AGENT_NAME = 'ads_strategist_2026';

const QUICK_PROMPTS = [
  { icon: Megaphone, label: 'PEYU general (PMax)', prompt: 'Crea una campaña Performance Max always-on de marca PEYU para B2C, presupuesto CLP $18.000/día, dirigida a la home (https://peyuchile.cl/). Genera los visuales con IA, explícame el racional y luego ofréceme el CSV para Google Ads.' },
  { icon: Target, label: 'Fiestas Patrias · Empresas', prompt: 'Crea una campaña Search para Fiestas Patrias dirigida a EMPRESAS que buscan regalos corporativos, presupuesto CLP $22.000/día, landing https://peyuchile.cl/fiestas-patrias/empresas. Enfócate en RRHH y compras, con logo láser gratis y entrega a tiempo para el 18. Luego ofréceme el CSV.' },
  { icon: ShoppingBag, label: 'Carcasas B2C (Demand Gen)', prompt: 'Crea una campaña Demand Gen visual para vender carcasas recicladas de celular a B2C, presupuesto CLP $15.000/día, landing https://peyuchile.cl/CatalogoNuevo. Genera 4 visuales con IA. Luego exporta el CSV.' },
  { icon: Search, label: 'Shopping del catálogo', prompt: 'Crea una campaña Shopping del catálogo PEYU para B2C, presupuesto CLP $16.000/día, landing https://peyuchile.cl/CatalogoNuevo, con negative keywords exhaustivas. Luego ofréceme el CSV.' },
  { icon: TrendingUp, label: 'Plan Meta Ads (Instagram)', prompt: 'Diseña un plan completo de Meta Ads (Instagram + Facebook) para regalos corporativos B2B: objetivo, públicos (lookalike + retargeting), ángulos creativos, copies y presupuesto, listo para cargar en Meta Ads Manager.' },
  { icon: BarChart2, label: '¿Qué campaña conviene?', prompt: 'Tengo CLP $20.000/día para vender más este mes. ¿Qué tipo de campaña Google Ads me conviene (Search, Shopping, PMax o Demand Gen) y por qué? Recomiéndame el mejor mix 2026.' },
];

const CAMPAIGN_TYPES = [
  { label: 'Search (AI Max)', desc: 'Intención alta · conversión directa', icon: Search },
  { label: 'Shopping', desc: 'Catálogo con feed', icon: ShoppingBag },
  { label: 'Performance Max', desc: 'IA optimiza todo el inventario', icon: Zap },
  { label: 'Demand Gen', desc: 'Descubrimiento visual', icon: Sparkles },
];

// ── Render de una campaña generada + descarga de CSV ────────────────────────
function CampaignResult({ draft }) {
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

  const adGroups = draft.ad_groups?.length || 0;
  const assetGroups = draft.asset_groups?.length || 0;
  const keywords = draft.keywords?.length || 0;

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-cyan-500/20 bg-cyan-500/[0.06]">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-white/5">
        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
        <span className="text-xs font-bold text-cyan-200 truncate">{draft.campaign_name}</span>
        <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200">{draft.campaign_type}</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: 'CTR', v: draft.expected_ctr_pct ? `${draft.expected_ctr_pct}%` : '—' },
            { l: 'CAC', v: draft.expected_cac_clp ? '$' + Math.round(draft.expected_cac_clp).toLocaleString('es-CL') : '—' },
            { l: 'Conv/sem', v: draft.expected_conversions_week || '—' },
          ].map(({ l, v }) => (
            <div key={l} className="rounded-lg bg-white/5 p-1.5 text-center">
              <p className="text-[8px] text-white/40 uppercase">{l}</p>
              <p className="text-xs font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 text-[9px]">
          {adGroups > 0 && <Chip>{adGroups} ad groups</Chip>}
          {assetGroups > 0 && <Chip>{assetGroups} asset groups</Chip>}
          {keywords > 0 && <Chip>{keywords} keywords</Chip>}
          {draft.bid_strategy && <Chip>{draft.bid_strategy}</Chip>}
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
  return <span className="px-1.5 py-0.5 rounded-full bg-white/8 text-white/60 font-semibold">{children}</span>;
}

function ToolCallBadge({ toolCall }) {
  const name = toolCall?.name || '';
  const status = toolCall?.status || 'pending';
  const isRunning = status === 'running' || status === 'in_progress' || status === 'pending';
  const isDone = status === 'completed' || status === 'success';
  const label = {
    adsGenerateCampaign2026: '🎯 Generando campaña completa…',
    adsExportEditor: '📄 Exportando CSV para Google Ads…',
    adsForecastPerformance: '📈 Proyectando performance…',
    adsAnalyzePerformance: '🔬 Analizando rendimiento…',
  }[name] || `⚙️ ${name}…`;
  const doneLabel = {
    adsGenerateCampaign2026: '✅ Campaña generada',
    adsExportEditor: '✅ CSV listo',
    adsForecastPerformance: '✅ Forecast listo',
    adsAnalyzePerformance: '✅ Análisis listo',
  }[name] || '✅ Listo';
  return (
    <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full mt-1 ${
      isDone ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
             : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
    }`}>
      {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
      {isDone && <CheckCircle2 className="w-3 h-3" />}
      {isDone ? doneLabel : label}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  const drafts = [];
  if (msg.tool_calls?.length) {
    for (const tc of msg.tool_calls) {
      if (tc.name === 'adsGenerateCampaign2026' && tc.results) {
        try {
          const parsed = typeof tc.results === 'string' ? JSON.parse(tc.results) : tc.results;
          if (parsed?.draft) drafts.push(parsed.draft);
        } catch { /* ignore */ }
      }
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-cyan-500 to-blue-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Megaphone className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[88%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {!isUser && msg.tool_calls?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {msg.tool_calls.map((tc, i) => <ToolCallBadge key={i} toolCall={tc} />)}
          </div>
        )}
        {msg.content && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${
            isUser
              ? 'bg-teal-600/25 border border-teal-500/30 text-white rounded-tr-sm'
              : 'bg-white/[0.06] border border-white/10 text-white/90 rounded-tl-sm'
          }`}>
            {isUser ? (
              <p className="leading-relaxed">{msg.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-white/85">{children}</li>,
                  strong: ({ children }) => <strong className="text-cyan-300 font-bold">{children}</strong>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-cyan-300 mt-3 mb-1">{children}</h3>,
                  code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono text-cyan-200">{children}</code>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {drafts.map((d, i) => <CampaignResult key={i} draft={d} />)}
        <p className={`text-[10px] text-white/20 mt-1 px-1 ${isUser ? 'text-right' : ''}`}>
          {isUser ? 'Tú' : '🎯 Estratega de Ads · PEYU'}
        </p>
      </div>
    </div>
  );
}

export default function AdsAgentPanel() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initing, setIniting] = useState(true);
  const bottomRef = useRef(null);

  const initConversation = useCallback(async () => {
    setIniting(true);
    setMessages([]);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Ads Session ${new Date().toLocaleDateString('es-CL')}` },
      });
      setConversation(conv);
      setMessages([{
        role: 'assistant',
        content: `¡Hola! 🎯 Soy tu **Estratega de Ads pagados** — Google Ads + Meta Ads.\n\nCreo campañas profesionales completas en todas sus variantes y te las dejo listas para Google Ads: genero copy, keywords, assets y forecast, y te entrego el **CSV para subir a Google Ads Editor** en 1 click.\n\nElige una campaña rápida de la izquierda o dime el objetivo. ¿Partimos?`,
        tool_calls: [],
      }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'Error al iniciar el agente. Intenta recargar.', tool_calls: [] }]);
    } finally {
      setIniting(false);
    }
  }, []);

  useEffect(() => { initConversation(); }, [initConversation]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading || !conversation) return;
    setInput('');
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: msg });
    } finally {
      setLoading(false);
    }
  };

  // ── Columna izquierda · acciones rápidas ──────────────────────────────────
  const left = (
    <div className="p-3 space-y-1">
      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 px-1">Campañas rápidas</p>
      {QUICK_PROMPTS.map((qp) => {
        const Icon = qp.icon;
        return (
          <button
            key={qp.label}
            onClick={() => sendMessage(qp.prompt)}
            disabled={initing || loading}
            className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/15 transition-all text-left group disabled:opacity-40"
          >
            <Icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 group-hover:text-cyan-300" />
            <span className="text-[11px] text-white/70 group-hover:text-white leading-tight">{qp.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ── Columna derecha · contexto (tipos de campaña) ─────────────────────────
  const right = (
    <div className="p-3 space-y-3">
      <div>
        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2 px-1">Tipos de campaña 2026</p>
        <div className="space-y-1.5">
          {CAMPAIGN_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white/85 leading-tight">{t.label}</p>
                  <p className="text-[9px] text-white/40 leading-tight mt-0.5">{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl bg-cyan-500/[0.06] border border-cyan-500/15 p-3">
        <p className="text-[10px] font-bold text-cyan-200 mb-1.5 flex items-center gap-1.5"><Download className="w-3 h-3" /> Cómo subir el CSV</p>
        <ol className="text-[9px] text-white/55 space-y-1 ml-3 list-decimal leading-snug">
          <li>Descarga el CSV de la campaña</li>
          <li>Abre Google Ads Editor</li>
          <li>File → Import → from file</li>
          <li>Revisa y publica</li>
        </ol>
      </div>
    </div>
  );

  return (
    <AgentLayout
      accent="cyan"
      title="Estratega de Ads PEYU"
      subtitle="Google Ads · Meta · CSV listo para subir"
      HeaderIcon={Megaphone}
      left={left}
      right={right}
      onReset={initConversation}
      resetting={initing}
    >
      {/* Stream */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0 p-4 space-y-4">
        {initing ? (
          <div className="flex items-center justify-center h-full gap-2 text-white/30">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Iniciando estratega de ads…</span>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="text-[10px] text-white/40 mr-1">El estratega está trabajando</span>
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-white/10 bg-black/20">
        <div className="flex gap-2 items-center max-w-3xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Crea campañas Google/Meta, exporta CSV, forecastea…"
            disabled={initing}
            className="flex-1 bg-white/[0.06] border border-white/15 text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-40"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || initing}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-lg shadow-cyan-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </AgentLayout>
  );
}