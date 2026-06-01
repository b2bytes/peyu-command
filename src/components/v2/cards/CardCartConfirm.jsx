import { Check, ShoppingCart } from 'lucide-react';
import { formatCLP } from '@/lib/v2-catalog';

// Confirmación de "agregado al carro" dentro del río del chat.
export default function CardCartConfirm({ data, onCheckout }) {
  const item = data?.item || {};
  return (
    <div className="v2-card v2-fade-up p-3.5 w-full max-w-[300px]">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--v2-teal-soft)' }}>
          <Check className="w-4 h-4" style={{ color: 'var(--v2-teal)' }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>Agregado al carro</p>
      </div>
      <div className="flex gap-2.5 items-center">
        {item.imagen && <img src={item.imagen} alt="" className="w-12 h-12 rounded-lg object-cover" />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium line-clamp-1" style={{ color: 'var(--v2-fg-soft)' }}>{item.nombre}</p>
          {item.color && <p className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>Color: {item.color}</p>}
          <p className="text-xs font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(item.precio)}</p>
        </div>
      </div>
      <button onClick={onCheckout} className="v2-btn-primary w-full h-9 flex items-center justify-center gap-2 text-xs mt-3">
        <ShoppingCart className="w-3.5 h-3.5" /> Ir al carro
      </button>
    </div>
  );
}