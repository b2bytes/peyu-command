import { useState, useRef } from 'react';
import { Recycle, ZoomIn, Check } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// Galería rica del Shop v2 (Baymard 2026 #3): imagen principal grande con zoom
// hover/touch, badge de sostenibilidad y thumbnails de cada ángulo/color real.
// Recibe `images` (urls), `active` (índice), `onSelect` y `badge`.
// ════════════════════════════════════════════════════════════════════════
export default function ProductGalleryV2({
  images = [], active = 0, onSelect, badge, fallback,
}) {
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const ref = useRef(null);

  const main = images[active] || images[0] || fallback;

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
        <img
          src={main}
          alt="Producto"
          referrerPolicy="no-referrer"
          onError={(e) => { if (fallback) e.target.src = fallback; }}
          className="w-full h-full transition-transform duration-200 ease-out"
          style={{
            objectFit: 'contain',
            objectPosition: 'center',
            padding: '12px',
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
              <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full" style={{ objectFit: 'contain', padding: '4px' }} />
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