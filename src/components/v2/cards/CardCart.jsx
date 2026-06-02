import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, ArrowRight, Minus, Plus } from 'lucide-react';
import { formatCLP } from '@/lib/v2-catalog';
import { readCart, setQty, removeLine, clearCart, computeCartTotals } from '@/lib/v2-cart';

// Card del río: carrito completo y EDITABLE (cantidad, quitar, vaciar) + CTA
// finalizar compra. Sincroniza en vivo con la columna derecha vía eventos.
export default function CardCart({ onCheckout }) {
  const [items, setItems] = useState(readCart());

  useEffect(() => {
    const refresh = () => setItems(readCart());
    window.addEventListener('v2:cart-updated', refresh);
    window.addEventListener('peyu:cart-added', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('v2:cart-updated', refresh);
      window.removeEventListener('peyu:cart-added', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const t = computeCartTotals(items);

  if (items.length === 0) {
    return (
      <div className="v2-card v2-fade-up p-3.5 w-full max-w-[320px]">
        <div className="flex items-center gap-2 mb-1.5">
          <ShoppingCart className="w-4 h-4" style={{ color: 'var(--v2-gold)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>Tu carro</p>
        </div>
        <p className="text-xs" style={{ color: 'var(--v2-fg-muted)' }}>Está vacío. Cuéntame qué buscas y lo armamos juntos 🐢</p>
      </div>
    );
  }

  return (
    <div className="v2-card v2-fade-up p-3.5 w-full max-w-[340px]">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart className="w-4 h-4" style={{ color: 'var(--v2-gold)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>Tu carro</p>
        <button
          onClick={() => clearCart()}
          className="ml-auto text-[10px] flex items-center gap-1 hover:opacity-80"
          style={{ color: 'var(--v2-fg-subtle)' }}
        >
          <Trash2 className="w-3 h-3" /> Vaciar
        </button>
      </div>

      <div className="flex flex-col gap-2.5 mb-3">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-2.5">
            {it.imagen
              ? <img src={it.imagen} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--v2-surface-2)' }}>🐢</div>}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium line-clamp-1" style={{ color: 'var(--v2-fg-soft)' }}>{it.nombre}</p>
              {it.color && <p className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>{it.color}</p>}
              <p className="text-[11px] font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP((it.precio || 0) * (it.cantidad || 1))}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setQty(it.id, (it.cantidad || 1) - 1)} className="v2-btn-ghost w-6 h-6 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
              <span className="text-[11px] font-semibold w-5 text-center" style={{ color: 'var(--v2-fg)' }}>{it.cantidad}</span>
              <button onClick={() => setQty(it.id, (it.cantidad || 1) + 1)} className="v2-btn-ghost w-6 h-6 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2.5 space-y-1" style={{ borderTop: '1px solid var(--v2-border)' }}>
        <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--v2-fg-muted)' }}>
          <span>Subtotal ({t.unidades} u.)</span>
          <span>{formatCLP(t.subtotal)}</span>
        </div>
        {t.descuentoVolumen > 0 && (
          <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--v2-teal)' }}>
            <span>📦 Descuento volumen ({t.pctVolumen}%)</span>
            <span>−{formatCLP(t.descuentoVolumen)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--v2-fg)' }}>Total</span>
          <span className="text-base font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(t.totalSinEnvio)}</span>
        </div>
        {t.teaser.necesita > 0 && t.unidades >= 1 && (
          <p className="text-[10px] pt-1" style={{ color: 'var(--v2-teal)' }}>
            ✨ Agrega {t.teaser.necesita} más y obtén {t.teaser.pctSiguiente}% off
          </p>
        )}
      </div>

      <button onClick={onCheckout} className="v2-btn-primary w-full h-10 flex items-center justify-center gap-2 text-xs mt-3">
        Finalizar compra <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}