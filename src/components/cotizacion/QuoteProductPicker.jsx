import { useState, useMemo } from 'react';
import { Search, Plus, TrendingDown } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { fmtCLP } from '@/lib/shop-v2-cart';
import { getUnitBasePrice, getB2BPriceForQty } from '@/lib/catalog-pricing';

// Buscador de productos para agregar a la cotización B2B. Lista el catálogo
// activo, permite filtrar por categoría y agregar con un click. Muestra el
// ahorro máximo por volumen para incentivar pedidos grandes.
export default function QuoteProductPicker({ productos, selectedSkus, onAdd }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todos');

  // Categorías disponibles (chips de filtro rápido).
  const categorias = useMemo(() => {
    const set = new Set(productos.map((p) => p.categoria).filter(Boolean));
    return ['Todos', ...Array.from(set)];
  }, [productos]);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return productos
      .filter((p) => !selectedSkus.includes(p.sku))
      .filter((p) => cat === 'Todos' || p.categoria === cat)
      .filter((p) => !term || (p.nombre || '').toLowerCase().includes(term) || (p.categoria || '').toLowerCase().includes(term))
      .slice(0, 12);
  }, [productos, selectedSkus, q, cat]);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78B6F]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca un producto para cotizar..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-[#EBE3D6] text-sm text-[#2A2420] placeholder:text-[#A78B6F] focus:outline-none focus:border-[#0F8B6C] focus:ring-2 focus:ring-[#0F8B6C]/15"
        />
      </div>

      {/* Chips de categoría */}
      {categorias.length > 2 && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-0.5">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                cat === c
                  ? 'bg-[#0F8B6C] text-white'
                  : 'bg-white border border-[#EBE3D6] text-[#4B4F54] hover:border-[#0F8B6C]/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {filtrados.length === 0 ? (
        <p className="text-xs text-[#A78B6F] text-center py-4">
          {q ? 'Sin resultados.' : 'Todos los productos ya están en tu cotización.'}
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto peyu-scrollbar pr-1">
          {filtrados.map((p) => {
            // Ahorro máximo (tramo de mayor volumen) para incentivar volumen.
            const maxVol = getB2BPriceForQty(p, 2000);
            const ahorroMax = maxVol?.ahorroPct || 0;
            return (
              <button
                key={p.id}
                onClick={() => onAdd(p)}
                className="w-full flex items-center gap-3 bg-white border border-[#EBE3D6] hover:border-[#0F8B6C]/40 rounded-xl p-2.5 text-left transition-colors group"
              >
                <img
                  src={getProductImage(p)}
                  alt={p.nombre}
                  className="w-10 h-10 object-cover rounded-lg bg-[#FAF7F2] flex-shrink-0"
                  onError={(e) => { e.target.style.visibility = 'hidden'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#2A2420] truncate">{p.nombre}</p>
                  <p className="text-[11px] text-[#A78B6F]">{p.categoria} · desde {fmtCLP(getUnitBasePrice(p))}/u</p>
                </div>
                {ahorroMax > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold text-[#0F8B6C] bg-[#0F8B6C]/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
                    <TrendingDown className="w-3 h-3" /> -{ahorroMax}%
                  </span>
                )}
                <span className="w-8 h-8 rounded-lg bg-[#0F8B6C]/8 group-hover:bg-[#0F8B6C] text-[#0F8B6C] group-hover:text-white flex items-center justify-center flex-shrink-0 transition-colors">
                  <Plus className="w-4 h-4" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}