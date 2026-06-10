import { useState, useMemo } from 'react';
import { Search, Plus, TrendingDown, Weight, Ruler, Sparkles } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { fmtCLP } from '@/lib/shop-v2-cart';
import { getUnitBasePrice, getB2BPriceForQty } from '@/lib/catalog-pricing';

// Mapa de colores → hex para swatches
const SWATCH_MAP = {
  'azul':'#3B7DD8','negro':'#1A1A1A','rojo':'#D63B3B','verde':'#2E8B57',
  'blanco':'#E8E8E8','amarillo':'#F5C518','naranja':'#E07020','gris':'#9CA3AF',
  'turquesa':'#0E9C9C','rosa':'#E05A8A','celeste':'#5AACE0','café':'#7B4F2E',
  'beige':'#D4C4A0','morado':'#7B3FA0',
};
function swatchColor(name) {
  if (!name) return '#D4C4B0';
  const k = name.toLowerCase();
  for (const [key, val] of Object.entries(SWATCH_MAP)) {
    if (k.includes(key)) return val;
  }
  return '#D4C4B0';
}

function getColores(p) {
  if (Array.isArray(p.colores_v2) && p.colores_v2.length) return p.colores_v2;
  if (Array.isArray(p.colores) && p.colores.length) return p.colores;
  return [];
}

// Buscador de productos para agregar a la cotización B2B.
// Muestra cards ricos: imagen, colores, dimensiones, precio por tramo real.
export default function QuoteProductPicker({ productos, selectedSkus, onAdd, onView }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todos');

  const categorias = useMemo(() => {
    const set = new Set(productos.map((p) => p.categoria?.replace(' B2C', '')).filter(Boolean));
    return ['Todos', ...Array.from(set)];
  }, [productos]);

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    return productos
      .filter((p) => !selectedSkus.includes(p.sku))
      .filter((p) => cat === 'Todos' || p.categoria?.replace(' B2C', '') === cat)
      .filter((p) => !term || (p.nombre || '').toLowerCase().includes(term) || (p.categoria || '').toLowerCase().includes(term))
      .slice(0, 18);
  }, [productos, selectedSkus, q, cat]);

  return (
    <div>
      {/* Buscador */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A78B6F]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca producto para cotizar..."
          className="w-full h-11 lg:h-12 pl-10 pr-4 rounded-xl lg:rounded-2xl bg-[#FAF7F2] lg:bg-white border border-[#EBE3D6] text-sm text-[#2A2420] placeholder:text-[#A78B6F] focus:outline-none focus:border-[#0F8B6C] focus:ring-2 focus:ring-[#0F8B6C]/15 transition-colors"
        />
      </div>

      {/* Chips de categoría */}
      {categorias.length > 2 && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-0.5">
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
        <p className="text-xs text-[#A78B6F] text-center py-6">
          {q ? 'Sin resultados.' : 'Todos los productos ya están en tu cotización.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[420px] lg:max-h-[640px] overflow-y-auto peyu-scrollbar pr-1">
          {filtrados.map((p) => {
            const precioDesde = getB2BPriceForQty(p, 10)?.precio ?? getUnitBasePrice(p);
            const maxVol = getB2BPriceForQty(p, 2000) || getB2BPriceForQty(p, 1000);
            const ahorroMax = maxVol?.ahorroPct || 0;
            const colores = getColores(p);
            const moq = p.personalizacion_gratis_desde || p.moq_personalizacion || 10;
            const dim = p.dim_detalle_v2 || p.dimensiones;
            const pesoPack = p.peso_pack_gr ? `${p.peso_pack_gr}gr/pack` : p.peso_kg ? `${(p.peso_kg * 1000).toFixed(0)}gr/u` : null;
            const tapitas = p.tapitas_aprox;

            return (
              <div
                key={p.id}
                onClick={() => onView?.(p)}
                className="group bg-white border border-[#EBE3D6] hover:border-[#0F8B6C]/50 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Imagen */}
                <div className="relative h-32 lg:h-40 bg-[#F8F4EE] overflow-hidden">
                  <img
                    src={getProductImage(p)}
                    alt={p.nombre}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { e.target.style.opacity = '0.3'; }}
                  />
                  {ahorroMax > 0 && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-[#D96B4D] px-1.5 py-0.5 rounded-full">
                      <TrendingDown className="w-2.5 h-2.5" /> −{ahorroMax}%
                    </span>
                  )}
                  <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/90 text-[#7A6050]">
                    {p.material?.includes('Trigo') ? 'Compostable' : '100% Reciclado'}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#A78B6F] mb-0.5">
                    {p.categoria?.replace(' B2C', '')}
                  </p>
                  <p className="font-bold text-sm text-[#2A2420] leading-snug mb-2">{p.nombre}</p>

                  {/* Specs rápidas */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                    {dim && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-[#A78B6F]">
                        <Ruler className="w-2.5 h-2.5" /> {dim}
                      </span>
                    )}
                    {pesoPack && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-[#A78B6F]">
                        <Weight className="w-2.5 h-2.5" /> {pesoPack}
                      </span>
                    )}
                    {tapitas && (
                      <span className="text-[10px] text-[#0F8B6C] font-semibold">♻ ~{tapitas} tapas/u</span>
                    )}
                  </div>

                  {/* Colores */}
                  {colores.length > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      {colores.slice(0, 5).map((c) => (
                        <span key={c} title={c} className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 flex-shrink-0"
                          style={{ background: swatchColor(c) }} />
                      ))}
                      {colores.length > 5 && (
                        <span className="text-[9px] text-[#A78B6F] font-bold">+{colores.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Precio + botón */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EBE3D6]">
                    <div>
                      <span className="text-[9px] text-[#A78B6F]">desde 10u</span>
                      <p className="font-bold text-sm text-[#0F8B6C] leading-tight">{fmtCLP(precioDesde)}/u</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-bold text-[#0F8B6C] bg-[#0F8B6C]/8 px-1.5 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" /> logo ≥{moq}u
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onAdd(p); }}
                        className="w-8 h-8 rounded-xl bg-[#0F8B6C]/10 hover:bg-[#0F8B6C] text-[#0F8B6C] hover:text-white flex items-center justify-center flex-shrink-0 transition-colors"
                        aria-label="Agregar"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}