import React from 'react';
import { Send, Leaf, ShoppingBag, Plus } from 'lucide-react';

const PEYU_LOGO = 'https://media.base44.com/images/public/6a1a158951bc398e16add415/86a2b4b89_image.png';

// Mini-mockup que deja entrever el norte: home conversacional (chat + orb Peyu),
// una card de producto y el carrito — todo pintado con los tokens de la dirección.
export default function BrandMockupPreview({ palette, tipografia, radios, sombras }) {
  if (!palette) return null;

  const radiusMd = radios?.md || '14px';
  const radiusSm = radios?.sm || '8px';
  const shadow =
    sombras === 'marcada'
      ? '0 18px 40px -16px rgba(0,0,0,0.45)'
      : sombras === 'media'
      ? '0 10px 26px -14px rgba(0,0,0,0.32)'
      : '0 4px 14px -8px rgba(0,0,0,0.22)';

  const titularFont = tipografia?.titular || 'inherit';
  const cuerpoFont = tipografia?.cuerpo || 'inherit';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {/* HOME conversacional */}
      <div
        className="p-3 flex flex-col gap-2 min-h-[150px]"
        style={{ background: palette.bg, borderRadius: radiusMd, boxShadow: shadow, color: palette.text }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ background: palette.accent, color: palette.bg }}
          >🐢</span>
          <span className="text-[10px] font-semibold" style={{ fontFamily: titularFont }}>Peyu</span>
        </div>
        <p className="text-[10px] leading-snug" style={{ fontFamily: cuerpoFont, color: palette.muted }}>
          Busco un regalo para mi equipo…
        </p>
        <div
          className="text-[9px] px-2 py-1.5 self-start max-w-[90%]"
          style={{ background: palette.surface, borderRadius: radiusSm, fontFamily: cuerpoFont }}
        >
          ¡Genial! Te muestro 3 ideas 🌱
        </div>
        <div className="mt-auto flex items-center gap-1.5">
          <div
            className="flex-1 h-6 px-2 flex items-center text-[8px]"
            style={{ background: palette.surface, borderRadius: 999, color: palette.muted, fontFamily: cuerpoFont }}
          >
            Escríbele a Peyu…
          </div>
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: palette.accent }}
          >
            <Send className="w-3 h-3" style={{ color: palette.bg }} />
          </span>
        </div>
      </div>

      {/* CARD producto */}
      <div
        className="p-2.5 flex flex-col gap-2 min-h-[150px]"
        style={{ background: palette.surface, borderRadius: radiusMd, boxShadow: shadow, color: palette.text }}
      >
        <div
          className="w-full h-16 flex items-center justify-center"
          style={{ background: palette.bg, borderRadius: radiusSm }}
        >
          <Leaf className="w-6 h-6" style={{ color: palette.accent }} />
        </div>
        <p className="text-[10px] font-semibold leading-tight" style={{ fontFamily: titularFont }}>
          Set Escritorio Eco
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: palette.accent2, color: palette.bg }}>
            Reciclado
          </span>
          <span className="text-[8px]" style={{ color: palette.muted, fontFamily: cuerpoFont }}>10 años</span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[11px] font-bold" style={{ fontFamily: titularFont }}>$24.990</span>
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: palette.accent }}
          >
            <Plus className="w-3 h-3" style={{ color: palette.bg }} />
          </span>
        </div>
      </div>

      {/* CARRITO */}
      <div
        className="p-2.5 flex flex-col gap-2 min-h-[150px]"
        style={{ background: palette.bg, borderRadius: radiusMd, boxShadow: shadow, color: palette.text }}
      >
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5" style={{ color: palette.accent }} />
          <span className="text-[10px] font-semibold" style={{ fontFamily: titularFont }}>Tu carrito</span>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-6 h-6 flex-shrink-0" style={{ background: palette.surface, borderRadius: radiusSm }} />
            <div className="flex-1 min-w-0">
              <div className="h-1.5 w-3/4 rounded-full mb-1" style={{ background: palette.muted, opacity: 0.4 }} />
              <div className="h-1.5 w-1/2 rounded-full" style={{ background: palette.muted, opacity: 0.25 }} />
            </div>
            <span className="text-[8px] font-semibold" style={{ fontFamily: cuerpoFont }}>$12k</span>
          </div>
        ))}
        <div
          className="mt-auto text-center text-[9px] font-semibold py-1.5"
          style={{ background: palette.accent, color: palette.bg, borderRadius: 999, fontFamily: cuerpoFont }}
        >
          Pagar →
        </div>
      </div>
    </div>
  );
}

export { PEYU_LOGO };