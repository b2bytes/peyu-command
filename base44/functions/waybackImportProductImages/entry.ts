// PEYU · waybackImportProductImages
// Recupera imágenes de productos desde Wayback Machine (archive.org).
//
// Estrategia:
//   1) Carga UN índice (CDX) de todos los slugs peyuchile.cl/producto/* archivados.
//   2) Matchea cada producto Base44 (por nombre) al slug real más similar.
//   3) Descarga el HTML archivado, extrae imágenes /wp-content/uploads/.
//   4) Sube cada imagen al CDN y actualiza el producto.
//
// Body:
//   { cursor: 0, batchSize: 3, replacePrincipal: false, onlyMissing: true }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Helpers ───────────────────────────────────────────────────────
const slugify = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const tokenize = (s) => slugify(s).split('-').filter(t => t.length >= 3);

// Score Jaccard simple entre tokens de dos strings
const similarity = (a, b) => {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
};

const filenameFromUrl = (url) => {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').pop() || 'image.jpg';
    return decodeURIComponent(last);
  } catch {
    return 'image.jpg';
  }
};

const cleanWaybackImg = (src) => {
  if (!src) return '';
  const m = src.match(/https?:\/\/web\.archive\.org\/web\/\d+(?:im_|if_)?\/(https?:\/\/.+)/);
  return m ? m[1] : src;
};

const waybackImg = (timestamp, originalUrl) =>
  `https://web.archive.org/web/${timestamp}im_/${originalUrl}`;

function extractWpImages(html) {
  const found = new Set();
  const re = /https?:\/\/(?:web\.archive\.org\/web\/\d+(?:im_)?\/)?https?:\/\/[^"'\s)]*peyuchile\.cl\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|jpeg|png|webp|gif)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let url = cleanWaybackImg(m[0]);
    // descartar miniaturas WordPress (-150x150 etc) → versión full
    if (/-\d+x\d+\.(jpg|jpeg|png|webp|gif)$/i.test(url)) {
      url = url.replace(/-\d+x\d+(\.(jpg|jpeg|png|webp|gif))$/i, '$1');
    }
    found.add(url);
  }
  return [...found];
}

// Cache del índice CDX por isolate (sobrevive entre lotes mientras dure)
let cdxCache = null;
async function loadWaybackIndex() {
  if (cdxCache) return cdxCache;
  const url = 'https://web.archive.org/cdx/search/cdx?url=peyuchile.cl/producto/*&output=json&fl=original,timestamp&filter=statuscode:200&collapse=urlkey&limit=2000';
  const r = await fetch(url, { headers: { 'User-Agent': 'PEYU-Recovery/1.0' } });
  if (!r.ok) throw new Error(`CDX API ${r.status}`);
  const arr = await r.json();
  // primer fila es header, descartar
  const rows = arr.slice(1).map(([original, timestamp]) => {
    const m = original.match(/\/producto\/([^\/]+)\/?$/i);
    return m ? { url: original, slug: m[1], timestamp } : null;
  }).filter(Boolean);
  // dedupe por slug, quedarse con el snapshot más reciente
  const bySlug = new Map();
  for (const r of rows) {
    const prev = bySlug.get(r.slug);
    if (!prev || r.timestamp > prev.timestamp) bySlug.set(r.slug, r);
  }
  cdxCache = [...bySlug.values()];
  return cdxCache;
}

function findBestMatch(nombre, index) {
  const nombreSlug = slugify(nombre);
  let best = null;
  let bestScore = 0;
  for (const entry of index) {
    const score = similarity(nombreSlug, entry.slug);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore >= 0.4 ? { ...best, score: bestScore } : null;
}

// ─── Handler ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const cursor = Number(body.cursor) || 0;
    const batchSize = Number(body.batchSize) || 3;
    const replacePrincipal = body.replacePrincipal === true;
    const onlyMissing = body.onlyMissing !== false;
    const previewOnly = body.previewOnly === true;

    const index = await loadWaybackIndex();

    const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 500);
    let candidatos = productos.filter(p => p.sku && p.activo !== false && p.nombre);

    if (onlyMissing) {
      candidatos = candidatos.filter(p => {
        const total = (p.imagen_url ? 1 : 0) + (Array.isArray(p.galeria_urls) ? p.galeria_urls.filter(u => u !== p.imagen_url).length : 0);
        return total < 2;
      });
    }

    const total = candidatos.length;
    const lote = candidatos.slice(cursor, cursor + batchSize);

    if (lote.length === 0) {
      return Response.json({ ok: true, done: true, total, processed: cursor, index_size: index.length });
    }

    const resultados = [];

    for (const producto of lote) {
      try {
        const match = findBestMatch(producto.nombre, index);
        if (!match) {
          resultados.push({ sku: producto.sku, nombre: producto.nombre, ok: false, error: 'Sin match en Wayback' });
          continue;
        }

        if (previewOnly) {
          resultados.push({
            sku: producto.sku,
            nombre: producto.nombre,
            ok: true,
            preview: true,
            slug_match: match.slug,
            score: Math.round(match.score * 100) / 100,
            timestamp: match.timestamp,
          });
          continue;
        }

        // Descargar HTML archivado
        const playbackUrl = `https://web.archive.org/web/${match.timestamp}/${match.url}`;
        const htmlR = await fetch(playbackUrl, { headers: { 'User-Agent': 'PEYU-Recovery/1.0' } });
        if (!htmlR.ok) {
          resultados.push({ sku: producto.sku, ok: false, error: `Wayback ${htmlR.status}`, slug_match: match.slug });
          continue;
        }
        const html = await htmlR.text();
        const imgsOriginales = extractWpImages(html);

        if (imgsOriginales.length === 0) {
          resultados.push({ sku: producto.sku, ok: false, error: 'HTML sin imágenes', slug_match: match.slug });
          continue;
        }

        // Descargar y subir cada imagen
        const nuevasUrls = [];
        for (const orig of imgsOriginales.slice(0, 8)) {
          try {
            const playback = waybackImg(match.timestamp, orig);
            const r = await fetch(playback, { headers: { 'User-Agent': 'PEYU-Recovery/1.0' } });
            if (!r.ok) continue;
            const blob = await r.blob();
            if (blob.size < 5000) continue; // descarta thumbs
            const fname = filenameFromUrl(orig);
            const file = new File([blob], `${producto.sku}-wb-${fname}`, {
              type: blob.type || 'image/jpeg',
            });
            const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });
            if (upload?.file_url) nuevasUrls.push(upload.file_url);
          } catch (err) {
            console.error(`fail img ${producto.sku}:`, err.message);
          }
        }

        if (nuevasUrls.length === 0) {
          resultados.push({ sku: producto.sku, ok: false, error: 'No se pudo subir imágenes', encontradas: imgsOriginales.length, slug_match: match.slug });
          continue;
        }

        const galeriaActual = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];
        const patch = {};
        if (replacePrincipal || !producto.imagen_url) {
          patch.imagen_url = nuevasUrls[0];
          patch.galeria_urls = [...new Set([...nuevasUrls, ...galeriaActual])];
        } else {
          patch.galeria_urls = [...new Set([...galeriaActual, ...nuevasUrls])];
        }

        await base44.asServiceRole.entities.Producto.update(producto.id, patch);

        resultados.push({
          sku: producto.sku,
          nombre: producto.nombre,
          ok: true,
          slug_match: match.slug,
          score: Math.round(match.score * 100) / 100,
          encontradas: imgsOriginales.length,
          subidas: nuevasUrls.length,
          principal_actualizada: !!patch.imagen_url,
        });
      } catch (err) {
        resultados.push({ sku: producto.sku, ok: false, error: err.message });
      }
    }

    const nextCursor = cursor + lote.length;
    return Response.json({
      ok: true,
      done: nextCursor >= total,
      total,
      processed: nextCursor,
      remaining: Math.max(0, total - nextCursor),
      lote_size: lote.length,
      index_size: index.length,
      resultados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});