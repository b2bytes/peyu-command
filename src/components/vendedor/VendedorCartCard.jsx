import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { getCartV2, updateCartItemV2, removeFromCartV2, subscribeCartV2, fmtCLP } from '@/lib/shop-v2-cart';

// Carrito EN VIVO dentro del chat del vendedor: el cliente ve, edita
// cantidades, elimina items y va a pagar sin salir de la conversación.
export default function VendedorCartCard({ showCheckout = true }) {
  const [items, setItems] = useState(() => getCartV2());
  useEffect(() => subscribeCartV2(setItems), []);

  if (!items.length) {
    return (
      <div className="rounded-2xl px-4 py-3 text-xs font-semibold text-center"
        style={{ background: 'white', border: '1.5px dashed #D4C4B0', color: '#A08070' }}>
        Tu carro está vacío — pídeme algo y lo agrego al tiro 🐢
      </div>
    );
  }

  const subtotal = items.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);

  return (
    <div className="rounded-2xl overflow-hidden w-full max-w-sm" style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 4px 16px rgba(44,24,16,.08)' }}>
      <div className="flex items-center gap-2 px-3.5 py-2" style={{ background: '#F8F3ED', borderBottom: '1px solid #E7D8C6' }}>
        <ShoppingBag className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
        <span className="text-[11px] font-bold" style={{ color: '#2C1810' }}>Tu carro · {items.length} {items.length === 1 ? 'producto' : 'productos'}</span>
      </div>

      <div className="divide-y" style={{ borderColor: '#F0E8DE' }}>
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-2.5 px-3 py-2">
            {i.imagen && (
              <img src={i.imagen} alt={i.nombre} referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-lg object-cover bg-[#F8F3ED] flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold leading-tight truncate" style={{ color: '#2C1810' }}>{i.nombre}</p>
              <p className="text-[10px]" style={{ color: '#A08070' }}>
                {i.color ? `${i.color} · ` : ''}{fmtCLP(i.precio)} c/u
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => i.cantidad > 1
                  ? updateCartItemV2(i.id, { cantidad: i.cantidad - 1 })
                  : removeFromCartV2(i.id)}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-[#F0E8DE]"
                style={{ border: '1px solid #E7D8C6', color: '#7A6050' }}>
                {i.cantidad > 1 ? <Minus className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
              </button>
              <span className="w-5 text-center text-[11px] font-bold" style={{ color: '#2C1810' }}>{i.cantidad}</span>
              <button
                onClick={() => updateCartItemV2(i.id, { cantidad: (i.cantidad || 1) + 1 })}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-[#F0E8DE]"
                style={{ border: '1px solid #E7D8C6', color: '#7A6050' }}>
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-3.5 py-2.5" style={{ borderTop: '1px solid #E7D8C6' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold" style={{ color: '#7A6050' }}>Subtotal (IVA incl.)</span>
          <span className="font-poppins font-bold text-base" style={{ color: '#C0785C' }}>{fmtCLP(subtotal)}</span>
        </div>
        {showCheckout && (
          <Link
            to="/CheckoutNuevo"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.01] active:scale-95"
            style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 4px 14px rgba(192,120,92,.3)' }}>
            Ir a pagar <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        <Link to="/CarritoNuevo" className="block text-center text-[10px] font-bold mt-1.5 underline" style={{ color: '#A08070' }}>
          Ver carrito completo
        </Link>
      </div>
    </div>
  );
}