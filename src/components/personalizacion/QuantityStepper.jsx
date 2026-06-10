import { Minus, Plus } from 'lucide-react';

// Selector de cantidad − [n] + (mínimo 1).
// Soporta dos temas: dark (glass teal, default — chat /v2) y light (Warm Dusk
// de alto contraste para fondos crema como /personalizar).
export default function QuantityStepper({ value, onChange, min = 1, max = 9999, light = false }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));

  const wrap = light
    ? 'inline-flex items-center gap-3 rounded-2xl border-[1.5px] border-[#D4C4B0] bg-white p-1.5'
    : 'inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-1.5';
  const minusBtn = light
    ? 'w-10 h-10 rounded-xl bg-[#F2EBE0] hover:bg-[#E7D8C6] border border-[#D4C4B0] flex items-center justify-center text-[#2C1810] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95'
    : 'w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95';
  const inputCls = light
    ? 'w-14 text-center bg-transparent text-[#2C1810] font-poppins font-bold text-xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
    : 'w-14 text-center bg-transparent text-white font-poppins font-bold text-xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
  const plusBtn = light
    ? 'w-10 h-10 rounded-xl bg-gradient-to-br from-[#C0785C] to-[#A86440] hover:brightness-110 flex items-center justify-center text-white shadow-lg shadow-[#C0785C]/25 transition-all active:scale-95'
    : 'w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 border border-teal-400/40 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 transition-all active:scale-95';

  return (
    <div className={wrap}>
      <button
        type="button"
        onClick={() => set((value || min) - 1)}
        disabled={(value || min) <= min}
        className={minusBtn}>
        <Minus className="w-4 h-4" />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => set(Number(e.target.value) || min)}
        className={inputCls} />
      <button
        type="button"
        onClick={() => set((value || min) + 1)}
        className={plusBtn}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}