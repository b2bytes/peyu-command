import { useState } from 'react';
import { Package, Sparkles, ChevronDown, MapPin } from 'lucide-react';

const ESTADO_BADGE = {
  Entregado: 'bg-emerald-100 text-emerald-700',
  Despachado: 'bg-blue-100 text-blue-700',
  'En Producción': 'bg-purple-100 text-purple-700',
  Cancelado: 'bg-red-100 text-red-600',
  Reembolsado: 'bg-red-100 text-red-600',
};

// Histórico de pedidos como timeline limpio y escaneable, con "ver más".
export default function ClientePedidosTimeline({ pedidos = [] }) {
  const [showAll, setShowAll] = useState(false);
  const visibles = showAll ? pedidos : pedidos.slice(0, 8);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-4 h-4 text-teal-600" /> Histórico de pedidos
        </h2>
        <span className="text-xs text-gray-400 font-semibold">{pedidos.length} total</span>
      </div>

      {pedidos.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Sin pedidos registrados aún</p>
      ) : (
        <div className="relative pl-4">
          {/* Línea vertical */}
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-200" />
          <div className="space-y-1">
            {visibles.map(p => {
              const badge = ESTADO_BADGE[p.estado] || 'bg-gray-100 text-gray-600';
              return (
                <div key={p.id} className="relative flex items-center justify-between gap-3 py-2.5 px-3 -ml-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <span className={`absolute -left-[7.5px] w-2.5 h-2.5 rounded-full border-2 border-white ${
                    p.estado === 'Entregado' ? 'bg-emerald-500' : p.estado === 'Cancelado' ? 'bg-red-400' : 'bg-teal-500'
                  }`} />
                  <div className="min-w-0 ml-2">
                    <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                      {p.numero_pedido || p.id.slice(-6)}
                      {p.requiere_personalizacion && <Sparkles className="w-3.5 h-3.5 text-purple-500" title="Personalizado" />}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                      {p.fecha} · {p.cantidad || 1}u
                      {p.ciudad && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.ciudad}</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-gray-900">${(p.total || 0).toLocaleString('es-CL')}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>{p.estado}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pedidos.length > 8 && (
        <button onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-xl transition-colors flex items-center justify-center gap-1">
          {showAll ? 'Ver menos' : `Ver los ${pedidos.length} pedidos`}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}