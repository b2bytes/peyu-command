import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Check, Sparkles, ImageIcon } from 'lucide-react';
import { BACKGROUNDS, useAppBackground } from '@/lib/background';

/**
 * Carrusel fullscreen para elegir fondo de la app.
 * - Preview GRANDE en el centro con la imagen real aplicada.
 * - Thumbnails scrollables debajo (iOS/macOS style).
 * - Filtros por categoría.
 * - Se aplica al instante al navegar (preview en vivo).
 */
export default function BackgroundCarousel({ open, onClose }) {
  const [currentId, setCurrentId] = useAppBackground();
  const [activeCat, setActiveCat] = useState('Todos');
  const [index, setIndex] = useState(0);
  const thumbsRef = useRef(null);
  const initialIdRef = useRef(currentId);

  // Categorías únicas (manteniendo orden).
  const categories = useMemo(() => {
    const cats = ['Todos'];
    BACKGROUNDS.forEach(bg => {
      const c = bg.category || 'Otros';
      if (!cats.includes(c)) cats.push(c);
    });
    return cats;
  }, []);

  const visible = useMemo(
    () => (activeCat === 'Todos' ? BACKGROUNDS : BACKGROUNDS.filter(b => b.category === activeCat)),
    [activeCat]
  );

  // Al abrir, guarda el fondo original y posiciona el índice en el actual.
  useEffect(() => {
    if (!open) return;
    initialIdRef.current = currentId;
    const i = visible.findIndex(b => b.id === currentId);
    setIndex(i >= 0 ? i : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Si cambia la categoría, reposiciona al fondo actual si está en esa cat, si no al 0.
  useEffect(() => {
    if (!open) return;
    const i = visible.findIndex(b => b.id === currentId);
    setIndex(i >= 0 ? i : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat]);

  // Aplica el fondo en vivo al mover el carrusel.
  useEffect(() => {
    if (!open) return;
    const bg = visible[index];
    if (bg && bg.id !== currentId) setCurrentId(bg.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, open]);

  // Hacer scroll del thumb activo a la vista.
  useEffect(() => {
    if (!thumbsRef.current) return;
    const el = thumbsRef.current.querySelector(`[data-idx="${index}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [index]);

  // Teclado: flechas + esc + enter.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleCancel();
      else if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setIndex(i => Math.min(visible.length - 1, i + 1));
      else if (e.key === 'Enter') handleApply();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visible.length, index]);

  if (!open) return null;

  const current = visible[index] || visible[0];
  const isTheme = (current?.category || '') === 'Temas';

  const handleCancel = () => {
    // Restaurar el fondo que había antes de abrir.
    if (initialIdRef.current && initialIdRef.current !== currentId) {
      setCurrentId(initialIdRef.current);
    }
    onClose();
  };

  const handleApply = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Selector de fondo"
    >
      {/* Fondo con blur profundo del fondo actual — feedback inmediato */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${current?.url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.4)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 backdrop-blur-md bg-black/30 flex-shrink-0 pt-[max(0.875rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-poppins font-bold text-white text-sm leading-tight">Fondo de la app</h2>
            <p className="text-[10px] text-white/60 leading-tight">
              {index + 1} de {visible.length} · {activeCat}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="hidden sm:block px-4 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-4 h-9 rounded-full bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-teal-500/30"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
            Aplicar
          </button>
          <button
            onClick={handleCancel}
            aria-label="Cerrar"
            className="sm:hidden w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* FILTROS */}
      <div className="relative z-10 px-4 sm:px-6 py-2.5 flex gap-2 overflow-x-auto peyu-scrollbar-light flex-shrink-0 backdrop-blur-md bg-black/20 border-b border-white/5">
        {categories.map(cat => {
          const active = cat === activeCat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`flex-shrink-0 px-3.5 h-8 rounded-full text-[11px] font-semibold transition border ${
                active
                  ? 'bg-white text-slate-900 border-white shadow'
                  : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
              }`}
            >
              {cat === 'Temas' && <Sparkles className="w-3 h-3 inline -mt-0.5 mr-1" />}
              {cat}
            </button>
          );
        })}
      </div>

      {/* PREVIEW CENTRAL */}
      <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6">
        {/* Flechas */}
        <button
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label="Anterior"
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-xl"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIndex(i => Math.min(visible.length - 1, i + 1))}
          disabled={index >= visible.length - 1}
          aria-label="Siguiente"
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-xl"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Card preview */}
        <div className="relative w-full max-w-4xl aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-800">
          <img
            key={current?.id}
            src={current?.url}
            alt={current?.name}
            className="w-full h-full object-cover animate-in fade-in duration-300"
            draggable={false}
          />
          {/* Overlay con nombre y descripción */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                {isTheme && (
                  <span className="inline-flex items-center gap-1 bg-yellow-400/95 text-yellow-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow mb-2">
                    <Sparkles className="w-2.5 h-2.5" /> Tema especial
                  </span>
                )}
                <h3 className="font-poppins font-black text-white text-xl sm:text-2xl leading-tight">
                  {current?.name}
                </h3>
                {current?.description && (
                  <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">
                    {current.description}
                  </p>
                )}
              </div>
              {current?.id === initialIdRef.current && (
                <span className="flex-shrink-0 text-[10px] font-bold text-white/70 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
                  Actual
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* THUMBNAILS */}
      <div className="relative z-10 flex-shrink-0 border-t border-white/10 backdrop-blur-md bg-black/40 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div
          ref={thumbsRef}
          className="flex gap-2.5 overflow-x-auto px-4 sm:px-6 py-3 peyu-scrollbar-light"
        >
          {visible.map((bg, i) => {
            const selected = i === index;
            return (
              <button
                key={bg.id}
                data-idx={i}
                onClick={() => setIndex(i)}
                className={`group relative flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selected
                    ? 'border-teal-400 ring-2 ring-teal-400/60 scale-110 shadow-lg shadow-teal-500/30'
                    : 'border-white/20 hover:border-white/50 opacity-70 hover:opacity-100'
                }`}
                aria-label={bg.name}
                aria-pressed={selected}
              >
                <img
                  src={bg.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
                {selected && (
                  <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center shadow">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}