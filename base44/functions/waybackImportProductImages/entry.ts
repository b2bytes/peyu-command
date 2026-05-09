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

// Fetch con timeout y reintentos. Wayback CDX es notoriamente lento/inestable.
async function fetchWithRetry(url, { tries = 3, timeoutMs = 25000 } = {}) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'PEYU-Recovery/1.0' },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (r.ok) return r;
      lastErr = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
    // backoff: 1s, 3s, 6s
    if (i < tries - 1) await new Promise(res => setTimeout(res, 1000 * (i + 1) * (i + 1)));
  }
  throw lastErr || new Error('fetch failed');
}

// Cache del índice CDX por isolate (sobrevive entre lotes mientras dure)
let cdxCache = null;
async function loadWaybackIndex() {
  if (cdxCache) return cdxCache;
  const url = 'https://web.archive.org/cdx/search/cdx?url=peyuchile.cl/producto/*&output=json&fl=original,timestamp&filter=statuscode:200&collapse=urlkey&limit=1000';
  try {
    const r = await fetchWithRetry(url, { tries: 4, timeoutMs: 50000 });
    const arr = await r.json();
    const rows = arr.slice(1).map(([original, timestamp]) => {
      const m = original.match(/\/producto\/([^\/]+)\/?$/i);
      return m ? { url: original, slug: m[1], timestamp } : null;
    }).filter(Boolean);
    const bySlug = new Map();
    for (const r of rows) {
      const prev = bySlug.get(r.slug);
      if (!prev || r.timestamp > prev.timestamp) bySlug.set(r.slug, r);
    }
    cdxCache = [...bySlug.values()];
  } catch (e) {
    console.warn('CDX index falló, modo fallback per-slug:', e.message);
    cdxCache = []; // fallback: buscamos slug por slug
  }
  return cdxCache;
}

// Fallback: buscar el slug específico de UN producto cuando el índice global falló
async function lookupSlugDirect(slug) {
  const url = `https://web.archive.org/cdx/search/cdx?url=peyuchile.cl/producto/${encodeURIComponent(slug)}/&output=json&fl=original,timestamp&filter=statuscode:200&limit=5`;
  try {
    const r = await fetchWithRetry(url, { tries: 2, timeoutMs: 15000 });
    const arr = await r.json();
    if (arr.length < 2) return null;
    // tomar el snapshot más reciente
    const rows = arr.slice(1).map(([original, timestamp]) => ({ url: original, slug, timestamp }));
    rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return rows[0];
  } catch {
    return null;
  }
}

// Extrae tokens-modelo (números y letras-modelo X/XR/XS/SE/FE/Plus/Ultra/Max/Pro/Mini/Air).
// Si dos productos comparten palabras pero los modelos NO coinciden, NO es match.
const MODEL_LETTERS = new Set(['x','xr','xs','se','fe','plus','ultra','max','pro','mini','air','edge','lite','note']);
const extractModelTokens = (s) => {
  const tokens = slugify(s).split('-');
  return tokens.filter(t =>
    /^\d+$/.test(t) ||           // 11, 14, 17, 22
    /^[a-z]\d+$/.test(t) ||      // p40, s22, s24
    /^\d+[a-z]+$/.test(t) ||     // 11s, 11pro
    MODEL_LETTERS.has(t)         // x, xr, xs, plus, ultra, max, pro, fe, etc.
  );
};

function findBestMatch(nombre, index) {
  const nombreSlug = slugify(nombre);
  const nombreModels = extractModelTokens(nombre);
  let best = null;
  let bestScore = 0;
  for (const entry of index) {
    const score = similarity(nombreSlug, entry.slug);
    if (score <= bestScore) continue;
    // Guard de modelos: si el producto tiene tokens-modelo (iPhone XR, S24 FE),
    // el slug archivado debe contener TODOS los tokens-modelo (orden flexible).
    if (nombreModels.length > 0) {
      const slugModels = extractModelTokens(entry.slug);
      const allPresent = nombreModels.every(m => slugModels.includes(m));
      if (!allPresent) continue;
    }
    bestScore = score;
    best = entry;
  }
  return bestScore >= 0.5 ? { ...best, score: bestScore } : null;
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
    const useDirectFallback = body.useDirectFallback === true;

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
        let match = index.length > 0 ? findBestMatch(producto.nombre, index) : null;
        // Fallback opt-in (lento): buscar el slug derivado del nombre directo en CDX.
        if (!match && useDirectFallback) {
          const slugCandidato = slugify(producto.nombre);
          if (slugCandidato.length >= 4) {
            const direct = await lookupSlugDirect(slugCandidato);
            if (direct) match = { ...direct, score: 1 };
          }
        }
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