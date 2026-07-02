// ════════════════════════════════════════════════════════════════════════
// logo-variants — Genera variantes EXACTAS del logo oficial de Peyu vía
// canvas (sin IA, fidelidad 100%): tiñe el trazo al color pedido con fondo
// TRANSPARENTE. El isotipo (solo la tortuga) se detecta AUTOMÁTICAMENTE
// escaneando las columnas de píxeles — nunca se corta la cabeza.
// También compone: logo vertical (tortuga + nombre abajo), favicon y
// imagen para redes sociales (OG 1200×630).
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

// Tiñe el logo completo al color pedido con fondo transparente.
// Devuelve el canvas (para composiciones) — cacheado por color.
const canvasCache = {};
async function tintedCanvas(hex) {
  if (canvasCache[hex]) return canvasCache[hex];
  const img = await loadImage(LOGO_OFICIAL);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  for (let i = 0; i < px.length; i += 4) {
    // Oscuro = trazo (opaco), claro = fondo (transparente). Se multiplica por
    // el alpha original para soportar PNGs que ya traen fondo transparente.
    const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const a0 = px[i + 3] / 255;
    px[i] = r; px[i + 1] = g; px[i + 2] = b;
    px[i + 3] = Math.round((255 - lum) * a0);
  }
  ctx.putImageData(data, 0, 0);
  canvasCache[hex] = canvas;
  return canvas;
}

// ── Detección automática de regiones ────────────────────────────────────
// Escanea columnas con contenido (alpha > 24) y encuentra el HUECO entre la
// tortuga y el wordmark "PEYU". Devuelve {tortuga:{x0,x1}, texto:{x0,x1},
// y0, y1} en píxeles. Cacheado (la geometría no depende del color).
let regionsCache = null;
async function detectRegions() {
  if (regionsCache) return regionsCache;
  const canvas = await tintedCanvas('#000000');
  const ctx = canvas.getContext('2d');
  const { width: W, height: H } = canvas;
  const px = ctx.getImageData(0, 0, W, H).data;

  const colHas = new Array(W).fill(false);
  let y0 = H, y1 = 0;
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      if (px[(y * W + x) * 4 + 3] > 24) {
        colHas[x] = true;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }

  // Primer bloque de contenido = tortuga; hueco ≥1.5% del ancho = separación.
  const minGap = Math.max(4, Math.round(W * 0.015));
  let tStart = colHas.indexOf(true);
  if (tStart < 0) tStart = 0;
  let tEnd = tStart, gapLen = 0, i = tStart;
  for (; i < W; i++) {
    if (colHas[i]) { tEnd = i; gapLen = 0; }
    else if (++gapLen >= minGap) break;
  }
  // Wordmark: primer contenido tras el hueco hasta el final del contenido.
  let wStart = -1, wEnd = -1;
  for (let x = tEnd + 1; x < W; x++) {
    if (colHas[x]) { if (wStart < 0) wStart = x; wEnd = x; }
  }
  regionsCache = {
    tortuga: { x0: tStart, x1: tEnd },
    texto: wStart >= 0 ? { x0: wStart, x1: wEnd } : null,
    y0, y1,
  };
  return regionsCache;
}

// Recorta una región del canvas teñido, con padding proporcional.
function cropRegion(canvas, x0, x1, y0, y1, padPct = 0.06) {
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const pad = Math.round(Math.max(w, h) * padPct);
  const out = document.createElement('canvas');
  out.width = w + pad * 2;
  out.height = h + pad * 2;
  out.getContext('2d').drawImage(canvas, x0, y0, w, h, pad, pad, w, h);
  return out;
}

/**
 * Variante del logo con fondo transparente.
 * @param {string} hex  Color del trazo (ej. '#F8F3ED')
 * @param {string} modo 'full' (logo completo) | 'isotipo' (solo la tortuga,
 *                      recorte automático) | 'vertical' (tortuga + nombre abajo)
 * @returns dataURL PNG transparente
 */
export async function buildLogoVariant(hex, modo = 'full') {
  const key = `${hex}-${modo}`;
  if (cache[key]) return cache[key];

  const canvas = await tintedCanvas(hex);
  const reg = await detectRegions();
  let out;

  if (modo === 'isotipo') {
    out = cropRegion(canvas, reg.tortuga.x0, reg.tortuga.x1, reg.y0, reg.y1);
  } else if (modo === 'vertical' && reg.texto) {
    // Tortuga arriba + wordmark "PEYU" abajo, centrados.
    const tort = cropRegion(canvas, reg.tortuga.x0, reg.tortuga.x1, reg.y0, reg.y1, 0);
    const word = cropRegion(canvas, reg.texto.x0, reg.texto.x1, reg.y0, reg.y1, 0);
    // Recorta el aire vertical del wordmark (sus glifos no llenan y0..y1)
    const wordTrim = trimVertical(word);
    // El wordmark se escala al 92% del ancho de la tortuga.
    const targetW = Math.round(tort.width * 0.92);
    const scale = targetW / wordTrim.width;
    const wordH = Math.round(wordTrim.height * scale);
    const gap = Math.round(tort.height * 0.10);
    const pad = Math.round(tort.width * 0.08);
    out = document.createElement('canvas');
    out.width = tort.width + pad * 2;
    out.height = tort.height + gap + wordH + pad * 2;
    const ctx = out.getContext('2d');
    ctx.drawImage(tort, pad, pad);
    ctx.drawImage(wordTrim, pad + Math.round((tort.width - targetW) / 2), pad + tort.height + gap, targetW, wordH);
  } else {
    out = cropRegion(canvas, 0, canvas.width - 1, reg.y0, reg.y1);
  }

  const url = out.toDataURL('image/png');
  cache[key] = url;
  return url;
}

// Recorta filas vacías arriba/abajo de un canvas transparente.
function trimVertical(canvas) {
  const ctx = canvas.getContext('2d');
  const { width: W, height: H } = canvas;
  const px = ctx.getImageData(0, 0, W, H).data;
  let y0 = 0, y1 = H - 1;
  outer0: for (; y0 < H; y0++) for (let x = 0; x < W; x++) if (px[(y0 * W + x) * 4 + 3] > 24) break outer0;
  outer1: for (; y1 > y0; y1--) for (let x = 0; x < W; x++) if (px[(y1 * W + x) * 4 + 3] > 24) break outer1;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(canvas, 0, y0, W, out.height, 0, 0, W, out.height);
  return out;
}

/**
 * Favicon 512×512: cuadrado redondeado verde PEYU con la tortuga crema.
 */
export async function buildFavicon() {
  if (cache.favicon) return cache.favicon;
  const isoUrl = await buildLogoVariant('#F8F3ED', 'isotipo');
  const iso = await loadImage(isoUrl);
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  const rad = S * 0.22;
  ctx.beginPath();
  ctx.roundRect(0, 0, S, S, rad);
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, '#0F8B6C');
  grad.addColorStop(1, '#0B4634');
  ctx.fillStyle = grad;
  ctx.fill();
  // Tortuga centrada al 68% del ancho
  const w = S * 0.68;
  const h = w * (iso.height / iso.width);
  ctx.drawImage(iso, (S - w) / 2, (S - h) / 2, w, h);
  cache.favicon = canvas.toDataURL('image/png');
  return cache.favicon;
}

/**
 * Imagen para redes sociales (OG) 1200×630: fondo verde profundo con el
 * logo vertical crema centrado + tagline.
 */
export async function buildSocialImage() {
  if (cache.social) return cache.social;
  const vertUrl = await buildLogoVariant('#F8F3ED', 'vertical');
  const vert = await loadImage(vertUrl);
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0B4634');
  grad.addColorStop(1, '#062B20');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Aro decorativo (caparazón) sutil
  ctx.strokeStyle = 'rgba(248,243,237,.07)';
  ctx.lineWidth = 42;
  ctx.beginPath();
  ctx.arc(W * 0.92, H * 0.1, 240, 0, Math.PI * 2);
  ctx.stroke();
  // Logo vertical centrado
  const lh = H * 0.58;
  const lw = lh * (vert.width / vert.height);
  ctx.drawImage(vert, (W - lw) / 2, H * 0.12, lw, lh);
  // Tagline
  ctx.fillStyle = '#A7D9C9';
  ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Hasta que el plástico deje de ser basura', W / 2, H * 0.86);
  cache.social = canvas.toDataURL('image/png');
  return cache.social;
}

export function downloadDataURL(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}