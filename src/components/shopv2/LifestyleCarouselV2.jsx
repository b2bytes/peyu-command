import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const LIFESTYLE_IMAGES = [
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/3525d251d_generated_image.png',
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/d1a050a8a_generated_image.png',
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/76a643a4c_generated_image.png',
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/a24101c83_generated_image.png',
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/b852a8955_generated_image.png',
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/920a6b6a2_generated_image.png',
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/7ca41414d_generated_image.png',
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/d9478f69a_generated_image.png',
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/11f43f51c_generated_image.png',
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/0a88fe897_generated_image.png',
];

export default function LifestyleCarouselV2() {
  const [idx, setIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % LIFESTYLE_IMAGES.length), 5000);
    return () => clearInterval(timer);
  }, [autoplay]);

  const prev = () => { setIdx((i) => (i - 1 + LIFESTYLE_IMAGES.length) % LIFESTYLE_IMAGES.length); setAutoplay(false); };
  const next = () => { setIdx((i) => (i + 1) % LIFESTYLE_IMAGES.length); setAutoplay(false); };

  return (
    <section className="w-full px-3 sm:px-4 lg:px-6 mb-8 sm:mb-12">
      <div className="max-w-screen-xl mx-auto">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[9/12] sm:aspect-[16/10] lg:aspect-[4/3] group">
          {/* Imagen actual */}
          <img
            src={LIFESTYLE_IMAGES[idx]}
            alt={`Lifestyle ${idx + 1}`}
            className="w-full h-full object-cover transition-opacity duration-700"
            loading="lazy"
          />

          {/* Overlay degradado en mobile */}
          <div className="absolute inset-0 sm:hidden bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Botones nav (ocultos en mobile, visibles en desktop) */}
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/80 hover:bg-white shadow-lg items-center justify-center transition-all active:scale-95 backdrop-blur-sm"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <ChevronLeft className="w-5 h-5 text-[#2C1810]" />
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/80 hover:bg-white shadow-lg items-center justify-center transition-all active:scale-95 backdrop-blur-sm"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <ChevronRight className="w-5 h-5 text-[#2C1810]" />
          </button>

          {/* Indicadores (dots) en mobile, numerador en desktop */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {/* Mobile: dots */}
            <div className="sm:hidden flex gap-1.5">
              {LIFESTYLE_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setIdx(i); setAutoplay(false); }}
                  className={`h-1.5 rounded-full transition-all ${ idx === i ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                  aria-label={`Imagen ${i + 1}`}
                />
              ))}
            </div>

            {/* Desktop: contador */}
            <div className="hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold" style={{ color: '#2C1810' }}>
              <span>{String(idx + 1).padStart(2, '0')}</span>
              <span className="text-[#A08070]">/</span>
              <span className="text-[#A08070]">{String(LIFESTYLE_IMAGES.length).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}