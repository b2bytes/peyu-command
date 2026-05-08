import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, ShoppingCart, Users, MessageSquare, DollarSign, Truck, AlertTriangle, Zap } from 'lucide-react';

/**
 * PulseBar — el "latido" de la empresa en una sola fila.
 * Heartbeat animado tipo HUD de nave espacial.
 * Auto-refresh cada 60s.
 */
export default function PulseBar() {
  const [data, setData] = useState(null);
  const [now, setNow] = useState(new Date());

  const load = async () => {
    try {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const isToday = (d) => d && new Date(d) >= startOfDay;
      const todayKey = new Date().toISOString().slice(0, 10);

      const [pedidos, leads, ailogs, envios, consultas, productos] = await Promise.all([
        base44.entities.PedidoWeb.list('-created_date', 200),
        base44.entities.B2BLead.list('-created_date', 100),
        base44.entities.AILog.list('-created_date', 200),
        base44.entities.Envio.list('-created_date', 100),
        base44.entities.Consulta.list('-created_date', 100),
        base44.entities.Producto.filter({ activo: true }, null, 500),
      ]);

      const todayOrders = pedidos.filter(p => p.fecha === todayKey || isToday(p.created_date));
      const revenue = todayOrders.reduce((s, p) => s + (p.total || 0), 0);
      const conversaciones = new Set(
        ailogs.filter(a => isToday(a.created_date) && a.task_type === 'chat').map(c => c.conversation_id || c.session_id).filter(Boolean)
      ).size;

      setData({
        revenue,
        orders: todayOrders.length,
        leads: leads.filter(l => isToday(l.created_date)).length,
        delivered: pedidos.filter(p => p.estado === 'Entregado' && isToday(p.updated_date)).length,
        inTransit: envios.filter(e => ['En Tránsito', 'En Reparto', 'Retirado por Courier'].includes(e.estado)).length,
        chats: conversaciones,
        consultas: consultas.filter(c => c.estado === 'Sin responder').length,
        lowStock: productos.filter(p => typeof p.stock_actual === 'number' && p.stock_actual < 10).length,
      });
    } catch (e) {
      console.warn('PulseBar load:', e);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(id); clearInterval(tick); };
  }, []);

  const items = [
    { label: 'Ingresos hoy', value: data ? `$${(data.revenue / 1000).toFixed(0)}K` : '…', icon: DollarSign, color: 'text-emerald-300' },
    { label: 'Pedidos', value: data?.orders ?? '…', icon: ShoppingCart, color: 'text-cyan-300' },
    { label: 'Entregados', value: data?.delivered ?? '…', icon: Truck, color: 'text-green-300' },
    { label: 'En tránsito', value: data?.inTransit ?? '…', icon: Activity, color: 'text-blue-300' },
    { label: 'Leads B2B', value: data?.leads ?? '…', icon: Users, color: 'text-teal-300' },
    { label: 'Chats Peyu', value: data?.chats ?? '…', icon: MessageSquare, color: 'text-violet-300' },
    { label: 'Consultas', value: data?.consultas ?? '…', icon: MessageSquare, color: 'text-orange-300' },
    { label: 'Stock crítico', value: data?.lowStock ?? '…', icon: AlertTriangle, color: data?.lowStock > 0 ? 'text-red-300' : 'text-gray-300' },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-400/20 rounded-2xl p-3 shadow-[0_0_60px_rgba(16,185,129,0.15)]">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/80 font-bold">PULSE · LIVE</span>
        </div>
        <span className="text-[10px] text-emerald-300/50 font-mono">
          {now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-2 flex flex-col gap-0.5 transition">
              <Icon className={`w-3.5 h-3.5 ${it.color}`} />
              <span className={`text-base font-bold font-poppins ${it.color} leading-none`}>{it.value}</span>
              <span className="text-[9px] text-white/50 leading-tight">{it.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}