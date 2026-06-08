// ════════════════════════════════════════════════════════════════════════
// EngravedLayer — Motor de montaje de ALTA CALIDAD para una capa grabada.
// ----------------------------------------------------------------------------
// Renderiza un grabado láser fotorrealista de una sola capa (logo raster, SVG
// vectorial o frase) usando una técnica multi-pasada que lo alinea con la
// TEXTURA real del material en vez de pegar un parche plano:
//
//   Pasada 1 · TINTA       → color base del grabado (gris láser claro/oscuro).
//   Pasada 2 · TEXTURA     → la PROPIA foto del producto recortada con la misma
//                            máscara del diseño y mezclada en `soft-light`. Esto
//                            "deja ver" los granos/reflejos del material dentro
//                            del grabado → integración perfecta con la superficie.
//   Pasada 3 · SURCO       → sombra interior (drop-shadow invertido) que hunde
//                            el trazo en el material (relieve real).
//   Pasada 4 · BORDE/BISEL → reflejo arriba + sombra abajo = bisel del láser.
//
// Todas las pasadas comparten la misma máscara (eng.dataUrl), por eso quedan
// pixel-perfect alineadas. Para `frase` se usa texto con los mismos efectos.
//
// Props:
//   eng       : { dataUrl, ok, svg } resultado del engraver (null para frase).
//   tipo      : 'frase' | 'peyu' | 'archivo'
//   texto     : string (solo frase)
//   sizePct   : tamaño en % del lienzo
//   tint      : 'light' | 'dark' (tinta del grabado)
//   productImg: URL de la foto del producto (para la pasada de textura)
// ════════════════════════════════════════════════════════════════════════

// Color de la tinta del grabado según el tono del producto.
const INK = {
  light: 'rgba(232,232,232,0.92)',
  dark: 'rgba(40,40,40,0.90)',
};

// Bisel del láser: reflejo arriba (highlight) + sombra abajo (surco). Sutil,
// medio píxel, para que se sienta hundido sin caricaturizar.
function biselFx(tint) {
  return tint === 'light'
    ? 'drop-shadow(0 0.8px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 -0.6px 0.5px rgba(255,255,255,0.25))'
    : 'drop-shadow(0 0.8px 0.5px rgba(255,255,255,0.5)) drop-shadow(0 -0.6px 0.5px rgba(0,0,0,0.32))';
}

// Estilo base de una máscara cuadrada centrada y contenida.
function maskStyle(dataUrl) {
  return {
    WebkitMaskImage: `url("${dataUrl}")`, maskImage: `url("${dataUrl}")`,
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center', maskPosition: 'center',
    WebkitMaskSize: 'contain', maskSize: 'contain',
  };
}

export default function EngravedLayer({ eng, tipo, texto, sizePct, tint, productImg }) {
   // ── FRASE ────────────────────────────────────────────────────────────
   if (tipo === 'frase') {
     if (!texto?.trim()) return null;
     return (
       <span
         className="pointer-events-none"
         style={{
           fontSize: `${sizePct * 0.42}px`,
           fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600,
           color: INK[tint],
           letterSpacing: '0.12em', whiteSpace: 'nowrap',
           maxWidth: '38vw', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block',
           // Bisel del láser en el texto (mismo lenguaje que los gráficos).
           textShadow: tint === 'light'
             ? '0 0.8px 0.5px rgba(0,0,0,0.55), 0 -0.6px 0.5px rgba(255,255,255,0.25)'
             : '0 0.8px 0.5px rgba(255,255,255,0.5), 0 -0.6px 0.5px rgba(0,0,0,0.3)',
           mixBlendMode: tint === 'light' ? 'soft-light' : 'multiply',
         }}
       >
         {texto.toUpperCase()}
       </span>
     );
   }

   if (!eng) return null;

   // Fallback CORS: el engraver no pudo limpiar el fondo → mostramos el diseño
   // limpio sin blend ennegrecedor (evita la caja negra), pero con bisel sutil.
   if (!eng.ok && !eng.svg) {
     return (
       <img
         src={eng.dataUrl} alt="Tu diseño" draggable={false}
         className="w-full h-auto pointer-events-none"
         style={{ filter: `contrast(1.05) ${biselFx(tint)}` }}
       />
     );
   }

   // Blend mode inteligente: logos de cliente (archivo) usan 'darken' para reemplazar
   // el logo PEYU existente en la foto. Otros diseños usan soft-light/multiply.
   const baseBlend = tipo === 'archivo' ? 'darken' : (tint === 'light' ? 'soft-light' : 'multiply');
   const useTexture = !!productImg; // pasada de textura solo si tenemos la foto

  // Caja cuadrada que aloja las pasadas superpuestas (todas con la misma máscara).
  const Box = ({ children }) => (
    <div className="relative w-full pointer-events-none" style={{ aspectRatio: '1 / 1' }}>{children}</div>
  );

  // Pasada de TEXTURA: la foto del producto recortada por la máscara del diseño.
  // Mezclada en soft-light → el grabado "absorbe" los granos/reflejos reales del
  // material y queda perfectamente integrado a la superficie (no un parche plano).
  const TextureLayer = useTexture && (
    <div
      className="absolute inset-0"
      style={{
        ...maskStyle(eng.dataUrl),
        backgroundImage: `url("${productImg}")`,
        backgroundSize: '320% 320%', // zoom: muestrea textura, no la silueta entera
        backgroundPosition: 'center',
        mixBlendMode: 'soft-light',
        opacity: 0.55,
        filter: tint === 'light' ? 'brightness(1.15) contrast(1.1)' : 'brightness(0.9) contrast(1.15)',
      }}
    />
  );

  // ── SVG vectorial ────────────────────────────────────────────────────
  if (eng.svg) {
    return (
      <Box>
        {/* Tinta base + bisel */}
        <div className="absolute inset-0" style={{
          ...maskStyle(eng.dataUrl),
          backgroundColor: INK[tint],
          filter: biselFx(tint),
          mixBlendMode: baseBlend,
          opacity: 0.92,
        }} />
        {TextureLayer}
      </Box>
    );
  }

  // ── Raster procesado ─────────────────────────────────────────────────
  // Capa 1: el PNG monocromo del engraver (ya transparente) con bisel + blend.
  // Capa 2: textura del material recortada con la misma silueta del logo.
  // IMPORTANTE: logos de cliente (tipo='archivo') reciben tratamiento especial para
  // reemplazar visualmente el logo PEYU existente en la foto.
  const clientLogoOpacity = tipo === 'archivo' ? 0.95 : 0.92;
  const clientLogoBrightness = tipo === 'archivo' 
    ? (tint === 'light' ? 1.4 : 0.85)
    : (tint === 'light' ? 1.3 : 1);

  return (
    <Box>
      <img
        src={eng.dataUrl} alt="Tu diseño" draggable={false}
        className="absolute inset-0 w-full h-full object-contain"
        style={{
          mixBlendMode: baseBlend,
          opacity: clientLogoOpacity,
          filter: tipo === 'archivo'
            ? `brightness(${clientLogoBrightness}) contrast(1.15) saturate(1.05) ${biselFx(tint)}`
            : (tint === 'light'
              ? `brightness(1.3) contrast(1.08) ${biselFx(tint)}`
              : `contrast(1.12) ${biselFx(tint)}`),
        }}
      />
      {TextureLayer}
    </Box>
  );
  }