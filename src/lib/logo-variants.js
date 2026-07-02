// ════════════════════════════════════════════════════════════════════════
// logo-variants — Genera variantes EXACTAS del logo oficial de Peyu vía
// canvas (sin IA, fidelidad 100%): convierte el negro del original en el
// color pedido y el fondo blanco en TRANSPARENTE. Soporta recorte del
// isotipo (solo la tortuga) para avatar del widget de chat.
// ════════════════════════════════════════════════════════════════════════
import { LOGO_OFICIAL } from '@/lib/peyu-brand-manual';

const cache = {};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Genera una variante del logo con fondo transparente.
 * @param {string} hex   Color destino del trazo (ej. '#F8F3ED')
 * @param {object} crop  Opcional {x, w} en fracción del ancho (isotipo: {x:0, w:0.44})
 * @returns dataURL PNG transparente
 */
export async function buildLogoVariant(hex, crop = null) {
  const key = `${hex}-${crop ? `${crop.x}-${crop.w}` : 'full'}`;
  if (cache[key]) return cache[key];

  const img = await loadImage(LOGO_OFICIAL);
  const sx = crop ? Math.round(img.width * crop.x) : 0;
  const sw = crop ? Math.round(img.width * crop.w) : img.width;

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, 0, sw, img.height, 0, 0, sw, img.height);

  const data = ctx.getImageData(0, 0, sw, img.height);
  const px = data.data;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  for (let i = 0; i < px.length; i += 4) {
    // Luminancia: oscuro = trazo (opaco), claro = fondo (transparente).
    // Se multiplica por el alpha original para soportar PNGs que ya traen
    // fondo transparente (si no, el fondo se volvía un bloque sólido).
    const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const a0 = px[i + 3] / 255;
    px[i] = r; px[i + 1] = g; px[i + 2] = b;
    px[i + 3] = Math.round((255 - lum) * a0);
  }
  ctx.putImageData(data, 0, 0);
  const url = canvas.toDataURL('image/png');
  cache[key] = url;
  return url;
}

// Recorte del isotipo: la tortuga ocupa aprox. el 44% izquierdo del logo.
export const ISOTIPO_CROP = { x: 0, w: 0.44 };

export function downloadDataURL(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}