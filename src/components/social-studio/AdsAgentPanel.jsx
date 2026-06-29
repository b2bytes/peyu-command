// ============================================================================
// AdsAgentPanel · Centro de Control de Google Ads dentro de Social Studio.
// Igualado al panel de Meta Ads: conversaciones GUARDADAS (historial reabrible),
// voz de Joaquín (ElevenLabs), guardar en base de conocimiento, markdown rico
// en cards, timeline de procesos en vivo con cards hermosas (campaña, forecast,
// keywords), visión (adjuntar creativos), y KPIs reales del sitio (GA4 en vivo).
// Entrenado a nivel agencia mundial Google Ads · junio 2026 (GML 2026).
// ============================================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Send, Loader2, User, Megaphone, Target, ShoppingBag, Sparkles, Search,
  TrendingUp, BarChart2, Zap, Brain, Lightbulb, Gauge, KeyRound, Activity,
  RefreshCw, AlertCircle, Eye, MousePointerClick, Users, ImagePlus, X,
  Volume2, Pause, Play,
} from 'lucide-react';
import AgentLayout from './AgentLayout';
import MetaAdsHistory from './MetaAdsHistory';
import MetaAgentMarkdown from './MetaAgentMarkdown';
import GoogleAdsProcessTimeline from './GoogleAdsProcessTimeline';
import SaveKnowledgeButton from '@/components/agente-os/SaveKnowledgeButton';
import useAgentVoice from '@/hooks/useAgentVoice';

const AGENT_NAME = 'ads_strategist_2026';

const QUICK_PROMPTS = [
  { icon: Megaphone,  label: 'PEYU general (PMax)',        prompt: 'Quiero una campaña always-on de marca PEYU para B2C. Propónme la mejor estructura Performance Max 2026 con presupuesto sugerido y landing, y guíame paso a paso para crearla. Cuando esté claro, génerala y ofréceme el CSV.' },
  { icon: Target,     label: 'Fiestas Patrias · Empresas', prompt: 'Necesito vender regalos corporativos para Fiestas Patrias a empresas (RRHH y compras). Recomiéndame el tipo de campaña ideal y armémosla juntos paso a paso, landing https://peyuchile.cl/fiestas-patrias/empresas.' },
  { icon: ShoppingBag,label: 'Carcasas B2C (Demand Gen)',  prompt: 'Quiero vender carcasas recicladas de celular a consumidor final con una campaña visual de descubrimiento. Guíame para armar la mejor Demand Gen 2026 con creativos, landing https://peyuchile.cl/CatalogoNuevo.' },
  { icon: Search,     label: 'AI Max for Search',          prompt: 'Explícame en 3 líneas qué es AI Max for Search (lo que reemplaza a DSA) y arma conmigo una campaña Search AI Max de alta intención para lead gen B2B. Vamos paso a paso.' },
  { icon: BarChart2,  label: '¿Qué campaña conviene?',     prompt: 'Tengo CLP $20.000/día para vender más este mes. ¿Qué tipo de campaña Google Ads me conviene (Search AI Max, Shopping, PMax o Demand Gen) y por qué? Recomiéndame el mejor mix 2026.' },
  { icon: KeyRound,   label: 'Keywords de alta intención', prompt: 'Tráeme oportunidades reales de keywords de alta intención para PEYU (B2C eco y B2B regalo corporativo) y dime cómo usarlas en mis campañas Search/Shopping.' },
  { icon: Activity,   label: 'GA4 en vivo del sitio',      prompt: 'Trae las métricas en vivo de Google Analytics 4 de mi sitio y dime qué páginas/productos están convirtiendo más para decidir hacia dónde mandar el tráfico pagado.' },
  { icon: Gauge,      label: 'Auditar mi cuenta',          prompt: 'Hazme una auditoría de agencia de mi setup Google Ads, empezando por lo más crítico (medición: Enhanced Conversions, GA4, atribución data-driven). Explícame el primer hallazgo y avanzamos uno por uno.' },
  { icon: TrendingUp, label: 'Medición moderna 2026',      prompt: '¿Cómo debería medir conversiones en 2026 (Enhanced Conversions, server-side, Consent Mode v2, GA4, atribución data-driven o Meridian/MMM)? Dame el setup recomendado para PEYU.' },
  { icon: Lightbulb,  label: 'Novedades GML 2026',         prompt: 'Resúmeme las novedades de Google Marketing Live 2026 que más me convienen (Ads in AI Mode, AI Brief, Business Agent for Leads, AI Max Shopping, Demand-Led Budget Pacing, Journey-Aware Bidding) y cuál aprovecho primero.' },
  { icon: Brain,      label: '¿Qué recuerdas de mí?',      prompt: 'Recupera de tu memoria lo que ya sabes de mis objetivos de ROAS/presupuesto, decisiones y aprendizajes de campañas pasadas. Hazme un resumen.' },
];

const CAMPAIGN_TYPES = [
  { label: 'Search AI Max', desc: 'Reemplaza DSA · intención semántica', icon: Search },
  { label: 'Shopping (Merchant API)', desc: 'Catálogo feed-first 2026', icon: ShoppingBag },
  { label: 'Performance Max', desc: 'IA optimiza todo el inventario', icon: Zap },
  { label: 'Demand Gen', desc: 'Descubrimiento visual · YouTube', icon: Sparkles },
];

function fmtNum(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n);
}

function ChatMessage({ msg, msgId, voice }) {
  const isUser = msg.role === 'user';
  const speakingThis = voice?.speakingId === msgId;
  const loadingThis = voice?.loadingId === msgId;
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-cyan-500 to-blue-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Megaphone className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[88%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {!isUser && msg.tool_calls?.length > 0 && (
          <GoogleAdsProcessTimeline toolCalls={msg.tool_calls} />
        )}
        {/* Imágenes adjuntas por el founder — el agente las VE (computer vision) */}
        {isUser && msg.file_urls?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1.5 justify-end">
            {msg.file_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="Adjunto" className="max-h-44 rounded-xl border border-cyan-500/30 object-cover" />
              </a>
            ))}
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
              <MetaAgentMarkdown content={msg.content} />
            )}
          </div>
        )}
        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isUser ? 'justify-end' : ''}`}>
          <p className="text-[10px] text-white/20">
            {isUser ? 'Tú' : '🎯 Estratega de Google Ads · PEYU'}
          </p>
          {!isUser && msg.content && (
            <div className="flex items-center gap-0.5">
              {voice && (
                <button
                  onClick={() => voice.speak(msgId, msg.content)}
                  className={`p-1 rounded-full transition-colors ${speakingThis ? 'bg-emerald-500/15 text-emerald-300' : 'text-white/40 hover:text-cyan-300 hover:bg-cyan-500/10'}`}
                  title={speakingThis ? (voice.paused ? 'Reanudar' : 'Pausar') : 'Escuchar con la voz de Joaquín'}
                >
                  {loadingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : speakingThis ? (voice.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />)
                    : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}
              <SaveKnowledgeButton text={msg.content} source="google_ads" dark />
            </div>
          )}
        </div>
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
  const [attachments, setAttachments] = useState([]); // [{name, url}]
  const [uploading, setUploading] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const voice = useAgentVoice();

  // KPIs reales del sitio (columna derecha) — GA4 en vivo.
  const [ga, setGa] = useState(null);
  const [gaLoading, setGaLoading] = useState(true);

  const loadGa = useCallback(async () => {
    setGaLoading(true);
    try {
      const res = await base44.functions.invoke('gaFetchRealtime', {});
      setGa(res.data);
    } catch (e) {
      setGa({ error: e.message });
    } finally {
      setGaLoading(false);
    }
  }, []);

  const initConversation = useCallback(async () => {
    setIniting(true);
    voice.stop();
    setMessages([]);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Google Ads ${new Date().toLocaleDateString('es-CL')}` },
      });
      setConversation(conv);
      setMessages([{
        role: 'assistant',
        content: `¡Hola! 🎯 Soy tu **Superagente de Google Ads** — nivel agencia mundial, junio 2026.\n\nConstruimos cada campaña **juntos, paso a paso** (Search AI Max, Shopping con Merchant API, Performance Max, Demand Gen). Ahora con **memoria** (recuerdo tus decisiones entre conversaciones), **visión** (súbeme un creativo y lo analizo), **GA4 en vivo** y dominio total de **Google Marketing Live 2026**.\n\nGenero la campaña, te muestro el forecast y te dejo el **CSV listo para Google Ads Editor**. Elige una acción rápida o dime tu objetivo. ¿Partimos?`,
        tool_calls: [],
      }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'Error al iniciar el agente. Intenta recargar.', tool_calls: [] }]);
    } finally {
      setIniting(false);
    }
  }, []);

  // Reabrir una conversación pasada con su historial completo.
  const openThread = useCallback(async (thread) => {
    if (!thread?.id || initing) return;
    setIniting(true);
    voice.stop();
    setMessages([]);
    try {
      const conv = await base44.agents.getConversation(thread.id);
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch {
      setMessages([{ role: 'assistant', content: 'No pude abrir esa conversación. Intenta de nuevo.', tool_calls: [] }]);
    } finally {
      setIniting(false);
    }
  }, [initing]);

  useEffect(() => { initConversation(); loadGa(); }, [initConversation, loadGa]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant' && last.content?.trim()) {
        setLoading(false);
        setHistoryKey((k) => k + 1);
      }
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAttach = async (files) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    setUploading(true);
    try {
      const subidos = await Promise.all(imgs.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { name: file.name, url: file_url };
      }));
      setAttachments((prev) => [...prev, ...subidos]);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    const fileUrls = attachments.map((a) => a.url);
    if ((!msg && fileUrls.length === 0) || loading || !conversation) return;
    setInput('');
    setAttachments([]);
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: msg || 'Analiza esta imagen.',
        file_urls: fileUrls,
      });
    } catch {
      setLoading(false);
    }
  };

  // ── Columna izquierda · acciones + historial guardado ─────────────────────
  const left = (
    <div className="p-3 space-y-1">
      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 px-1">Acciones rápidas</p>
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
      <MetaAdsHistory
        agentName={AGENT_NAME}
        activeId={conversation?.id}
        refreshKey={historyKey}
        onSelect={openThread}
      />
    </div>
  );

  // ── Columna derecha · GA4 en vivo + tipos de campaña 2026 ─────────────────
  const right = (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[9px] text-white/30 uppercase tracking-wider">Sitio en vivo · GA4</p>
        <button onClick={loadGa} disabled={gaLoading} className="text-white/30 hover:text-white transition-colors">
          <RefreshCw className={`w-3 h-3 ${gaLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {gaLoading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-white/30">
          <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-xs">Cargando…</span>
        </div>
      ) : ga?.error ? (
        <div className="rounded-xl bg-amber-500/[0.08] border border-amber-500/25 p-3">
          <p className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-3.5 h-3.5" /> GA4 no disponible
          </p>
          <p className="text-[10px] text-white/60 leading-snug">{ga.error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <KpiBox label="Activos ahora" value={fmtNum(ga?.activeUsers ?? ga?.active_users)} icon={Users} accent="text-emerald-300" />
            <KpiBox label="Vistas 30 min" value={fmtNum(ga?.screenPageViews ?? ga?.pageviews)} icon={Eye} accent="text-cyan-300" />
          </div>
          {Array.isArray(ga?.topPages || ga?.top_pages) && (ga.topPages || ga.top_pages).length > 0 && (
            <div>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 px-1">Páginas activas</p>
              <div className="space-y-1">
                {(ga.topPages || ga.top_pages).slice(0, 6).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-1.5">
                    <MousePointerClick className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <span className="text-[11px] text-white/75 flex-1 truncate">{p.page || p.path || p.pagePath}</span>
                    <span className="text-[10px] text-white/45 font-semibold flex-shrink-0">{fmtNum(p.views ?? p.activeUsers ?? p.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

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
    </div>
  );

  return (
    <AgentLayout
      accent="cyan"
      title="Centro de Control · Google Ads"
      subtitle="Search AI Max · Shopping · PMax · Demand Gen · GML 2026"
      HeaderIcon={Megaphone}
      storageKey="google_ads"
      left={left}
      right={right}
      onReset={initConversation}
      resetting={initing}
    >
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0 p-4 space-y-4">
        {initing ? (
          <div className="flex items-center justify-center h-full gap-2 text-white/30">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Iniciando estratega de Google Ads…</span>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} msgId={i} voice={voice} />)}
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

      <div className="flex-shrink-0 px-3 py-3 border-t border-white/10 bg-black/20">
        <div className="max-w-3xl mx-auto space-y-2">
          {(attachments.length > 0 || uploading) && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div key={i} className="relative group">
                  <img src={a.url} alt={a.name} className="w-14 h-14 rounded-lg object-cover border border-white/15" />
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white/70 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {uploading && (
                <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { handleAttach(e.target.files); e.target.value = ''; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={initing || uploading}
              title="Adjuntar creativo para que el agente lo analice"
              className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/15 hover:bg-white/[0.12] disabled:opacity-30 flex items-center justify-center flex-shrink-0 transition-all"
            >
              <ImagePlus className="w-4 h-4 text-white/70" />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Construyamos una campaña, sube un creativo, pide keywords o GA4 en vivo…"
              disabled={initing}
              className="flex-1 bg-white/[0.06] border border-white/15 text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all disabled:opacity-40"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && attachments.length === 0) || initing}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-lg shadow-cyan-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}

function KpiBox({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${accent}`} />
        <span className="text-[9px] text-white/40 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-sm font-black leading-none ${accent}`}>{value}</p>
    </div>
  );
}