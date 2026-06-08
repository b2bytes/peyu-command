import { Minus, Plus } from 'lucide-react';

// Stepper de cantidad del Shop v2 (estética crema).
export default function QtyStepperV2({ value, onChange, min = 1, max = 9999 }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));

  return (
    <div className="inline-flex items-center bg-white border border-[#E7D8C6] rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
      <button
        type="button"
        onClick={() => set((value || min) - 1)}
        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#4B4F54] hover:bg-[#FBF7EF] transition-colors active:bg-[#EDE3D6]"
      >
        <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => set(parseInt(e.target.value, 10) || min)}
        className="w-8 h-8 sm:w-10 sm:h-9 text-center text-xs sm:text-sm font-bold text-[#2A2420] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => set((value || min) + 1)}
        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#4B4F54] hover:bg-[#FBF7EF] transition-colors active:bg-[#EDE3D6]"
      >
        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  );
}