import { CreditCard, Building2, Wallet, Gift, Check } from 'lucide-react';

/**
 * Selector de método de pago. Muestra cards visuales con instrucciones según método.
 * Props: value, onChange, totalCubiertoConGC (boolean → fuerza GiftCard como único)
 */
export const PAYMENT_METHODS = [
  {
    id: 'WebPay',
    label: 'Webpay Plus',
    sub: 'Crédito, Débito, Prepago',
    icon: CreditCard,
    color: 'from-blue-500 to-indigo-600',
    badge: 'Más usado',
  },
  {
    id: 'MercadoPago',
    label: 'Mercado Pago',
    sub: 'Tarjetas y cuotas sin interés',
    icon: Wallet,
    color: 'from-cyan-400 to-sky-500',
  },
  {
    id: 'Transferencia',
    label: 'Transferencia bancaria',
    sub: 'Banco de Chile · 5% dscto',
    icon: Building2,
    color: 'from-emerald-500 to-teal-600',
    badge: '−5%',
  },
];

export default function PaymentMethodSelector({ value, onChange, totalCubiertoConGC }) {
  if (totalCubiertoConGC) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-emerald-900 text-sm">Cubierto 100% con Gift Card</p>
          <p className="text-xs text-emerald-700">No se requiere medio de pago adicional</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-700 block mb-1">Método de pago</label>
      {PAYMENT_METHODS.map((m) => {
        const selected = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
              selected
                ? 'border-gray-900 bg-gray-50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white flex-shrink-0`}>
              <m.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-sm">{m.label}</p>
                {m.badge && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{m.sub}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              selected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
            }`}>
              {selected && <Check className="w-3 h-3 text-white" />}
            </div>
          </button>
        );
      })}

      {value === 'Transferencia' && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-1.5">
          <p className="font-bold mb-1">📋 Datos para transferencia:</p>
          <p><strong>PEYU SpA</strong> · RUT 77.777.777-7</p>
          <p>Banco de Chile · Cuenta Corriente</p>
          <p>N° 000-0000-0000</p>
          <p>Email: <strong>pagos@peyuchile.cl</strong></p>
          <p className="pt-1 text-emerald-700">Recibirás los datos por email tras confirmar. Despachamos al recibir comprobante.</p>
        </div>
      )}

      {value === 'MercadoPago' && (
        <div className="mt-3 bg-sky-50 border border-sky-200 rounded-2xl p-3 text-xs text-sky-900">
          💳 Serás redirigido a Mercado Pago para completar el pago de forma segura. Cuotas sin interés disponibles.
        </div>
      )}
    </div>
  );
}