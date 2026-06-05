import { Check } from 'lucide-react';
import { getProductImageForColor } from '@/utils/productImages';

// Selector de color del Shop v2 (Baymard 2026 #1: variantes siempre visibles,
// foto real + swatch, nunca dropdown oculto). Si el producto tiene imagen por
// color (carcasas), el swatch usa la FOTO real; si no, el color sólido.
export default function ColorSwatchesV2({ colores = [], value, onSelect, error, producto }) {
  if (!colores.length) return null;

  const hasPhotos = !!(producto?.imagenes_por_color && typeof producto.imagenes_por_color === 'object');

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
      <div className={`flex flex-wrap gap-2.5 ${error ? 'p-2 -m-2 rounded-xl ring-2 ring-[#D96B4D]/40' : ''}`}>
        {colores.map((c) => {
          const sel = value === c.id;
          const photo = hasPhotos ? getProductImageForColor(producto, c) : null;
          const usePhoto = photo && producto?.imagenes_por_color && photo !== getProductImageForColor(producto, '__none__');
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              title={c.label}
              className={`relative w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${
                sel ? 'border-[#0F8B6C] scale-110 shadow-md' : 'border-[#EBE3D6] hover:scale-105'
              }`}
              style={usePhoto ? undefined : { backgroundColor: c.hex || '#ccc' }}
            >
              {usePhoto && (
                <img src={photo} alt={c.label} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              )}
              {sel && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Check className="w-4 h-4 text-white drop-shadow-lg" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-[#D96B4D] font-semibold mt-2">Elige un color para continuar</p>}
    </div>
  );
}