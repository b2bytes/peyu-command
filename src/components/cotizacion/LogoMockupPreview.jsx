// ════════════════════════════════════════════════════════════════════════
// LogoMockupPreview — Motor SUPREMO de mockup de grabado láser (B2B).
// ----------------------------------------------------------------------------
// Al elegir/subir un logo, se incrusta AL INSTANTE sobre el producto:
//   0. PLACEHOLDER inmediato → mientras el engraver procesa, el logo crudo ya
//      aparece fundido en la superficie (grayscale + multiply, nunca caja blanca).
//   1. ENGRAVER real → engraveLogo() elimina el fondo del logo (JPG con fondo
//      blanco incluido) y lo convierte a tinta monocroma transparente.
//   2. TONO AUTOMÁTICO → se detecta el color del producto (por color elegido):
//      producto oscuro → tinta clara · producto claro → tinta oscura.
//   3. MULTI-PASADA → tinta + bisel 3D del láser + textura del material
//      (la propia foto recortada con la silueta del logo, en soft-light).
//   4. LUZ DE ESTUDIO → highlight especular + viñeta para volumen real.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { Image, Sparkles, Loader2 } from 'lucide-react';
import { getEngraveZone } from '@/lib/mockup-engine';
import { engraveLogo, detectImageTone } from '@/lib/logo-engraver';

// Bisel del láser según la tinta: reflejo + surco de medio píxel.
function biselFx(tint) {
  return tint === 'light'
    ? 'drop-shadow(0 1px 0.6px rgba(0,0,0,0.5)) drop-shadow(0 -0.8px 0.5px rgba(255,255,255,0.28))'
    : 'drop-shadow(0 1px 0.6px rgba(255,255,255,0.45)) drop-shadow(0 -0.8px 0.5px rgba(0,0,0,0.32))';
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
  // tint = tinta del grabado ('light' sobre producto oscuro, 'dark' sobre claro)
  const [tint, setTint] = useState('dark');
  const [eng, setEng] = useState(null); // { dataUrl, ok } resultado del engraver
  const [processing, setProcessing] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevImg = useRef(null);

  // ① Detecta el tono del producto automáticamente cada vez que cambia la
  //    imagen (color elegido) → la tinta del grabado SIEMPRE coincide.
  useEffect(() => {
    if (!productImg || productImg === prevImg.current) return;
    prevImg.current = productImg;
    setImgLoaded(false);
    let cancelled = false;
    detectImageTone(productImg).then((t) => { if (!cancelled) setTint(t); });
    return () => { cancelled = true; };
  }, [productImg]);

  // ② Procesa el logo con el engraver real (elimina fondo + monocromo).
  //    Mantiene el resultado anterior visible mientras reprocesa (anti-flash).
  useEffect(() => {
    let cancelled = false;
    if (!logoUrl) { setEng(null); return; }
    setProcessing(true);
    engraveLogo(logoUrl, tint)
      .then(({ dataUrl, processed }) => {
        if (!cancelled) setEng({ dataUrl, ok: processed !== false });
      })
      .catch(() => { if (!cancelled) setEng({ dataUrl: logoUrl, ok: false }); })
      .finally(() => { if (!cancelled) setProcessing(false); });
    return () => { cancelled = true; };
  }, [logoUrl, tint]);

  const zone = getEngraveZone(producto);
  const isCircle = zone.shape === 'circle';

  // Tamaños de contenedor según prop size
  const containerStyle = {
    sm: { borderRadius: '12px', overflow: 'hidden', position: 'relative', width: '100%', height: '100%', background: '#F8F4EE' },
    md: { borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '1', background: '#F8F4EE' },
    lg: { borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '4/3', background: '#F8F4EE' },
    xl: { borderRadius: '20px', overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: '16/9', background: '#F8F4EE' },
  }[size] || {};

  // ¿Qué mostramos dentro del área de grabado?
  //  · eng listo y ok    → grabado real multi-pasada (tinta + textura + bisel)
  //  · procesando aún    → PLACEHOLDER instantáneo: logo crudo fundido con
  //                        grayscale+multiply y pulso sutil ("se está grabando")
  //  · eng falló (CORS)  → logo crudo limpio con multiply (nunca caja blanca)
  const showEngraved = !!eng && eng.ok;
  const showPlaceholder = !!logoUrl && !eng; // primer procesado en curso

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

      {logoUrl && (
        <>
          {/* Luz de estudio: highlight especular + viñeta → volumen real */}
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

          {/* Área de grabado inteligente por categoría */}
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
            {showEngraved ? (
              <>
                {/* Pasada 1 · TINTA: PNG monocromo transparente del engraver
                    (el color de la tinta ya viene resuelto según el tono del
                    producto) + bisel del láser (profundidad 3D). */}
                <img
                  src={eng.dataUrl}
                  alt="Logo grabado"
                  style={{
                    width: '92%',
                    height: '92%',
                    objectFit: 'contain',
                    filter: biselFx(tint),
                    opacity: zone.opacity ?? 0.92,
                    mixBlendMode: tint === 'light' ? 'screen' : 'multiply',
                  }}
                />
                {/* Pasada 2 · TEXTURA: la foto del producto recortada con la
                    silueta transparente del engraver → el grabado absorbe los
                    granos/reflejos reales del material. */}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    WebkitMaskImage: `url("${eng.dataUrl}")`, maskImage: `url("${eng.dataUrl}")`,
                    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center', maskPosition: 'center',
                    WebkitMaskSize: '92% 92%', maskSize: '92% 92%',
                    backgroundImage: `url("${productImg}")`,
                    backgroundSize: '320% 320%',
                    backgroundPosition: 'center',
                    mixBlendMode: 'soft-light',
                    opacity: 0.6,
                    filter: tint === 'light' ? 'brightness(1.15) contrast(1.1)' : 'brightness(0.9) contrast(1.15)',
                  }}
                />
              </>
            ) : (
              /* PLACEHOLDER instantáneo / fallback CORS: el logo crudo fundido
                 con grayscale+multiply (el fondo claro desaparece solo) y un
                 pulso sutil mientras el engraver termina. NUNCA caja blanca. */
              <img
                src={eng?.dataUrl || logoUrl}
                alt="Logo"
                className={showPlaceholder ? 'animate-pulse' : undefined}
                style={{
                  width: '92%',
                  height: '92%',
                  objectFit: 'contain',
                  filter: `grayscale(1) contrast(1.2) ${biselFx(tint)}`,
                  opacity: 0.85,
                  mixBlendMode: 'multiply',
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
              {processing
                ? <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" />
                : <Sparkles style={{ width: 10, height: 10 }} />}
              {processing ? 'Grabando tu logo…' : `Grabado láser · ${zone.areaLabel}`}
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