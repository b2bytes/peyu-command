// ============================================================================
// PipelineB2C — Vista única, real y en vivo del funnel B2C de hoy.
// ----------------------------------------------------------------------------
// Cruza ActivityLog + AILog + CarritoAbandonado + PedidoWeb para mostrar:
//   1. Visitas → Productos vistos → Carritos → Checkouts iniciados → Pedidos
//   2. Conversaciones de Peyu activas hoy con preview
//   3. Carritos abandonados con email capturado
//   4. Pedidos del día
// Auto-refresh cada 30s. Sin paginación pesada — solo "hoy".
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Activity, ShoppingCart, MessageSquare, Package, RefreshCw, Eye, AlertCircle, Sparkles, TrendingUp, Users } from 'lucide-react';
import FunnelStrip from '@/components/pipeline-b2c/FunnelStrip';
import LiveConversations from '@/components/pipeline-b2c/LiveConversations';
import AbandonedCartsList from '@/components/pipeline-b2c/AbandonedCartsList';
import TodayOrdersList from '@/components/pipeline-b2c/TodayOrdersList';
import LiveActivityFeed from '@/components/pipeline-b2c/LiveActivityFeed';

const REFRESH_MS = 30000;

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function PipelineB2C() {
  const [activity, setActivity] = useState([]);
  const [ailogs, setAilogs] = useState([]);
  const [carritos, setCarritos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchAll = async () => {
    const since = startOfTodayISO();
    try {
      const [act, ai, cart, ped] = await Promise.all([
        base44.entities.ActivityLog.filter({ created_date: { $gte: since } }, '-created_date', 500),
        base44.entities.AILog.filter({ created_date: { $gte: since }, task_type: 'chat' }, '-created_date', 200),
        base44.entities.CarritoAbandonado.filter({ created_date: { $gte: since } }, '-created_date', 100),
        base44.entities.PedidoWeb.filter({ created_date: { $gte: since } }, '-created_date', 100),
      ]);
      setActivity(act || []);
      setAilogs(ai || []);
      setCarritos(cart || []);
      setPedidos(ped || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('PipelineB2C fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  // ── Métricas derivadas del día ─────────────────────────────────────
  const metrics = useMemo(() => {
    const sessions = new Set(activity.map(a => a.session_id).filter(Boolean));
    const productViews = activity.filter(a => a.event_type === 'product_view');
    const addToCarts = activity.filter(a => a.event_type === 'add_to_cart');
    const checkoutStarts = activity.filter(a => a.event_type === 'checkout_start');
    const checkoutCompletes = activity.filter(a => a.event_type === 'checkout_complete');
    const chatMessages = activity.filter(a => a.event_type === 'chat_message');

    const conversaciones = new Set(ailogs.map(l => l.conversation_id).filter(Boolean));
    const carritosPendientes = carritos.filter(c => c.estado === 'Pendiente');
    const pedidosTotal = pedidos.reduce((s, p) => s + (p.total || 0), 0);

    const visitas = sessions.size;
    const conv = visitas > 0 ? ((pedidos.length / visitas) * 100).toFixed(2) : '0.00';

    return {
      visitas,
      productViews: productViews.length,
      addToCarts: addToCarts.length,
      checkoutStarts: checkoutStarts.length,
      checkoutCompletes: checkoutCompletes.length,
      chatMessages: chatMessages.length,
      conversaciones: conversaciones.size,
      carritosPendientes: carritosPendientes.length,
      pedidos: pedidos.length,
      pedidosTotal,
      conversionRate: conv,
    };
  }, [activity, ailogs, carritos, pedidos]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-jakarta">Pipeline B2C · Live</h1>
              <p className="text-sm text-slate-500">Funnel real del día · auto-refresh cada 30s</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-slate-500">
              Actualizado {lastRefresh.toLocaleTimeString('es-CL')}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-sm font-medium shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
        </div>
      </header>

      {/* KPIs top */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPI label="Sesiones únicas" value={metrics.visitas} icon={Users} color="blue" />
        <KPI label="Vistas producto" value={metrics.productViews} icon={Eye} color="indigo" />
        <KPI label="Add to Cart" value={metrics.addToCarts} icon={ShoppingCart} color="violet" />
        <KPI label="Checkout start" value={metrics.checkoutStarts} icon={TrendingUp} color="amber" />
        <KPI label="Pedidos hoy" value={metrics.pedidos} icon={Package} color="emerald" subtitle={`$${metrics.pedidosTotal.toLocaleString('es-CL')}`} />
        <KPI label="Conversión" value={`${metrics.conversionRate}%`} icon={Sparkles} color="rose" />
      </div>

      {/* Funnel */}
      <FunnelStrip metrics={metrics} />

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col izquierda: feed de actividad en vivo */}
        <div className="lg:col-span-1">
          <LiveActivityFeed events={activity.slice(0, 30)} />
        </div>

        {/* Col centro: conversaciones Peyu */}
        <div className="lg:col-span-1">
          <LiveConversations ailogs={ailogs} activity={activity} />
        </div>

        {/* Col derecha: carritos abandonados + pedidos */}
        <div className="lg:col-span-1 space-y-6">
          <AbandonedCartsList carritos={carritos} />
          <TodayOrdersList pedidos={pedidos} />
        </div>
      </div>

      {/* Estado vacío educativo */}
      {!loading && metrics.visitas === 0 && metrics.pedidos === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Aún no hay actividad hoy</p>
            <p className="text-sm text-amber-800 mt-1">
              Cuando lleguen visitantes al sitio, verás aquí el funnel completo en tiempo real:
              sesiones, productos vistos, carritos, conversaciones con Peyu y pedidos concretados.
            </p>
            <div className="flex gap-3 mt-3 text-xs">
              <Link to="/admin/ga-realtime" className="text-amber-700 hover:underline font-semibold">→ GA4 en vivo</Link>
              <Link to="/admin/trazabilidad-360" className="text-amber-700 hover:underline font-semibold">→ Trazabilidad 360°</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mini KPI card ────────────────────────────────────────────────────
function KPI({ label, value, icon: Icon, color, subtitle }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 font-jakarta">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}