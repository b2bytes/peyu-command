import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProductImage } from '@/utils/productImages';

// ════════════════════════════════════════════════════════════════════════
// FeaturedCarouselV3 — Carrusel de impacto visual 2027. Foto grande con
// navegación, indicadores e integración fluida con el diseño Liquid Dual.
// ════════════════════════════════════════════════════════════════════════
export default function FeaturedCarouselV3({ productos = [], onPersonaliza }) {
  const [current, setCurrent] = useState(0);
  const items = productos.slice(0, 5);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const p = items[current];
  const img = getProductImage(p);

  const prev = () => setCurrent((c) => (c - 1 + items.length) % items.length);
  const next = () => setCurrent((c) => (c + 1) % items.length);

  return (
    <section className="w-full px-3 sm:px-4 lg:px-6 mb-8 sm:mb-12">
      <div className="max-w-7xl mx-auto">
        <div className="relative group rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden" style={{ background: '#FAF7F2', border: '1.5px solid #D4C4B0' }}>
          {/* Imagen principal con transición suave */}
          <div className="aspect-square sm:aspect-video relative overflow-hidden">
            <img
              src={img}
              alt={p.nombre}
              className="w-full h-full object-cover transition-opacity duration-700"
              key={`${current}-${p.id}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(44,24,16,.4)] via-transparent to-transparent" />
          </div>

          {/* Controles de navegación */}
          <button
            onClick={prev}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
            style={{ background: 'rgba(248,243,237,.9)', border: '1px solid #D4C4B0' }}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#2C1810' }} />
          </button>

          <button
            onClick={next}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
            style={{ background: 'rgba(248,243,237,.9)', border: '1px solid #D4C4B0' }}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#2C1810' }} />
          </button>

          {/* Info del producto superpuesta */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
            <h3 className="font-fraunces text-lg sm:text-2xl font-bold mb-2 line-clamp-2">{p.nombre}</h3>
            <p className="text-xs sm:text-sm opacity-90 mb-4 line-clamp-2">{p.descripcion || 'Producto destacado'}</p>
            <Link
              to={`/ProductoNuevo?id=${p.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: '#C0785C', color: 'white' }}
            >
              Ver producto <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Indicadores de posición */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="transition-all"
                style={{
                  width: i === current ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === current ? 'white' : 'rgba(255,255,255,.4)',
                }}
                aria-label={`Ir a producto ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Thumbnails debajo */}
        <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
          {items.map((prod, i) => (
            <button
              key={prod.id}
              onClick={() => setCurrent(i)}
              className={`flex-1 aspect-video rounded-lg sm:rounded-xl overflow-hidden border transition-all ${
                i === current ? 'border-[#C0785C] scale-105' : 'border-[#D4C4B0] opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={getProductImage(prod)}
                alt={prod.nombre}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}