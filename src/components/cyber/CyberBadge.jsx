import { isCyberActive, tieneOfertaCyber, descuentoCyberPct, CYBER_COPY } from '@/lib/cyber-campaign';

/**
 * Badge pequeño y discreto "CYBER" / "-XX%" para la esquina de las
 * cards de producto. Solo se muestra si la campaña está activa Y el
 * producto tiene oferta real (precio_oferta < precio_b2c). Si no hay
 * oferta cargada, no renderiza nada (no inventamos descuentos).
 */
export default function CyberBadge({ producto, className = '' }) {
  if (!isCyberActive() || !tieneOfertaCyber(producto)) return null;

  const pct = descuentoCyberPct(producto);
  const label = pct ? `-${pct}%` : CYBER_COPY.badge;

  return (
    <span
      className={`text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md inline-flex items-center gap-1 ${className}`}
      style={{ background: 'var(--ld-highlight)' }}
    >
      ⚡ {label}
    </span>
  );
}