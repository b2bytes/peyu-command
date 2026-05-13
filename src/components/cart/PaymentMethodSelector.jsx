import { CreditCard, Building2, Wallet, Gift, Check } from 'lucide-react';

/**
 * Selector de método de pago. Muestra cards visuales con instrucciones según método.
 * Props: value, onChange, totalCubiertoConGC (boolean → fuerza GiftCard como único)
 */
export const PAYMENT_METHODS = [
  {
    id: 'MercadoPago',
    label: 'Mercado Pago',
    sub: 'Tarjetas de crédito y débito',
    icon: Wallet,
    color: 'from-cyan-400 to-sky-500',
    badge: 'Más usado',
  },
  {
    id: 'Transferencia',
    label: 'Transferencia bancaria',
    sub: 'Banco Santander · 5% dscto',
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
            aria-pressed={selected}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
              selected
                ? 'border-teal-600 bg-teal-50/40 shadow-md ring-2 ring-teal-100'
                : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm'
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
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              selected ? 'border-teal-600 bg-teal-600' : 'border-gray-300'
            }`}>
              {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
          </button>
        );
      })}

      {value === 'Transferencia' && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold">📋 Datos para transferencia</p>
            <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-full">5% dscto incluido</span>
          </div>
          <div className="bg-white/70 rounded-xl p-3 space-y-1 border border-emerald-100">
            <p><span className="text-emerald-700">Titular:</span> <strong>Peyu Chile SpA</strong></p>
            <p><span className="text-emerald-700">RUT:</span> <strong>77.069.974-6</strong></p>
            <p><span className="text-emerald-700">Banco:</span> <strong>Banco Santander</strong></p>
            <p><span className="text-emerald-700">Tipo:</span> <strong>Cuenta Corriente</strong></p>
            <p><span className="text-emerald-700">N° cuenta:</span> <strong>94151872</strong></p>
            <p><span className="text-emerald-700">Email:</span> <strong>ventas@peyuchile.cl</strong></p>
          </div>
          <p className="text-emerald-700 leading-relaxed">
            Te enviaremos los datos por email al confirmar. Despachamos apenas recibimos el comprobante.
          </p>
        </div>
      )}

      {value === 'MercadoPago' && (
        <div className="mt-3 bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-xs text-sky-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">💳 Pago seguro con Mercado Pago</p>
          <ul className="space-y-0.5 text-sky-800/90 pl-1">
            <li>• Tarjeta de crédito, débito o efectivo en sucursales</li>
            <li>• Te redirigimos al checkout oficial de Mercado Pago</li>
          </ul>
        </div>
      )}
    </div>
  );
}