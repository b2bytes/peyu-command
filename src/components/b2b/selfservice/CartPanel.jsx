import { Package, Trash2, ShoppingBag, Sparkles } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';

/**
 * Panel del carrito del flujo Self-Service B2B.
 * Diseño UI/UX 2027 trend: thumbnails, stepper +/-, total destacado en gradient.
 * Se reutiliza tanto en el sidebar desktop como en el drawer inferior móvil.
 */
export default function CartPanel({ cart, calcPrice, updateQty, setQty, removeFromCart, subtotalEstimado, compact = false }) {
  const totalUnidades = cart.reduce((s, c) => s + c.cantidad, 0);

  return (
    <div className={compact ? '' : 'bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/15 rounded-3xl p-4 backdrop-blur-xl shadow-2xl shadow-black/20'}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400/30 to-cyan-500/30 border border-teal-400/40 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h3 className="font-poppins font-bold text-white text-sm leading-none">Tu pedido</h3>
              <p className="text-[10px] text-white/50 mt-0.5">{cart.length} {cart.length === 1 ? 'producto' : 'productos'} · {totalUnidades} u.</p>
            </div>
          </div>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="text-center py-10 px-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-white/30" />
          </div>
          <p className="text-white/60 text-xs font-medium">Tu carrito está vacío</p>
          <p className="text-white/35 text-[10px] mt-1">Agrega productos del catálogo</p>
        </div>
      ) : (
        <div className={`space-y-2 ${compact ? 'max-h-[55vh]' : 'max-h-[420px]'} overflow-y-auto peyu-scrollbar-light pr-1`}>
          {cart.map(c => {
            const unitario = calcPrice(c.producto, c.cantidad);
            const imageUrl = getProductImage(c.producto);
            return (
              <div
                key={c.producto.id}
                className="bg-white/[0.05] hover:bg-white/[0.08] transition-colors border border-white/10 rounded-2xl p-2.5 flex gap-2.5 group"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800/50 flex-shrink-0 border border-white/5">
                  <img
                    src={imageUrl}
                    alt={c.producto.nombre}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info + controls */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="text-[12px] font-semibold text-white leading-tight line-clamp-2 flex-1">
                      {c.producto.nombre}
                    </p>
                    <button
                      onClick={() => removeFromCart(c.producto.id)}
                      className="text-white/30 hover:text-red-400 active:text-red-500 p-0.5 -mr-0.5 -mt-0.5 transition opacity-0 group-hover:opacity-100"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQty(c.producto.id, -10)}
                        className="w-7 h-7 text-white/80 hover:bg-white/10 active:bg-white/15 transition text-base font-bold"
                        aria-label="Restar 10"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={c.cantidad}
                        onChange={e => setQty(c.producto.id, e.target.value)}
                        className="w-10 h-7 text-center text-white text-xs font-bold bg-transparent focus:outline-none focus:bg-white/[0.08] tabular-nums"
                      />
                      <button
                        onClick={() => updateQty(c.producto.id, 10)}
                        className="w-7 h-7 text-white/80 hover:bg-white/10 active:bg-white/15 transition text-base font-bold"
                        aria-label="Sumar 10"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-poppins font-bold text-teal-300 tabular-nums">
                      ${(unitario * c.cantidad).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cart.length > 0 && (
        <div className="border-t border-white/10 mt-3 pt-3.5">
          <div className="bg-gradient-to-br from-teal-500/15 to-cyan-500/15 border border-teal-400/25 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-white/70">Subtotal estimado</span>
              <span className="font-poppins font-extrabold text-lg text-white tabular-nums">
                ${subtotalEstimado.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-teal-300/90">
              <Sparkles className="w-2.5 h-2.5" />
              <span>IVA incluido · descuento por volumen aplicado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}