import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLiquidPhase, subscribeLiquidMode } from '@/lib/liquid-dual';

const PHASE_GREETING = {
  dawn:  { hello: 'Buenos días',   sub: 'Empieza el día con propósito' },
  day:   { hello: 'Hola',          sub: 'Regalos chilenos con propósito' },
  dusk:  { hello: 'Buenas tardes', sub: 'Cierra el día con un detalle' },
  night: { hello: 'Buenas noches', sub: 'Pensar el regalo, sin apuro' },
};

/**
 * Hero móvil Liquid Dual — auto-adaptativo día/noche con saludo horario.
 * Tipografía Fraunces editorial + CTA dual (tienda + chat agéntico).
 */
export default function MobileHero({ onOpenChat }) {
  const [phase, setPhase] = useState(getLiquidPhase);
  useEffect(() => subscribeLiquidMode(() => setPhase(getLiquidPhase())), []);
  const greeting = PHASE_GREETING[phase] || PHASE_GREETING.day;

  return (
    <section className="relative px-4 pt-4 pb-5">
      <div className="relative overflow-hidden rounded-3xl ld-glass">
        {/* Glow ambient — verde acción + terracota */}
        <div
          className="absolute -top-16 -right-12 w-56 h-56 rounded-full pointer-events-none opacity-50 blur-3xl"
          style={{ background: 'var(--ld-action)' }}
        />
        <div
          className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full pointer-events-none opacity-25 blur-3xl"
          style={{ background: 'var(--ld-highlight)' }}
        />

        <div className="relative px-5 py-7 text-ld-fg">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-1.5 ld-glass-soft border border-ld-glass-border rounded-full px-2.5 py-1 mb-3"
          >
            <Sparkles className="w-3 h-3" style={{ color: 'var(--ld-highlight)' }} />
            <span className="text-[10px] font-bold tracking-wider uppercase text-ld-fg-soft">
              {greeting.hello} · 100% Reciclado
            </span>
          </div>

          {/* Headline editorial Fraunces */}
          <h1 className="ld-display text-[34px] leading-[0.98] mb-2">
            Regalos
            <br />
            <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
              con propósito.
            </span>
          </h1>

          <p className="text-ld-fg-soft text-[13px] leading-snug mb-5 max-w-[92%] font-light">
            Plástico 100% reciclado, grabado láser de regalo y diez años de garantía.
          </p>

          {/* CTAs duales Liquid Dual */}
          <div className="flex flex-col gap-2">
            <Link to="/shop" className="block">
              <button className="ld-btn-primary w-full rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-sm active:scale-[0.98]">
                <span>Ver tienda</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button
              onClick={onOpenChat}
              className="ld-btn-ghost w-full rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 font-semibold text-sm text-ld-fg active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
              <span>Hablar con Peyu IA</span>
            </button>
          </div>

          {/* Trust micro-line */}
          <p className="text-[11px] text-ld-fg-muted text-center mt-3 font-medium">
            ⚡ Despacho Bluex · 🎁 Personalización láser gratis ≥10u
          </p>
        </div>
      </div>
    </section>
  );
}