import { ShoppingBag, Check } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// Barra inferior STICKY móvil con precio + CTA (Baymard 2026 #2: sube conversión).
// Solo visible en mobile (lg:hidden). Muestra total en vivo y dispara onAdd.
// ════════════════════════════════════════════════════════════════════════
export default function StickyBuyBarV2({ total, onAdd, added, disabled }) {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-xl border-t border-[#EBE3D6] px-4 py-3 pb-safe shadow-[0_-8px_30px_-12px_rgba(74,63,51,0.25)]">
      <div className="flex items-center gap-3 max-w-6xl mx-auto">
        <div className="flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#A78B6F] leading-none">Total</p>
          <p className="font-poppins font-bold text-lg text-[#2A2420] leading-tight">{fmtCLP(total)}</p>
        </div>
        <button
          onClick={onAdd}
          disabled={added || disabled}
          className="flex-1 h-12 rounded-xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/25 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {added ? (
            <><Check className="w-5 h-5" /> ¡Agregado!</>
          ) : (
            <><ShoppingBag className="w-5 h-5" /> Agregar al carrito</>
          )}
        </button>
      </div>
    </div>
  );
}