// Mockup inteligente de logo sobre producto B2B.
// Simula grabado láser real: logo en blanco grabado sobre el producto,
// centrado, con sombra sutil de profundidad. Funciona sobre cualquier color de fondo.
import { Image, Sparkles } from 'lucide-react';

export default function LogoMockupPreview({ logoUrl, productImg, size = 'md', className = '' }) {
  const sizes = {
    sm: { container: 'w-12 h-12', logo: '35%' },
    md: { container: 'w-full aspect-square max-h-48', logo: '38%' },
    lg: { container: 'w-full aspect-[4/3]', logo: '42%' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#F8F4EE] ${s.container} ${className}`}>
      {/* Imagen base del producto */}
      {productImg ? (
        <img
          src={productImg}
          alt="producto"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.style.opacity = '0'; }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image className="w-10 h-10 text-[#D4C4B0]" />
        </div>
      )}

      {/* Overlay de grabado láser — solo si hay logo */}
      {logoUrl && (
        <>
          {/* Área de grabado: fondo negro semitransparente simulando área marcada */}
          <div
            className="absolute rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              width: s.logo,
              aspectRatio: '1',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.08)',
              backdropFilter: 'blur(0.5px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18), inset 0 1px 2px rgba(255,255,255,0.15)',
            }}
          >
            {/* Logo en blanco — simula grabado láser real */}
            <img
              src={logoUrl}
              alt="Tu logo grabado"
              className="w-[80%] h-[80%] object-contain"
              style={{
                filter: 'brightness(0) invert(1)',
                opacity: 0.88,
              }}
            />
          </div>
          {/* Badge indicador */}
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-[9px] font-bold px-2 py-1 rounded-full text-[#0F8B6C]">
            <Sparkles className="w-2.5 h-2.5" /> Grabado láser
          </div>
        </>
      )}

      {/* Sin logo: placeholder elegante */}
      {!logoUrl && productImg && (
        <div className="absolute inset-0 flex flex-col items-end justify-end p-2">
          <div className="inline-flex items-center gap-1 bg-white/80 backdrop-blur text-[9px] font-bold px-2 py-1 rounded-full text-[#A78B6F]">
            <Image className="w-2.5 h-2.5" /> + Tu logo
          </div>
        </div>
      )}
    </div>
  );
}