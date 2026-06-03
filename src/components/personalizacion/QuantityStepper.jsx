import { Minus, Plus } from 'lucide-react';

// Selector de cantidad − [n] + (mínimo 1). Estética Warm Dusk / Agent OS:
// glass translúcido, acentos teal, controles táctiles grandes.
export default function QuantityStepper({ value, onChange, min = 1, max = 9999 }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-1.5">
      <button
        type="button"
        onClick={() => set((value || min) - 1)}
        disabled={(value || min) <= min}
        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95">
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => set(Number(e.target.value) || min)}
        className="w-14 text-center bg-transparent text-white font-poppins font-bold text-xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      <button
        type="button"
        onClick={() => set((value || min) + 1)}
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 border border-teal-400/40 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 transition-all active:scale-95">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}