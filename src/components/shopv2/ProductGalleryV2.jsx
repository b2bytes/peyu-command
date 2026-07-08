import { useState, useRef, useEffect } from 'react';
import { Recycle, ZoomIn, Check } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// Galería rica del Shop v2 (Baymard 2026 #3): imagen principal grande con zoom
// hover/touch, badge de sostenibilidad y thumbnails de cada ángulo/color real.
// Recibe `images` (urls), `active` (índice), `onSelect` y `badge`.
// ════════════════════════════════════════════════════════════════════════
export default function ProductGalleryV2({
  images = [], active = 0, onSelect, badge, fallback, imgFilter = '', mainImage,
}) {
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const ref = useRef(null);

  // mainImage tiene prioridad: es la imagen resuelta del color elegido por el
  // padre (displayImg). Si no se pasa, cae al índice activo de la galería.
  // Esto hace que el cambio de color sea INMEDIATO y fluido — el padre ya
  // resolvió la URL correcta, no dependemos de sincronizar índices frágiles.
  const main = mainImage || images[active] || images[0] || fallback;

  // ── Transición de carga: cuando cambia la imagen principal (color/ángulo),
  //     mostramos un shimmer hasta que la nueva imagen cargue. Así el cliente
  //     ve feedback INMEDIATO de que algo cambió, en vez de la foto anterior
  //     congelada mientras se descarga la nueva.
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  useEffect(() => {
    setImgLoaded(false);
    setImgKey((k) => k + 1);
  }, [main]);

  // ── Auto-sync del thumbnail activo: cuando mainImage cambia (el cliente
  //     eligió otro color), buscamos esa URL en los thumbnails y marcamos el
  //     activo para feedback visual. Si no se encuentra, no hacemos nada.
  useEffect(() => {
    if (!mainImage || images.length < 2) return;
    const idx = images.indexOf(mainImage);
    if (idx >= 0 && idx !== active) onSelect?.(idx);
  }, [mainImage]); // eslint-disable-line

  const handleMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const point = e.touches?.[0] || e;
    const x = ((point.clientX - r.left) / r.width) * 100;
    const y = ((point.clientY - r.top) / r.height) * 100;
    setPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMove}
        onTouchStart={() => setZoom(true)}
        onTouchMove={handleMove}
        onTouchEnd={() => setZoom(false)}
        className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-[#EBE3D6] shadow-[0_12px_40px_-18px_rgba(74,63,51,0.35)] cursor-zoom-in group"
      >
        {/* Shimmer sutil mientras carga la nueva imagen (cambio de color/ángulo) */}
        {!imgLoaded && (
          <div className="absolute inset-0 peyu-shimmer z-10" style={{ padding: '12px' }} />
        )}
        <img
          key={imgKey}
          src={main}
          alt="Producto"
          referrerPolicy="no-referrer"
          fetchpriority="high"
          loading="eager"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { setImgLoaded(true); if (fallback) e.target.src = fallback; }}
          className="w-full h-full transition-transform duration-200 ease-out"
          style={{
            objectFit: 'contain',
            objectPosition: 'center',
            padding: '12px',
            filter: imgFilter || undefined,
            transition: imgLoaded ? 'filter .25s ease, transform .2s ease-out, opacity .18s ease' : 'none',
            opacity: imgLoaded ? 1 : 0,
            ...(zoom ? {
              transform: 'scale(2)',
              transformOrigin: `${pos.x}% ${pos.y}%`,
            } : { transform: 'scale(1)' })
          }}
        />
        {badge && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-[11px] font-bold px-2.5 py-1.5 rounded-full text-[#0F8B6C] shadow-sm">
            <Recycle className="w-3.5 h-3.5" />
            {badge}
          </span>
        )}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 bg-[#2A2420]/70 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3 h-3" /> Pasa el cursor para ampliar
        </span>
      </div>

      {/* Thumbnails de ángulos / colores reales */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onSelect?.(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 transition-all ${
                i === active ? 'border-[#0F8B6C] shadow-md' : 'border-[#EBE3D6] hover:border-[#0F8B6C]/40'
              }`}
            >
              <img src={img} alt="" referrerPolicy="no-referrer" loading="lazy" className="w-full h-full" style={{ objectFit: 'contain', padding: '4px', filter: imgFilter || undefined, transition: 'filter .25s ease' }} />
              {i === active && (
                <span className="absolute inset-0 flex items-center justify-center bg-[#0F8B6C]/15">
                  <Check className="w-4 h-4 text-[#0F8B6C]" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}