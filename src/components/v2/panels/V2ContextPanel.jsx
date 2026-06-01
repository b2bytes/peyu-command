import { ShoppingCart, ArrowRight, Clock, Sparkles, Building2, X } from 'lucide-react';
import { formatCLP } from '@/lib/v2-catalog';

// Panel derecho cockpit VIVO: carrito persistente + vistos recientemente +
// recomendaciones / destacados. En modo Empresa muestra resumen de cotización.
export default function V2ContextPanel({
  perfil, cart, recientes, destacados, quoteDraft,
  onPick, onCheckout, onClose,
}) {
  const total = cart.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
  const recos = (recientes.length > 0 ? destacados : destacados).slice(0, 4);

  return (
    <div className="flex flex-col h-full">
      {onClose && (
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--v2-border)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--v2-fg)' }}>Tu actividad</span>
          <button onClick={onClose} className="v2-btn-ghost w-8 h-8 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto v2-scroll px-3 py-4 flex flex-col gap-5">
        {/* Carrito vivo */}
        <div className="v2-card p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <ShoppingCart className="w-4 h-4" style={{ color: 'var(--v2-gold)' }} />
            <p className="text-xs font-bold" style={{ color: 'var(--v2-fg)' }}>Tu carro</p>
            {cart.length > 0 && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--v2-gold-soft)', color: 'var(--v2-gold)' }}>{cart.length}</span>
            )}
          </div>
          {cart.length === 0 ? (
            <p className="text-[11px]" style={{ color: 'var(--v2-fg-muted)' }}>Vacío por ahora. Cuéntame qué buscas y lo armamos juntos 🐢</p>
          ) : (
            <>
              <div className="flex flex-col gap-2 mb-2.5">
                {cart.slice(0, 4).map((it, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {it.imagen && <img src={it.imagen} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
                    <span className="text-[11px] flex-1 line-clamp-1" style={{ color: 'var(--v2-fg-soft)' }}>{it.nombre}</span>
                    <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: 'var(--v2-gold)' }}>{formatCLP(it.precio)}</span>
                  </div>
                ))}
                {cart.length > 4 && <p className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>+{cart.length - 4} más</p>}
              </div>
              <div className="flex items-center justify-between pt-2 mb-2.5" style={{ borderTop: '1px solid var(--v2-border)' }}>
                <span className="text-[11px]" style={{ color: 'var(--v2-fg-muted)' }}>Subtotal</span>
                <span className="text-sm font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(total)}</span>
              </div>
              <button onClick={onCheckout} className="v2-btn-primary w-full h-9 flex items-center justify-center gap-1.5 text-[11px]">
                Finalizar compra <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Cotización en curso (B2B) */}
        {perfil === 'b2b' && quoteDraft && (
          <div className="v2-card p-3" style={{ borderColor: 'var(--v2-teal)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4" style={{ color: 'var(--v2-teal)' }} />
              <p className="text-xs font-bold" style={{ color: 'var(--v2-fg)' }}>Cotización en curso</p>
            </div>
            <div className="flex items-center gap-2">
              {quoteDraft.imagen_url && <img src={quoteDraft.imagen_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
              <p className="text-[11px] line-clamp-2" style={{ color: 'var(--v2-fg-soft)' }}>{quoteDraft.nombre}</p>
            </div>
          </div>
        )}

        {/* Vistos recientemente */}
        {recientes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5" style={{ color: 'var(--v2-fg-subtle)' }}>
              <Clock className="w-3 h-3" /> Vistos recientemente
            </p>
            <div className="flex flex-col gap-1.5">
              {recientes.slice(0, 3).map((p) => (
                <button key={p.sku} onClick={() => onPick(p)} className="v2-mini-card flex items-center gap-2 p-1.5 text-left">
                  {p.imagen_url && <img src={p.imagen_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium line-clamp-1" style={{ color: 'var(--v2-fg-soft)' }}>{p.nombre}</p>
                    <p className="text-[10px] font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(p.precio_b2c)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recomendaciones / destacados */}
        {recos.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5" style={{ color: 'var(--v2-fg-subtle)' }}>
              <Sparkles className="w-3 h-3" /> {recientes.length > 0 ? 'Te puede gustar' : 'Best-sellers'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {recos.map((p) => (
                <button key={p.sku || p.id} onClick={() => onPick(p)} className="v2-mini-card text-left overflow-hidden">
                  <div className="aspect-square overflow-hidden" style={{ background: 'var(--v2-surface-2)' }}>
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt={p.nombre} loading="lazy" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🐢</div>}
                  </div>
                  <div className="p-1.5">
                    <p className="text-[10px] font-medium line-clamp-2 leading-tight" style={{ color: 'var(--v2-fg-soft)' }}>{p.nombre}</p>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--v2-gold)' }}>{formatCLP(p.precio_b2c)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}