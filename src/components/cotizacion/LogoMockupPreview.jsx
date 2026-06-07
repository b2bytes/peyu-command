// ════════════════════════════════════════════════════════════════════════
// LogoMockupPreview — Mockup inteligente de logo sobre producto B2B.
// Usa el motor mockup-engine para detectar la zona de grabado por categoría
// y el tono del fondo (claro/oscuro) para aplicar el filtro correcto al logo.
// Logo blanco sobre fondo oscuro, negro sobre fondo claro — siempre legible.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { Image, Sparkles, Loader2 } from 'lucide-react';
import { getEngraveZone, detectImageTone, getLogoFilter } from '@/lib/mockup-engine';

export default function LogoMockupPreview({
  logoUrl,
  productImg,
  producto = null,      // opcional: para zona inteligente por categoría
  size = 'md',
  showBadge = true,
  className = '',
}) {
  const [tone, setTone] = useState('light'); // 'light' | 'dark'
  const [toneReady, setToneReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevImg = useRef(null);

  // Detecta el tono del fondo del producto automáticamente
  useEffect(() => {
    if (!productImg || productImg === prevImg.current) return;
    prevImg.current = productImg;
    setToneReady(false);
    detectImageTone(productImg).then((t) => {
      setTone(t);
      setToneReady(true);
    });
  }, [productImg]);

  const zone = getEngraveZone(producto);
  const logoFilter = toneReady ? getLogoFilter(tone, zone) : 'grayscale(100%) brightness(0) invert(1)';

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
            transition: 'opacity 0.3s',
            opacity: imgLoaded ? 1 : 0,
          }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image style={{ width: 32, height: 32, color: '#D4C4B0' }} />
        </div>
      )}

      {/* Overlay de grabado láser — solo si hay logo */}
      {logoUrl && (
        <>
          {/* Área de grabado inteligente por categoría */}
          <div
            style={{
              position: 'absolute',
              width: zone.size,
              aspectRatio: '1',
              top: zone.top,
              left: zone.left,
              transform: 'translate(-50%, -50%)',
              borderRadius: isCircle ? '50%' : '12%',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // Efecto de grabado: área ligeramente quemada
              background: tone === 'dark'
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.06)',
              boxShadow: tone === 'dark'
                ? '0 0 0 1px rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.3) inset'
                : '0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.15) inset',
            }}
          >
            {/* Logo grabado con filtro inteligente */}
            {!toneReady ? (
              <Loader2 style={{ width: '30%', height: '30%', color: 'rgba(255,255,255,0.5)', animation: 'spin 1s linear infinite' }} />
            ) : (
              <img
                src={logoUrl}
                alt="Logo grabado"
                style={{
                  width: '76%',
                  height: '76%',
                  objectFit: 'contain',
                  filter: logoFilter,
                  opacity: zone.opacity,
                  // Sombra de profundidad del grabado láser
                  dropShadow: tone === 'dark'
                    ? '0 1px 3px rgba(0,0,0,0.8)'
                    : '0 1px 3px rgba(255,255,255,0.6)',
                }}
              />
            )}
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