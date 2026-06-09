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
    <div
      className="relative w-full rounded-3xl overflow-hidden group"
      style={{
        background: 'linear-gradient(145deg, #F5EFE8 0%, #EDE3D6 100%)',
        aspectRatio: '1 / 1',
      }}
    >
      {/* Imágenes: object-contain para que se vean COMPLETAS, sin corte */}
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
            className="w-full h-full transition-transform duration-700 ease-out"
            style={{
              objectFit: 'contain',
              objectPosition: 'center',
              padding: '8px',
              transform: idx === current ? 'scale(1.02)' : 'scale(1)',
            }}
            loading={idx === current ? 'eager' : 'lazy'}
            onError={(e) => {
              e.target.src = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4a2230d61_generated_image.png';
              e.target.onerror = null;
            }}
          />
        </div>
      ))}

      {/* Botones navegación — siempre visibles en mobile, hover en desktop */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100 active:scale-95"
            style={{ background: 'rgba(255,255,255,.92)', boxShadow: '0 2px 12px rgba(44,24,16,.14)', border: '1px solid rgba(212,196,176,.4)' }}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: '#C0785C' }} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100 active:scale-95"
            style={{ background: 'rgba(255,255,255,.92)', boxShadow: '0 2px 12px rgba(44,24,16,.14)', border: '1px solid rgba(212,196,176,.4)' }}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-4 h-4" style={{ color: '#C0785C' }} />
          </button>
        </>
      )}

      {/* Dots — siempre visibles, más grandes en mobile */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 items-center">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDot(idx)}
              className="rounded-full transition-all"
              style={{
                width: idx === current ? '20px' : '7px',
                height: '7px',
                background: idx === current ? '#C0785C' : 'rgba(192,120,92,0.35)',
              }}
              aria-label={`Ir a slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}