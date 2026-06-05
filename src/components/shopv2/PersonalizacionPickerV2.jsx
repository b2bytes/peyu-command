import { Ban, Type, Palette, Upload } from 'lucide-react';
import { PRECIO_PERSONALIZACION } from '@/lib/personalizacion-config';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Selector excluyente de personalización del Shop v2: ninguna / frase / PEYU / archivo.
const OPCIONES = [
  { id: 'none', label: 'Sin grabado', Icon: Ban, precio: 0 },
  { id: 'frase', label: 'Frase', Icon: Type, precio: PRECIO_PERSONALIZACION.frase },
  { id: 'peyu', label: 'Diseño PEYU', Icon: Palette, precio: PRECIO_PERSONALIZACION.peyu },
  { id: 'archivo', label: 'Tu logo', Icon: Upload, precio: PRECIO_PERSONALIZACION.archivo },
];

export default function PersonalizacionPickerV2({ value, onSelect, gratis, moq = 10 }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {OPCIONES.map(({ id, label, Icon, precio }) => {
          const sel = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                sel
                  ? 'border-[#0F8B6C] bg-[#0F8B6C]/5'
                  : 'border-[#E7D8C6] bg-white hover:border-[#0F8B6C]/40'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${sel ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`} />
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#2A2420] truncate">{label}</div>
                <div className="text-[10px] font-semibold text-[#A78B6F]">
                  {precio === 0 ? 'Gratis' : gratis ? 'GRATIS' : `+${fmtCLP(precio)}/u`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {value && value !== 'none' && (
        <p className={`text-[11px] mt-2 font-semibold ${gratis ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`}>
          {gratis ? `✓ Grabado láser GRATIS desde ${moq} unidades` : `Grabado gratis desde ${moq} unidades`}
        </p>
      )}
    </div>
  );
}