// ────────────────────────────────────────────────────────────────────────
// DesktopChatWelcomeChips
// ────────────────────────────────────────────────────────────────────────
// Cards de bienvenida que aparecen SOLO cuando el chat está vacío en el
// hero desktop. Replican la energía visual del modal mobile.
//
// Orden por relevancia temporal (estamos en CyberDay + se viene Día del
// Padre 21 jun). Ya NO mostramos Día de la Madre (pasó). Cada card lleva
// ícono en círculo de acento, título en negrita y subtítulo gris corto.
// ────────────────────────────────────────────────────────────────────────
import { Gift, Building2, Recycle, Flame, ArrowRight } from 'lucide-react';

const QUICK_INTENTS = [
  {
    id: 'padre',
    icon: Gift,
    label: 'Regalo Día del Padre',
    sub: 'Útil, masculino y con causa',
    prompt: 'Quiero un regalo para el Día del Padre. Algo útil y especial, ¿qué me recomiendas?',
    accent: 'warm',
    featured: true,
  },
  {
    id: 'empresa',
    icon: Building2,
    label: 'Regalos para mi empresa',
    sub: 'Corporativos con tu logo, por volumen',
    prompt: 'Necesito regalos corporativos para mi empresa. ¿Puedes ayudarme a cotizar?',
    accent: 'blue',
  },
  {
    id: 'sostenibles',
    icon: Recycle,
    label: 'Productos sostenibles',
    sub: 'Reciclados y compostables hechos en Chile',
    prompt: '¿Cuáles son sus productos más sostenibles y por qué? Cuéntame del impacto.',
    accent: 'emerald',
  },
  {
    id: 'cyber',
    icon: Flame,
    label: 'Ofertas CyberDay',
    sub: 'Termina mañana · precios especiales',
    prompt: 'Muéstrame las mejores ofertas de CyberDay disponibles ahora.',
    accent: 'cyber',
  },
];

const ACCENT_BG = {
  warm:    'linear-gradient(135deg, #F2994A 0%, #D96B4D 100%)',
  blue:    'linear-gradient(135deg, #4F8BFF 0%, #3D6FE0 100%)',
  emerald: 'linear-gradient(135deg, #34D399 0%, #0F8B6C 100%)',
  cyber:   'linear-gradient(135deg, #A855F7 0%, #6D28D9 100%)',
};

export default function DesktopChatWelcomeChips({ onPick, disabled }) {
  return (
    <div className="flex flex-col gap-1.5 px-0.5 pt-0.5">
      {/* Label fila — compacto, sin burbuja que robe altura */}
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ld-fg-muted px-1 mb-0.5">
        Ideas rápidas
      </p>

      {QUICK_INTENTS.map(({ id, icon: Icon, label, sub, prompt, accent, featured }) => (
        <button
          key={id}
          onClick={() => onPick(prompt)}
          disabled={disabled}
          className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all duration-200 hover:-translate-y-px hover:shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed border"
          style={{
            background: featured ? 'var(--ld-highlight-soft)' : 'var(--ld-glass-soft)',
            borderColor: featured ? 'var(--ld-highlight)' : 'var(--ld-border)',
          }}
        >
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: ACCENT_BG[accent] }}
          >
            <Icon className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-bold text-ld-fg leading-tight truncate">
              {label}
            </span>
            <span className="block text-[10px] text-ld-fg-muted leading-tight truncate">
              {sub}
            </span>
          </span>
          <ArrowRight
            className="w-3.5 h-3.5 flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200"
            style={{ color: featured ? 'var(--ld-highlight)' : 'var(--ld-action)' }}
          />
        </button>
      ))}
    </div>
  );
}