import { Check, MousePointerClick } from 'lucide-react';

// Selector de color del Shop v2.
// · Muestra SOLO círculos de color (nunca fotos del producto): así el cliente
//   entiende que debe ELEGIR un color, y al elegirlo la foto principal cambia
//   automáticamente al color seleccionado.
// · Si el producto tiene stock_por_color, los colores agotados se deshabilitan.
export default function ColorSwatchesV2({ colores = [], value, onSelect, error, producto }) {
  if (!colores.length) return null;

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
          Color {colores.length > 1 && <span className="text-[#D96B4D]">* obligatorio</span>}
        </label>
        {value && (
          <span className="text-xs font-bold text-[#0F8B6C] flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {colores.find((c) => c.id === value)?.label}
          </span>
        )}
      </div>
      {/* Aviso destacado mientras NO haya color elegido: muchos clientes pinchan
          la foto y creen que ya eligieron. Al seleccionar, la foto cambia sola. */}
      {!value && colores.length > 1 && (
        <div className="flex items-center gap-2 mb-2.5 px-3 py-2 rounded-xl text-[11px] font-bold"
          style={{ background: 'rgba(217,107,77,.08)', border: '1.5px dashed #D96B4D', color: '#D96B4D' }}>
          <MousePointerClick className="w-4 h-4 flex-shrink-0 animate-pulse" />
          Toca un círculo para elegir tu color — la foto del producto cambiará automáticamente
        </div>
      )}
      <div className={`flex flex-wrap justify-center sm:justify-start gap-3 ${error ? 'p-2 -m-2 rounded-xl ring-2 ring-[#D96B4D]/40' : ''}`}>
        {colores.map((c) => {
          const sel = value === c.id;
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
                style={c.id === 'mixto'
                  ? { background: 'conic-gradient(#4DA3DC 0 25%, #212121 25% 50%, #F0807A 50% 75%, #4BC5A5 75% 100%)' }
                  : { backgroundColor: c.hex || '#ccc' }}
              >
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