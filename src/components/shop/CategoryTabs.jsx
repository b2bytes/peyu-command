import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Tabs de categorías sticky con conteos en tiempo real.
 * Patrón 2026 (Allbirds / Patagonia / Apple Shop): pill horizontal scrollable,
 * sticky bajo el header, con indicador de scroll en mobile.
 *
 * @param categorias  Array<{ id, label, count, icon? }>
 * @param selected    string (id activo)
 * @param onSelect    (id) => void
 */
export default function CategoryTabs({ categorias, selected, onSelect }) {
  const scrollRef = useRef(null);
  const [canScrollL, setCanScrollL] = useState(false);
  const [canScrollR, setCanScrollR] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollL(el.scrollLeft > 4);
    setCanScrollR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [categorias]);

  // Auto-centrar el tab activo
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector('[data-active="true"]');
    if (active) {
      const elRect = el.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      const offset = aRect.left - elRect.left - elRect.width / 2 + aRect.width / 2;
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, [selected]);

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-slate-950/70 backdrop-blur-xl border-b border-white/10">
      <div className="relative">
        {/* Edge fade L */}
        {canScrollL && (
          <button
            onClick={() => scrollBy(-1)}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/15 items-center justify-center text-white shadow-lg backdrop-blur"
            aria-label="Categorías anteriores"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {/* Edge fade R */}
        {canScrollR && (
          <button
            onClick={() => scrollBy(1)}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/15 items-center justify-center text-white shadow-lg backdrop-blur"
            aria-label="Más categorías"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth py-1 snap-x snap-mandatory sm:snap-none"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
        >
          {categorias.map(cat => {
            const isActive = cat.id === selected;
            return (
              <button
                key={cat.id}
                data-active={isActive}
                onClick={() => onSelect(cat.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 backdrop-blur-sm border snap-start active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-teal-400/60 shadow-lg shadow-teal-500/30 scale-105'
                    : 'bg-white/5 text-white/75 border-white/15 hover:bg-white/10 hover:text-white hover:border-white/30'
                }`}
              >
                {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
                <span>{cat.label}</span>
                <span className={`text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : 'bg-white/10 text-white/60'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}