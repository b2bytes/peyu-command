import { useMemo } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { BACKGROUNDS, useAppBackground } from '@/lib/background';

/**
 * Selector visual de fondo de la app. Agrupa por categoría (Temas / Naturaleza).
 * Props opcionales:
 *   - className: clases extra para el contenedor
 *   - compact: versión más chica (útil en drawers)
 */
export default function BackgroundPicker({ className = '', compact = false }) {
  const [currentId, setCurrentId] = useAppBackground();

  // Agrupar por categoría, preservando el orden del catálogo.
  const groups = useMemo(() => {
    const order = [];
    const map = new Map();
    BACKGROUNDS.forEach(bg => {
      const cat = bg.category || 'Otros';
      if (!map.has(cat)) {
        map.set(cat, []);
        order.push(cat);
      }
      map.get(cat).push(bg);
    });
    return order.map(cat => ({ name: cat, items: map.get(cat) }));
  }, []);

  return (
    <div className={className}>
      {groups.map((group) => (
        <section key={group.name} className="mb-5 last:mb-0">
          <div className="flex items-center gap-2 mb-2.5">
            {group.name === 'Temas' && <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
            <h4 className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
              {group.name}
            </h4>
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/40">{group.items.length}</span>
          </div>

          <div
            className={`grid gap-3 ${
              compact
                ? 'grid-cols-2 sm:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3'
            }`}
          >
            {group.items.map((bg) => {
              const selected = bg.id === currentId;
              const isTheme = group.name === 'Temas';
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
                  {isTheme && !selected && (
                    <span className="absolute top-2 left-2 bg-yellow-400/95 text-yellow-950 text-[9px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Tema
                    </span>
                  )}
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
        </section>
      ))}
      <p className="text-[10px] text-white/50 mt-1">
        Tu elección se guarda en este dispositivo. No afecta a otros usuarios.
      </p>
    </div>
  );
}