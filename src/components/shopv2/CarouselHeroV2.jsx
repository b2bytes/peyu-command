import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Carrusel automático cada 3s — hermoso, inteligente, clickeable
export default function CarouselHeroV2({ images = [], onImageClick }) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay || images.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isAutoPlay, images.length]);

  if (images.length === 0) return null;

  const handlePrev = () => {
    setIsAutoPlay(false);
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setIsAutoPlay(false);
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const handleDot = (idx) => {
    setIsAutoPlay(false);
    setCurrent(idx);
  };

  return (
    <div className="relative w-full aspect-square sm:aspect-auto sm:h-[500px] rounded-3xl overflow-hidden group bg-[#F2EBE1]">
      {/* Imágenes */}
      {images.map((img, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 cursor-pointer ${
            idx === current ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => onImageClick?.(img)}
        >
          <img
            src={img}
            alt={`Slide ${idx + 1}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading={idx === current ? 'eager' : 'lazy'}
            onError={(e) => {
              e.target.src = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4a2230d61_generated_image.png';
            }}
          />
        </div>
      ))}

      {/* Botones navegación — visible en hover */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 bg-white/80 hover:bg-white shadow-lg"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: '#C0785C' }} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 bg-white/80 hover:bg-white shadow-lg"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" style={{ color: '#C0785C' }} />
          </button>
        </>
      )}

      {/* Indicadores de puntos — siempre visible */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDot(idx)}
              className={`rounded-full transition-all ${
                idx === current
                  ? 'w-3 h-3'
                  : 'w-2 h-2 hover:w-2.5 hover:h-2.5'
              }`}
              style={{
                background: idx === current ? '#C0785C' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
              aria-label={`Ir a slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Badge contador */}
      {images.length > 1 && (
        <div
          className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs font-bold text-white backdrop-blur-sm"
          style={{ background: 'rgba(192,120,92,0.8)' }}
        >
          {current + 1}/{images.length}
        </div>
      )}
    </div>
  );
}