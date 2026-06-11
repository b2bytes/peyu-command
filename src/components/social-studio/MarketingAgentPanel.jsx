// ============================================================================
// MarketingAgentPanel · Agente Marketing PEYU con herramientas reales
// Usa base44.agents SDK → el agente puede generar imágenes, lanzar campañas
// semanales, publicar posts y consultar redes sociales desde el chat.
// ============================================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Send, Loader2, Bot, User, TrendingUp, Calendar, BarChart2,
  Megaphone, Zap, Image as ImageIcon, RefreshCw, Sparkles, Play,
  CheckCircle2, ExternalLink, ChevronRight, ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AGENT_NAME = 'marketing_orchestrator';

// ── Quick prompts iniciales ──────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: ImageIcon,  label: 'Generar imagen de producto',    prompt: 'Genera una imagen lifestyle del portavasos de escritorio PEYU para Instagram.' },
  { icon: Play,       label: 'Generar VIDEO de producto',     prompt: 'Genera un video formato reel (9:16) del pack de cachos PEYU usando sus fotos reales, con efecto cinemático de luz dorada.' },
  { icon: Calendar,   label: 'Lanzar campaña semanal',        prompt: 'Lanza una campaña semanal de contenido para PEYU esta semana: genera el plan, crea los posts y programa el calendario de publicación.' },
  { icon: TrendingUp, label: 'Tendencias LinkedIn hoy',        prompt: '¿Qué tendencias de contenido funcionan mejor en LinkedIn esta semana para una marca B2B sustentable? Dame 3 ideas con copy completo.' },
  { icon: Megaphone,  label: 'Campaña corporativa B2B',        prompt: 'Diseña una campaña de regalos corporativos B2B para PEYU: 2 semanas, Instagram + LinkedIn. Genera imágenes y copies listos para publicar.' },
  { icon: BarChart2,  label: 'Diagnosis engagement bajo',     prompt: 'Mis últimos posts tuvieron menos del 2% de engagement. Analiza mis posts actuales y dame un plan concreto de 2 semanas para recuperar alcance.' },
  { icon: Zap,        label: 'Copy B2B regalos corporativos', prompt: 'Escribe 3 versiones de copy para LinkedIn apuntando a gerentes de RRHH que buscan regalos corporativos sustentables.' },
];

// ── Renderiza imágenes generadas inline ─────────────────────────────────────
function GeneratedImage({ url, label, isVideo }) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-white/5">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-violet-300 hover:text-violet-200"
      >
        <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" />{label || 'Imagen generada'}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="px-3 pb-3">
          {!loaded && !isVideo && <div className="w-full h-40 bg-white/5 rounded-lg animate-pulse" />}
          {isVideo ? (
            <video src={url} controls className="w-full rounded-lg" onLoadedData={() => setLoaded(true)} />
          ) : (
            <img
              src={url}
              alt={label || 'Imagen generada'}
              onLoad={() => setLoaded(true)}
              className={`w-full rounded-lg object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0 h-0'}`}
            />
          )}
          {loaded && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300">
              <ExternalLink className="w-3 h-3" /> Abrir en nueva pestaña
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Renderiza tool calls (acciones del agente) ───────────────────────────────
function ToolCallBadge({ toolCall }) {
  const name = toolCall?.name || '';
  const status = toolCall?.status || 'pending';
  const isRunning = status === 'running' || status === 'in_progress';
  const isDone = status === 'completed' || status === 'success';

  const label = {
    generateProductPromoImage: '🖼 Generando imagen IA…',
    agentGenerateMedia: '🎬 Generando imagen/video desde fotos reales…',
    generateWeeklyContentPlan: '📅 Creando plan semanal…',
    generateSocialContent: '✍️ Generando contenido…',
    publishContentPost: '🚀 Publicando post…',
    instagramStatus: '📊 Consultando Instagram…',
    linkedInStatus: '📊 Consultando LinkedIn…',
    bulkGeneratePromoVariants: '⚡ Generando variantes…',
  }[name] || `⚙️ ${name}…`;

  const doneLabel = {
    generateProductPromoImage: '✅ Imagen generada',
    agentGenerateMedia: '✅ Media generada y guardada en Galería',
    generateWeeklyContentPlan: '✅ Plan semanal listo',
    generateSocialContent: '✅ Contenido generado',
    publishContentPost: '✅ Post publicado',
    instagramStatus: '✅ Instagram consultado',
    linkedInStatus: '✅ LinkedIn consultado',
    bulkGeneratePromoVariants: '✅ Variantes generadas',
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

// ── Mensaje del chat ─────────────────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';

  // Extrae URLs de imágenes de los resultados de tool calls
  const imageResults = [];
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
    }
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-violet-600 to-pink-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[82%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Tool calls badges */}
        {!isUser && msg.tool_calls?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {msg.tool_calls.map((tc, i) => <ToolCallBadge key={i} toolCall={tc} />)}
          </div>
        )}

        {/* Bubble */}
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

        {/* Imágenes generadas */}
        {imageResults.map((img, i) => (
          <GeneratedImage key={i} url={img.url} label={img.label} isVideo={img.isVideo} />
        ))}

        <p className={`text-[10px] text-white/20 mt-1 px-1 ${isUser ? 'text-right' : ''}`}>
          {isUser ? 'Tú' : '🤖 Agente Marketing · PEYU'}
        </p>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function MarketingAgentPanel({ posts = [] }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initing, setIniting] = useState(true);
  const bottomRef = useRef(null);

  // Inicializa la conversación con el agente real
  const initConversation = useCallback(async () => {
    setIniting(true);
    setMessages([]);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Marketing Session ${new Date().toLocaleDateString('es-CL')}` },
      });
      setConversation(conv);

      // Mensaje de bienvenida sintético (no enviado al agente, solo UI)
      setMessages([{
        role: 'assistant',
        content: `¡Hola equipo PEYU! 👋 Soy tu **Agente de Marketing** con acceso completo a herramientas.\n\n**Ahora puedo:**\n- 🖼 **Generar imágenes** de productos con IA desde sus fotos reales\n- 🎬 **Generar VIDEOS** de productos (reels) con efectos cinematográficos\n- 🗂 Todo lo generado queda guardado en la **Galería** automáticamente\n- 📅 **Lanzar campañas semanales** completas (plan + posts + calendario)\n- 🚀 **Publicar posts** en Instagram y LinkedIn directamente\n- 📊 **Consultar métricas** de IG y LinkedIn en tiempo real\n\n¿En qué trabajamos hoy?`,
        tool_calls: [],
      }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'Error al iniciar el agente. Intenta recargar.', tool_calls: [] }]);
    } finally {
      setIniting(false);
    }
  }, []);

  useEffect(() => { initConversation(); }, [initConversation]);

  // Suscripción en tiempo real a los mensajes del agente
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  // Shortcut de campaña semanal
  const launchWeeklyCampaign = () => {
    sendMessage('Lanza ahora una campaña semanal completa para PEYU: genera el plan editorial, crea los posts para Instagram y LinkedIn con copies listos, genera al menos 2 imágenes de productos, y guarda todo en el ContentCalendar de esta semana.');
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-900/30 to-pink-900/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-950" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Agente Marketing PEYU</p>
            <p className="text-[10px] text-white/40 mt-0.5">Imágenes IA · Campañas · Publicación directa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Shortcut campaña semanal */}
          <button
            onClick={launchWeeklyCampaign}
            disabled={loading || initing}
            title="Lanzar campaña semanal automática"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-pink-600/30 to-violet-600/30 border border-pink-500/30 hover:border-pink-400/50 text-pink-300 hover:text-pink-200 text-[10px] font-bold transition-all disabled:opacity-30"
          >
            <Play className="w-3 h-3" /> Campaña Semanal
          </button>
          <button
            onClick={initConversation}
            disabled={initing}
            className="text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30"
            title="Nueva conversación"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${initing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick prompts — solo si hay pocos mensajes */}
      {messages.length <= 1 && !initing && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-white/[0.06]">
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 px-1">Acciones rápidas</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
            {QUICK_PROMPTS.map((qp) => {
              const Icon = qp.icon;
              return (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.prompt)}
                  className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all text-left group"
                >
                  <Icon className="w-3 h-3 text-violet-400 flex-shrink-0 group-hover:text-violet-300" />
                  <span className="text-[10px] text-white/70 group-hover:text-white leading-tight">{qp.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
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
      <div className="flex-shrink-0 px-3 py-2 border-t border-white/10 bg-black/20">
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Genera imágenes, lanza campañas, publica posts…"
            disabled={initing}
            className="flex-1 bg-white/[0.06] border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 transition-all disabled:opacity-40"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || initing}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 hover:from-violet-400 hover:to-pink-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-lg shadow-violet-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}