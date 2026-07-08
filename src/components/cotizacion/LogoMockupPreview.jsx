// ════════════════════════════════════════════════════════════════════════
// LogoMockupPreview — Mockup inteligente de logo sobre producto B2B.
// Usa el motor mockup-engine para detectar la zona de grabado por categoría
// y el tono del fondo (claro/oscuro) para aplicar el filtro correcto al logo.
// Logo blanco sobre fondo oscuro, negro sobre fondo claro — siempre legible.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { Image, Sparkles } from 'lucide-react';
import { getEngraveZone, detectImageTone, getLogoFilter } from '@/lib/mockup-engine';

export default function LogoMockupPreview({
  logoUrl,
  productImg,
  producto = null,      // opcional: para zona inteligente por categoría
  size = 'md',
  showBadge = true,
  className = '',
  imgFilter = undefined,  // filtro CSS opcional (tinte de color) para coincidir con la galería
}) {
  const [tone, setTone] = useState('light'); // 'light' | 'dark'
  const [toneReady, setToneReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevImg = useRef(null);

  // Detecta el tono del fondo del producto automáticamente.
  // Con timeout de seguridad: si la detección se cuelga (CORS, red), el mockup
  // igual se muestra con el filtro por defecto — nunca un loader infinito.
  useEffect(() => {
    if (!productImg || productImg === prevImg.current) return;
    prevImg.current = productImg;
    setToneReady(false);
    let resolved = false;
    const fallback = setTimeout(() => { if (!resolved) setToneReady(true); }, 1500);
    detectImageTone(productImg).then((t) => {
      resolved = true;
      clearTimeout(fallback);
      setTone(t);
      setToneReady(true);
    }).catch(() => {
      resolved = true;
      clearTimeout(fallback);
      setToneReady(true);
    });
    return () => clearTimeout(fallback);
  }, [productImg]);

  const zone = getEngraveZone(producto);
  // Filtro de grabado. CLAVE: nunca usar brightness(0) — vuelve NEGRO todo el
  // rectángulo del logo (incluido el fondo blanco de un JPG) y aparece una
  // mancha negra gigante. Con grayscale+contrast, el blend multiply hace
  // transparente el fondo claro y screen el fondo oscuro: solo se graba el logo.
  const logoFilter = toneReady ? getLogoFilter(tone, zone) : 'grayscale(100%) contrast(1.2)';
  const blendMode = toneReady && tone === 'dark' ? 'screen' : 'multiply';

  // Tamaños de contenedor según prop size
  const containerStyle = {
    sm: { borderRadius: '12px', overflow: 'hidden', position: 'relative', width: '100%', height: '100%', background: '#F8F4EE' },
    md: { borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '1', background: '#F8F4EE' },
    lg: { borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '4/3', background: '#F8F4EE' },
    xl: { borderRadius: '20px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '16/9', background: '#F8F4EE' },
  }[size] || {};

  // Shape del área de grabado
  const isCircle = zone.shape === 'circle';

  return (
    <div style={containerStyle} className={className}>
      {/* Imagen base del producto */}
      {productImg ? (
        <img
          src={productImg}
          alt="producto"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { e.target.style.opacity = '0'; }}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            filter: imgFilter,
            transition: 'opacity 0.3s, filter 0.25s ease',
            opacity: imgLoaded ? 1 : 0,
          }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image style={{ width: 32, height: 32, color: '#D4C4B0' }} />
        </div>
      )}

      {/* Overlay de grabado láser — aplica logo a TODOS los productos */}
      {logoUrl && (
        <>
          {/* Iluminación de estudio: highlight especular + viñeta de sombra.
              Da volumen real a la superficie para que el grabado se asiente
              con profundidad (no flote plano como un sticker). */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(70% 55% at 32% 28%, rgba(255,255,255,0.13) 0%, transparent 60%)',
            mixBlendMode: 'screen',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(120% 95% at 50% 44%, transparent 52%, rgba(0,0,0,0.12) 100%)',
            mixBlendMode: 'multiply',
          }} />

          {/* Área de grabado inteligente — reemplaza marca PEYU con logo cliente.
              Motor multi-pasada: tinta + textura del material + bisel del láser. */}
          <div
            style={{
              position: 'absolute',
              width: zone.size,
              aspectRatio: '1',
              top: zone.top,
              left: zone.left,
              transform: 'translate(-50%, -50%)',
              borderRadius: isCircle ? '50%' : '14%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Pasada 1 · TINTA: el logo con blend inteligente (multiply/screen)
                y bisel del láser (drop-shadow para profundidad 3D). */}
            <img
              src={logoUrl}
              alt="Logo grabado"
              style={{
                width: '92%',
                height: '92%',
                objectFit: 'contain',
                filter: `${logoFilter} ${tone === 'dark'
                  ? 'drop-shadow(0 0.8px 0.5px rgba(255,255,255,0.35)) drop-shadow(0 -0.6px 0.5px rgba(0,0,0,0.2))'
                  : 'drop-shadow(0 0.8px 0.5px rgba(0,0,0,0.35)) drop-shadow(0 -0.6px 0.5px rgba(255,255,255,0.2))'
                }`,
                opacity: zone.opacity ?? 0.9,
                mixBlendMode: blendMode,
              }}
            />
            {/* Pasada 2 · TEXTURA: la propia foto del producto recortada con la
                misma silueta del logo y mezclada en soft-light. Esto "deja ver"
                los granos/reflejos del material dentro del grabado → integración
                perfecta con la superficie (no un parche plano). */}
            <div
              style={{
                position: 'absolute', inset: 0,
                WebkitMaskImage: `url("${logoUrl}")`, maskImage: `url("${logoUrl}")`,
                WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center', maskPosition: 'center',
                WebkitMaskSize: '92% 92%', maskSize: '92% 92%',
                backgroundImage: `url("${productImg}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                mixBlendMode: 'soft-light',
                opacity: 0.55,
                filter: tone === 'dark' ? 'brightness(1.15) contrast(1.1)' : 'brightness(0.9) contrast(1.15)',
              }}
            />
          </div>

          {/* Badge indicador */}
          {showBadge && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              padding: '3px 8px',
              borderRadius: 999,
              fontSize: 9,
              fontWeight: 700,
              color: '#0F8B6C',
            }}>
              <Sparkles style={{ width: 10, height: 10 }} />
              Grabado láser · {zone.areaLabel}
            </div>
          )}
        </>
      )}

      {/* Sin logo: CTA sutil */}
      {!logoUrl && productImg && (
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(6px)',
          padding: '3px 8px', borderRadius: 999,
          fontSize: 9, fontWeight: 700, color: '#A78B6F',
        }}>
          <Image style={{ width: 10, height: 10 }} />
          + Tu logo
        </div>
      )}
    </div>
  );
}