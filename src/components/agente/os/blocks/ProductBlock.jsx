// ============================================================================
// PEYU OS · Ficha de producto con imagen real del catálogo.
// ============================================================================
import { Package, Layers } from 'lucide-react';
import { fmtCLP, fmtNum, imagenProducto } from '../helpers';

export default function ProductBlock({ producto }) {
  if (!producto) return null;
  const img = imagenProducto(producto);
  return (
    <div className="rounded-2xl bg-white border border-[#ece4d8] overflow-hidden flex">
      <div className="w-28 h-28 flex-shrink-0 bg-[#f6f1ea] flex items-center justify-center">
        {img ? (
          <img src={img} alt={producto.nombre} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-8 h-8 text-[#c4b8a6]" />
        )}
      </div>
      <div className="flex-1 p-3.5 min-w-0">
        <p className="text-sm font-semibold text-[#22302c] font-poppins leading-tight">{producto.nombre}</p>
        <p className="text-[11px] text-[#9aa6a0] mt-0.5">{producto.categoria} · {producto.sku}</p>
        <div className="flex items-center gap-3 mt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#9aa6a0]">B2C</p>
            <p className="text-sm font-bold text-[#0F8B6C] tabular-nums">{fmtCLP(producto.precio_b2c)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#9aa6a0]">B2B base</p>
            <p className="text-sm font-bold text-[#22302c] tabular-nums">{fmtCLP(producto.precio_base_b2b)}</p>
          </div>
          {producto.stock_actual != null && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[#9aa6a0]">Stock</p>
              <p className="text-sm font-medium text-[#22302c] tabular-nums flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#9aa6a0]" /> {fmtNum(producto.stock_actual)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}