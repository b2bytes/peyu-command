import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { getActiveCelebration, getDaysToEvent, getDaysToDeadline } from '@/lib/celebration-moments';

/**
 * Banner inteligente de celebración corporativa.
 * - Detecta automáticamente la próxima celebración activa
 *   (Día del Trabajador, Madre, Padre).
 * - Se renderiza como capa liquid-glass en el home.
 * - Si no hay celebración activa, no renderiza nada.
 *
 * Props:
 *   onChatPrompt?: (text: string) => void  // opcional, para enviar prompt al chat Peyu
 *   compact?: boolean                      // versión reducida (mobile)
 */
export default function CelebrationBanner({ onChatPrompt, compact = false }) {
  const moment = getActiveCelebration();
  if (!moment) return null;

  const daysToEvent = getDaysToEvent(moment);
  const daysToDeadline = getDaysToDeadline(moment);
  const { copy, palette, emoji, name } = moment;

  const handleAskPeyu = () => {
    if (onChatPrompt) onChatPrompt(copy.ctaSecondary?.label ? moment.chatPrompt : moment.chatPrompt);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl lg:rounded-2xl transition-all ${
        compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4 lg:p-5'
      }`}
      style={{
        background: `linear-gradient(135deg, ${palette.tint} 0%, rgba(0,0,0,0.25) 100%)`,
        backdropFilter: 'blur(16px) saturate(160%)',
        WebkitBackdropFilter: 'blur(16px) saturate(160%)',
        border: `1px solid ${palette.accent}40`,
        boxShadow: `
          0 1px 0 0 rgba(255,255,255,0.20) inset,
          0 10px 40px -10px rgba(0,0,0,0.50),
          0 0 40px ${palette.glow}
        `,
      }}
    >
      {/* Glow decorativo esquina */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: palette.accent }}
      />

      <div className={`relative z-10 flex flex-col ${compact ? 'gap-1.5' : 'gap-3'}`}>
        {/* Header: emoji + kicker + countdown */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl sm:text-2xl leading-none drop-shadow-lg">{emoji}</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex-shrink-0">
              <Sparkles className="w-3 h-3 text-white" style={{ color: palette.accent }} />
              <span className="text-white/95 text-[10px] sm:text-xs font-bold tracking-wide uppercase truncate">
                {copy.kicker}
              </span>
            </div>
          </div>

          {daysToEvent > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 border border-white/20 flex-shrink-0">
              <Clock className="w-3 h-3 text-white/80" />
              <span className="text-white text-[10px] sm:text-xs font-bold">
                {daysToEvent} {daysToEvent === 1 ? 'día' : 'días'}
              </span>
            </div>
          )}
        </div>

        {/* Título + highlight */}
        <div>
          <h2 className={`text-white font-poppins font-black leading-tight drop-shadow-lg ${
            compact ? 'text-sm sm:text-base lg:text-lg' : 'text-lg sm:text-xl lg:text-2xl'
          }`}>
            {copy.title}{' '}
            <span style={{ color: palette.accent }} className="drop-shadow">
              {copy.highlight}
            </span>
          </h2>
          {!compact && (
            <p className="text-white/85 text-xs sm:text-sm mt-1.5 leading-snug drop-shadow">
              {copy.subtitle}
            </p>
          )}
        </div>

        {/* Párrafo narrativo — solo desktop */}
        {!compact && (
          <p className="hidden lg:block text-white/75 text-xs leading-relaxed">
            {copy.paragraph}
          </p>
        )}

        {/* Grid de beneficios — oculto en modo compact (home landing) */}
        {!compact && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
          {copy.benefits.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 p-1.5 sm:p-2 rounded-lg bg-white/8 border border-white/15 backdrop-blur-sm"
            >
              <span className="text-sm sm:text-base flex-shrink-0 leading-none mt-0.5">{b.icon}</span>
              <div className="min-w-0">
                <p className="text-white font-bold text-[10px] sm:text-xs leading-tight">{b.label}</p>
                {!compact && (
                  <p className="text-white/65 text-[9px] sm:text-[10px] leading-snug line-clamp-2 mt-0.5">
                    {b.text}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Urgencia + CTAs — oculto en compact */}
        {!compact && (
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <Link to={copy.ctaPrimary.href} className="flex-1">
            <button
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm text-white shadow-lg active:scale-95 transition-all"
              style={{
                background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accent}dd 100%)`,
                boxShadow: `0 4px 20px ${palette.glow}`,
              }}
            >
              {copy.ctaPrimary.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>

          {onChatPrompt ? (
            <button
              onClick={handleAskPeyu}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-sm active:scale-95 transition-all"
            >
              🐢 Preguntar a Peyu
            </button>
          ) : (
            <Link to={copy.ctaSecondary.href} className="flex-1">
              <button className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-sm active:scale-95 transition-all">
                {copy.ctaSecondary.label}
              </button>
            </Link>
          )}
        </div>
        )}

        {/* Urgencia deadline — oculto en compact */}
        {!compact && daysToDeadline !== null && daysToDeadline >= 0 && (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-white/70 italic">
            <Clock className="w-3 h-3 flex-shrink-0" style={{ color: palette.accent }} />
            <span className="leading-snug">{copy.urgency}</span>
          </div>
        )}
      </div>
    </div>
  );
}