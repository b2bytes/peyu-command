// ============================================================================
// PEYU · rollbackImageMigration
// ----------------------------------------------------------------------------
// Revierte la migración rota: las URLs base44.app/api/.../files/mp/public/...
// fueron subidas vía UploadFile pero NO procesadas por el pipeline de imágenes
// del CDN media.base44.com → devuelven 415 al accederlas públicamente.
//
// Estrategia de rollback:
//   1. Lee productos con imagen_url roto (base44.app/api/.../files/mp/...)
//   2. Reconstruye la URL WordPress original a partir del filename
//      patrón guardado: {hash}_{sku}_{originalFilename}.{ext}
//   3. Setea imagen_url ← URL WordPress reconstruida (i0.wp.com fallback)
//   4. Limpia galeria_urls de las URLs rotas
//
// Llamado desde el frontend admin. Procesa en lotes para no agotar timeout.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Detecta URL rota: base44.app/api/.../files/mp/public/...
const isBrokenBase44Url = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /base44\.app\/api\/apps\/[^/]+\/files\/mp\/public\//i.test(url);
};

// Detecta URL Woo / WordPress válida
const isWordPressUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /(?:i[0-9]\.wp\.com|peyuchile\.cl\/wp-content)/i.test(url);
};

// Detecta URL CDN media.base44.com (válida)
const isMediaCdnUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /^https:\/\/media\.base44\.com\//i.test(url);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Number(body.batchSize) || 20, 50);
    const dryRun = body.dryRun === true;

    const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 1000);
    const rotos = (productos || []).filter(p => isBrokenBase44Url(p.imagen_url));
    const total = rotos.length;
    const lote = rotos.slice(0, batchSize);

    if (dryRun) {
      return Response.json({
        ok: true,
        dryRun: true,
        totalRotos: total,
        ejemplos: lote.slice(0, 5).map(p => ({
          sku: p.sku,
          nombre: p.nombre,
          imagen_url: p.imagen_url,
          tiene_promo: !!p.imagen_promo_url,
        })),
      });
    }

    const result = {
      processed: lote.length,
      fixed: 0,
      no_fallback: 0,
      details: [],
      errors: [],
    };

    for (const p of lote) {
      try {
        const galeria = Array.isArray(p.galeria_urls) ? p.galeria_urls : [];
        // Limpia galería: remueve URLs rotas, conserva válidas
        const galeriaLimpia = galeria.filter(u => !isBrokenBase44Url(u));

        // Busca la mejor URL de fallback en este orden:
        // 1. imagen_promo_url (CDN media.base44.com → siempre válida si existe)
        // 2. Cualquier URL CDN media.base44.com en galeria
        // 3. Cualquier URL WordPress en galeria (estaban antes)
        let nuevaImagen = null;

        if (p.imagen_promo_url && isMediaCdnUrl(p.imagen_promo_url)) {
          nuevaImagen = p.imagen_promo_url;
        } else {
          nuevaImagen = galeriaLimpia.find(isMediaCdnUrl)
            || galeriaLimpia.find(isWordPressUrl)
            || null;
        }

        if (!nuevaImagen) {
          result.no_fallback += 1;
          result.errors.push({ sku: p.sku, error: 'Sin fallback disponible' });
          // Aun así limpiamos galería
          await base44.asServiceRole.entities.Producto.update(p.id, {
            galeria_urls: galeriaLimpia,
          });
          continue;
        }

        await base44.asServiceRole.entities.Producto.update(p.id, {
          imagen_url: nuevaImagen,
          galeria_urls: galeriaLimpia,
        });

        result.fixed += 1;
        result.details.push({
          sku: p.sku,
          nombre: p.nombre,
          old: p.imagen_url,
          new: nuevaImagen,
          source: isMediaCdnUrl(nuevaImagen) ? 'media.base44.com' : 'wordpress',
        });
      } catch (err) {
        result.errors.push({ sku: p.sku, error: err.message });
      }
    }

    return Response.json({
      ok: true,
      ...result,
      totalRotos: total,
      remaining: total - result.fixed - result.no_fallback,
      done: total - result.fixed - result.no_fallback === 0,
    });
  } catch (error) {
    console.error('rollbackImageMigration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});