import { Gift, Building2, Leaf } from 'lucide-react';
import V2TrustBadges from '@/components/v2/V2TrustBadges';

// Hero de bienvenida + bifurcación clara B2C/B2B (home unificada /v2).
// Una sola propuesta de valor + dos caminos armónicos (misma paleta Warm),
// que enrutan la conversación. Pura UI: delega en onAsk / onForkPick.
export default function CardOnboarding({ onAsk, onForkPick }) {
  const pick = (mode, prompt) => {
    if (onForkPick) onForkPick(mode);
    else onAsk?.(prompt);
  };

  return (
    <div className="v2-card v2-fade-up p-5 w-full max-w-[480px]">
      {/* Propuesta de valor única */}
      <div className="mb-4">
        <span className="v2-badge-eco inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold mb-3">
          <Leaf className="w-3 h-3" /> 100% reciclado chileno
        </span>
        <h2 className="text-2xl leading-tight v2-display" style={{ color: 'var(--v2-fg)' }}>
          Regalos que dejan huella, no basura.
        </h2>
        <p className="text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--v2-fg-muted)' }}>
          Productos chilenos, sustentables y personalizables. Para sorprender a alguien especial o para que tu marca llegue lejos.
        </p>
      </div>

      {/* Dos caminos armónicos */}
      <div className="grid sm:grid-cols-2 gap-2.5">
        {/* B2C */}
        <button
          onClick={() => pick('b2c', 'Busco un regalo sustentable para alguien especial')}
          className="v2-btn-ghost text-left p-3.5 flex flex-col gap-1.5"
          style={{ borderRadius: 'var(--v2-radius-md)', minHeight: 128 }}
        >
          <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--v2-terracota-soft)' }}>
            <Gift className="w-4 h-4" style={{ color: 'var(--v2-terracota)' }} />
          </span>
          <span className="text-[14px] font-bold" style={{ color: 'var(--v2-fg)' }}>Quiero un regalo 🎁</span>
          <span className="text-[11px] leading-snug" style={{ color: 'var(--v2-fg-muted)' }}>
            Elige, personalízalo con tu toque y lo enviamos a domicilio. Perfecto para sorprender.
          </span>
          <span className="text-[11px] font-bold mt-auto" style={{ color: 'var(--v2-terracota)' }}>Ver productos →</span>
        </button>

        {/* B2B */}
        <button
          onClick={() => pick('b2b', 'Quiero comprar para mi empresa por volumen con mi logo')}
          className="text-left p-3.5 flex flex-col gap-1.5"
          style={{ borderRadius: 'var(--v2-radius-md)', minHeight: 128, background: 'var(--v2-grad-gold)', color: '#2a1f2b' }}
        >
          <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(42,31,43,0.12)' }}>
            <Building2 className="w-4 h-4" />
          </span>
          <span className="text-[14px] font-bold">Compra por volumen 🏢</span>
          <span className="text-[11px] leading-snug" style={{ opacity: 0.85 }}>
            Pedidos corporativos con tu logo y descuento por cantidad. Cotización en minutos.
          </span>
          <span className="text-[11px] font-bold mt-auto">Armar pedido corporativo →</span>
        </button>
      </div>

      {/* Confianza */}
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--v2-border)' }}>
        <V2TrustBadges keys={['eco', 'garantia', 'envio']} />
      </div>
    </div>
  );
}