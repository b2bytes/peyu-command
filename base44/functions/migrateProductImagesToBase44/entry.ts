// ============================================================================
// PEYU · migrateProductImagesToBase44
// ----------------------------------------------------------------------------
// Migra imágenes de productos desde WordPress (i0.wp.com / peyuchile.cl/wp-content)
// hacia el CDN de Base44 (media.base44.com), para no depender de WordPress.
//
// Procesa en LOTES (default 5 productos por invocación) para no agotar timeout.
// Cada producto:
//   1. Descarga la imagen desde WordPress (limpia params Jetpack)
//   2. La sube a Base44 vía integrations.Core.UploadFile
//   3. Actualiza Producto.imagen_url + agrega a galeria_urls (preservando histórico)
//
// Llamado desde el frontend (admin) en bucle hasta procesar todo.
// Devuelve { processed, migrated, skipped, errors, remaining }
//
// Solo admin puede invocar.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Detecta si una URL viene de WordPress / Jetpack (no es Base44 CDN)
const isWordPressUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /(?:i[0-9]\.wp\.com|peyuchile\.cl\/wp-content)/i.test(url);
};

// Limpia URL Jetpack para obtener canónica (sin ?fit, ?ssl, etc.)
const canonicalizeUrl = (url) => {
  let u = url.trim();
  u = u.replace(/^https?:\/\/i[0-9]\.wp\.com\//, 'https://');
  u = u.split('?')[0];
  if (u.startsWith('//')) u = 'https:' + u;
  return u;
};

// Extrae el filename de una URL para preservarlo en Base44
const getFilenameFromUrl = (url, sku) => {
  try {
    const clean = canonicalizeUrl(url);
    const parts = clean.split('/');
    const last = parts[parts.length - 1] || '';
    const name = last.split('?')[0].split('#')[0];
    if (name && /\.(jpg|jpeg|png|webp|gif)$/i.test(name)) return `${sku}_${name}`;
    return `${sku}_image.jpg`;
  } catch {
    return `${sku}_image.jpg`;
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
    const batchSize = Math.min(Number(body.batchSize) || 5, 10); // máx 10 por lote
    const dryRun = body.dryRun === true;

    // Lista todos los productos activos
    const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 1000);

    // Filtra los que aún tienen imagen WordPress
    const pendientes = (productos || []).filter(p => isWordPressUrl(p.imagen_url));
    const totalPendientes = pendientes.length;
    const lote = pendientes.slice(0, batchSize);

    if (dryRun) {
      return Response.json({
        ok: true,
        dryRun: true,
        totalPendientes,
        loteSize: lote.length,
        ejemplos: lote.slice(0, 3).map(p => ({
          sku: p.sku,
          nombre: p.nombre,
          imagen_url_actual: p.imagen_url,
        })),
      });
    }

    const resultados = {
      processed: lote.length,
      migrated: 0,
      skipped: 0,
      errors: [],
      details: [],
    };

    for (const producto of lote) {
      const sku = producto.sku || producto.id;
      const urlOriginal = producto.imagen_url;
      const urlCanonica = canonicalizeUrl(urlOriginal);

      try {
        // 1. Descarga imagen desde WordPress
        const respImg = await fetch(urlCanonica, {
          headers: { 'User-Agent': 'Mozilla/5.0 PEYU-Migration-Bot/1.0' },
        });

        if (!respImg.ok) {
          resultados.errors.push({ sku, error: `HTTP ${respImg.status} al descargar` });
          continue;
        }

        const blob = await respImg.blob();
        const filename = getFilenameFromUrl(urlCanonica, sku);
        const file = new File([blob], filename, {
          type: blob.type || 'image/jpeg',
        });

        // 2. Sube a Base44 CDN
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        const nuevaUrl = uploadResult?.file_url;

        if (!nuevaUrl) {
          resultados.errors.push({ sku, error: 'UploadFile no retornó file_url' });
          continue;
        }

        // 3. Actualiza Producto
        const galeriaActual = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];
        // Preserva la URL antigua en galeria como respaldo histórico (al final)
        const nuevaGaleria = [
          nuevaUrl,
          ...galeriaActual.filter(u => u !== nuevaUrl && u !== urlOriginal),
        ];

        await base44.asServiceRole.entities.Producto.update(producto.id, {
          imagen_url: nuevaUrl,
          galeria_urls: nuevaGaleria,
        });

        resultados.migrated += 1;
        resultados.details.push({
          sku,
          nombre: producto.nombre,
          old: urlOriginal,
          new: nuevaUrl,
        });
      } catch (err) {
        resultados.errors.push({ sku, error: err.message });
      }
    }

    return Response.json({
      ok: true,
      ...resultados,
      totalPendientes,
      remaining: totalPendientes - resultados.migrated,
      done: totalPendientes - resultados.migrated === 0,
    });
  } catch (error) {
    console.error('migrateProductImagesToBase44 error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});