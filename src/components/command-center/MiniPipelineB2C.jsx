import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ShoppingCart, ArrowRight, Loader2, Clock, Truck, CheckCircle2, Factory } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Mini pipeline B2C para el Centro de Comando.
 * Muestra los últimos pedidos web en vivo agrupados por estado, con auto-refresh.
 * Pensado para que el founder vea de un toque: ¿llegó algo nuevo? ¿qué está en producción?
 */

const ESTADOS_FLOW = [
  { key: 'Nuevo', label: 'Nuevos', icon: Clock, color: 'text-yellow-300', bg: 'bg-yellow-500/15' },
  { key: 'Confirmado', label: 'Confirmados', icon: CheckCircle2, color: 'text-cyan-300', bg: 'bg-cyan-500/15' },
  { key: 'En Producción', label: 'En producción', icon: Factory, color: 'text-orange-300', bg: 'bg-orange-500/15' },
  { key: 'Despachado', label: 'Despachados', icon: Truck, color: 'text-blue-300', bg: 'bg-blue-500/15' },
  { key: 'Entregado', label: 'Entregados', icon: CheckCircle2, color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
];

const fmt = (n) => '$' + (n || 0).toLocaleString('es-CL');
const ago = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export default function MiniPipelineB2C() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    try {
      const res = await base44.entities.PedidoWeb.list('-created_date', 30);
      setPedidos(res || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (e) {
      console.warn('MiniPipelineB2C error:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  // Conteo por estado
  const counts = {};
  for (const e of ESTADOS_FLOW) counts[e.key] = pedidos.filter(p => p.estado === e.key).length;

  // Últimos 4 pedidos para mostrar en el feed
  const recent = pedidos.slice(0, 4);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-semibold text-white text-sm">Pipeline B2C · En vivo</h3>
            <p className="text-[10px] text-orange-300/70">
              {lastUpdate ? `Actualizado ${lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando…'}
            </p>
          </div>
        </div>
        <Link to="/admin/pipeline-b2c" className="text-[11px] text-orange-300 hover:text-orange-200 flex items-center gap-1">
          Ver completo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Flow de estados */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {ESTADOS_FLOW.map((e, i) => {
          const Icon = e.icon;
          return (
            <div key={i} className={`${e.bg} border border-white/10 rounded-lg p-2 text-center hover:bg-white/15 transition`}>
              <Icon className={`w-3.5 h-3.5 ${e.color} mx-auto mb-0.5`} />
              <div className={`text-base font-bold font-poppins ${e.color}`}>
                {loading ? '…' : counts[e.key]}
              </div>
              <div className="text-[9px] text-white/60 leading-tight">{e.label}</div>
            </div>
          );
        })}
      </div>

      {/* Feed de últimos pedidos */}
      <div className="border-t border-white/10 pt-3">
        <p className="text-[10px] text-white/50 uppercase tracking-wide font-semibold mb-2">Últimos pedidos</p>
        {loading ? (
          <div className="flex items-center justify-center py-3 text-white/50 text-xs">
            <Loader2 className="w-3 h-3 animate-spin mr-2" /> Cargando…
          </div>
        ) : recent.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-3">Sin pedidos aún</p>
        ) : (
          <div className="space-y-1.5">
            {recent.map(p => (
              <Link
                key={p.id}
                to={`/admin/procesar-pedidos`}
                className="flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 rounded-lg p-2 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white truncate">{p.cliente_nombre || 'Cliente'}</span>
                    <span className="text-[9px] text-white/40">·</span>
                    <span className="text-[10px] text-white/50">{ago(p.created_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-orange-300">{fmt(p.total)}</span>
                    <span className="text-[10px] text-white/40">{p.canal || 'Web'}</span>
                  </div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                  p.estado === 'Entregado' ? 'bg-emerald-500/20 text-emerald-300' :
                  p.estado === 'Despachado' ? 'bg-blue-500/20 text-blue-300' :
                  p.estado === 'En Producción' ? 'bg-orange-500/20 text-orange-300' :
                  p.estado === 'Confirmado' ? 'bg-cyan-500/20 text-cyan-300' :
                  p.estado === 'Cancelado' ? 'bg-red-500/20 text-red-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {p.estado}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}