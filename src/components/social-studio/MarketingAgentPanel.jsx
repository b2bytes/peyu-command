// ============================================================================
// MarketingAgentPanel · Agente IA Marketing Especialista PEYU
// Entrenado con los 13 bloques esenciales de agente autónomo
// ============================================================================
import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Bot, User, TrendingUp, Calendar, BarChart2, Megaphone, Zap, Image, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SYSTEM_PROMPT = `Eres el Agente de Marketing Autónomo de PEYU Chile — experto en estrategia digital, engagement y campañas para una marca de productos sustentables chilena. Estás entrenado con los 13 bloques esenciales de un agente autónomo:

BLOQUE 1 · PERCEPCIÓN: Monitoreas tendencias globales de engagement en tiempo real. Sabes que en 2025-26: Instagram Reels prioriza saves+shares sobre likes, LinkedIn da 3x más alcance a documentos y carruseles vs texto puro, TikTok FYP: primeros 3 segundos determinan 80% del éxito. Horarios pico Chile: IG 12pm y 7pm, LinkedIn martes/miércoles 9-11am, TikTok 18-20h.

BLOQUE 2 · MEMORIA DE MARCA: PEYU Chile = productos de escritorio, hogar, entretenimiento y accesorios móviles en plástico 100% reciclado post-consumo y fibra de trigo compostable. B2B (regalos corporativos, eventos) y B2C (consumidores conscientes). Made in Chile. Personalización láser UV. Economía circular.

BLOQUE 3 · OBJETIVOS & KPIs: IG engagement rate >5%, reach 15k+/post. LinkedIn: 3-8% engagement, leads B2B calificados. CPA lead B2B < $8.000 CLP. +30% tráfico peyuchile.cl.

BLOQUE 4 · PLANIFICACIÓN: Estructura 3-3-1-1 semanal = 3 Producto/valor, 3 ESG/educativo, 1 Detrás de escena, 1 Testimonio. Fechas clave Chile: 18 Septiembre, Navidad, CyberDay (junio), Día Madre (2do domingo mayo), Día Padre (3er domingo junio).

BLOQUE 5 · HERRAMIENTAS: Puedes generar copy completo, briefs de imagen, calendarios, hashtags investigados, variaciones A/B, y sugerir horarios óptimos.

BLOQUE 6 · RAZONAMIENTO CREATIVO: Frameworks: AIDA, PAS, Storytelling de impacto. Hooks probados: "Cada [producto] rescata X botellas del océano", "¿Sabías que tu empresa puede regalar esto?", "Hecho en Chile con lo que tú tirabas a la basura". LinkedIn: abre con cifra impactante. IG: pregunta o dato sorpresivo. TikTok: POV o transformación en 3 segundos.

BLOQUE 7 · EJECUCIÓN: Generates briefs completos con copy por formato, hashtags, horario, formato recomendado (Reel/carrusel/estático), CTA específico, variante A/B lista.

BLOQUE 8 · REFLEXIÓN: Posts PEYU de mayor engagement histórico: lifestyle con personas usando producto, antes/después de reciclaje, unboxing corporativo B2B, datos de impacto ambiental con gráfico simple.

BLOQUE 9 · CONTEXTO DE MARCA: Voz: directa, auténtica, educativa con propósito. Nunca corporativa fría. Paleta: verde PEYU #0F8B6C, arena #E7D8C6, terracota #D96B4D. Emojis on-brand: ♻️🌱🇨🇱💚. Nunca usar "revolucionario" ni "disruptivo".

BLOQUE 10 · RETROALIMENTACIÓN: Si el usuario comparte métricas, ajustas recomendaciones. Aprendes de lo que reportan que funcionó o falló.

BLOQUE 11 · BASE DE CONOCIMIENTO: LinkedIn 2025: contenido >500 palabras tiene 4x más distribución. Instagram 2025: Reels <30s con subtítulos tienen 25% más retención. Marketing ESG: 73% de millennials pagaría más por marca sustentable (Nielsen). Mercado regalos corporativos Chile: $45B CLP anuales, pico noviembre-diciembre.

BLOQUE 12 · COMUNICACIÓN: Siempre en español chileno. Tono: como CMO experto y cercano. Da respuestas accionables y concretas, no teóricas. Incluye siempre pasos concretos.

BLOQUE 13 · MONITOREO: Alerta sobre cambios de algoritmo, tendencias estacionales próximas, oportunidades de newsjacking para PEYU.

Responde SIEMPRE con recomendaciones concretas y accionables para PEYU Chile. Si piden ideas de posts, genera copy completo listo para usar.`;

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Tendencias LinkedIn hoy',     prompt: '¿Qué tendencias de contenido funcionan mejor en LinkedIn esta semana para una marca B2B sustentable? Dame 3 ideas de posts concretas con copy completo listo.' },
  { icon: Megaphone,  label: 'Campaña Navidad PEYU',        prompt: 'Diseña una campaña de Navidad completa para PEYU Chile: 2 semanas, Instagram + LinkedIn, foco en regalos corporativos B2B. Incluye calendario, temas y 3 copies listos para publicar.' },
  { icon: Image,      label: 'Hooks virales para Reels',    prompt: 'Dame 5 hooks para Reels de Instagram que muestren el impacto ambiental de los productos PEYU. Deben ser cortos (<5 palabras), visuales y con alto potencial de guardar y compartir.' },
  { icon: BarChart2,  label: 'Diagnosis engagement bajo',  prompt: 'Mis últimos posts de LinkedIn tuvieron menos del 2% de engagement. ¿Qué puede estar fallando según el algoritmo 2025? Dame un plan concreto de 2 semanas para recuperar alcance.' },
  { icon: Calendar,   label: 'Calendario semanal ESG',      prompt: 'Genera un calendario editorial de 1 semana con pilar ESG/sustentabilidad para PEYU: 4 posts (IG x2, LinkedIn x2), copy completo, hashtags y horario óptimo Chile.' },
  { icon: Zap,        label: 'Copy B2B regalos corporativos', prompt: 'Escribe 3 versiones de copy para LinkedIn apuntando a gerentes de RRHH que buscan regalos corporativos sustentables. Enfoca en el diferencial del impacto ambiental medible de PEYU.' },
];

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-violet-600 to-pink-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[82%] ${isUser ? 'flex flex-col items-end' : ''}`}>
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
        <p className={`text-[10px] text-white/20 mt-1 px-1 ${isUser ? 'text-right' : ''}`}>
          {isUser ? 'Tú' : '🤖 Agente Marketing · Claude Sonnet'}
        </p>
      </div>
    </div>
  );
}

export default function MarketingAgentPanel({ posts = [] }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `¡Hola equipo PEYU! 👋 Soy tu **Agente de Marketing Especialista** — entrenado con los 13 bloques de autonomía en estrategia digital, tendencias de engagement y campañas para marcas sustentables.\n\n**Puedo ayudarte con:**\n- Diseñar campañas completas con copy listo para publicar\n- Analizar qué está fallando en tu engagement por plataforma\n- Sugerir trends, hooks virales y formatos ganadores\n- Crear calendarios editoriales con fechas clave Chile\n- Optimizar tu estrategia B2B en LinkedIn\n\n¿En qué trabajamos hoy?`
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const history = [...messages, userMsg].slice(-8)
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Agente'}: ${m.content.slice(0, 400)}`)
      .join('\n\n');

    const contextPrompt = `${SYSTEM_PROMPT}

CONTEXTO CUENTA: ${posts?.length || 0} posts totales, ${(posts||[]).filter(p => p.red_social === 'LinkedIn').length} LinkedIn, ${(posts||[]).filter(p => p.red_social === 'Instagram').length} Instagram. Posts publicados: ${(posts||[]).filter(p => p.estado === 'Publicado').length}. En revisión: ${(posts||[]).filter(p => p.estado === 'En revisión').length}.
Fecha: ${new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

HISTORIAL:
${history}

Agente Marketing PEYU:`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: contextPrompt,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
    });

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
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
            <p className="text-[10px] text-white/40 mt-0.5">13 bloques autónomos · Claude Sonnet · Web Search</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([{ role: 'assistant', content: '¡Nueva sesión! ¿En qué estrategia de marketing trabajamos hoy? 🚀' }])}
          className="text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5"
          title="Nueva conversación"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick prompts — solo si hay pocos mensajes */}
      {messages.length <= 1 && (
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
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="text-[10px] text-white/40 mr-1">Analizando tendencias</span>
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          </div>
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
            placeholder="Tendencias, campañas, copy, estrategia…"
            className="flex-1 bg-white/[0.06] border border-white/15 text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50 transition-all"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 hover:from-violet-400 hover:to-pink-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-lg shadow-violet-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}