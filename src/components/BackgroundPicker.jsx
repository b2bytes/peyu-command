import { Check } from 'lucide-react';
import { BACKGROUNDS, useAppBackground } from '@/lib/background';

/**
 * Selector visual de fondo de la app. Grid responsive, touch-friendly en móvil.
 * Props opcionales:
 *   - className: clases extra para el contenedor
 *   - compact: versión más chica (útil en drawers)
 */
export default function BackgroundPicker({ className = '', compact = false }) {
  const [currentId, setCurrentId] = useAppBackground();

  return (
    <div className={className}>
      <div
        className={`grid gap-3 ${
          compact
            ? 'grid-cols-2 sm:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3'
        }`}
      >
        {BACKGROUNDS.map((bg) => {
          const selected = bg.id === currentId;
          return (
            <button
              key={bg.id}
              type="button"
              onClick={() => setCurrentId(bg.id)}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                selected
                  ? 'border-teal-400 ring-2 ring-teal-400/50 shadow-lg shadow-teal-500/20'
                  : 'border-white/15 hover:border-white/40 active:border-white/60'
              }`}
              aria-pressed={selected}
              aria-label={`Fondo: ${bg.name}`}
            >
              <div
                className="w-full aspect-[4/3] bg-cover bg-center"
                style={{ backgroundImage: `url('${bg.url}')` }}
              />
              {/* Overlay de información */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 text-left">
                <p className="text-[11px] font-semibold text-white leading-tight">{bg.name}</p>
                {!compact && bg.description && (
                  <p className="text-[9px] text-white/70 leading-tight mt-0.5 line-clamp-1">
                    {bg.description}
                  </p>
                )}
              </div>
              {selected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center shadow-lg">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-white/50 mt-3">
        Tu elección se guarda en este dispositivo. No afecta a otros usuarios.
      </p>
    </div>
  );
}