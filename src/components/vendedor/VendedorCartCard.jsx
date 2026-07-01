import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, CreditCard, Truck } from 'lucide-react';
import { getCartV2, updateCartItemV2, removeFromCartV2, subscribeCartV2, fmtCLP } from '@/lib/shop-v2-cart';

export default function VendedorCartCard({ showCheckout = true, compact = false }) {
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
  const totalItems = items.reduce((s, i) => s + (i.cantidad || 1), 0);

  return (
    <div className="rounded-2xl overflow-hidden w-full max-w-sm"
      style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 4px 16px rgba(44,24,16,.08)' }}>

      {/* Header del carrito */}
      <div className="flex items-center gap-2 px-3.5 py-2.5"
        style={{ background: '#F8F3ED', borderBottom: '1px solid #E7D8C6' }}>
        <ShoppingBag className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
        <span className="text-[11px] font-bold" style={{ color: '#2C1810' }}>
          Tu carro · {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {/* Líneas de producto */}
      <div className="divide-y" style={{ borderColor: '#F0E8DE' }}>
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 px-3 py-2.5">
            {item.imagen && (
              <img src={item.imagen} alt={item.nombre} referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover bg-[#F8F3ED] flex-shrink-0 border border-[#EBE3D6]" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold leading-tight truncate" style={{ color: '#2C1810' }}>{item.nombre}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#A08070' }}>
                {item.color ? `${item.color} · ` : ''}{fmtCLP(item.precio)} c/u
                {item.personalizacion && (
                  <span className="ml-1 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px]" style={{ background: 'rgba(15,139,108,.08)', color: '#0F8B6C' }}>
                    ✦ {item.personalizacion.length > 20 ? item.personalizacion.slice(0, 18) + '…' : item.personalizacion}
                  </span>
                )}
              </p>
              <p className="text-[10px] font-bold mt-0.5" style={{ color: '#C0785C' }}>
                {fmtCLP((item.precio || 0) * (item.cantidad || 1))}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => item.cantidad > 1
                  ? updateCartItemV2(item.id, { cantidad: item.cantidad - 1 })
                  : removeFromCartV2(item.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F0E8DE] active:scale-90"
                style={{ border: '1px solid #E7D8C6', color: '#7A6050' }}>
                {item.cantidad > 1 ? <Minus className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
              </button>
              <span className="w-5 text-center text-[11px] font-bold" style={{ color: '#2C1810' }}>{item.cantidad}</span>
              <button
                onClick={() => updateCartItemV2(item.id, { cantidad: (item.cantidad || 1) + 1 })}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F0E8DE] active:scale-90"
                style={{ border: '1px solid #E7D8C6', color: '#7A6050' }}>
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer con total y CTA */}
      <div className="px-3.5 py-3" style={{ borderTop: '1px solid #E7D8C6', background: '#FCFAF7' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold" style={{ color: '#7A6050' }}>Subtotal (IVA incl.)</span>
          <span className="font-poppins font-bold text-lg" style={{ color: '#C0785C' }}>{fmtCLP(subtotal)}</span>
        </div>

        {showCheckout && (
          <>
            <Link
              to="/CheckoutNuevo"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] mb-1.5"
              style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 4px 14px rgba(192,120,92,.3)' }}>
              <CreditCard className="w-4 h-4" /> Ir a pagar <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Payment trust */}
            <div className="flex items-center justify-center gap-3 text-[9px] font-semibold mb-1.5" style={{ color: '#A08070' }}>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> BlueExpress</span>
              <span>Mercado Pago</span>
              <span>Transferencia −5%</span>
            </div>
          </>
        )}

        <Link to="/CarritoNuevo" className="block text-center text-[10px] font-bold underline" style={{ color: '#A08070' }}>
          Ver carrito completo
        </Link>
      </div>
    </div>
  );
}