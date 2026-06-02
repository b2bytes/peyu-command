import { Truck, ShieldCheck, RefreshCw, Recycle, Lock } from 'lucide-react';

// Tira compacta de garantías para reducir fricción en carro/checkout /v2.
// Consolida info que vive dispersa en /envios, /cambios, /nosotros y la
// muestra justo en el momento de compra. Aditiva: pura UI, sin lógica.
const BADGES = {
  envio:    { icon: Truck,       label: 'Envío a todo Chile', sub: 'BlueExpress 24-72h' },
  garantia: { icon: ShieldCheck, label: 'Garantía 10 años',   sub: 'Productos PEYU' },
  cambios:  { icon: RefreshCw,   label: 'Cambios fáciles',    sub: '30 días' },
  eco:      { icon: Recycle,     label: '100% reciclado',     sub: 'Plástico chileno' },
  seguro:   { icon: Lock,        label: 'Pago seguro',        sub: 'Mercado Pago' },
};

export default function V2TrustBadges({ keys = ['envio', 'garantia', 'cambios'], compact = false }) {
  const items = keys.map((k) => BADGES[k]).filter(Boolean);
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9.5px] font-semibold"
            style={{ background: 'var(--v2-glass)', border: '1px solid var(--v2-border)', color: 'var(--v2-fg-soft)' }}
          >
            <Icon className="w-3 h-3" style={{ color: 'var(--v2-teal)' }} /> {label}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex flex-col items-center text-center gap-0.5 px-1.5 py-2 rounded-xl"
          style={{ background: 'var(--v2-glass)', border: '1px solid var(--v2-border)' }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: 'var(--v2-teal)' }} />
          <span className="text-[9.5px] font-bold leading-tight" style={{ color: 'var(--v2-fg-soft)' }}>{label}</span>
          <span className="text-[8.5px] leading-tight" style={{ color: 'var(--v2-fg-subtle)' }}>{sub}</span>
        </div>
      ))}
    </div>
  );
}