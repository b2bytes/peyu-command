// PEYU · fixProductImageUrls
// Normaliza URLs rotas de imagen en el catálogo.
//
// Las URLs viejas con formato:
//   https://base44.app/api/apps/{appId}/files/mp/public/{appId}/{hash}_{filename}
// ya NO sirven (el dominio cambió). El formato nuevo equivalente es:
//   https://media.base44.com/images/public/{appId}/{hash}_{filename}
//
// Este script recorre todos los productos y reemplaza las URLs legacy en:
//   - imagen_url
//   - galeria_urls[]
//   - imagen_promo_url
//
// Body: { mode: "preview" | "apply" }
//   preview → cuenta cuántas URLs están rotas, no modifica nada
//   apply   → aplica el reemplazo

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LEGACY_PATTERN = /^https:\/\/base44\.app\/api\/apps\/([a-f0-9]+)\/files\/mp\/public\/([a-f0-9]+)\/(.+)$/;

function fixUrl(url) {
  if (!url || typeof url !== 'string') return { url, changed: false };
  const m = url.match(LEGACY_PATTERN);
  if (!m) return { url, changed: false };
  // m[2] = appId (segundo), m[3] = filename
  const fixed = `https://media.base44.com/images/public/${m[2]}/${m[3]}`;
  return { url: fixed, changed: true };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const apply = body.mode === 'apply';

    const productos = await base44.asServiceRole.entities.Producto.filter({}, '-updated_date', 500);

    let totalProductos = 0;
    let productosAfectados = 0;
    let urlsArregladas = 0;
    const cambios = [];

    for (const p of productos) {
      totalProductos += 1;
      const patch = {};
      let prodChanged = false;

      // imagen_url
      const r1 = fixUrl(p.imagen_url);
      if (r1.changed) {
        patch.imagen_url = r1.url;
        urlsArregladas += 1;
        prodChanged = true;
      }

      // imagen_promo_url
      const r2 = fixUrl(p.imagen_promo_url);
      if (r2.changed) {
        patch.imagen_promo_url = r2.url;
        urlsArregladas += 1;
        prodChanged = true;
      }

      // galeria_urls
      if (Array.isArray(p.galeria_urls) && p.galeria_urls.length > 0) {
        const fixedGallery = [];
        let galleryChanged = false;
        for (const u of p.galeria_urls) {
          const r = fixUrl(u);
          if (r.changed) {
            urlsArregladas += 1;
            galleryChanged = true;
          }
          fixedGallery.push(r.url);
        }
        if (galleryChanged) {
          patch.galeria_urls = fixedGallery;
          prodChanged = true;
        }
      }

      if (prodChanged) {
        productosAfectados += 1;
        cambios.push({
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          campos: Object.keys(patch),
        });
        if (apply) {
          await base44.asServiceRole.entities.Producto.update(p.id, patch);
        }
      }
    }

    return Response.json({
      ok: true,
      mode: apply ? 'apply' : 'preview',
      total_productos_revisados: totalProductos,
      productos_afectados: productosAfectados,
      urls_arregladas: urlsArregladas,
      cambios: cambios.slice(0, 100),
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});