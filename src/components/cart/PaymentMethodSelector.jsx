import { CreditCard, Building2, Wallet, Gift, Check, Lock } from 'lucide-react';

/**
 * Selector de método de pago — piel Warm Dusk (misma paleta del checkout).
 * WebPay Plus · Mercado Pago · Transferencia. Cards grandes, selección clara.
 * Props: value, onChange, totalCubiertoConGC (boolean → fuerza GiftCard como único)
 */
// ⛔ WebPay OCULTO temporalmente: las llaves configuradas son del ambiente de
// INTEGRACIÓN de Transbank (webpay3gint, comercio "WEBPAY REST SIMULTANEA"),
// que solo acepta tarjetas de prueba — toda tarjeta real es rechazada.
// Cambiar a true cuando se configuren las credenciales PRODUCTIVAS.
export const WEBPAY_ENABLED = false;

export const PAYMENT_METHODS = [
  {
    id: 'WebPay',
    label: 'WebPay Plus',
    sub: 'Débito, crédito y prepago',
    tag: 'Transbank',
    icon: CreditCard,
    color: 'linear-gradient(135deg,#E85D75,#C2334D)',
  },
  {
    id: 'MercadoPago',
    label: 'Mercado Pago',
    sub: 'Tarjetas, saldo MP o cuotas',
    tag: 'Más usado',
    icon: Wallet,
    color: 'linear-gradient(135deg,#38BDF8,#0284C7)',
  },
  {
    id: 'Transferencia',
    label: 'Transferencia bancaria',
    sub: 'Te enviamos los datos por email',
    tag: '−5% dscto',
    icon: Building2,
    color: 'linear-gradient(135deg,#8BAD8A,#5B7D5A)',
  },
];

const C = {
  fg: 'var(--ck-fg, #2C1810)', fgSoft: 'var(--ck-fg-soft, #7A6050)', fgMuted: 'var(--ck-fg-muted, #A08070)',
  border: 'var(--ck-border, #D4C4B0)', action: 'var(--ck-action, #C0785C)',
};

function InfoBox({ children }) {
  return (
    <div className="mt-2.5 rounded-2xl p-3.5 text-xs space-y-1.5"
      style={{ background: 'rgba(var(--ck-action-rgb, 192,120,92),.06)', border: '1.5px solid rgba(var(--ck-action-rgb, 192,120,92),.25)', color: C.fgSoft }}>
      {children}
    </div>
  );
}

export default function PaymentMethodSelector({ value, onChange, totalCubiertoConGC }) {
  if (totalCubiertoConGC) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: 'rgba(139,173,138,.1)', border: '1.5px solid rgba(139,173,138,.35)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#8BAD8A,#5B7D5A)' }}>
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: C.fg }}>Cubierto 100% con Gift Card</p>
          <p className="text-xs" style={{ color: C.fgSoft }}>No se requiere medio de pago adicional</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {PAYMENT_METHODS.filter((m) => WEBPAY_ENABLED || m.id !== 'WebPay').map((m) => {
          const selected = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              aria-pressed={selected}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left active:scale-[0.99]"
              style={{
                border: selected ? `2px solid ${C.action}` : `1.5px solid ${C.border}`,
                background: selected ? 'rgba(var(--ck-action-rgb, 192,120,92),.05)' : 'white',
                boxShadow: selected ? '0 4px 16px rgba(var(--ck-action-rgb, 192,120,92),.15)' : 'none',
              }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: m.color }}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm" style={{ color: C.fg }}>{m.label}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(139,173,138,.15)', color: '#5B7D5A', border: '1px solid rgba(139,173,138,.3)' }}>
                    {m.tag}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: C.fgMuted }}>{m.sub}</p>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  border: selected ? `2px solid ${C.action}` : `2px solid ${C.border}`,
                  background: selected ? C.action : 'white',
                }}>
                {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {value === 'WebPay' && (
        <InfoBox>
          <p className="font-bold flex items-center gap-1.5" style={{ color: C.fg }}>
            <Lock className="w-3.5 h-3.5" style={{ color: C.action }} /> Pago seguro con WebPay Plus
          </p>
          <p>Te redirigimos al formulario oficial de Transbank. Acepta tarjetas de débito, crédito y prepago de cualquier banco.</p>
        </InfoBox>
      )}

      {value === 'MercadoPago' && (
        <InfoBox>
          <p className="font-bold flex items-center gap-1.5" style={{ color: C.fg }}>
            <Lock className="w-3.5 h-3.5" style={{ color: C.action }} /> Pago seguro con Mercado Pago
          </p>
          <p>Te redirigimos al checkout oficial de Mercado Pago: tarjetas, saldo en cuenta o cuotas.</p>
        </InfoBox>
      )}

      {value === 'Transferencia' && (
        <InfoBox>
          <div className="flex items-center justify-between">
            <p className="font-bold" style={{ color: C.fg }}>📋 Datos para transferir</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,173,138,.15)', color: '#5B7D5A', border: '1px solid rgba(139,173,138,.3)' }}>
              5% dscto incluido
            </span>
          </div>
          <div className="bg-white rounded-xl p-3 space-y-1" style={{ border: `1px solid ${C.border}` }}>
            <p><span style={{ color: C.fgMuted }}>Titular:</span> <strong style={{ color: C.fg }}>Peyu Chile SpA</strong></p>
            <p><span style={{ color: C.fgMuted }}>RUT:</span> <strong style={{ color: C.fg }}>77.069.974-6</strong></p>
            <p><span style={{ color: C.fgMuted }}>Banco:</span> <strong style={{ color: C.fg }}>Banco Santander</strong></p>
            <p><span style={{ color: C.fgMuted }}>Tipo:</span> <strong style={{ color: C.fg }}>Cuenta Corriente</strong></p>
            <p><span style={{ color: C.fgMuted }}>N° cuenta:</span> <strong style={{ color: C.fg }}>94151872</strong></p>
            <p><span style={{ color: C.fgMuted }}>Email:</span> <strong style={{ color: C.fg }}>ventas@peyuchile.cl</strong></p>
          </div>
          <p className="leading-relaxed">También te enviamos estos datos por email al confirmar. Despachamos apenas recibimos el comprobante.</p>
        </InfoBox>
      )}
    </div>
  );
}