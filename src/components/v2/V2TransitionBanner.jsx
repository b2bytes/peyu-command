import { ArrowRight } from 'lucide-react';

// Banner suave de transición entre mundos B2C ↔ B2B dentro del río /v2.
// variant="to_b2b": un B2C con cantidad alta → invita a pedido corporativo.
// variant="to_b2c": un B2B viendo producto → invita a ver detalle/personalizar.
// No rompe el contexto: el copy promete mantener lo ya elegido.
export default function V2TransitionBanner({ variant = 'to_b2b', onAction }) {
  const isToB2B = variant === 'to_b2b';
  const copy = isToB2B
    ? {
        text: '¿Vas a llevar varias? 👀 Te conviene el modo Empresa: descuentos por volumen y cotización con tu logo. Mantenemos lo que ya elegiste.',
        cta: 'Pasar a pedido corporativo',
      }
    : {
        text: '¿Quieres ver cómo queda con tu logo? Te mostramos el detalle sin perder tu pedido corporativo.',
        cta: 'Ver producto',
      };

  return (
    <div
      className="v2-fade-up w-full max-w-[440px] p-3.5 flex flex-col gap-2.5"
      style={{
        borderRadius: 'var(--v2-radius-md)',
        background: 'var(--v2-gold-soft)',
        border: '1px solid var(--v2-gold)',
      }}
    >
      <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--v2-fg-soft)' }}>
        {copy.text}
      </p>
      <button
        onClick={() => onAction?.(variant)}
        className="v2-btn-gold h-10 px-4 flex items-center justify-center gap-2 text-[13px] self-start"
      >
        {copy.cta} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}