import { ShoppingBag } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// AddWithoutEngravingV2 — Salida de rescate del punto de abandono #1.
// Cuando el cliente activó una opción de grabado y no la completó, el CTA
// principal se bloquea. Este atajo le permite comprar el producto simple
// sin grabado, en un clic, en vez de abandonar la compra.
// ════════════════════════════════════════════════════════════════════════
export default function AddWithoutEngravingV2({ onSkip, disabled }) {
  return (
    <div
      className="mt-3 rounded-2xl p-3 text-center"
      style={{ background: 'rgba(192,120,92,.06)', border: '1.5px dashed rgba(192,120,92,.35)' }}
    >
      <p className="text-[11px] font-semibold mb-2" style={{ color: '#7A6050' }}>
        ¿Prefieres el producto sin grabado? Puedes continuar igual.
      </p>
      <button
        type="button"
        onClick={() => onSkip()}
        disabled={disabled}
        className="w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'white', border: '1.5px solid #C0785C', color: '#C0785C' }}
      >
        <ShoppingBag className="w-3.5 h-3.5" /> Agregar sin grabado
      </button>
    </div>
  );
}