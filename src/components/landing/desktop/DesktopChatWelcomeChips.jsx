// ────────────────────────────────────────────────────────────────────────
// DesktopChatWelcomeChips
// ────────────────────────────────────────────────────────────────────────
// Chips de bienvenida que aparecen SOLO cuando el chat está vacío en el
// hero desktop. Replican la energía visual del modal mobile / del modal de
// referencia ("Peyu IA · Asistente de gifting · en línea") para que el
// preview desktop NO se vea muerto comparado con el de mobile.
//
// Disparan envíos directos al agente (intents pre-baked), exactamente como
// hace el modal mobile con OCASIONES + buildOccasionPrompt — pero acá los
// intents apuntan a flujos de venta más conversacionales (gifting, B2B,
// sostenibilidad) en vez de fechas calendarizadas.
// ────────────────────────────────────────────────────────────────────────
import { Gift, Building2, Sparkles, ArrowRight } from 'lucide-react';

const QUICK_INTENTS = [
  {
    id: 'madre',
    icon: Gift,
    label: 'Regalo para Día de la Madre',
    prompt: 'Quiero un regalo lindo y especial para Día de la Madre. ¿Qué me recomiendas?',
    accent: 'rose',
  },
  {
    id: 'empresa',
    icon: Building2,
    label: 'Regalos para mi empresa',
    prompt: 'Necesito regalos corporativos para mi empresa. ¿Puedes ayudarme a cotizar?',
    accent: 'blue',
  },
  {
    id: 'sostenibles',
    icon: Sparkles,
    label: 'Productos sostenibles',
    prompt: '¿Cuáles son sus productos más sostenibles y por qué? Cuéntame del impacto.',
    accent: 'emerald',
  },
];

const ACCENT_BG = {
  rose:    'linear-gradient(135deg, #FF6B8A 0%, #E14B6E 100%)',
  blue:    'linear-gradient(135deg, #4F8BFF 0%, #3D6FE0 100%)',
  emerald: 'linear-gradient(135deg, #34D399 0%, #0F8B6C 100%)',
};

export default function DesktopChatWelcomeChips({ onPick, disabled }) {
  return (
    <div className="flex flex-col gap-1.5 px-0.5 pt-1 pb-1">
      {/* Subtítulo IA — replica el spirit de la captura "¿No sabes qué regalar?" */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl ld-glass-soft mb-0.5">
        <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--ld-highlight)' }} />
        <p className="text-[11px] text-ld-fg-soft font-medium leading-tight">
          ¿No sabes qué regalar? Te ayudo a encontrar el regalo perfecto.
        </p>
      </div>

      {/* Tres intents grandes y clickeables — desktop "vivo" como mobile */}
      {QUICK_INTENTS.map(({ id, icon: Icon, label, prompt, accent }) => (
        <button
          key={id}
          onClick={() => onPick(prompt)}
          disabled={disabled}
          className="group ld-glass-soft flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed border border-ld-border hover:border-ld-action"
        >
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: ACCENT_BG[accent] }}
          >
            <Icon className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="flex-1 text-[11.5px] font-semibold text-ld-fg leading-tight">
            {label}
          </span>
          <ArrowRight
            className="w-3.5 h-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
            style={{ color: 'var(--ld-action)' }}
          />
        </button>
      ))}
    </div>
  );
}