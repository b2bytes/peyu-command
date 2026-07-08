import { Check } from 'lucide-react';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';

// Selector de color del Shop v2.
// · Si el producto tiene imagenes_por_color (asignadas manualmente por el founder
//   desde el admin), los swatches muestran la FOTO real del color.
// · Si no hay fotos asignadas, muestra círculo de color sólido.
// · Si el producto tiene stock_por_color, los colores agotados se deshabilitan.
export default function ColorSwatchesV2({ colores = [], value, onSelect, error, producto }) {
  if (!colores.length) return null;

  // ¿Tiene fotos por color asignadas? Aplica a carcasas Y a cualquier producto
  // donde el founder haya asignado fotos manualmente desde el admin.
  const mapa = producto?.imagenes_por_color;
  const hasPhotos = !!(mapa && typeof mapa === 'object' && Object.keys(mapa).length > 0);
  const baseImg = producto ? getProductImage(producto) : null;

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
          // Foto real del color: si hay mapa y la foto es distinta de la base.
          const photo = hasPhotos ? getProductImageForColor(producto, c) : null;
          const usePhoto = !!(photo && photo !== baseImg);
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