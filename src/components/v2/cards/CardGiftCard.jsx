import { Gift, ArrowRight } from 'lucide-react';

// Card de Gift Card dentro del río del chat → enlaza al flujo existente.
export default function CardGiftCard() {
  const montos = [15000, 25000, 50000];
  return (
    <div className="v2-card v2-fade-up p-4 w-full max-w-[300px]" style={{ background: 'var(--v2-grad-canvas)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--v2-gold-soft)' }}>
          <Gift className="w-4.5 h-4.5" style={{ color: 'var(--v2-gold)' }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--v2-fg)' }}>Gift Card PEYU</p>
          <p className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>El regalo sustentable perfecto 🐢</p>
        </div>
      </div>
      <div className="flex gap-1.5 my-3">
        {montos.map((m) => (
          <span key={m} className="v2-chip flex-1 text-center px-2 py-1.5 text-[11px] font-semibold">
            ${m.toLocaleString('es-CL')}
          </span>
        ))}
      </div>
      <a href="/regalar-giftcard" className="v2-btn-gold w-full h-10 flex items-center justify-center gap-2 text-xs">
        Regalar una Gift Card <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}