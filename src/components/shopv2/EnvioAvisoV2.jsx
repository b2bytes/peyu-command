import { Truck } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD_CLP } from '@/lib/delivery-promise';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Aviso informativo de envío en la ficha de producto: el cliente sabe ANTES
// del checkout cuánto falta para el envío gratis. Solo informa — el costo real
// se sigue calculando en el carrito/checkout con BlueExpress.
export default function EnvioAvisoV2({ total = 0 }) {
  const gratis = total >= FREE_SHIPPING_THRESHOLD_CLP;
  const falta = Math.max(0, FREE_SHIPPING_THRESHOLD_CLP - total);
  const pct = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD_CLP) * 100));

  return (
    <div className="rounded-2xl px-3.5 py-3" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4 flex-shrink-0" style={{ color: gratis ? '#5B7D5A' : '#C0785C' }} />
        <p className="text-[12px] font-bold leading-tight" style={{ color: '#2C1810' }}>
          {gratis
            ? '¡Tienes envío gratis a todo Chile!'
            : `Te faltan ${fmtCLP(falta)} para el envío gratis`}
        </p>
      </div>
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#EDE3D6' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: gratis ? '#8BAD8A' : 'linear-gradient(90deg,#C0785C,#A86440)' }}
        />
      </div>
      {!gratis && (
        <p className="text-[10px] mt-1.5" style={{ color: '#A08070' }}>
          Bajo {fmtCLP(FREE_SHIPPING_THRESHOLD_CLP)} el envío se calcula en el carrito según tu comuna.
        </p>
      )}
    </div>
  );
}