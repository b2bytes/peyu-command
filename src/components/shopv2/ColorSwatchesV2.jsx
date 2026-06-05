import { Check } from 'lucide-react';

// Selector de color del Shop v2. Lee colores reales (getColoresProducto).
export default function ColorSwatchesV2({ colores = [], value, onSelect, error }) {
  if (!colores.length) return null;

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
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              title={c.label}
              className={`relative w-11 h-11 rounded-full border-2 transition-all ${
                sel ? 'border-[#0F8B6C] scale-110 shadow-md' : 'border-[#E7D8C6] hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex || '#ccc' }}
            >
              {sel && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={3} />
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