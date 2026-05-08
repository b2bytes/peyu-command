// PEYU · wooImportProductImages
// Importa TODAS las imágenes oficiales de cada producto desde peyuchile.cl
// (WooCommerce REST API), las descarga y las sube al CDN de Base44.
// Match determinístico por SKU. Por lote (cursor + batchSize) para no agotar timeout.
//
// Body:
//   { cursor: 0, batchSize: 5, replacePrincipal: true, onlyMissing: false }
//
// Response:
//   { ok, done, total, processed, remaining, resultados: [{ sku, ok, principal_actualizada, galeria_agregadas, total_woo }] }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Limpia query params típicos de WP/Jetpack que rompen el cache.
const cleanWooUrl = (url) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    // Quitar params de Jetpack y CDN proxies
    ['fit', 'ssl', 'resize', 'w', 'h', 'quality', 'strip'].forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
};

// Extrae nombre de archivo desde URL → "producto.jpg"
const filenameFromUrl = (url) => {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').pop() || 'image.jpg';
    return decodeURIComponent(last);
  } catch {
    return 'image.jpg';
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const cursor = Number(body.cursor) || 0;
    const batchSize = Number(body.batchSize) || 5;
    const replacePrincipal = body.replacePrincipal !== false;
    const onlyMissing = body.onlyMissing === true; // solo procesar productos sin imagen Base44

    const baseUrl = (Deno.env.get('WOOCOMMERCE_URL') || '').replace(/\/$/, '');
    const ck = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const cs = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
    if (!baseUrl || !ck || !cs) {
      return Response.json({ error: 'WooCommerce credentials missing' }, { status: 500 });
    }
    const basicAuth = btoa(`${ck}:${cs}`);

    // ── 1) Obtener TODOS los productos Woo en la primera llamada y cachear
    //      en memoria por petición. Como la función se llama por lotes,
    //      cada lote re-consulta Woo (es O(N) pero rápido y simple).
    const allWoo = [];
    for (let page = 1; page <= 5; page++) {
      const r = await fetch(`${baseUrl}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
          'User-Agent': 'PEYU-ImageImport/1.0',
        },
      });
      const txt = await r.text();
      if (!r.ok) {
        return Response.json({ error: `Woo API ${r.status}`, details: txt.slice(0, 300) }, { status: 502 });
      }
      let arr;
      try {
        arr = JSON.parse(txt);
      } catch {
        return Response.json({
          error: 'Woo respondió HTML/no-JSON',
          page,
          content_type: r.headers.get('content-type'),
          preview: txt.slice(0, 400),
        }, { status: 502 });
      }
      if (!Array.isArray(arr) || arr.length === 0) break;
      allWoo.push(...arr);
      if (arr.length < 100) break;
    }

    // Mapa SKU → producto Woo
    const wooBySku = new Map();
    for (const wp of allWoo) {
      if (wp.sku) wooBySku.set(wp.sku.trim(), wp);
    }

    // ── 2) Cargar productos Base44 que tienen SKU matching
    const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 500);
    let candidatos = productos.filter(p => p.sku && wooBySku.has(p.sku.trim()));

    if (onlyMissing) {
      candidatos = candidatos.filter(p => !p.imagen_url || p.imagen_url.includes('base44.app/api/apps') === false);
    }

    const total = candidatos.length;
    const lote = candidatos.slice(cursor, cursor + batchSize);

    if (lote.length === 0) {
      return Response.json({ ok: true, done: true, total, processed: cursor });
    }

    // ── 3) Procesar lote
    const resultados = [];

    for (const producto of lote) {
      try {
        const wp = wooBySku.get(producto.sku.trim());
        const wooImages = (wp.images || [])
          .map(img => cleanWooUrl(img.src))
          .filter(Boolean);

        if (wooImages.length === 0) {
          resultados.push({ sku: producto.sku, ok: false, error: 'Producto sin imágenes en Woo' });
          continue;
        }

        // Descargar y subir cada imagen al CDN de Base44
        const nuevasUrls = [];
        for (const wooUrl of wooImages) {
          try {
            const r = await fetch(wooUrl);
            if (!r.ok) continue;
            const blob = await r.blob();
            const fname = filenameFromUrl(wooUrl);
            const file = new File([blob], `${producto.sku}-${fname}`, {
              type: blob.type || 'image/jpeg',
            });
            const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file });
            if (upload?.file_url) nuevasUrls.push(upload.file_url);
          } catch (err) {
            // imagen individual falló; seguir con las demás
            console.error(`fail ${producto.sku} ${wooUrl}:`, err.message);
          }
        }

        if (nuevasUrls.length === 0) {
          resultados.push({ sku: producto.sku, ok: false, error: 'No se pudo subir ninguna imagen al CDN' });
          continue;
        }

        // Asignar al producto: primera = principal, resto = galería
        const galeriaActual = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];
        const galeriaFinal = [...new Set([...nuevasUrls.slice(1), ...galeriaActual])];

        const patch = { galeria_urls: galeriaFinal };
        if (replacePrincipal || !producto.imagen_url) {
          patch.imagen_url = nuevasUrls[0];
        }

        await base44.asServiceRole.entities.Producto.update(producto.id, patch);

        resultados.push({
          sku: producto.sku,
          nombre: producto.nombre,
          ok: true,
          principal_actualizada: !!patch.imagen_url,
          galeria_agregadas: nuevasUrls.length - (patch.imagen_url ? 1 : 0),
          total_woo: wooImages.length,
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
      resultados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});