import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users, AlertTriangle, RefreshCw, ChevronRight, Loader2, Sparkles, Package, ShoppingBag, Briefcase } from 'lucide-react';

/**
 * /admin/movil — Resumen ejecutivo móvil-first para el fundador.
 *
 * 3 bloques principales, optimizado para celular:
 *  1) Ventas HOY (B2C + B2B con desglose)
 *  2) Leads NUEVOS últimas 24h (B2B form + chat)
 *  3) Alertas críticas (stock, errores, pagos por expirar) con acción 1-tap
 *
 * Auto-refresh cada 60s. Pull-to-refresh manual.
 */

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');
const fmtCompactCLP = (n) => {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
};

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-300', dot: 'bg-red-500' },
  high:     { bg: 'bg-orange-500/15', border: 'border-orange-500/40', text: 'text-orange-300', dot: 'bg-orange-500' },
  medium:   { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-300', dot: 'bg-amber-500' },
  low:      { bg: 'bg-slate-500/15', border: 'border-slate-500/40', text: 'text-slate-300', dot: 'bg-slate-500' },
};

const TYPE_ICONS = {
  stock: Package,
  error: AlertTriangle,
  payment: ShoppingBag,
};

function StatCard({ icon: Icon, label, value, sub, gradient, href }) {
  const inner = (
    <div className={`relative rounded-2xl p-4 ${gradient} border border-white/10 overflow-hidden`}>
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative flex items-start justify-between mb-2">
        <Icon className="w-5 h-5 text-white/80" />
        {href && <ChevronRight className="w-4 h-4 text-white/40" />}
      </div>
      <p className="relative text-[10px] uppercase tracking-widest text-white/60 font-semibold">{label}</p>
      <p className="relative text-2xl font-bold text-white mt-1 leading-tight">{value}</p>
      {sub && <p className="relative text-[11px] text-white/55 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

function AlertRow({ alert }) {
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
  const Icon = TYPE_ICONS[alert.type] || AlertTriangle;
  return (
    <Link
      to={alert.action_url}
      className={`flex items-start gap-3 p-3 rounded-xl border ${style.border} ${style.bg} active:scale-[0.98] transition-transform`}
    >
      <div className={`w-9 h-9 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${style.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
          <p className="text-sm font-semibold text-white truncate">{alert.title}</p>
        </div>
        <p className="text-xs text-white/60 line-clamp-2">{alert.detail}</p>
        <p className={`text-[10px] uppercase tracking-wider mt-1 font-bold ${style.text}`}>{alert.action_label} →</p>
      </div>
    </Link>
  );
}

export default function MobileCockpit() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const res = await base44.functions.invoke('cockpitMobileSnapshot', {});
      if (res?.data?.ok) {
        setData(res.data);
        setLastRefresh(new Date());
        setError(null);
      } else {
        setError(res?.data?.error || 'No se pudo cargar el resumen');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return 'Buena madrugada';
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] pb-24">
      {/* Glow ambient */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-violet-500/15 via-indigo-500/8 to-transparent pointer-events-none" />

      <div className="relative px-4 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-violet-300/70 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Cockpit móvil
            </p>
            <h1 className="text-xl font-bold text-white mt-0.5">{greeting}</h1>
            <p className="text-xs text-white/50 mt-0.5">
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center active:scale-95 transition"
            aria-label="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 text-white/70 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* ── 1) Ventas HOY ─────────────────────────────────────── */}
            <div className="space-y-3 mb-5">
              <StatCard
                icon={TrendingUp}
                label="Ventas hoy"
                value={fmtCLP(data.ventas.total_clp)}
                sub={`${data.ventas.pedidos} pedidos · ticket prom ${fmtCompactCLP(data.ventas.ticket_promedio_clp)}`}
                gradient="bg-gradient-to-br from-emerald-600/30 via-teal-600/20 to-cyan-600/30"
                href="/admin/procesar-pedidos"
              />
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={ShoppingBag}
                  label="B2C"
                  value={fmtCompactCLP(data.ventas.b2c_clp)}
                  sub={`${data.ventas.pagados} pagados`}
                  gradient="bg-gradient-to-br from-violet-600/25 to-fuchsia-600/15"
                />
                <StatCard
                  icon={Briefcase}
                  label="B2B"
                  value={fmtCompactCLP(data.ventas.b2b_clp)}
                  sub={`${data.ventas.pendientes} pendientes`}
                  gradient="bg-gradient-to-br from-blue-600/25 to-indigo-600/15"
                />
              </div>
            </div>

            {/* ── 2) Leads 24h ──────────────────────────────────────── */}
            <div className="mb-5">
              <h2 className="text-[11px] uppercase tracking-widest text-white/50 font-semibold mb-2 px-1">Últimas 24 horas</h2>
              <StatCard
                icon={Users}
                label="Leads nuevos"
                value={data.leads.total_24h}
                sub={
                  data.leads.calientes > 0
                    ? `🔥 ${data.leads.calientes} calientes · ${data.leads.b2b_24h} B2B · ${data.leads.chat_24h} chat`
                    : `${data.leads.b2b_24h} B2B · ${data.leads.chat_24h} chat`
                }
                gradient="bg-gradient-to-br from-orange-600/25 via-amber-600/15 to-yellow-600/20"
                href="/admin/pipeline"
              />
            </div>

            {/* ── 3) Alertas críticas ───────────────────────────────── */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Alertas críticas</h2>
                {data.alertas.total > 0 && (
                  <span className="text-[10px] text-white/60 font-mono">{data.alertas.total} activas</span>
                )}
              </div>
              {data.alertas.items.length === 0 ? (
                <div className="rounded-xl p-5 bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-emerald-300 text-sm">✓ Sin alertas críticas</p>
                  <p className="text-white/40 text-xs mt-1">Todo operando con normalidad</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.alertas.items.map((a, i) => (
                    <AlertRow key={i} alert={a} />
                  ))}
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <Link to="/admin/inventario" className="rounded-xl p-3 bg-white/5 border border-white/10 active:bg-white/10 text-center">
                <Package className="w-5 h-5 text-white/70 mx-auto mb-1" />
                <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Inventario</p>
              </Link>
              <Link to="/admin/pipeline" className="rounded-xl p-3 bg-white/5 border border-white/10 active:bg-white/10 text-center">
                <Users className="w-5 h-5 text-white/70 mx-auto mb-1" />
                <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Pipeline</p>
              </Link>
              <Link to="/admin/cockpit" className="rounded-xl p-3 bg-white/5 border border-white/10 active:bg-white/10 text-center">
                <Sparkles className="w-5 h-5 text-white/70 mx-auto mb-1" />
                <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Cockpit completo</p>
              </Link>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-[10px] text-white/30 font-mono">
                Actualizado {lastRefresh?.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} · auto-refresh 60s
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}