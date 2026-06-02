import { Gift, Building2 } from 'lucide-react';

// Micro-fork conversacional (CASO B): el cliente mencionó cantidad alta pero
// sin señal clara de empresa. Le preguntamos cálidamente con dos botones
// tappables, sin popup. La elección la maneja PeyuV2 (cambia toggle + persiste).
export default function CardB2BFork({ data, onPick }) {
  const cantidad = data?.cantidad;
  return (
    <div className="v2-card p-3.5 w-full max-w-[440px]" style={{ borderColor: 'var(--v2-gold)' }}>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onPick?.('b2c', cantidad)}
          className="v2-btn-ghost flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 text-center"
          style={{ minHeight: 88 }}
        >
          <Gift className="w-5 h-5" style={{ color: 'var(--v2-terracota)' }} />
          <span className="text-[13px] font-bold" style={{ color: 'var(--v2-fg)' }}>Para mí</span>
          <span className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>Personal</span>
        </button>
        <button
          onClick={() => onPick?.('b2b', cantidad)}
          className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 text-center rounded-2xl"
          style={{ minHeight: 88, background: 'var(--v2-grad-gold)', color: '#2a1f2b' }}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[13px] font-bold">Para mi empresa</span>
          <span className="text-[10px] opacity-80">Precios por volumen</span>
        </button>
      </div>
    </div>
  );
}