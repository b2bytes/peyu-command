import { useState } from 'react';
import { Tag, ChevronDown, Gift } from 'lucide-react';
import CuponBox from './CuponBox';
import GiftCardRedeemBox from './GiftCardRedeemBox';

/**
 * Combina Cupón y Gift Card en un solo bloque colapsable.
 * Best practice de checkout (Shopify/Amazon): los descuentos NO deben competir
 * visualmente con el Resumen. Se ocultan tras un toggle "¿Tienes un código?"
 * para reducir abandono por confusión.
 *
 * Props:
 *  - subtotal, envio, email — para cupones
 *  - onCuponChange, onGiftCardChange
 *  - showGiftCard — si false, oculta la GC (cuando el carrito ya tiene una GC)
 */
export default function PromoBox({
  subtotal,
  envio,
  email,
  onCuponChange,
  onGiftCardChange,
  showGiftCard = true,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <Tag className="w-3.5 h-3.5 text-gray-700" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 leading-tight">¿Tienes un código?</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Cupón o Gift Card</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 mt-3">
              Cupón de descuento
            </p>
            <CuponBox
              subtotal={subtotal}
              envio={envio}
              email={email}
              onChange={onCuponChange}
              bare
            />
          </div>

          {showGiftCard && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 mt-2 flex items-center gap-1">
                <Gift className="w-3 h-3" /> Gift Card
              </p>
              <GiftCardRedeemBox onChange={onGiftCardChange} bare />
            </div>
          )}
        </div>
      )}
    </div>
  );
}