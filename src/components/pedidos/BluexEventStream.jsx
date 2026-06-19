import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Truck, Zap, RefreshCw, CheckCircle2, AlertTriangle, Package, Mail } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// BluexEventStream · Panel en vivo de eventos BlueExpress + secuencias
// automáticas disparadas. Convierte el pipeline de un registro pasivo en un
// centro que MUESTRA qué automatizaciones se activaron con cada entrega.
// Lee de la entidad Envio (timeline real del courier) y de las
// notificaciones_enviadas[] que dejaron las secuencias.
// ════════════════════════════════════════════════════════════════════════

const ESTADO_CFG = {
  'Entregado':            { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Entregado' },
  'En Reparto':           { icon: Truck,        color: 'text-cyan-600',    bg: 'bg-cyan-50 border-cyan-200',       label: 'En reparto' },
  'En Tránsito':          { icon: Truck,        color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',       label: 'En tránsito' },
  'Retirado por Courier': { icon: Package,      color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200',   label: 'Retirado' },
  'No Entregado':         { icon: AlertTriangle,color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     label: 'Intento fallido' },
  'Excepción':            { icon: AlertTriangle,color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         label: 'Incidencia' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function BluexEventStream() {
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Envio.list('-ultimo_evento_at', 40);
      setEnvios((data || []).filter(e => e.ultimo_evento_at));
    } catch {
      setEnvios([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Refresco en vivo cuando llega un evento nuevo de BlueExpress
    const unsub = base44.entities.Envio.subscribe(() => load());
    return unsub;
  }, []);

  const entregadosHoy = envios.filter(e => {
    if (e.estado !== 'Entregado' || !e.fecha_entrega_real) return false;
    return new Date(e.fecha_entrega_real).toDateString() === new Date().toDateString();
  }).length;

  const conIncidencia = envios.filter(e => e.tiene_excepcion || e.estado === 'No Entregado').length;

  return (
    <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900">Eventos BlueExpress en vivo</h3>
          <p className="text-[11px] text-gray-500">Cada entrega dispara la secuencia post-venta automática</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
            {entregadosHoy} entregados hoy
          </span>
          {conIncidencia > 0 && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
              {conIncidencia} con incidencia
            </span>
          )}
          <button onClick={load} className="p-1.5 hover:bg-white rounded-lg text-gray-500 border border-transparent hover:border-gray-200">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-h-[280px] overflow-y-auto divide-y divide-gray-50">
        {loading && envios.length === 0 && (
          <p className="text-center py-8 text-xs text-gray-400">Cargando eventos...</p>
        )}
        {!loading && envios.length === 0 && (
          <p className="text-center py-8 text-xs text-gray-400">Aún no hay eventos de BlueExpress registrados.</p>
        )}
        {envios.slice(0, 20).map(envio => {
          const cfg = ESTADO_CFG[envio.estado] || { icon: Truck, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: envio.estado };
          const Icon = cfg.icon;
          const notifs = envio.notificaciones_enviadas || [];
          const ultimaNotif = notifs[notifs.length - 1];
          return (
            <div key={envio.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50/60 transition">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 truncate">{envio.numero_pedido || envio.tracking_number}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-[11px] text-gray-500 truncate">
                  {envio.cliente_nombre || 'Cliente'} · {envio.comuna_destino || 'destino'} · {timeAgo(envio.ultimo_evento_at)}
                </p>
              </div>
              {ultimaNotif && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 flex-shrink-0">
                  <Mail className="w-3 h-3" /> {notifs.length} email{notifs.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}