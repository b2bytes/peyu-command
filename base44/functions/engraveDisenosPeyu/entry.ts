import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import UPNG from 'npm:upng-js@2.1.0';
import jpeg from 'npm:jpeg-js@0.4.4';

// ════════════════════════════════════════════════════════════════════════
// engraveDisenosPeyu — Pre-procesa TODOS los diseños PEYU (galería DisenoPeyu)
// a grabado láser limpio: line-art monocromo con fondo transparente, listo para
// superponer sobre cualquier carcasa sin caja ni mancha (igual de bien que los
// SVG flamenco/huemul). Guarda el resultado en imagen_grabado_url.
//
// Pure-JS (UPNG) para correr en Deno Deploy sin binarios nativos. Solo procesa
// PNG (los SVG ya son line-art transparente → se copian directo).
//
// Algoritmo (mismo criterio que lib/logo-engraver del frontend):
//   1. Decodifica el PNG a RGBA.
//   2. Detecta fondo (esquinas) o asume fondo claro si es mayormente opaca.
//   3. Quita el fondo (flood-key por similitud de color) → transparente.
//   4. Convierte cada trazo a gris oscuro (#2E2E2E) con opacidad por luminancia
//      → grabado fundido, sin halos.
//   5. Re-codifica PNG transparente, lo sube y guarda en imagen_grabado_url.
//
// Body opcional: { soloFaltantes?: boolean, id?: string }
// Admin-only.
// ════════════════════════════════════════════════════════════════════════

const INK = 46;            // gris oscuro #2E2E2E
const KEY_THRESHOLD = 60;  // similitud al fondo para volverlo transparente

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// Decodifica PNG o JPG (ArrayBuffer) → { data: Uint8Array RGBA, w, h }.
// Detecta el formato por MAGIC BYTES (no por extensión): muchos archivos .jpg
// son en realidad PNG y viceversa. Intenta el formato detectado y cae al otro.
function decodeJpg(arrayBuffer) {
  const raw = jpeg.decode(new Uint8Array(arrayBuffer), { useTArray: true, formatAsRGBA: true });
  return { data: new Uint8Array(raw.data.buffer || raw.data), w: raw.width, h: raw.height };
}
function decodePng(arrayBuffer) {
  const decoded = UPNG.decode(arrayBuffer);
  const rgbaBuf = UPNG.toRGBA8(decoded)[0];
  return { data: new Uint8Array(rgbaBuf), w: decoded.width, h: decoded.height };
}
function decodeImage(arrayBuffer) {
  const b = new Uint8Array(arrayBuffer);
  const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const isJpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (isPng) return decodePng(arrayBuffer);
  if (isJpg) return decodeJpg(arrayBuffer);
  // Magic byte desconocido → intenta ambos.
  try { return decodePng(arrayBuffer); } catch { return decodeJpg(arrayBuffer); }
}

// Procesa RGBA → PNG buffer monocromo transparente (Uint8Array).
function engraveRGBA(data, w, h) {
  // 1. Detectar color de fondo: promedio de las 4 esquinas opacas.
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
  let br = 0, bg = 0, bb = 0, opaqueCorners = 0;
  for (const c of corners) {
    if (data[c + 3] > 20) { br += data[c]; bg += data[c + 1]; bb += data[c + 2]; opaqueCorners++; }
  }
  let hasSolidBg = opaqueCorners >= 2;
  if (hasSolidBg) { br /= opaqueCorners; bg /= opaqueCorners; bb /= opaqueCorners; }

  // 1b. ¿Mayormente opaca sin fondo detectado? → asume fondo claro (line-art negro).
  let opaquePx = 0, totalPx = 0;
  for (let i = 3; i < data.length; i += 4) { totalPx++; if (data[i] > 200) opaquePx++; }
  const mostlyOpaque = totalPx > 0 && opaquePx / totalPx > 0.85;
  if (mostlyOpaque && !hasSolidBg) { hasSolidBg = true; br = 255; bg = 255; bb = 255; }

  const bgLum = 0.299 * br + 0.587 * bg + 0.114 * bb;

  // 2. Recorrer píxeles: quitar fondo + monocromo.
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 10) { data[i + 3] = 0; continue; }
    if (hasSolidBg && colorDist(r, g, b, br, bg, bb) < KEY_THRESHOLD) { data[i + 3] = 0; continue; }

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    let strokeAlpha = hasSolidBg ? (bgLum > 128 ? (255 - lum) / 255 : lum / 255) : a / 255;
    // Limpia halo del antialias y realza el trazo (grabado nítido).
    strokeAlpha = strokeAlpha < 0.18 ? 0 : Math.min(1, (strokeAlpha - 0.18) / 0.82 * 1.5);

    data[i] = INK; data[i + 1] = INK; data[i + 2] = INK;
    data[i + 3] = Math.round(strokeAlpha * 255);
  }

  // Re-codificar PNG sin pérdida (0 = lossless).
  const out = UPNG.encode([data.buffer], w, h, 0);
  return new Uint8Array(out);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const soloFaltantes = body.soloFaltantes !== false; // default true
    const onlyId = body.id || null;

    let disenos = await base44.asServiceRole.entities.DisenoPeyu.list('orden', 200);
    if (onlyId) disenos = disenos.filter((d) => d.id === onlyId);

    const resultados = [];
    for (const d of disenos) {
      const src = d.imagen_url;
      if (!src) { resultados.push({ id: d.id, nombre: d.nombre, status: 'sin_imagen' }); continue; }

      const esSvg = src.toLowerCase().includes('.svg');
      // Los SVG ya son line-art transparente perfecto → se usan directo.
      if (esSvg) {
        if (!d.imagen_grabado_url) {
          await base44.asServiceRole.entities.DisenoPeyu.update(d.id, { imagen_grabado_url: src });
        }
        resultados.push({ id: d.id, nombre: d.nombre, status: 'svg_directo' });
        continue;
      }

      if (soloFaltantes && d.imagen_grabado_url) {
        resultados.push({ id: d.id, nombre: d.nombre, status: 'ya_procesado' });
        continue;
      }

      try {
        const resp = await fetch(src);
        if (!resp.ok) throw new Error(`fetch ${resp.status}`);
        const ab = await resp.arrayBuffer();
        const { data, w, h } = decodeImage(ab);
        const pngBytes = engraveRGBA(data, w, h);
        const file = new File([pngBytes], `grabado_${(d.nombre || 'diseno').replace(/\W+/g, '_')}.png`, { type: 'image/png' });
        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        await base44.asServiceRole.entities.DisenoPeyu.update(d.id, { imagen_grabado_url: file_url });
        resultados.push({ id: d.id, nombre: d.nombre, status: 'ok', grabado_url: file_url });
      } catch (e) {
        resultados.push({ id: d.id, nombre: d.nombre, status: 'error', error: e?.message });
      }
    }

    const ok = resultados.filter((r) => r.status === 'ok').length;
    const svg = resultados.filter((r) => r.status === 'svg_directo').length;
    const ya = resultados.filter((r) => r.status === 'ya_procesado').length;
    const err = resultados.filter((r) => r.status === 'error').length;

    return Response.json({
      total: disenos.length,
      procesados_ok: ok,
      svg_directo: svg,
      ya_procesados: ya,
      errores: err,
      resultados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});