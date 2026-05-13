import { Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

/**
 * Card preview del chat IA Peyu — Liquid Dual edition (mobile).
 *
 * Diseño:
 *  • Contenedor ld-glass auto-adaptativo (día/noche) con ambient glow.
 *  • Avatar Peyu con anillo verde firma + status live.
 *  • Sugerencias clickeables como chips ld-glass-soft (legibles en ambos modos).
 *  • CTA primario con gradient ld-action.
 */
const SUGGESTIONS = [
  { icon: '🎁', text: 'Regalo para Día de la Madre' },
  { icon: '🏢', text: 'Regalos para mi empresa' },
  { icon: '🌱', text: 'Productos sostenibles' },
];

export default function MobileChatPreview({ onOpenChat, onSuggestionClick }) {
  return (
    <section className="px-4 pb-5">
      <div className="relative overflow-hidden rounded-3xl ld-glass">
        {/* Ambient glow firmado */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: 'var(--ld-action)' }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'var(--ld-highlight)' }}
        />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-shrink-0">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl ring-2"
                style={{
                  background: 'var(--ld-grad-action)',
                  boxShadow: '0 4px 16px -4px rgba(15, 139, 108, 0.4)',
                  color: '#FFFFFF',
                }}
              >
                🐢
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 animate-pulse"
                style={{ borderColor: 'var(--ld-bg)' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] leading-tight text-ld-fg">Peyu IA</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[10px] text-ld-fg-muted font-medium tracking-wide">
                  Asistente de gifting · en línea
                </p>
              </div>
            </div>
          </div>

          {/* Intro message — burbuja glass */}
          <div className="ld-glass-soft rounded-2xl rounded-bl-md px-3.5 py-2.5 mb-4">
            <p className="text-ld-fg text-[13.5px] leading-relaxed flex items-start gap-1.5">
              <Sparkles
                className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                style={{ color: 'var(--ld-highlight)' }}
              />
              <span>¿No sabes qué regalar? Te ayudo a encontrar el regalo perfecto.</span>
            </p>
          </div>

          {/* Sugerencias */}
          <div className="space-y-1.5 mb-4">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(s.text)}
                className="ld-btn-ghost group w-full flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left active:scale-[0.99] transition"
              >
                <span className="text-base flex-shrink-0">{s.icon}</span>
                <span className="text-ld-fg text-[12.5px] font-semibold flex-1 truncate">
                  {s.text}
                </span>
                <ArrowRight
                  className="w-3.5 h-3.5 group-active:translate-x-0.5 transition flex-shrink-0"
                  style={{ color: 'var(--ld-action)' }}
                />
              </button>
            ))}
          </div>

          {/* CTA principal */}
          <button
            onClick={onOpenChat}
            className="ld-btn-primary w-full rounded-2xl py-3 px-4 flex items-center justify-center gap-2 font-bold text-[14px] active:scale-[0.98] transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Conversar con Peyu</span>
          </button>
        </div>
      </div>
    </section>
  );
}