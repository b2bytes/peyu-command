// ============================================================================
// ChatFunnelPanel · ¿El chat Peyu lleva a la compra final?
// ----------------------------------------------------------------------------
// Cruza ChatLead × CarritoAbandonado × PedidoWeb por email/teléfono y muestra:
//   1. Funnel completo (5 etapas) con tasas de conversión
//   2. Diagnóstico claro: "el chat sí/no cierra ventas"
//   3. Lista de conversiones concretas (casos donde chat → pedido pagado)
//   4. Top productos mencionados en el chat
//
// Es el panel que responde la pregunta: ¿está convirtiendo el chat?
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingDown, MessageCircle, MousePointerClick, UserCheck, ShoppingCart, CheckCircle2, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const STAGES = [
  { key: 'visitantes_que_abrieron',  label: 'Abrieron el chat',              icon: MessageCircle,      color: 'sky' },
  { key: 'escribieron_mensaje_real', label: 'Escribieron mensaje real',      icon: MousePointerClick,  color: 'cyan' },
  { key: 'entregaron_dato',          label: 'Entregaron algún dato',         icon: UserCheck,          color: 'teal' },
  { key: 'llegaron_a_carrito',       label: 'Agregaron al carrito',          icon: ShoppingCart,       color: 'amber' },
  { key: 'compraron',                label: 'Compraron 🎉',                  icon: CheckCircle2,       color: 'emerald' },
];

const COLOR_CLASSES = {
  sky:     { bar: 'from-sky-400 to-sky-500',         badge: 'bg-sky-500/15 text-sky-200 border-sky-400/25' },
  cyan:    { bar: 'from-cyan-400 to-cyan-500',       badge: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/25' },
  teal:    { bar: 'from-teal-400 to-teal-500',       badge: 'bg-teal-500/15 text-teal-200 border-teal-400/25' },
  amber:   { bar: 'from-amber-400 to-amber-500',     badge: 'bg-amber-500/15 text-amber-200 border-amber-400/25' },
  emerald: { bar: 'from-emerald-400 to-emerald-500', badge: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25' },
};

export default function ChatFunnelPanel({ windowDays = 7 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke('chatFunnelStats', { days: windowDays });
        if (!alive) return;
        if (res?.data?.ok) setData(res.data);
        else setError(res?.data?.error || 'No se pudo cargar el funnel');
      } catch (e) {
        if (alive) setError(e?.message || 'Error desconocido');
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [windowDays]);

  if (loading) {
    return (
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex items-center justify-center gap-2 text-white/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cruzando ChatLead × Carrito × Pedidos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-400/20 rounded-2xl p-4 text-rose-200 text-sm flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Error: {error}</span>
      </div>
    );
  }

  const { funnel, tasas, revenue_atribuido_clp, conversiones_concretas, top_productos_mencionados, tipo_distribucion } = data;
  const total = funnel.visitantes_que_abrieron || 1;
  const chatCierraVentas = funnel.compraron > 0;

  return (
    <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-5">
      {/* Header con veredicto */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-jakarta font-bold text-white text-base tracking-tight flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-teal-300" />
            Funnel del chat Peyu — ¿lleva a la compra?
          </h3>
          <p className="text-xs text-white/50 font-inter mt-0.5">
            Últimos {data.window_days} días · cruza ChatLead × Carrito × Pedidos por email/teléfono
          </p>
        </div>
        <div className={`px-3 py-2 rounded-xl border text-xs font-bold font-jakarta ${
          chatCierraVentas
            ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'
            : 'bg-amber-500/15 text-amber-200 border-amber-400/30'
        }`}>
          {chatCierraVentas
            ? `✅ Sí · ${funnel.compraron} compra(s) atribuida(s)`
            : '⚠️ Aún sin compras atribuidas al chat'
          }
        </div>
      </header>

      {/* Funnel visual */}
      <div className="space-y-2">
        {STAGES.map((stage) => {
          const value = funnel[stage.key] || 0;
          const pct = (value / total) * 100;
          const colors = COLOR_CLASSES[stage.color];
          const Icon = stage.icon;
          return (
            <div key={stage.key} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-white/80 font-inter flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-white/50" />
                  {stage.label}
                </span>
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${colors.badge}`}>
                  {value} · {pct.toFixed(1)}%
                </span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-700`}
                  style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Metric label="Engagement" value={`${tasas.engagement_pct}%`} desc="escribieron tras abrir" />
        <Metric label="Captura datos" value={`${tasas.captura_pct}%`} desc="dieron nombre/email" />
        <Metric label="Conversión total" value={`${tasas.conversion_pct}%`} desc="chat → compra" highlight={chatCierraVentas} />
        <Metric label="Revenue atribuido" value={`$${(revenue_atribuido_clp / 1000).toFixed(0)}k`} desc="CLP del chat" />
      </div>

      {/* Distribución B2C/B2B */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs font-inter">
        <span className="text-white/60">Distribución de conversaciones:</span>
        <div className="flex items-center gap-3">
          <span className="text-cyan-300 font-bold">B2C: {tipo_distribucion.B2C}</span>
          <span className="text-violet-300 font-bold">B2B: {tipo_distribucion.B2B}</span>
          <span className="text-white/40 font-bold">Sin clasificar: {tipo_distribucion.Sin_clasificar}</span>
        </div>
      </div>

      {/* Top productos mencionados */}
      {top_productos_mencionados.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 font-jakarta mb-2">Productos más mencionados</h4>
          <div className="flex flex-wrap gap-1.5">
            {top_productos_mencionados.map(p => (
              <span key={p.nombre} className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 font-inter">
                {p.nombre} · <span className="text-teal-300 font-bold">{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Conversiones concretas */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 font-jakarta mb-2 flex items-center gap-2">
          🏆 Conversiones concretas ({conversiones_concretas.length})
        </h4>
        {conversiones_concretas.length === 0 ? (
          <div className="bg-amber-500/8 border border-amber-400/20 rounded-xl p-4 text-xs text-amber-200/90 font-inter leading-relaxed">
            <p className="font-bold mb-1">No hay compras atribuidas al chat aún en esta ventana.</p>
            <p className="text-amber-200/70">
              Esto NO significa que el chat no funcione — significa que aún no hay match exacto entre el email/teléfono de un ChatLead y el email/teléfono de un Pedido pagado. Posibles razones:
            </p>
            <ul className="mt-2 space-y-0.5 text-amber-200/70 list-disc list-inside">
              <li>El cliente conversa con el chat pero compra después sin dejar email en el chat</li>
              <li>El chat aún no pidió email/teléfono antes de derivar al carrito</li>
              <li>El cliente cierra el navegador y vuelve más tarde con otro flujo</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-1.5">
            {conversiones_concretas.slice(0, 10).map(c => (
              <Link
                key={c.chat_lead_id}
                to="/admin/chat-leads"
                className="block bg-emerald-500/8 hover:bg-emerald-500/12 border border-emerald-400/20 rounded-xl p-3 transition-colors group"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-100 font-jakarta truncate">
                      {c.nombre || c.email || c.telefono || 'Anónimo'}
                      <span className="text-emerald-300/60 font-normal"> · {c.mensajes} msj · {c.tipo_chat}</span>
                    </p>
                    <p className="text-[11px] text-emerald-200/70 font-inter truncate">
                      Pedido {c.numero_pedido} · {c.pedido_estado}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-200 font-jakarta">
                      ${Number(c.pedido_total).toLocaleString('es-CL')}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-300/60 group-hover:text-emerald-200 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, desc, highlight }) {
  return (
    <div className={`rounded-xl p-3 border ${
      highlight
        ? 'bg-emerald-500/10 border-emerald-400/25'
        : 'bg-white/[0.04] border-white/10'
    }`}>
      <p className={`text-[9px] uppercase tracking-wider font-bold font-jakarta mb-1 ${
        highlight ? 'text-emerald-300' : 'text-white/40'
      }`}>{label}</p>
      <p className={`text-lg font-bold font-jakarta ${
        highlight ? 'text-emerald-100' : 'text-white'
      }`}>{value}</p>
      <p className="text-[10px] text-white/40 font-inter mt-0.5">{desc}</p>
    </div>
  );
}