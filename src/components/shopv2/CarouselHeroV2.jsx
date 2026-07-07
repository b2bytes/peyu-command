import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// CarouselHeroV2 — Carrusel hero editorial. Imágenes lifestyle full-bleed
// (generadas a partir de los productos reales del catálogo, que NO se tocan),
// ken-burns suave, caption por slide, swipe táctil en móvil y dots refinados.
// slides: [{ img, kicker, title }] · onSlideClick(slide)
// ════════════════════════════════════════════════════════════════════════
export default function CarouselHeroV2({ slides = [], onSlideClick }) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const touchX = useRef(null);

  useEffect(() => {
    if (!isAutoPlay || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlay, slides.length]);

  if (slides.length === 0) return null;

  const go = (idx) => {
    setIsAutoPlay(false);
    setCurrent((idx + slides.length) % slides.length);
  };

  // Swipe táctil — móvil navega deslizando, sin flechas encima de la foto
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden group select-none"
      style={{ aspectRatio: '1 / 1', background: '#EDE3D6', boxShadow: '0 20px 50px -20px rgba(44,24,16,.28)' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides full-bleed con ken-burns suave */}
      {slides.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-[900ms] ease-out cursor-pointer ${
            idx === current ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
          }`}
          onClick={() => onSlideClick?.(s)}
        >
          <img
            src={s.img}
            alt={s.title || `Slide ${idx + 1}`}
            className="w-full h-full object-cover"
            style={{
              transform: idx === current ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 5.5s ease-out',
            }}
            loading={idx === 0 ? 'eager' : 'lazy'}
            onError={(e) => {
              e.target.src = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4a2230d61_generated_image.png';
              e.target.onerror = null;
            }}
          />
          {/* Gradiente cálido inferior para legibilidad del caption (reforzado) */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(20,12,6,.92) 0%, rgba(20,12,6,.6) 40%, transparent 100%)' }} />

          {/* Caption editorial — contenedor glass que destaca sobre la foto */}
          {(s.kicker || s.title) && (
            <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-5 pb-5 sm:pb-7 pointer-events-none">
              <div className="inline-block max-w-[88%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3"
                style={{ background: 'rgba(20,12,6,.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.12)' }}>
                {s.kicker && (
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] mb-0.5"
                    style={{ color: '#F0C9B4' }}>
                    {s.kicker}
                  </p>
                )}
                {s.title && (
                  <p className="font-fraunces text-sm sm:text-xl leading-tight text-white">
                    {s.title}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Flechas — solo desktop al hover (en móvil se navega con swipe) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => go(current - 1)}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-95"
            style={{ background: 'rgba(255,255,255,.92)', boxShadow: '0 2px 12px rgba(44,24,16,.18)' }}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: '#C0785C' }} />
          </button>
          <button
            onClick={() => go(current + 1)}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-95"
            style={{ background: 'rgba(255,255,255,.92)', boxShadow: '0 2px 12px rgba(44,24,16,.18)' }}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" style={{ color: '#C0785C' }} />
          </button>
        </>
      )}


    </div>
  );
}