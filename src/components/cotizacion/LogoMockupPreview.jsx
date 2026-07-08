// ════════════════════════════════════════════════════════════════════════
// LogoMockupPreview — Motor de mockup de grabado láser para B2B.
// ----------------------------------------------------------------------------
// Renderiza un grabado fotorrealista del logo del cliente sobre la foto del
// producto, usando la MISMA técnica multi-pasada del motor B2C (EngravedLayer):
//
//   Pasada 1 · TINTA       → logo monocromo con blend inteligente (multiply/screen)
//                            + bisel del láser (drop-shadow para profundidad 3D).
//   Pasada 2 · TEXTURA     → la PROPIA foto del producto recortada con la silueta
//                            del logo y mezclada en soft-light → el grabado absorbe
//                            los granos/reflejos reales del material.
//   Pasada 3 · LUZ         → highlight especular + viñeta → volumen de superficie.
//
// CLAVE: el tono (light/dark) se re-detecta automáticamente cada vez que cambia
// la imagen del producto (color elegido). Así el grabado SIEMPRE coincide con
// el color real del producto: tinta clara sobre producto oscuro, tinta oscura
// sobre producto claro.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { Image, Sparkles } from 'lucide-react';
import { getEngraveZone, detectImageTone } from '@/lib/mockup-engine';

// Bisel del láser: reflejo arriba (highlight) + sombra abajo (surco).
function biselFx(tone) {
  return tone === 'dark'
    ? 'drop-shadow(0 1px 0.6px rgba(255,255,255,0.45)) drop-shadow(0 -0.8px 0.5px rgba(0,0,0,0.35))'
    : 'drop-shadow(0 1px 0.6px rgba(0,0,0,0.5)) drop-shadow(0 -0.8px 0.5px rgba(255,255,255,0.3))';
}

export default function LogoMockupPreview({
  logoUrl,
  productImg,
  producto = null,
  size = 'md',
  showBadge = true,
  className = '',
  imgFilter = undefined,
}) {
  const [tone, setTone] = useState('dark');
  const [toneReady, setToneReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const prevImg = useRef(null);

  // Detecta el tono del fondo del producto automáticamente cada vez que cambia
  // la imagen (color elegido). Con timeout de seguridad: si la detección se
  // cuelga (CORS, red), el mockup igual se muestra con el filtro por defecto.
  useEffect(() => {
    if (!productImg || productImg === prevImg.current) return;
    prevImg.current = productImg;
    setToneReady(false);
    setImgLoaded(false);
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
  const isCircle = zone.shape === 'circle';

  // Filtro del logo: monocromo + contraste para que el blend funcione.
  // En fondo oscuro → logo blanco (invert); en fondo claro → logo negro.
  const logoFilter = toneReady
    ? (tone === 'dark'
        ? 'grayscale(100%) invert(1) contrast(1.3) brightness(1.1)'
        : 'grayscale(100%) contrast(1.3) brightness(0.8)')
    : 'grayscale(100%) contrast(1.2)';
  const blendMode = toneReady && tone === 'dark' ? 'screen' : 'multiply';

  // Tamaños de contenedor según prop size
  const containerStyle = {
    sm: { borderRadius: '12px', overflow: 'hidden', position: 'relative', width: '100%', height: '100%', background: '#F8F4EE' },
    md: { borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '1', background: '#F8F4EE' },
    lg: { borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '4/3', background: '#F8F4EE' },
    xl: { borderRadius: '20px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '16/9', background: '#F8F4EE' },
  }[size] || {};

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
            background: 'radial-gradient(70% 55% at 32% 28%, rgba(255,255,255,0.14) 0%, transparent 60%)',
            mixBlendMode: 'screen',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(120% 95% at 50% 44%, transparent 52%, rgba(0,0,0,0.13) 100%)',
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
              onLoad={() => setLogoLoaded(true)}
              style={{
                width: '92%',
                height: '92%',
                objectFit: 'contain',
                filter: `${logoFilter} ${biselFx(tone)}`,
                opacity: zone.opacity ?? 0.9,
                mixBlendMode: blendMode,
                transition: 'filter 0.3s ease',
              }}
            />
            {/* Pasada 2 · TEXTURA: la propia foto del producto recortada con la
                misma silueta del logo y mezclada en soft-light. Esto "deja ver"
                los granos/reflejos del material dentro del grabado → integración
                perfecta con la superficie (no un parche plano).

                ALINEACIÓN: background-size ampliado (320%) para muestrar TEXTURA
                del material, no la silueta entera del producto. */}
            <div
              style={{
                position: 'absolute', inset: 0,
                WebkitMaskImage: `url("${logoUrl}")`, maskImage: `url("${logoUrl}")`,
                WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center', maskPosition: 'center',
                WebkitMaskSize: '92% 92%', maskSize: '92% 92%',
                backgroundImage: `url("${productImg}")`,
                backgroundSize: '320% 320%',
                backgroundPosition: 'center',
                mixBlendMode: 'soft-light',
                opacity: 0.6,
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