import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { getActiveCelebration, getDaysToEvent } from '@/lib/celebration-moments';

/**
 * Franja editorial compacta de celebración — se renderiza DENTRO del Hero
 * como eyebrow superior (reemplaza el eyebrow estático cuando hay un
 * momento activo). Mantiene el heading principal sin competir con un
 * banner separado.
 *
 * Si no hay celebración activa, devuelve null y el Hero usa su eyebrow default.
 */
export default function HeroCelebrationStrip() {
  const moment = getActiveCelebration();
  if (!moment) return null;

  const daysToEvent = getDaysToEvent(moment);
  const { copy, palette, emoji } = moment;

  return (
    <Link
      to={copy.ctaPrimary.href}
      className="group inline-flex items-center gap-2.5 rounded-full pl-2.5 pr-3.5 py-2 mb-6 self-start relative overflow-hidden transition-all hover:scale-[1.015]"
      style={{
        background: `linear-gradient(90deg, ${palette.tint} 0%, rgba(255,255,255,0.04) 100%)`,
        border: `1px solid ${palette.accent}55`,
        boxShadow: `0 4px 20px ${palette.glow}, 0 1px 0 rgba(255,255,255,0.10) inset`,
        backdropFilter: 'blur(14px) saturate(160%)',
        WebkitBackdropFilter: 'blur(14px) saturate(160%)',
      }}
    >
      <span className="text-base leading-none flex-shrink-0">{emoji}</span>
      <span
        className="text-[10px] font-bold tracking-[0.18em] uppercase flex-shrink-0"
        style={{ color: palette.accent }}
      >
        {copy.kicker}
      </span>
      <span className="hidden xl:inline text-ld-fg text-[12px] font-semibold truncate max-w-[280px]">
        {copy.title}
      </span>
      {daysToEvent > 0 && (
        <span
          className="flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0"
          style={{
            background: 'rgba(0,0,0,0.25)',
            color: '#fff',
          }}
        >
          <Clock className="w-2.5 h-2.5" />
          {daysToEvent}d
        </span>
      )}
      <ArrowRight
        className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
        style={{ color: palette.accent }}
      />
    </Link>
  );
}