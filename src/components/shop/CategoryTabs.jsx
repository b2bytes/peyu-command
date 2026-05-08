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
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 ld-glass-strong border-b border-ld-border">
      <div className="relative">
        {canScrollL && (
          <button
            onClick={() => scrollBy(-1)}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full ld-glass items-center justify-center text-ld-fg active:scale-95"
            aria-label="Categorías anteriores"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {canScrollR && (
          <button
            onClick={() => scrollBy(1)}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full ld-glass items-center justify-center text-ld-fg active:scale-95"
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
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 snap-start active:scale-95 ${
                  isActive
                    ? 'ld-btn-primary text-white scale-105'
                    : 'ld-glass-soft text-ld-fg-soft border border-ld-border hover:text-ld-fg'
                }`}
              >
                {cat.icon && <span className="text-base leading-none">{cat.icon}</span>}
                <span>{cat.label}</span>
                <span className={`text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : ''
                }`} style={isActive ? undefined : { background: 'var(--ld-bg-soft)', color: 'var(--ld-fg-muted)' }}>
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