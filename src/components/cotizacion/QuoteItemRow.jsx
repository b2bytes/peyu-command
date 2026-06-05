import { Trash2 } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Fila de un producto dentro de la cotización rápida B2B. Muestra el precio
// unitario por volumen (en vivo) + subtotal, con control de cantidad y eliminar.
export default function QuoteItemRow({ producto, qty, onQty, onRemove }) {
  const b2b = getB2BPriceForQty(producto, qty);
  const unit = b2b?.precio ?? getUnitBasePrice(producto);
  const ahorro = b2b?.ahorroPct ?? 0;
  const subtotal = unit * qty;

  return (
    <div className="flex items-center gap-3 bg-white border border-[#EBE3D6] rounded-2xl p-3">
      <img
        src={getProductImage(producto)}
        alt={producto.nombre}
        className="w-14 h-14 object-cover rounded-xl bg-[#FAF7F2] flex-shrink-0"
        onError={(e) => { e.target.style.visibility = 'hidden'; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-[#2A2420] truncate">{producto.nombre}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[12px] font-bold text-[#0F8B6C]">{fmtCLP(unit)}/u</span>
          {ahorro > 0 && (
            <span className="text-[10px] font-bold text-[#D96B4D] bg-[#D96B4D]/10 px-1.5 py-0.5 rounded-full">
              −{ahorro}%
            </span>
          )}
          {b2b?.label && <span className="text-[10px] text-[#A78B6F]">{b2b.label}</span>}
        </div>
      </div>

      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => onQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
        className="w-16 h-9 text-center text-sm font-bold text-[#2A2420] bg-[#FAF7F2] border border-[#EBE3D6] rounded-lg focus:outline-none focus:border-[#0F8B6C] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <div className="w-24 text-right">
        <p className="text-sm font-bold text-[#2A2420]">{fmtCLP(subtotal)}</p>
      </div>

      <button
        onClick={onRemove}
        className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#EBE3D6] hover:border-[#D96B4D]/40 hover:text-[#D96B4D] flex items-center justify-center text-[#A78B6F] flex-shrink-0 transition-colors"
        aria-label="Quitar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}