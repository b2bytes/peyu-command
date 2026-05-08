import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Recycle, ShieldCheck, Award } from 'lucide-react';

/**
 * Hero Liquid Dual — desktop.
 * Sigue el sistema PEYU 2026: tipografía Fraunces italic display,
 * vidrio líquido auto-adaptativo (light/dark), acción verde firma,
 * acento terracota para palabras editoriales.
 */
export default function DesktopHeroSplit({ onOpenChat }) {
  return (
    <div className="ld-glass rounded-[28px] overflow-hidden flex flex-col h-full p-9 xl:p-12 relative">
      {/* Glow ambient sutil — verde acción + terracota highlight */}
      <div
        className="absolute -top-24 -left-20 w-72 h-72 rounded-full pointer-events-none opacity-50 blur-3xl"
        style={{ background: 'var(--ld-action)' }}
      />
      <div
        className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{ background: 'var(--ld-highlight)' }}
      />

      <div className="relative flex-1 flex flex-col justify-center">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 ld-glass-soft rounded-full px-3.5 py-1.5 mb-7 self-start"
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--ld-action)' }}
          />
          <span className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-ld-fg-soft">
            PEYU 2026 · Hecho en Chile
          </span>
        </div>

        {/* Headline editorial — Fraunces italic firma del sistema */}
        <h2 className="ld-display text-[56px] xl:text-[80px] mb-5 text-ld-fg">
          Regalos
          <br />
          <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
            con propósito.
          </span>
        </h2>

        <p className="text-base xl:text-[17px] leading-[1.65] mb-9 max-w-[500px] text-ld-fg-soft font-light">
          Plástico 100% reciclado, grabado láser de regalo y diez años de garantía.
          Para tu casa, tu oficina o tu equipo entero —{' '}
          <span className="font-semibold text-ld-fg">en cualquier hora del día</span>.
        </p>

        {/* CTAs duales */}
        <div className="flex flex-wrap gap-3 mb-9">
          <Link to="/shop">
            <button className="ld-btn-primary rounded-2xl px-7 py-4 flex items-center gap-2 font-semibold text-[15px]">
              <span>Explorar tienda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <button
            onClick={onOpenChat}
            className="ld-btn-ghost rounded-2xl px-6 py-4 flex items-center gap-2 font-semibold text-[15px] text-ld-fg"
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--ld-highlight)' }} />
            <span>Conversar con Peyu IA</span>
          </button>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 pt-6 border-t border-ld-border">
          <TrustItem icon={Recycle} label="100% reciclado" />
          <TrustItem icon={ShieldCheck} label="10 años garantía" />
          <TrustItem icon={Award} label="Empresa B Chile" />
        </div>
      </div>
    </div>
  );
}

function TrustItem({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-ld-fg-soft">
      <Icon className="w-[15px] h-[15px]" style={{ color: 'var(--ld-action)' }} />
      <span className="text-[12px] font-semibold tracking-tight">{label}</span>
    </div>
  );
}