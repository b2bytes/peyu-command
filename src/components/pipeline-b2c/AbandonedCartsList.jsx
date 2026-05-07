// AbandonedCartsList · Carritos abandonados de hoy con email capturado.
import { ShoppingCart, Mail, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AbandonedCartsList({ carritos }) {
  const pendientes = carritos.filter(c => c.estado === 'Pendiente');
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-amber-600" />
          <h2 className="font-bold text-slate-900 font-jakarta">Carritos abandonados</h2>
        </div>
        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
          {pendientes.length} pendientes
        </span>
      </div>
      <div className="p-3 space-y-2 max-h-72 overflow-y-auto peyu-scrollbar">
        {carritos.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">Sin carritos abandonados hoy</p>
        )}
        {carritos.map(cart => (
          <div key={cart.id} className="border border-slate-200 rounded-xl p-3 hover:bg-amber-50/40 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-900 truncate">{cart.email}</span>
              </div>
              <span className="text-sm font-bold text-amber-700 ml-2">
                ${(cart.total || 0).toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{cart.carrito_items?.length || 0} items · {cart.estado}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(cart.created_date), { locale: es, addSuffix: true })}
              </div>
            </div>
            {cart.estado === 'Pendiente' && !cart.reminder_sent_at && (
              <div className="mt-2 text-[10px] text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Recordatorio pendiente
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}