import { Gift, Building2, Sparkles, Boxes } from 'lucide-react';
import V2TrustBadges from '@/components/v2/V2TrustBadges';

// Card de onboarding del primer contacto en /v2. Da confianza desde el primer
// mensaje (badges) y guía con un clic vía intenciones rápidas que disparan el
// chat. Pura UI: delega la conversación en onAsk.
const INTENTS = [
  { icon: Gift,      label: 'Busco un regalo',   prompt: 'Busco un regalo sustentable para alguien especial' },
  { icon: Building2, label: 'Para mi empresa',   prompt: 'Quiero comprar para mi empresa por volumen con mi logo' },
  { icon: Boxes,     label: 'Ver productos',     prompt: 'Muéstrame todos los productos' },
  { icon: Sparkles,  label: 'Personalizar logo', prompt: '¿Cómo personalizo los productos con mi logo?' },
];

export default function CardOnboarding({ onAsk }) {
  return (
    <div className="v2-card v2-fade-up p-3.5 w-full max-w-[360px]">
      <p className="text-[11px] font-semibold mb-2.5" style={{ color: 'var(--v2-fg-soft)' }}>
        ¿Por qué PEYU? 🐢
      </p>
      <V2TrustBadges keys={['eco', 'garantia', 'envio']} />

      <p className="text-[10px] mt-2.5 mb-3 leading-relaxed" style={{ color: 'var(--v2-fg-muted)' }}>
        Cada pieza rescata plástico del océano · Grabado láser con tu logo gratis desde 10 u · Cambios fáciles hasta 30 días.
      </p>

      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--v2-fg-subtle)' }}>
        ¿En qué te ayudo?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {INTENTS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => onAsk?.(prompt)}
            className="v2-chip flex items-center gap-1.5 px-2.5 py-2 text-[11px] text-left"
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--v2-gold)' }} />
            <span className="leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}