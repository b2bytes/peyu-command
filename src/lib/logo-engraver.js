// ============================================================================
// logo-engraver.js — Motor de procesado de logo para grabado láser (frontend)
// ----------------------------------------------------------------------------
// PROBLEMA QUE RESUELVE: el compositor anterior pegaba el PNG del logo COMPLETO
// (incluido su fondo blanco/color) y lo volvía negro con `brightness(0)`,
// produciendo una CAJA NEGRA OPACA sobre el producto.
//
// ESTE MOTOR, dado un File/URL de logo:
//   1. Lo dibuja en un <canvas> oculto.
//   2. Detecta el color de fondo (esquinas) y lo vuelve TRANSPARENTE (flood-key).
//   3. Convierte cada píxel visible a UN solo tono (monocromo de 1 tinta),
//      con la opacidad real preservada (antialias suave → grabado fundido).
//   4. Devuelve un PNG transparente data-URL listo para componer con blend.
//
// Si algo falla, devuelve el logo original (sin caja negra) como fallback.
// ============================================================================

/** Carga una imagen (File o URL) como HTMLImageElement. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Distancia euclidiana entre dos colores RGB. */
function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Procesa un logo a PNG transparente monocromo.
 * @param {File|string} input - File subido o URL del logo.
 * @param {'dark'|'light'} tint - tono de la tinta del grabado.
 * @returns {Promise<{ dataUrl: string, processed: boolean }>}
 */
export async function engraveLogo(input, tint = 'dark') {
  const srcUrl = typeof input === 'string' ? input : URL.createObjectURL(input);
  try {
    const img = await loadImage(srcUrl);

    // Limitar resolución de trabajo (rendimiento) manteniendo proporción.
    const MAX = 512;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // ── 1. Detectar color de fondo: promedio de las 4 esquinas ──────────
    const corners = [
      0, // top-left
      (w - 1) * 4, // top-right
      (h - 1) * w * 4, // bottom-left
      ((h - 1) * w + (w - 1)) * 4, // bottom-right
    ];
    let br = 0, bg = 0, bb = 0, opaqueCorners = 0;
    for (const c of corners) {
      if (data[c + 3] > 20) { // solo esquinas opacas cuentan como fondo
        br += data[c]; bg += data[c + 1]; bb += data[c + 2];
        opaqueCorners++;
      }
    }
    const hasSolidBg = opaqueCorners >= 2;
    if (hasSolidBg) { br /= opaqueCorners; bg /= opaqueCorners; bb /= opaqueCorners; }

    // Tono de tinta del grabado (1 sola tinta).
    const ink = tint === 'light' ? 245 : 28;
    // Umbral de similitud al fondo para volverlo transparente.
    const KEY_THRESHOLD = 60;

    // ── 2. Recorrer píxeles: quitar fondo + monocromo ──────────────────
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

      // Píxel ya transparente → se queda transparente.
      if (a < 10) { data[i + 3] = 0; continue; }

      // Si hay fondo sólido y este píxel se parece al fondo → transparente.
      if (hasSolidBg && colorDist(r, g, b, br, bg, bb) < KEY_THRESHOLD) {
        data[i + 3] = 0;
        continue;
      }

      // Luminancia del píxel → define cuánta "tinta" deja (trazo del logo).
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // Para fondo claro: trazos oscuros = más tinta. Normalizamos a alfa.
      // Para fondo oscuro: trazos claros = más tinta.
      let strokeAlpha;
      if (hasSolidBg) {
        const bgLum = 0.299 * br + 0.587 * bg + 0.114 * bb;
        strokeAlpha = bgLum > 128
          ? (255 - lum) / 255   // fondo claro → tinta donde es oscuro
          : lum / 255;          // fondo oscuro → tinta donde es claro
      } else {
        // Logo ya transparente: usamos su propio alfa, con leve realce de contraste.
        strokeAlpha = a / 255;
      }

      // Suavizado: descartar ruido muy tenue.
      strokeAlpha = strokeAlpha < 0.08 ? 0 : Math.min(1, strokeAlpha * 1.1);

      data[i] = ink;
      data[i + 1] = ink;
      data[i + 2] = ink;
      data[i + 3] = Math.round(strokeAlpha * 255);
    }

    ctx.putImageData(imageData, 0, 0);
    // toDataURL lanza SecurityError si el canvas quedó "tainted" (logo remoto sin
    // CORS). En ese caso NO podemos limpiar el fondo → devolvemos processed:false
    // para que el preview NO aplique blend ennegrecedor (evita la caja negra).
    return { dataUrl: canvas.toDataURL('image/png'), processed: true };
  } catch (e) {
    // Fallback: nunca devolvemos caja negra — devolvemos el logo tal cual y
    // marcamos processed:false para que el preview lo muestre limpio (sin blend
    // multiply que lo volvería un bloque oscuro).
    console.warn('engraveLogo falló, usando logo original:', e?.message);
    return { dataUrl: srcUrl, processed: false };
  }
}