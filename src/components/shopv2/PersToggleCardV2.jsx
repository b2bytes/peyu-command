import { Check } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Tarjeta de un tipo de personalización (EXCLUYENTE / radio). Click = elige
// esta opción (deselecciona las otras). Indicador redondo verde cuando activo.
export default function PersToggleCardV2({ Icon, label, precio, active, onToggle, gratis }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`relative flex flex-col items-center text-center gap-1.5 p-3.5 sm:p-3 min-h-[88px] sm:min-h-0 sm:flex-row sm:items-center sm:text-left sm:gap-2.5 rounded-2xl sm:rounded-xl border-2 transition-all ${
        active ? 'border-[#0F8B6C] bg-[#0F8B6C]/5' : 'border-[#E7D8C6] bg-white hover:border-[#0F8B6C]/40'
      }`}
    >
      <Icon className={`w-6 h-6 sm:w-4 sm:h-4 flex-shrink-0 ${active ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] sm:text-xs font-bold text-[#2A2420] truncate">{label}</div>
        <div className="text-[11px] sm:text-[10px] font-semibold text-[#A78B6F]">
          {gratis ? 'GRATIS' : `+${fmtCLP(precio)}/u`}
        </div>
      </div>
      <span
        className={`absolute top-2 right-2 sm:static flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          active ? 'bg-[#0F8B6C] border-[#0F8B6C]' : 'border-[#E7D8C6] bg-white'
        }`}
      >
        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
    </button>
  );
}