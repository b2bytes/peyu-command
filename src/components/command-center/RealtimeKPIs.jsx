import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, ShoppingCart, Users, AlertTriangle, MessageCircle, Package, MessageSquare, CheckCircle2, Truck, FileText } from 'lucide-react';

/**
 * KPIs en tiempo real (HOY) — auto-refresh cada 30s.
 * Sin charts, sin demo. Solo data viva del día actual.
 *
 * Ahora muestra TODO lo crítico del día de un vistazo:
 *  - Sesiones · Pedidos · Ingresos · Entregados HOY
 *  - Leads B2B nuevos hoy · Consultas chat nuevas hoy
 *  - Conversaciones con Peyu · Propuestas pendientes
 *  - Envíos en tránsito · Stock bajo
 */
export default function RealtimeKPIs() {
  const [kpis, setKpis] = useState({
    sessionsToday: 0,
    ordersToday: 0,
    revenueToday: 0,
    deliveredToday: 0,
    leadsToday: 0,
    consultasToday: 0,
    chatsToday: 0,
    conversationsToday: 0,
    propuestasPendientes: 0,
    enviosEnTransito: 0,
    stockAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const isToday = (d) => d && new Date(d) >= startOfDay;

      const [activity, pedidos, b2bLeads, ailogs, productos, consultas, propuestas, envios] = await Promise.all([
        base44.entities.ActivityLog.filter({ event_type: 'page_view' }, '-created_date', 500),
        base44.entities.PedidoWeb.list('-created_date', 200),
        base44.entities.B2BLead.list('-created_date', 100),
        base44.entities.AILog.list('-created_date', 200),
        base44.entities.Producto.filter({ activo: true }, null, 500),
        base44.entities.Consulta.list('-created_date', 100),
        base44.entities.CorporateProposal.list('-created_date', 100),
        base44.entities.Envio.list('-created_date', 100),
      ]);

      // Sessions únicas hoy
      const uniqueSessions = new Set(
        activity.filter(a => isToday(a.created_date)).map(a => a.session_id).filter(Boolean)
      );

      // Pedidos del día
      const todayOrders = pedidos.filter(p => p.fecha === todayKey || isToday(p.created_date));
      const revenue = todayOrders.reduce((s, p) => s + (p.total || 0), 0);

      // Pedidos entregados hoy (estado = Entregado y se actualizó hoy)
      const delivered = pedidos.filter(p => p.estado === 'Entregado' && isToday(p.updated_date)).length;

      // Leads B2B nuevos hoy
      const leadsToday = b2bLeads.filter(l => isToday(l.created_date)).length;

      // Consultas chat nuevas hoy
      const consultasToday = consultas.filter(c => isToday(c.created_date)).length;

      // Chats con Peyu hoy + conversaciones únicas
      const todayChats = ailogs.filter(a => isToday(a.created_date) && a.task_type === 'chat');
      const uniqueConvs = new Set(todayChats.map(c => c.conversation_id || c.session_id).filter(Boolean));

      // Propuestas pendientes (enviadas sin respuesta)
      const propuestasPendientes = propuestas.filter(p => p.status === 'Enviada').length;

      // Envíos en tránsito
      const enviosEnTransito = envios.filter(e => ['En Tránsito', 'En Reparto', 'Retirado por Courier'].includes(e.estado)).length;

      // Stock bajo (< 10 unidades)
      const lowStock = productos.filter(p => typeof p.stock_actual === 'number' && p.stock_actual < 10).length;

      setKpis({
        sessionsToday: uniqueSessions.size,
        ordersToday: todayOrders.length,
        revenueToday: revenue,
        deliveredToday: delivered,
        leadsToday,
        consultasToday,
        chatsToday: todayChats.length,
        conversationsToday: uniqueConvs.size,
        propuestasPendientes,
        enviosEnTransito,
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
    { label: 'Entregados hoy', value: kpis.deliveredToday, icon: CheckCircle2, color: 'text-green-300', bg: 'bg-green-500/15' },
    { label: 'Leads B2B hoy', value: kpis.leadsToday, icon: Users, color: 'text-teal-300', bg: 'bg-teal-500/15' },
    { label: 'Consultas hoy', value: kpis.consultasToday, icon: MessageSquare, color: 'text-orange-300', bg: 'bg-orange-500/15' },
    { label: 'Conversaciones Peyu', value: kpis.conversationsToday, icon: MessageCircle, color: 'text-purple-300', bg: 'bg-purple-500/15', sub: kpis.chatsToday > 0 ? `${kpis.chatsToday} mensajes` : null },
    { label: 'Propuestas pendientes', value: kpis.propuestasPendientes, icon: FileText, color: 'text-indigo-300', bg: 'bg-indigo-500/15' },
    { label: 'Envíos en tránsito', value: kpis.enviosEnTransito, icon: Truck, color: 'text-blue-300', bg: 'bg-blue-500/15' },
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
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
                {it.sub && <div className="text-[9px] text-white/40 leading-tight">{it.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}