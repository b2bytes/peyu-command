import { Link } from 'react-router-dom';
import { Recycle, ShieldCheck, Truck, Award, ArrowRight, Gift, Building2 } from 'lucide-react';

/**
 * Trust band mobile Liquid Dual — vidrio auto-adaptativo.
 * Ahora incluye CTA dual de cierre (B2C / B2B) para no dejar al usuario en
 * blanco al final del scroll. Los trust signals quedan compactados arriba
 * y los dos CTAs principales abajo, cerrando el embudo.
 */
const SIGNALS = [
  { icon: Recycle,     label: '100% Reciclado',   desc: 'Plástico chileno' },
  { icon: ShieldCheck, label: '10 años garantía', desc: 'Sin letra chica' },
  { icon: Truck,       label: 'Envío Bluex',      desc: 'Todo Chile' },
  { icon: Award,       label: 'Hecho en Chile',   desc: 'Producción local' },
];

export default function MobileTrustBand() {
  return (
    <section className="px-4 pb-6 space-y-3">
      {/* Trust signals (2x2 compacto) */}
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

      {/* Cierre dual — el usuario nunca queda sin siguiente paso */}
      <div className="relative overflow-hidden rounded-2xl ld-glass">
        {/* Glow firma */}
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: 'var(--ld-action)' }}
        />
        <div className="relative p-4">
          <p className="ld-display text-ld-fg text-[20px] leading-tight mb-1">
            ¿Listo para <span className="ld-display-italic ld-highlight">regalar</span>?
          </p>
          <p className="text-ld-fg-muted text-[12px] mb-3">
            Elige tu camino. Te respondemos en menos de 5 minutos.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/shop"
              className="group flex flex-col items-start gap-1.5 rounded-xl p-3 bg-white/80 hover:bg-white border border-ld-border hover:border-ld-action transition active:scale-[0.98]"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ background: 'var(--ld-grad-action)' }}
              >
                <Gift className="w-4 h-4" />
              </span>
              <span className="text-ld-fg text-[12px] font-bold">Regalo personal</span>
              <span className="text-ld-fg-muted text-[10px] leading-tight">
                Envío gratis &gt; $40.000
              </span>
              <span className="text-ld-action text-[11px] font-semibold flex items-center gap-0.5 mt-0.5">
                Ver tienda <ArrowRight className="w-3 h-3 group-active:translate-x-0.5 transition" />
              </span>
            </Link>

            <Link
              to="/b2b/contacto"
              className="group flex flex-col items-start gap-1.5 rounded-xl p-3 border transition active:scale-[0.98]"
              style={{
                background: 'var(--ld-highlight-soft)',
                borderColor: 'var(--ld-highlight)',
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ background: 'var(--ld-highlight)' }}
              >
                <Building2 className="w-4 h-4" />
              </span>
              <span className="text-ld-fg text-[12px] font-bold">Regalo corporativo</span>
              <span className="text-ld-fg-muted text-[10px] leading-tight">
                Desde 10u · Láser gratis
              </span>
              <span
                className="text-[11px] font-semibold flex items-center gap-0.5 mt-0.5"
                style={{ color: 'var(--ld-highlight)' }}
              >
                Cotizar <ArrowRight className="w-3 h-3 group-active:translate-x-0.5 transition" />
              </span>
            </Link>
          </div>

          {/* Social proof minimal */}
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-ld-border text-[10px] text-ld-fg-muted">
            <span className="flex items-center gap-1">⭐ 4.9 · 500+ reseñas</span>
            <span className="w-1 h-1 rounded-full bg-ld-fg-subtle" />
            <span>+500.000 kg reciclados</span>
          </div>
        </div>
      </div>
    </section>
  );
}