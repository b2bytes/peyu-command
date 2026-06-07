import { ShoppingBag, Check, Sparkles } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Barra inferior STICKY móvil — Warm Clay 2027. Precio + CTA siempre visible.
export default function StickyBuyBarV2({ total, onAdd, added, disabled }) {
  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl px-4 py-3 pb-safe"
      style={{
        background: 'rgba(248,243,237,.96)',
        borderTop: '1px solid #D4C4B0',
        boxShadow: '0 -8px 32px -8px rgba(44,24,16,.15)',
      }}
    >
      <div className="flex items-center gap-3 max-w-6xl mx-auto">
        <div className="flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wide leading-none" style={{ color: '#A08070' }}>Total</p>
          <p className="font-poppins font-bold text-lg leading-tight" style={{ color: '#2C1810' }}>{fmtCLP(total)}</p>
        </div>
        <button
          onClick={onAdd}
          disabled={added || disabled}
          className="flex-1 h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          style={{
            background: added ? 'linear-gradient(135deg,#8BAD8A,#5B7D5A)' : 'linear-gradient(135deg,#C0785C,#A86440)',
            boxShadow: added ? '0 4px 16px rgba(139,173,138,.3)' : '0 4px 20px rgba(192,120,92,.35)',
          }}
        >
          {added ? (
            <><Check className="w-5 h-5" /> ¡Agregado!</>
          ) : disabled ? (
            <><Sparkles className="w-5 h-5" /> Aprueba tu diseño</>
          ) : (
            <><ShoppingBag className="w-5 h-5" /> Agregar al carrito</>
          )}
        </button>
      </div>
    </div>
  );
}