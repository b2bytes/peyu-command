import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, ShoppingCart, Users, MessageSquare, DollarSign, Truck, AlertTriangle, Brain } from 'lucide-react';

/**
 * PulseBar — heartbeat HUD style, ultra denso.
 * 8 KPIs en 1 fila con LED activo cuando hay actividad.
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
    { label: 'INGRESOS', value: data ? `$${(data.revenue / 1000).toFixed(0)}K` : '—', icon: DollarSign, accent: 'emerald', live: data?.revenue > 0 },
    { label: 'PEDIDOS', value: data?.orders ?? '—', icon: ShoppingCart, accent: 'cyan', live: data?.orders > 0 },
    { label: 'ENTREGADOS', value: data?.delivered ?? '—', icon: Truck, accent: 'green', live: data?.delivered > 0 },
    { label: 'TRÁNSITO', value: data?.inTransit ?? '—', icon: Activity, accent: 'blue', live: data?.inTransit > 0 },
    { label: 'LEADS B2B', value: data?.leads ?? '—', icon: Users, accent: 'teal', live: data?.leads > 0 },
    { label: 'CHATS PEYU', value: data?.chats ?? '—', icon: Brain, accent: 'violet', live: data?.chats > 0 },
    { label: 'CONSULTAS', value: data?.consultas ?? '—', icon: MessageSquare, accent: 'orange', live: data?.consultas > 0, alert: data?.consultas > 5 },
    { label: 'STOCK BAJO', value: data?.lowStock ?? '—', icon: AlertTriangle, accent: 'red', alert: data?.lowStock > 0 },
  ];

  const accentMap = {
    emerald: 'text-emerald-300 border-emerald-400/30',
    cyan: 'text-cyan-300 border-cyan-400/30',
    green: 'text-green-300 border-green-400/30',
    blue: 'text-blue-300 border-blue-400/30',
    teal: 'text-teal-300 border-teal-400/30',
    violet: 'text-violet-300 border-violet-400/30',
    orange: 'text-orange-300 border-orange-400/30',
    red: 'text-red-300 border-red-400/30',
  };

  return (
    <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-400/20 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.08)]">
      {/* Top status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-500/5 border-b border-emerald-400/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
          </span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-emerald-400/90 font-bold">PULSE · LIVE FEED</span>
        </div>
        <span className="text-[9px] text-emerald-300/40 font-mono tracking-wider">
          T+ {now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
      {/* KPIs grid */}
      <div className="grid grid-cols-4 md:grid-cols-8 divide-x divide-white/5">
        {items.map((it, i) => {
          const Icon = it.icon;
          const accent = accentMap[it.accent] || accentMap.cyan;
          return (
            <div key={i} className="px-3 py-2.5 hover:bg-white/[0.02] transition relative group">
              {it.live && (
                <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {it.alert && (
                <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-red-400 animate-pulse" />
              )}
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className={`w-2.5 h-2.5 ${accent.split(' ')[0]}`} />
                <span className="text-[8px] tracking-widest text-white/40 font-mono">{it.label}</span>
              </div>
              <p className={`text-xl font-bold font-poppins leading-none ${accent.split(' ')[0]}`}>{it.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}