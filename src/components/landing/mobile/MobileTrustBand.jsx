import { Recycle, ShieldCheck, Truck, Award } from 'lucide-react';

/**
 * Trust band mobile Liquid Dual — vidrio auto-adaptativo.
 * 2x2 con iconos teñidos del verde acción (firma del sistema).
 */
const SIGNALS = [
  { icon: Recycle,     label: '100% Reciclado',  desc: 'Plástico chileno' },
  { icon: ShieldCheck, label: '10 años garantía',desc: 'Sin letra chica' },
  { icon: Truck,       label: 'Envío Bluex',     desc: 'Todo Chile' },
  { icon: Award,       label: 'Hecho en Chile',  desc: 'Producción local' },
];

export default function MobileTrustBand() {
  return (
    <section className="px-4 pb-5">
      <div className="ld-glass rounded-2xl p-3 grid grid-cols-2 gap-2">
        {SIGNALS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-2 px-1 py-1">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}
              >
                <Icon className="w-4 h-4" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className="text-ld-fg text-[11px] font-bold leading-tight">{s.label}</p>
                <p className="text-ld-fg-muted text-[10px] leading-tight">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}