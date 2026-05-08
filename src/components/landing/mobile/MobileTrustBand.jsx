import { Recycle, ShieldCheck, Truck, Award } from 'lucide-react';

/**
 * Banda de confianza con los 4 sellos clave PEYU.
 * Compacto, 2x2 mobile, con iconos premium.
 */
const SIGNALS = [
  { icon: Recycle, label: '100% Reciclado', desc: 'Plástico chileno', color: 'text-emerald-400' },
  { icon: ShieldCheck, label: '10 años garantía', desc: 'Sin letra chica', color: 'text-cyan-400' },
  { icon: Truck, label: 'Envío Bluex', desc: 'Todo Chile', color: 'text-blue-400' },
  { icon: Award, label: 'Hecho en Chile', desc: 'Empresa B', color: 'text-yellow-400' },
];

export default function MobileTrustBand() {
  return (
    <section className="px-4 pb-5">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 grid grid-cols-2 gap-2">
        {SIGNALS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-2 px-1 py-1">
              <Icon className={`w-5 h-5 flex-shrink-0 ${s.color}`} strokeWidth={2} />
              <div className="min-w-0">
                <p className="text-white text-[11px] font-bold leading-tight">{s.label}</p>
                <p className="text-white/50 text-[9px] leading-tight">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}