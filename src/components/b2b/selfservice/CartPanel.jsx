import { Package, Trash2 } from 'lucide-react';

/**
 * Panel del carrito del flujo Self-Service B2B.
 * Se reutiliza tanto en el sidebar desktop como en el drawer inferior móvil.
 */
export default function CartPanel({ cart, calcPrice, updateQty, setQty, removeFromCart, subtotalEstimado, compact = false }) {
  return (
    <div className={compact ? '' : 'bg-white/5 border border-white/15 rounded-2xl p-4 backdrop-blur-sm'}>
      {!compact && (
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-teal-400" />
          <h3 className="font-bold text-white text-sm">Tu pedido ({cart.length})</h3>
        </div>
      )}

      {cart.length === 0 ? (
        <p className="text-white/40 text-xs text-center py-6">Agrega productos desde el catálogo.</p>
      ) : (
        <div className={`space-y-2 ${compact ? 'max-h-[55vh]' : 'max-h-80'} overflow-y-auto peyu-scrollbar-light`}>
          {cart.map(c => {
            const unitario = calcPrice(c.producto, c.cantidad);
            return (
              <div key={c.producto.id} className="bg-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-white truncate flex-1">{c.producto.nombre}</p>
                  <button
                    onClick={() => removeFromCart(c.producto.id)}
                    className="text-white/40 hover:text-red-400 active:text-red-500 p-1 -m-1"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center bg-white/10 rounded-lg">
                    <button
                      onClick={() => updateQty(c.producto.id, -10)}
                      className="w-9 h-9 text-white hover:bg-white/10 active:bg-white/15 rounded-l-lg text-lg"
                      aria-label="Restar 10"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={c.cantidad}
                      onChange={e => setQty(c.producto.id, e.target.value)}
                      className="w-14 h-9 text-center text-white text-sm bg-transparent focus:outline-none"
                    />
                    <button
                      onClick={() => updateQty(c.producto.id, 10)}
                      className="w-9 h-9 text-white hover:bg-white/10 active:bg-white/15 rounded-r-lg text-lg"
                      aria-label="Sumar 10"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-bold text-teal-300">${(unitario * c.cantidad).toLocaleString('es-CL')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cart.length > 0 && (
        <div className="border-t border-white/10 mt-3 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-white/70">
            <span>Subtotal estimado</span>
            <span className="font-bold text-white">${subtotalEstimado.toLocaleString('es-CL')}</span>
          </div>
          <p className="text-[10px] text-white/40">IVA incluido · descuento por volumen aplicado</p>
        </div>
      )}
    </div>
  );
}