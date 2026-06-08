import { memo } from 'react';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';

const ESTADO_CONFIG = {
  'Pendiente Emisión':    { cls: 'bg-slate-100 text-slate-700 border-slate-300', dot: '#94A3B8' },
  'Etiqueta Generada':    { cls: 'bg-blue-100 text-blue-800 border-blue-300',    dot: '#3B82F6' },
  'En Bodega':            { cls: 'bg-indigo-100 text-indigo-800 border-indigo-300', dot: '#6366F1' },
  'Retirado por Courier': { cls: 'bg-cyan-100 text-cyan-800 border-cyan-300',    dot: '#06B6D4' },
  'En Tránsito':          { cls: 'bg-sky-100 text-sky-800 border-sky-300',       dot: '#0EA5E9' },
  'En Reparto':           { cls: 'bg-violet-100 text-violet-800 border-violet-300', dot: '#8B5CF6' },
  'Entregado':            { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: '#10B981' },
  'No Entregado':         { cls: 'bg-amber-100 text-amber-800 border-amber-300', dot: '#F59E0B' },
  'Devuelto':             { cls: 'bg-red-100 text-red-800 border-red-300',       dot: '#EF4444' },
  'Anulado':              { cls: 'bg-slate-200 text-slate-500 border-slate-300', dot: '#CBD5E1' },
  'Excepción':            { cls: 'bg-red-100 text-red-800 border-red-300',       dot: '#DC2626' },
};

const BluexShipmentRow = memo(function BluexShipmentRow({ envio, onClick }) {
  const cfg = ESTADO_CONFIG[envio.estado] || ESTADO_CONFIG['Pendiente Emisión'];

  const ago = envio.ultimo_evento_at
    ? (() => {
        const h = Math.floor((Date.now() - new Date(envio.ultimo_evento_at).getTime()) / 3600000);
        if (h < 1) return 'hace min';
        if (h < 24) return `hace ${h}h`;
        return `hace ${Math.floor(h / 24)}d`;
      })()
    : null;

  const fechaCorta = envio.ultimo_evento_at
    ? new Date(envio.ultimo_evento_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : null;

  return (
    <tr
      onClick={onClick}
      className="border-t border-gray-100 hover:bg-blue-50/60 cursor-pointer transition-colors group"
    >
      {/* Pedido / OT */}
      <td className="px-4 py-3.5">
        <p className="font-bold text-gray-900 text-sm">{envio.numero_pedido || '—'}</p>
        {envio.tracking_number && (
          <p className="text-xs text-blue-600 font-mono mt-0.5">{envio.tracking_number}</p>
        )}
      </td>

      {/* Cliente */}
      <td className="px-4 py-3.5 max-w-[180px]">
        <p className="font-semibold text-gray-800 text-sm truncate">{envio.cliente_nombre || '—'}</p>
        <p className="text-xs text-gray-500 truncate">{envio.cliente_email}</p>
      </td>

      {/* Destino */}
      <td className="px-3 py-3.5">
        <p className="text-sm font-semibold text-gray-800">{envio.comuna_destino || '—'}</p>
        {envio.tipo_destino && (
          <p className="text-xs text-gray-400">{envio.tipo_destino}</p>
        )}
      </td>

      {/* Estado */}
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
            {envio.estado}
          </span>
          {envio.tiene_excepcion && (
            <span title="Excepción">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            </span>
          )}
          {envio.atrasado && envio.estado !== 'Entregado' && (
            <span title="Atrasado">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
            </span>
          )}
        </div>
      </td>

      {/* Última novedad */}
      <td className="px-3 py-3.5 max-w-[200px]">
        {envio.ultimo_evento_descripcion ? (
          <>
            <p className="text-sm text-gray-700 line-clamp-1">{envio.ultimo_evento_descripcion}</p>
            <p className="text-xs text-gray-400">{ago || fechaCorta}</p>
          </>
        ) : fechaCorta ? (
          <p className="text-sm text-gray-500">{fechaCorta}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Sin novedad</p>
        )}
      </td>

      {/* Servicio */}
      <td className="px-3 py-3.5 text-right">
        <span className={`inline-block text-xs font-black px-2 py-1 rounded-lg ${
          envio.servicio === 'EXPRESS' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
        }`}>
          {envio.servicio || 'EXPRESS'}
        </span>
        {envio.peso_kg && (
          <p className="text-xs text-gray-400 mt-0.5 text-right">{envio.peso_kg}kg</p>
        )}
      </td>

      {/* Acción */}
      <td className="px-3 py-3.5 text-right">
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors ml-auto" />
      </td>
    </tr>
  );
});

export default BluexShipmentRow;