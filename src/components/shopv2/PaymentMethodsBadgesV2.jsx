import { CreditCard, Landmark, Lock } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// PaymentMethodsBadgesV2 — Medios de pago visibles en la ficha de producto.
// Mismos métodos reales del checkout: MercadoPago/Webpay (crédito y débito)
// y transferencia con −5%. Refuerza confianza antes de agregar al carrito.
// ════════════════════════════════════════════════════════════════════════
const W = { border: '#D4C4B0', fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070', green: '#5B7D5A' };

const METODOS = [
  { Icon: CreditCard, t: 'Webpay · MercadoPago', sub: 'Crédito y débito' },
  { Icon: Landmark, t: 'Transferencia', sub: 'Ahorra 5% extra' },
  { Icon: Lock, t: 'Pago seguro', sub: 'Datos protegidos' },
];

export default function PaymentMethodsBadgesV2({ vertical = false }) {
  return (
    <div className={vertical ? 'flex flex-col gap-1.5' : 'grid grid-cols-3 gap-2'}>
      {METODOS.map(({ Icon, t, sub }) => (
        <div
          key={t}
          className={`flex ${vertical ? 'flex-row items-center gap-2.5 px-3 py-2' : 'flex-col items-center gap-1.5 p-3 text-center'} bg-white rounded-2xl`}
          style={{ border: `1px solid ${W.border}` }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,173,138,.12)' }}>
            <Icon className="w-4 h-4" style={{ color: '#8BAD8A' }} />
          </div>
          <div className={vertical ? 'min-w-0' : ''}>
            <p className="text-[10px] sm:text-[11px] font-bold leading-tight" style={{ color: W.fg }}>{t}</p>
            <p className="text-[9px] leading-tight" style={{ color: t === 'Transferencia' ? W.green : W.fgMuted }}>{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}