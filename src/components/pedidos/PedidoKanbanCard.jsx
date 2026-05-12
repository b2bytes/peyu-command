import { Package, Clock, MapPin, User, Sparkles, Eye, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPagoStatus } from '@/lib/pago-status';

const ESTADO_COLORS = {
  'Nuevo': 'border-l-amber-400 bg-amber-50/50',
  'Confirmado': 'border-l-blue-400 bg-blue-50/50',
  'En Producción': 'border-l-purple-400 bg-purple-50/50',
  'Listo para Despacho': 'border-l-teal-400 bg-teal-50/50',
  'Despachado': 'border-l-cyan-400 bg-cyan-50/50',
  'Entregado': 'border-l-green-500 bg-green-50/50',
  'Cancelado': 'border-l-red-400 bg-red-50/50',
};

function daysSince(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return days;
}

export default function PedidoKanbanCard({ pedido, onClick }) {
  const color = ESTADO_COLORS[pedido.estado] || 'border-l-gray-300 bg-white';
  const days = daysSince(pedido.fecha);
  const urgent = pedido.estado === 'Nuevo' && days >= 1;
  const pago = getPagoStatus(pedido);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all border-l-4 ${color} group`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-gray-900 truncate">{pedido.numero_pedido || pedido.id.slice(-6)}</span>
            {urgent && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">URGENTE</span>}
            {pedido.requiere_personalizacion && <Sparkles className="w-3 h-3 text-purple-500" />}
          </div>
          <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3" /> {pedido.cliente_nombre}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-gray-900">
            ${(pedido.total || 0).toLocaleString('es-CL')}
          </div>
          {days !== null && (
            <div className="text-[10px] text-gray-500 flex items-center gap-0.5 justify-end">
              <Clock className="w-2.5 h-2.5" /> {days === 0 ? 'Hoy' : `${days}d`}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <Package className="w-3 h-3" /> {pedido.cantidad || 1}u
        </span>
        {pedido.ciudad && (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3" /> {pedido.ciudad}
          </span>
        )}
        <Eye className="w-3 h-3 text-gray-400 group-hover:text-teal-600" />
      </div>
      {/* Chip de pago: visible "Pagado" verde o "Por pagar" ámbar */}
      <div className={`mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
        pago.tone === 'green' ? 'bg-emerald-50 text-emerald-700'
        : pago.tone === 'amber' ? 'bg-amber-50 text-amber-800'
        : pago.tone === 'red' ? 'bg-red-50 text-red-700'
        : 'bg-gray-100 text-gray-600'
      }`}>
        {pago.pagado ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
        {pago.pagado ? 'Pagado' : 'Por pagar'}
      </div>
    </button>
  );
}