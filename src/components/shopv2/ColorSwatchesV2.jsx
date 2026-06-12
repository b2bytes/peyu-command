import { Check } from 'lucide-react';
import { getProductImageForColor } from '@/utils/productImages';
import { isProductoCarcasa } from '@/lib/product-engraving-areas';

// Selector de color del Shop v2.
// · CARCASAS: swatch con la FOTO real del color (imagenes_por_color es confiable ahí).
// · RESTO DE PRODUCTOS: SIEMPRE círculo de color sólido — nunca fotos. El mapa
//   imagenes_por_color estaba mal poblado en no-carcasas y mostraba fotos de
//   otro color (bug reportado por el cliente: "elegí rojo y aparece negro").
// · Si el producto tiene stock_por_color, los colores agotados se deshabilitan.
export default function ColorSwatchesV2({ colores = [], value, onSelect, error, producto }) {
  if (!colores.length) return null;

  const esCarcasa = producto ? isProductoCarcasa(producto) : false;
  const hasPhotos = esCarcasa && !!(producto?.imagenes_por_color && typeof producto.imagenes_por_color === 'object');

  // Stock por color: solo aplica si el mapa existe y tiene datos.
  const stockMap = producto?.stock_por_color;
  const tieneStockPorColor = stockMap && typeof stockMap === 'object' && Object.keys(stockMap).length > 0;
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const stockDe = (c) => {
    if (!tieneStockPorColor) return null;
    const candidatos = [c.label, c.id, ...(c.aliases || [])].map(norm);
    const hit = Object.entries(stockMap).find(([k]) => candidatos.includes(norm(k)));
    return hit ? Number(hit[1]) : null;
  };

  return (
    <div data-color-selector>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-sm font-bold text-[#2A2420]">
          Color {colores.length > 1 && <span className="text-[#D96B4D]">*</span>}
        </label>
        {value && (
          <span className="text-xs font-semibold text-[#4B4F54]">
            {colores.find((c) => c.id === value)?.label}
          </span>
        )}
      </div>
      <div className={`flex flex-wrap justify-center sm:justify-start gap-3 ${error ? 'p-2 -m-2 rounded-xl ring-2 ring-[#D96B4D]/40' : ''}`}>
        {colores.map((c) => {
          const sel = value === c.id;
          const photo = hasPhotos ? getProductImageForColor(producto, c) : null;
          const usePhoto = hasPhotos && photo && photo !== getProductImageForColor(producto, '__none__');
          const stock = stockDe(c);
          const agotado = stock !== null && stock <= 0;
          return (
            <div key={c.id} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => !agotado && onSelect(c.id)}
                disabled={agotado}
                title={agotado ? `${c.label} — agotado` : c.label}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 overflow-hidden transition-all ${
                  agotado
                    ? 'border-[#EBE3D6] opacity-35 cursor-not-allowed'
                    : sel
                      ? 'border-[#0F8B6C] scale-110 shadow-md'
                      : 'border-[#EBE3D6] hover:scale-105'
                }`}
                style={usePhoto ? undefined : c.id === 'mixto'
                  ? { background: 'conic-gradient(#4DA3DC 0 25%, #212121 25% 50%, #F0807A 50% 75%, #4BC5A5 75% 100%)' }
                  : { backgroundColor: c.hex || '#ccc' }}
              >
                {usePhoto && (
                  <img src={photo} alt={c.label} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                )}
                {agotado && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-full h-0.5 bg-[#A78B6F] rotate-45" />
                  </span>
                )}
                {sel && !agotado && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <Check className="w-5 h-5 sm:w-4 sm:h-4 text-white drop-shadow-lg" strokeWidth={3} />
                  </span>
                )}
              </button>
              <span className={`text-[9px] font-semibold leading-none ${sel ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`}>
                {agotado ? 'Agotado' : c.label}
              </span>
            </div>
          );
        })}
      </div>
      {error && <p className="text-xs text-[#D96B4D] font-semibold mt-2">Elige un color para continuar</p>}
    </div>
  );
}