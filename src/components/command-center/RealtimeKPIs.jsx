import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, ShoppingCart, Users, AlertTriangle, MessageCircle, Package } from 'lucide-react';

/**
 * KPIs en tiempo real (HOY) — auto-refresh cada 30s.
 * Sin charts, sin demo. Solo data viva del día actual.
 */
export default function RealtimeKPIs() {
  const [kpis, setKpis] = useState({
    sessionsToday: 0,
    ordersToday: 0,
    revenueToday: 0,
    leadsB2BActive: 0,
    chatsToday: 0,
    stockAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const [activity, pedidos, b2bLeads, ailogs, productos] = await Promise.all([
        base44.entities.ActivityLog.filter({ event_type: 'page_view' }, '-created_date', 500),
        base44.entities.PedidoWeb.list('-created_date', 100),
        base44.entities.B2BLead.list('-created_date', 100),
        base44.entities.AILog.list('-created_date', 200),
        base44.entities.Producto.filter({ activo: true }, null, 500),
      ]);

      // Sessions únicas hoy (por session_id en ActivityLog)
      const todayActivity = activity.filter(a => (a.created_date || '').startsWith(todayKey));
      const uniqueSessions = new Set(todayActivity.map(a => a.session_id).filter(Boolean));

      // Pedidos del día
      const todayOrders = pedidos.filter(p =>
        (p.fecha || '').startsWith(todayKey) || (p.created_date || '').startsWith(todayKey)
      );
      const revenue = todayOrders.reduce((s, p) => s + (p.total || 0), 0);

      // Leads B2B activos (no cerrados)
      const activeLeads = b2bLeads.filter(l => !['Aceptado', 'Perdido'].includes(l.status)).length;

      // Chats con Peyu hoy
      const todayChats = ailogs.filter(a =>
        (a.created_date || '').startsWith(todayKey) && a.task_type === 'chat'
      ).length;

      // Stock bajo (< 10 unidades)
      const lowStock = productos.filter(p => typeof p.stock_actual === 'number' && p.stock_actual < 10).length;

      setKpis({
        sessionsToday: uniqueSessions.size,
        ordersToday: todayOrders.length,
        revenueToday: revenue,
        leadsB2BActive: activeLeads,
        chatsToday: todayChats,
        stockAlerts: lowStock,
      });
      setLastUpdate(new Date());
      setLoading(false);
    } catch (e) {
      console.warn('RealtimeKPIs load error:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: 'Sesiones hoy', value: kpis.sessionsToday, icon: Activity, color: 'text-cyan-300', bg: 'bg-cyan-500/15' },
    { label: 'Pedidos hoy', value: kpis.ordersToday, icon: ShoppingCart, color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
    { label: 'Ingresos hoy', value: `$${(kpis.revenueToday / 1000).toFixed(0)}K`, icon: Package, color: 'text-yellow-300', bg: 'bg-yellow-500/15' },
    { label: 'Leads B2B activos', value: kpis.leadsB2BActive, icon: Users, color: 'text-teal-300', bg: 'bg-teal-500/15' },
    { label: 'Chats Peyu hoy', value: kpis.chatsToday, icon: MessageCircle, color: 'text-purple-300', bg: 'bg-purple-500/15' },
    { label: 'Alertas stock', value: kpis.stockAlerts, icon: AlertTriangle, color: kpis.stockAlerts > 0 ? 'text-red-300' : 'text-gray-300', bg: kpis.stockAlerts > 0 ? 'bg-red-500/15' : 'bg-gray-500/15' },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <h3 className="font-poppins font-semibold text-white text-sm">EN VIVO · KPIs del día</h3>
        </div>
        <span className="text-[10px] text-teal-300/70">
          {lastUpdate ? `Actualizado ${lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Cargando...'}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className={`${it.bg} border border-white/10 rounded-xl p-3 flex items-center gap-2.5 hover:bg-white/15 transition`}>
              <Icon className={`w-4 h-4 ${it.color} shrink-0`} />
              <div className="min-w-0">
                <div className={`text-lg font-bold font-poppins leading-tight ${it.color}`}>
                  {loading ? '…' : it.value}
                </div>
                <div className="text-[10px] text-gray-300/70 leading-tight">{it.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}