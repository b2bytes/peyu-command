import { Check } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Tarjeta toggle de un tipo de personalización (combinable). Click = activa/
// desactiva. Muestra check verde cuando está activo. Cada tipo suma su cargo.
export default function PersToggleCardV2({ Icon, label, precio, active, onToggle, gratis }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
        active ? 'border-[#0F8B6C] bg-[#0F8B6C]/5' : 'border-[#E7D8C6] bg-white hover:border-[#0F8B6C]/40'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-[#2A2420] truncate">{label}</div>
        <div className="text-[10px] font-semibold text-[#A78B6F]">
          {gratis ? 'GRATIS' : `+${fmtCLP(precio)}/u`}
        </div>
      </div>
      <span
        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          active ? 'bg-[#0F8B6C] border-[#0F8B6C]' : 'border-[#E7D8C6] bg-white'
        }`}
      >
        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
    </button>
  );
}