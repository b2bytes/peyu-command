// ============================================================================
// MetaAdsPanel · Centro de control de Meta Ads dentro de Social Studio.
// Layout agentico 3-col: izquierda acciones · centro chat del especialista ·
// derecha KPIs reales del periodo (Facebook + Instagram vía Graph API).
// ============================================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Send, Loader2, User, Facebook, TrendingUp, AlertCircle, RefreshCw,
  CheckCircle2, BarChart2, Target, Zap, Eye, MousePointerClick,
  DollarSign, Activity, Instagram, ShieldCheck, XCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AgentLayout from './AgentLayout';

const AGENT_NAME = 'meta_ads_strategist';

const QUICK_PROMPTS = [
  { icon: BarChart2,        label: 'Diagnóstico completo',     prompt: 'Trae el rendimiento de mis campañas de los últimos 30 días y dame un diagnóstico completo de agencia: qué está funcionando, qué no, y las 3 acciones de mayor impacto para mejorar ventas.' },
  { icon: Target,           label: '¿Qué campaña escalar?',    prompt: 'Analiza el rendimiento de los últimos 30 días y dime qué campaña debería escalar (subir presupuesto) y cuál pausar, con el racional basado en CPA, ROAS y frecuencia.' },
  { icon: AlertCircle,      label: 'Detectar fatiga creativa', prompt: 'Revisa la frecuencia y el CTR de mis campañas activas y dime cuáles tienen fatiga de creativo o audiencia saturada, y qué hacer.' },
  { icon: Zap,              label: 'Plan Advantage+ B2C',      prompt: 'Diséñame un plan para migrar/escalar mis ventas B2C con Advantage+ Shopping Campaigns: estructura, presupuesto, públicos y estrategia creativa para PEYU.' },
  { icon: ShieldCheck,      label: 'Verificar pixel e integración', prompt: 'Corre un diagnóstico completo de mi integración con Meta: verifica que el pixel esté activo y disparando, la página de Facebook y la cuenta de Instagram conectadas, y dime si todo está listo para optimizar a Compras/Leads o qué falta configurar.' },
];

// Diagnóstico accionable según el motivo que devuelve metaAdsPerformance.
const META_DIAG = {
  sin_permiso: {
    title: 'Falta permiso sobre la cuenta',
    steps: [
      'Meta Business Settings → Usuarios del sistema',
      'Selecciona tu System User → "Agregar activos" → Cuentas publicitarias',
      'Marca tu cuenta y activa "Administrar campañas" (ads_read + ads_management)',
      'Genera un token NUEVO con esos scopes y actualiza META_SYSTEM_USER_TOKEN',
    ],
  },
  token_invalido: {
    title: 'Token inválido o expirado',
    steps: [
      'En el System User, genera un token nuevo',
      'Marca los scopes ads_read y ads_management',
      'Actualiza el secreto META_SYSTEM_USER_TOKEN con ese token',
    ],
  },
  cuenta_no_encontrada: {
    title: 'Cuenta publicitaria no encontrada',
    steps: [
      'Revisa META_AD_ACCOUNT_ID (solo el número, sin act_)',
      'Confirma que la cuenta esté asignada al System User',
    ],
  },
  rate_limit: { title: 'Meta limitando consultas', steps: ['Espera unos minutos y vuelve a actualizar.'] },
};

function fmtMoney(n, currency = 'CLP') {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}
function fmtNum(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n);
}

function ToolCallBadge({ toolCall }) {
  const status = toolCall?.status || 'pending';
  const isRunning = status === 'running' || status === 'in_progress' || status === 'pending';
  const isDone = status === 'completed' || status === 'success';
  return (
    <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full mt-1 ${
      isDone ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
             : 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
    }`}>
      {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
      {isDone && <CheckCircle2 className="w-3 h-3" />}
      {isDone ? '✅ Rendimiento consultado' : '📊 Consultando Meta Ads…'}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Facebook className="w-4 h-4 text-white" />}
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
                  strong: ({ children }) => <strong className="text-blue-300 font-bold">{children}</strong>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-blue-300 mt-3 mb-1">{children}</h3>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        <p className={`text-[10px] text-white/20 mt-1 px-1 ${isUser ? 'text-right' : ''}`}>
          {isUser ? 'Tú' : '📘 Estratega de Meta Ads · PEYU'}
        </p>
      </div>
    </div>
  );
}

export default function MetaAdsPanel() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initing, setIniting] = useState(true);
  const bottomRef = useRef(null);

  // Estado de rendimiento (columna derecha)
  const [perf, setPerf] = useState(null);
  const [perfLoading, setPerfLoading] = useState(true);
  // Salud de la integración (pixel + página + IG)
  const [health, setHealth] = useState(null);

  const loadPerf = useCallback(async () => {
    setPerfLoading(true);
    try {
      const [perfRes, healthRes] = await Promise.all([
        base44.functions.invoke('metaAdsPerformance', { date_preset: 'last_30d' }),
        base44.functions.invoke('metaAdsManage', { action: 'diagnostico' }),
      ]);
      setPerf(perfRes.data);
      setHealth(healthRes.data?.ok ? healthRes.data : null);
    } catch (e) {
      setPerf({ connected: false, error: e.message });
    } finally {
      setPerfLoading(false);
    }
  }, []);

  const initConversation = useCallback(async () => {
    setIniting(true);
    setMessages([]);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Meta Ads ${new Date().toLocaleDateString('es-CL')}` },
      });
      setConversation(conv);
      setMessages([{
        role: 'assistant',
        content: `¡Hola! 📘 Soy tu **Estratega de Meta Ads** — Facebook + Instagram, nivel agencia 2026 (Advantage+, consolidación de conjuntos, creativo como targeting).\n\nLeo el rendimiento real de tus campañas activas, diagnostico y te doy acciones concretas para vender más. Elige una acción rápida de la izquierda o pídeme un diagnóstico. ¿Partimos?`,
        tool_calls: [],
      }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'Error al iniciar el agente. Intenta recargar.', tool_calls: [] }]);
    } finally {
      setIniting(false);
    }
  }, []);

  useEffect(() => { initConversation(); loadPerf(); }, [initConversation, loadPerf]);

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

  const currency = perf?.account?.currency || 'CLP';

  // ── Columna izquierda · acciones ──────────────────────────────────────────
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
            <Icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 group-hover:text-blue-300" />
            <span className="text-[11px] text-white/70 group-hover:text-white leading-tight">{qp.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ── Columna derecha · KPIs reales del periodo ─────────────────────────────
  const right = (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-[9px] text-white/30 uppercase tracking-wider">Rendimiento · 30 días</p>
        <button onClick={loadPerf} disabled={perfLoading} className="text-white/30 hover:text-white transition-colors">
          <RefreshCw className={`w-3 h-3 ${perfLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {perfLoading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-white/30">
          <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-xs">Cargando…</span>
        </div>
      ) : !perf?.connected ? (
        <div className="rounded-xl bg-amber-500/[0.08] border border-amber-500/25 p-3">
          <p className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {META_DIAG[perf?.reason]?.title || 'Conexión Meta pendiente'}
          </p>
          <p className="text-[10px] text-white/60 leading-snug mb-2">{perf?.error || 'Conexión no disponible.'}</p>
          {META_DIAG[perf?.reason]?.steps && (
            <ol className="text-[9px] text-white/50 leading-snug space-y-0.5 ml-3 list-decimal">
              {META_DIAG[perf.reason].steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          )}
        </div>
      ) : (
        <>
          {/* Salud de la integración */}
          {health && <HealthCard health={health} />}

          {/* KPIs agregados */}
          <div className="grid grid-cols-2 gap-2">
            <KpiBox label="Inversión" value={fmtMoney(perf.totals.spend, currency)} icon={TrendingUp} accent="text-blue-300" />
            <KpiBox label="Conversiones" value={fmtNum(perf.totals.conversions)} icon={Target} accent="text-emerald-300" />
            {perf.totals.conversion_value > 0 && (
              <KpiBox label="Ingresos" value={fmtMoney(perf.totals.conversion_value, currency)} icon={DollarSign} accent="text-green-300" />
            )}
            {perf.totals.roas > 0 && (
              <KpiBox label="ROAS" value={`${perf.totals.roas.toFixed(2)}x`} icon={Activity} accent="text-teal-300" />
            )}
            <KpiBox label="CTR" value={`${perf.totals.ctr.toFixed(2)}%`} icon={MousePointerClick} accent="text-violet-300" />
            <KpiBox label="CPA" value={fmtMoney(perf.totals.cpa, currency)} icon={Zap} accent="text-amber-300" />
            <KpiBox label="Impresiones" value={fmtNum(perf.totals.impressions)} icon={Eye} accent="text-sky-300" />
            <KpiBox label="Clics" value={fmtNum(perf.totals.clicks)} icon={MousePointerClick} accent="text-pink-300" />
          </div>

          {/* Campañas */}
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 px-1">
              Campañas activas {perf.campaigns?.length ? `(${perf.campaigns.length})` : ''}
            </p>
            {perf.campaigns?.length ? (
              <div className="space-y-1.5">
                {perf.campaigns.slice(0, 8).map((c) => (
                  <div key={c.campaign_id} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
                    <p className="text-[11px] font-semibold text-white/85 truncate">{c.campaign_name}</p>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-white/50 flex-wrap">
                      <span>{fmtMoney(c.spend, currency)}</span>
                      <span>·</span>
                      <span>CTR {c.ctr.toFixed(1)}%</span>
                      <span>·</span>
                      <span>{fmtNum(c.conversions)} conv</span>
                      {c.roas > 0 && (<><span>·</span><span className="text-teal-300 font-semibold">ROAS {c.roas.toFixed(2)}x</span></>)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-white/35 px-1">Sin campañas con datos en el periodo.</p>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <AgentLayout
      accent="cyan"
      title="Centro de Control · Meta Ads"
      subtitle="Facebook · Instagram · rendimiento real + IA"
      HeaderIcon={Facebook}
      left={left}
      right={right}
      onReset={initConversation}
      resetting={initing}
    >
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0 p-4 space-y-4">
        {initing ? (
          <div className="flex items-center justify-center h-full gap-2 text-white/30">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Iniciando estratega de Meta…</span>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Facebook className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="text-[10px] text-white/40 mr-1">El estratega está analizando</span>
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 px-3 py-3 border-t border-white/10 bg-black/20">
        <div className="flex gap-2 items-center max-w-3xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Diagnostica campañas, detecta fatiga, plan Advantage+…"
            disabled={initing}
            className="flex-1 bg-white/[0.06] border border-white/15 text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-40"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || initing}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-lg shadow-blue-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
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

function HealthRow({ ok, label, detail }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          : <XCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
      <span className="text-[10px] text-white/70">{label}</span>
      {detail && <span className="text-[9px] text-white/35 truncate ml-auto">{detail}</span>}
    </div>
  );
}

function HealthCard({ health }) {
  const activePixel = (health.pixels || []).find(p => p.active);
  const allOk = health.todo_ok;
  return (
    <div className={`rounded-xl border p-2.5 space-y-1.5 ${
      allOk ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-amber-500/[0.06] border-amber-500/20'
    }`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <ShieldCheck className={`w-3.5 h-3.5 ${allOk ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide">
          {allOk ? 'Integración OK' : 'Revisar integración'}
        </span>
      </div>
      <HealthRow ok={health.pixel_ok} label="Pixel" detail={activePixel ? activePixel.name?.slice(0, 18) : 'inactivo'} />
      <HealthRow ok={health.page_ok} label="Página FB" detail={health.pages?.[0]?.name} />
      <HealthRow ok={health.instagram_ok} label="Instagram" detail={health.instagram?.username ? `@${health.instagram.username}` : '—'} />
      <HealthRow ok={health.account?.status_ok} label="Cuenta activa" detail={health.account?.currency} />
    </div>
  );
}