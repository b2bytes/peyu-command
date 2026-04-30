// ============================================================================
// GiftCardVisual — Tarjeta de regalo PEYU diseñada en CSS/SVG
// ----------------------------------------------------------------------------
// Renderiza una giftcard con:
//  - Logo PEYU oficial (tortuga + texto)
//  - Monto destacado
//  - Patrón sutil de tortuga reciclada
//  - Código (opcional, solo después de canjear)
//  - Variantes de color según monto (Detalle / Popular / Premium / Corporativo)
//
// Reutilizable en:
//  - /regalar-giftcard (preview en el flujo)
//  - /producto/:id (cuando es gift card)
//  - Email HTML (renderizable como imagen estática)
// ============================================================================
import { Gift, Recycle } from 'lucide-react';

const VARIANTES = {
  10000:  { name: 'Detalle',     gradient: 'from-amber-700 via-orange-700 to-red-800',  accent: '#FCD34D', tag: 'DETALLE' },
  20000:  { name: 'Popular',     gradient: 'from-teal-700 via-emerald-700 to-cyan-800', accent: '#5EEAD4', tag: 'POPULAR' },
  50000:  { name: 'Premium',     gradient: 'from-slate-800 via-slate-900 to-black',     accent: '#D4AF37', tag: 'PREMIUM' },
  100000: { name: 'Corporativo', gradient: 'from-emerald-800 via-emerald-900 to-slate-900', accent: '#A7F3D0', tag: 'CORPORATIVO' },
};

export default function GiftCardVisual({
  monto = 20000,
  destinatario = '',
  remitente = '',
  codigo = '',
  mensaje = '',
  showCode = false,
  className = '',
}) {
  const v = VARIANTES[monto] || VARIANTES[20000];
  const montoFmt = `$${new Intl.NumberFormat('es-CL').format(monto)}`;

  return (
    <div className={`relative w-full aspect-[1.586/1] rounded-3xl overflow-hidden shadow-2xl ${className}`}
      style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Fondo gradiente */}
      <div className={`absolute inset-0 bg-gradient-to-br ${v.gradient}`} />

      {/* Patrón de tortugas (decorativo, muy sutil) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`turtle-${monto}`} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <text x="20" y="50" fontSize="36" fill="white">🐢</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#turtle-${monto})`} />
      </svg>

      {/* Glow accent radial */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-40 blur-3xl"
        style={{ backgroundColor: v.accent }} />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: v.accent }} />

      {/* Borde interno premium */}
      <div className="absolute inset-3 sm:inset-4 rounded-2xl border border-white/15 pointer-events-none" />

      {/* Contenido */}
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-7 md:p-8">

        {/* TOP — Logo + tag */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {/* Logo PEYU oficial — invertido para fondo oscuro */}
            <img
              src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU"
              className="h-7 sm:h-9 w-auto object-contain"
              style={{ filter: 'invert(1) brightness(1.15)' }}
              draggable={false}
            />
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.2em] text-white/90 px-2 py-1 rounded-full backdrop-blur-sm border border-white/30"
              style={{ backgroundColor: v.accent + '25' }}>
              {v.tag}
            </span>
            <span className="text-[8px] sm:text-[9px] text-white/60 font-medium tracking-wider uppercase flex items-center gap-1">
              <Gift className="w-2.5 h-2.5" /> Gift Card
            </span>
          </div>
        </div>

        {/* CENTER — Monto */}
        <div className="text-center -my-2">
          <p className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-white/50 mb-1 font-medium">Valor</p>
          <p className="font-poppins font-bold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-none drop-shadow-lg">
            {montoFmt}
          </p>
          <p className="text-[10px] sm:text-xs text-white/55 mt-1 font-medium tracking-wide">CLP · Saldo disponible</p>
        </div>

        {/* BOTTOM — Destinatario / código / firma */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            {destinatario ? (
              <>
                <p className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase text-white/45 font-medium">Para</p>
                <p className="font-poppins font-semibold text-sm sm:text-base text-white truncate">
                  {destinatario}
                </p>
                {remitente && (
                  <p className="text-[10px] sm:text-xs text-white/55 truncate">
                    De: <span className="font-medium text-white/75">{remitente}</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase text-white/45 font-medium">Regalo sostenible</p>
                <p className="text-[10px] sm:text-xs text-white/65 font-medium flex items-center gap-1.5 mt-0.5">
                  <Recycle className="w-3 h-3" style={{ color: v.accent }} /> 100% reciclado · Hecho en Chile
                </p>
              </>
            )}
          </div>

          {showCode && codigo ? (
            <div className="text-right flex-shrink-0">
              <p className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase text-white/45 font-medium">Código</p>
              <p className="font-mono font-bold text-[10px] sm:text-xs tracking-widest"
                style={{ color: v.accent }}>
                {codigo}
              </p>
            </div>
          ) : (
            <div className="text-right flex-shrink-0">
              <p className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-white/40 font-medium">peyuchile.cl</p>
              <p className="text-[8px] sm:text-[9px] text-white/30 mt-0.5">Vigencia 12 meses</p>
            </div>
          )}
        </div>

        {/* Mensaje superpuesto si existe (solo en preview grande) */}
        {mensaje && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 max-w-[80%] hidden sm:block">
            <p className="text-[10px] italic text-white/65 text-center line-clamp-2">"{mensaje}"</p>
          </div>
        )}
      </div>

      {/* Brillo metálico superior (efecto premium) */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
    </div>
  );
}