import V2TrustBadges from '@/components/v2/V2TrustBadges';

// Card de onboarding del primer contacto en /v2. Muestra de un vistazo por qué
// comprar en PEYU (info consolidada de /envios, /nosotros, /cambios) para dar
// confianza desde el primer mensaje. Pura UI, sin lógica.
export default function CardOnboarding() {
  return (
    <div className="v2-card v2-fade-up p-3.5 w-full max-w-[360px]">
      <p className="text-[11px] font-semibold mb-2.5" style={{ color: 'var(--v2-fg-soft)' }}>
        ¿Por qué PEYU? 🐢
      </p>
      <V2TrustBadges keys={['eco', 'garantia', 'envio']} />
      <p className="text-[10px] mt-2.5 leading-relaxed" style={{ color: 'var(--v2-fg-muted)' }}>
        Cada pieza rescata plástico del océano · Grabado láser con tu logo gratis desde 10 u · Cambios fáciles hasta 30 días.
      </p>
    </div>
  );
}