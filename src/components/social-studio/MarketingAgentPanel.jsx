// ============================================================================
// MarketingAgentPanel · Agencia de Marketing IA con herramientas reales.
// Layout agentico de 3 columnas (estilo PEYU v2): acciones · chat · contexto.
// Genera imágenes/videos, campañas semanales, publica posts, CSV de Google Ads.
// ============================================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Send, Loader2, Bot, User, TrendingUp, Calendar, BarChart2,
  Megaphone, Zap, Image as ImageIcon, Sparkles, Play,
  CheckCircle2, ExternalLink, ChevronRight, ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AgentLayout from './AgentLayout';

const AGENT_NAME = 'marketing_orchestrator';

const QUICK_PROMPTS = [
  { icon: Zap,        label: 'Publicar 1 post AHORA',     prompt: 'Publica 1 post ahora en Instagram. Tú eliges el mejor producto y la mejor imagen de la galería (o genera una nueva), escribe el copy con criterio de agencia y publícalo.' },
  { icon: Calendar,   label: 'Publicar semana completa',  prompt: 'Lanza y publica una campaña semanal completa para PEYU: diagnóstico de métricas, plan editorial, imágenes/videos desde fotos reales, posts para Instagram y LinkedIn, publica el de hoy y deja el resto programado en el calendario.' },
  { icon: ImageIcon,  label: 'Ver galería completa',      prompt: 'Muéstrame la galería completa de assets: lista las últimas imágenes y videos generados con su título, tipo y URL, y dime cuáles recomiendas usar esta semana.' },
  { icon: Play,       label: 'Generar VIDEO de producto', prompt: 'Genera un video formato reel (9:16) del pack de cachos PEYU usando sus fotos reales, con efecto cinemático de luz dorada.' },
  { icon: Megaphone,  label: 'CSV de Google Ads B2B',     prompt: 'Genérame un CSV listo para Google Ads de una campaña Search de regalos corporativos B2B, presupuesto CLP $20.000/día, landing https://peyuchile.cl/EmpresasNuevo, con copies persuasivos y keywords optimizadas. Luego dame el archivo para descargar.' },
  { icon: TrendingUp, label: 'Estrategia agencia (ventas)', prompt: 'Actúa como agencia: haz un diagnóstico de mis redes (Instagram y LinkedIn) y de mis leads B2B, y propón una estrategia de 2 semanas orientada a aumentar ventas y relaciones, con plan de ejecución concreto.' },
  { icon: BarChart2,  label: 'Diagnosis engagement bajo', prompt: 'Mis últimos posts tuvieron menos del 2% de engagement. Analiza mis posts actuales y dame un plan concreto de 2 semanas para recuperar alcance.' },
];

const CAPABILITIES = [
  { icon: ImageIcon, label: 'Imágenes y videos IA', desc: 'Desde fotos reales del catálogo' },
  { icon: Calendar, label: 'Campañas semanales', desc: 'Plan + posts + calendario' },
  { icon: Zap, label: 'Publicación directa', desc: 'Instagram y LinkedIn' },
  { icon: Megaphone, label: 'CSV de Google Ads', desc: 'Copies + keywords listos' },
];

// ── Imágenes generadas inline ───────────────────────────────────────────────
function GeneratedImage({ url, label, isVideo }) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-white/5">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-violet-300 hover:text-violet-200">
        <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" />{label || 'Imagen generada'}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="px-3 pb-3">
          {!loaded && !isVideo && <div className="w-full h-40 bg-white/5 rounded-lg animate-pulse" />}
          {isVideo ? (
            <video src={url} controls className="w-full rounded-lg" onLoadedData={() => setLoaded(true)} />
          ) : (
            <img src={url} alt={label || 'Imagen generada'} onLoad={() => setLoaded(true)}
              className={`w-full rounded-lg object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0 h-0'}`} />
          )}
          {loaded && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300">
              <ExternalLink className="w-3 h-3" /> Abrir en nueva pestaña
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── CSV de Google Ads descargable ───────────────────────────────────────────
function CsvResult({ url }) {
  return (
    <a href={url} download className="mt-2 inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-white font-bold text-xs transition">
      <CheckCircle2 className="w-3.5 h-3.5" /> Descargar CSV para Google Ads
    </a>
  );
}

function ToolCallBadge({ toolCall }) {
  const name = toolCall?.name || '';
  const status = toolCall?.status || 'pending';
  const isRunning = status === 'running' || status === 'in_progress';
  const isDone = status === 'completed' || status === 'success';
  const label = {
    generateProductPromoImage: '🖼 Generando imagen IA…',
    agentGenerateMedia: '🎬 Generando imagen/video…',
    generateWeeklyContentPlan: '📅 Creando plan semanal…',
    generateSocialContent: '✍️ Generando contenido…',
    publishContentPost: '🚀 Publicando post…',
    instagramStatus: '📊 Consultando Instagram…',
    linkedInStatus: '📊 Consultando LinkedIn…',
    bulkGeneratePromoVariants: '⚡ Generando variantes…',
    adsGenerateCampaign2026: '🎯 Generando campaña Google Ads…',
    adsExportEditor: '📄 Exportando CSV…',
  }[name] || `⚙️ ${name}…`;
  const doneLabel = {
    generateProductPromoImage: '✅ Imagen generada',
    agentGenerateMedia: '✅ Media en Galería',
    generateWeeklyContentPlan: '✅ Plan semanal listo',
    generateSocialContent: '✅ Contenido generado',
    publishContentPost: '✅ Post publicado',
    instagramStatus: '✅ Instagram consultado',
    linkedInStatus: '✅ LinkedIn consultado',
    bulkGeneratePromoVariants: '✅ Variantes generadas',
    adsGenerateCampaign2026: '✅ Campaña generada',
    adsExportEditor: '✅ CSV listo',
  }[name] || '✅ Listo';
  return (
    <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full mt-1 ${
      isDone ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
             : 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
    }`}>
      {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
      {isDone && <CheckCircle2 className="w-3 h-3" />}
      {isDone ? doneLabel : label}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  const imageResults = [];
  const csvUrls = [];
  if (msg.tool_calls?.length) {
    for (const tc of msg.tool_calls) {
      if (tc.name === 'generateProductPromoImage' && tc.results) {
        try {
          const parsed = typeof tc.results === 'string' ? JSON.parse(tc.results) : tc.results;
          if (parsed?.image_url) imageResults.push({ url: parsed.image_url, label: 'Imagen generada con IA' });
          if (parsed?.variants) parsed.variants.forEach((v, i) => imageResults.push({ url: v.url, label: `Variante ${i + 1}` }));
        } catch { /* ignore */ }
      }
      if (tc.name === 'agentGenerateMedia' && tc.results) {
        try {
          const parsed = typeof tc.results === 'string' ? JSON.parse(tc.results) : tc.results;
          if (parsed?.url) imageResults.push({
            url: parsed.url,
            label: parsed.tipo === 'video' ? `Video generado · ${parsed.producto || ''}` : `Imagen generada · ${parsed.producto || ''}`,
            isVideo: parsed.tipo === 'video',
          });
        } catch { /* ignore */ }
      }
      if (tc.name === 'bulkGeneratePromoVariants' && tc.results) {
        try {
          const parsed = typeof tc.results === 'string' ? JSON.parse(tc.results) : tc.results;
          const imgs = parsed?.images || parsed?.results || [];
          imgs.forEach((v, i) => {
            const url = v?.image_url || v?.url;
            if (url) imageResults.push({ url, label: `Variante ${i + 1}` });
          });
        } catch { /* ignore */ }
      }
      if (tc.name === 'adsExportEditor' && tc.results) {
        try {
          const parsed = typeof tc.results === 'string' ? JSON.parse(tc.results) : tc.results;
          if (parsed?.file_url) csvUrls.push(parsed.file_url);
        } catch { /* ignore */ }
      }
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-violet-600 to-pink-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
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
                  strong: ({ children }) => <strong className="text-teal-300 font-bold">{children}</strong>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-violet-300 mt-3 mb-1">{children}</h3>,
                  code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono text-teal-200">{children}</code>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {imageResults.map((img, i) => <GeneratedImage key={i} url={img.url} label={img.label} isVideo={img.isVideo} />)}
        {csvUrls.map((url, i) => <CsvResult key={i} url={url} />)}
        <p className={`text-[10px] text-white/20 mt-1 px-1 ${isUser ? 'text-right' : ''}`}>
          {isUser ? 'Tú' : '🤖 Agente Marketing · PEYU'}
        </p>
      </div>
    </div>
  );
}

export default function MarketingAgentPanel() {
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
        metadata: { name: `Marketing Session ${new Date().toLocaleDateString('es-CL')}` },
      });
      setConversation(conv);
      setMessages([{
        role: 'assistant',
        content: `¡Hola equipo PEYU! 👋 Soy tu **Agencia de Marketing IA** — opero como una agencia grande: diagnóstico con datos → estrategia → producción → publicación → optimización.\n\nElige una acción rápida de la izquierda o dime el objetivo y ejecuto. Puedo generar imágenes/videos, publicar posts, lanzar campañas semanales y crear CSV de Google Ads. ¿Partimos?`,
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

  // ── Columna izquierda · acciones ──────────────────────────────────────────
  const left = (
    <div className="p-3 space-y-1">
      <button
        onClick={() => sendMessage('Lanza ahora una campaña semanal completa para PEYU: genera el plan editorial, crea los posts para Instagram y LinkedIn con copies listos, genera al menos 2 imágenes de productos, y guarda todo en el ContentCalendar de esta semana.')}
        disabled={initing || loading}
        className="w-full flex items-center gap-2 p-2.5 mb-2 rounded-lg bg-gradient-to-br from-pink-600/25 to-violet-600/25 border border-pink-500/30 hover:border-pink-400/50 transition-all text-left disabled:opacity-40"
      >
        <Play className="w-4 h-4 text-pink-300 flex-shrink-0" />
        <span className="text-[11px] font-bold text-pink-200 leading-tight">Lanzar Campaña Semanal</span>
      </button>
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
            <Icon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 group-hover:text-violet-300" />
            <span className="text-[11px] text-white/70 group-hover:text-white leading-tight">{qp.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ── Columna derecha · capacidades ─────────────────────────────────────────
  const right = (
    <div className="p-3 space-y-3">
      <div>
        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2 px-1">Qué puedo hacer</p>
        <div className="space-y-1.5">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Icon className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white/85 leading-tight">{c.label}</p>
                  <p className="text-[9px] text-white/40 leading-tight mt-0.5">{c.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl bg-violet-500/[0.06] border border-violet-500/15 p-3">
        <p className="text-[10px] font-bold text-violet-200 mb-1.5 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Tip</p>
        <p className="text-[9px] text-white/55 leading-snug">Dime "tú eliges" y actúo con criterio de agencia: producto, imagen, copy y red. Nunca publico sin que lo pidas.</p>
      </div>
    </div>
  );

  return (
    <AgentLayout
      accent="violet"
      title="Agente Marketing PEYU"
      subtitle="Imágenes IA · Campañas · Publicación · Google Ads"
      HeaderIcon={Bot}
      storageKey="marketing"
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
            <span className="text-sm">Iniciando agente…</span>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="text-[10px] text-white/40 mr-1">El agente está trabajando</span>
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
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
            placeholder="Genera imágenes, lanza campañas, publica posts, crea CSV de Ads…"
            disabled={initing}
            className="flex-1 bg-white/[0.06] border border-white/15 text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-all disabled:opacity-40"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || initing}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 hover:from-violet-400 hover:to-pink-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-lg shadow-violet-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </AgentLayout>
  );
}