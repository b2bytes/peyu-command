// TodayOrdersList · Pedidos cerrados hoy.
import { Package, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADO_COLOR = {
  'Nuevo': 'bg-blue-100 text-blue-700',
  'Confirmado': 'bg-emerald-100 text-emerald-700',
  'En Producción': 'bg-amber-100 text-amber-700',
  'Despachado': 'bg-violet-100 text-violet-700',
  'Entregado': 'bg-emerald-100 text-emerald-700',
};

export default function TodayOrdersList({ pedidos }) {
  const total = pedidos.reduce((s, p) => s + (p.total || 0), 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-slate-900 font-jakarta">Pedidos hoy</h2>
        </div>
        <span className="text-sm font-bold text-emerald-700">
          ${total.toLocaleString('es-CL')}
        </span>
      </div>
      <div className="p-3 space-y-2 max-h-72 overflow-y-auto peyu-scrollbar">
        {pedidos.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">Sin pedidos aún hoy</p>
        )}
        {pedidos.map(p => (
          <div key={p.id} className="border border-slate-200 rounded-xl p-3 hover:bg-emerald-50/40 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-900 truncate">{p.numero_pedido}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                ${(p.total || 0).toLocaleString('es-CL')}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">{p.cliente_nombre} · {p.cliente_email}</p>
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
              <span className={`px-2 py-0.5 rounded-full font-semibold ${ESTADO_COLOR[p.estado] || 'bg-slate-100 text-slate-600'}`}>
                {p.estado}
              </span>
              <span>{formatDistanceToNow(new Date(p.created_date), { locale: es, addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}