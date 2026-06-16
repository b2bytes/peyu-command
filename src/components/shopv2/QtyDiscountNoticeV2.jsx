import { Tag, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// QtyDiscountNoticeV2 — Aviso visible de los beneficios por cantidad en la
// ficha de producto (Shop v2). Resalta el escalón actual según la cantidad
// elegida y deja claro que el grabado láser es GRATIS desde 10 unidades.
// Solo presentación: no toca el cálculo de precios (lib/volume-discount).
//   · 2 unidades       → 10%
//   · 3 a 9 unidades   → 15%
//   · 10 o más         → precio por mayor + grabado gratis
// ════════════════════════════════════════════════════════════════════════
const ESCALONES = [
  { min: 2, max: 2, label: '2 unidades', pct: '−10%' },
  { min: 3, max: 9, label: '3 a 9 unidades', pct: '−15%' },
  { min: 10, max: Infinity, label: '10 o más', pct: 'Precio por mayor' },
];

export default function QtyDiscountNoticeV2({ cantidad = 1, moq = 10 }) {
  return (
    <div
      className="rounded-2xl p-3.5 space-y-2"
      style={{ background: 'rgba(192,120,92,.06)', border: '1.5px solid rgba(192,120,92,.2)' }}
    >
      <div className="flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#C0785C' }}>
          Descuentos por cantidad
        </p>
      </div>

      <div className="space-y-1">
        {ESCALONES.map((e) => {
          const activo = cantidad >= e.min && cantidad <= e.max;
          return (
            <div
              key={e.label}
              className="flex items-center justify-between text-[11px] rounded-lg px-2.5 py-1.5 transition-colors"
              style={{
                background: activo ? '#C0785C' : 'transparent',
                color: activo ? 'white' : '#7A6050',
                fontWeight: activo ? 700 : 500,
              }}
            >
              <span>{e.label}</span>
              <span className="font-bold">{e.pct}</span>
            </div>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-[11px] font-semibold pt-0.5" style={{ color: '#5B7D5A' }}>
        <Sparkles className="w-3 h-3 flex-shrink-0" />
        Grabado láser GRATIS desde {moq} unidades
      </p>
    </div>
  );
}