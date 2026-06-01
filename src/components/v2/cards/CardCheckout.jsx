import { ShoppingCart, ArrowRight } from 'lucide-react';
import { formatCLP } from '@/lib/v2-catalog';

// Resumen de carro + CTA a checkout, dentro del río del chat.
export default function CardCheckout({ data }) {
  const items = (() => {
    try { return JSON.parse(localStorage.getItem('carrito') || '[]'); } catch { return []; }
  })();
  const total = items.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);

  return (
    <div className="v2-card v2-fade-up p-3.5 w-full max-w-[300px]">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart className="w-4 h-4" style={{ color: 'var(--v2-gold)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>Tu carro</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--v2-fg-muted)' }}>Tu carro está vacío. ¡Cuéntame qué buscas! 🐢</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-3">
            {items.slice(0, 4).map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                {it.imagen && <img src={it.imagen} alt="" className="w-8 h-8 rounded object-cover" />}
                <span className="text-[11px] flex-1 line-clamp-1" style={{ color: 'var(--v2-fg-soft)' }}>{it.nombre}</span>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(it.precio)}</span>
              </div>
            ))}
            {items.length > 4 && <p className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>+{items.length - 4} más</p>}
          </div>
          <div className="flex items-center justify-between pt-2.5 mb-3" style={{ borderTop: '1px solid var(--v2-border)' }}>
            <span className="text-xs" style={{ color: 'var(--v2-fg-muted)' }}>Total</span>
            <span className="text-base font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(total)}</span>
          </div>
          <a href="/cart" className="v2-btn-primary w-full h-10 flex items-center justify-center gap-2 text-xs">
            Finalizar compra <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </>
      )}
    </div>
  );
}