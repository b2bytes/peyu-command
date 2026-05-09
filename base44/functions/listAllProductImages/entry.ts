// PEYU · listAllProductImages
// Recolecta TODAS las imágenes referenciadas por productos del catálogo,
// las clasifica por origen (CDN base44 / WordPress legacy / unsplash / otro)
// y por rol (principal / galería / promo). Devuelve también huérfanas
// (galería duplicando la principal) y stats globales.
//
// No descarga ni mide tamaño en bytes (sería costoso para 200+ productos).
// Sólo metadata estructural — la galería visual usa srcs directos.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const classifyOrigin = (url) => {
  if (!url || typeof url !== 'string') return 'unknown';
  if (url.includes('media.base44.com') || url.includes('base44.app/api/apps')) return 'base44';
  if (url.includes('peyuchile.cl') || url.includes('i0.wp.com')) return 'wordpress';
  if (url.includes('web.archive.org')) return 'wayback';
  if (url.includes('unsplash.com')) return 'unsplash';
  if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) return 'gdrive';
  return 'external';
};

const detectSubOrigin = (url) => {
  // Para imágenes en CDN base44, detectamos de qué función vinieron
  // por convención de nombres en el filename (set por cada función).
  if (!url) return null;
  const isBase44 = url.includes('media.base44.com') || url.includes('base44.app/api/apps');
  if (!isBase44) return null;
  const lower = url.toLowerCase();
  if (lower.includes('-wb-') || lower.includes('wayback')) return 'wayback';
  if (lower.includes('-drv-') || lower.includes('drive')) return 'drive';
  if (lower.includes('-woo-') || lower.includes('wp-')) return 'woo';
  if (lower.includes('generated_image') || lower.includes('-ai-') || lower.includes('-promo-')) return 'ai';
  if (lower.includes('mockup')) return 'mockup';
  return 'manual';
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 500);

    const imagenes = [];
    const seen = new Set();

    for (const p of productos) {
      const principal = p.imagen_url;
      const galeria = Array.isArray(p.galeria_urls) ? p.galeria_urls : [];
      const promo = p.imagen_promo_url;

      // Principal
      if (principal) {
        const key = `${p.id}::${principal}`;
        if (!seen.has(key)) {
          seen.add(key);
          imagenes.push({
            url: principal,
            role: 'principal',
            origin: classifyOrigin(principal),
            sub_origin: detectSubOrigin(principal),
            producto_id: p.id,
            producto_sku: p.sku,
            producto_nombre: p.nombre,
            producto_categoria: p.categoria,
            producto_activo: p.activo !== false,
          });
        }
      }

      // Galería (excluye duplicados con la principal)
      for (const url of galeria) {
        if (!url) continue;
        const key = `${p.id}::${url}`;
        if (seen.has(key)) continue;
        seen.add(key);
        imagenes.push({
          url,
          role: url === principal ? 'galeria_dup_principal' : 'galeria',
          origin: classifyOrigin(url),
          sub_origin: detectSubOrigin(url),
          producto_id: p.id,
          producto_sku: p.sku,
          producto_nombre: p.nombre,
          producto_categoria: p.categoria,
          producto_activo: p.activo !== false,
        });
      }

      // Promo
      if (promo) {
        const key = `${p.id}::${promo}::promo`;
        if (!seen.has(key)) {
          seen.add(key);
          imagenes.push({
            url: promo,
            role: 'promo',
            origin: classifyOrigin(promo),
            sub_origin: detectSubOrigin(promo),
            producto_id: p.id,
            producto_sku: p.sku,
            producto_nombre: p.nombre,
            producto_categoria: p.categoria,
            producto_activo: p.activo !== false,
          });
        }
      }
    }

    // Stats agregadas
    const stats = {
      total: imagenes.length,
      por_origen: {},
      por_rol: {},
      por_sub_origen: {},
      productos_total: productos.length,
      productos_sin_principal: productos.filter(p => !p.imagen_url).length,
      productos_sin_galeria: productos.filter(p => !Array.isArray(p.galeria_urls) || p.galeria_urls.length === 0).length,
      productos_solo_principal: productos.filter(p => p.imagen_url && (!Array.isArray(p.galeria_urls) || p.galeria_urls.length === 0)).length,
    };

    for (const img of imagenes) {
      stats.por_origen[img.origin] = (stats.por_origen[img.origin] || 0) + 1;
      stats.por_rol[img.role] = (stats.por_rol[img.role] || 0) + 1;
      if (img.sub_origin) {
        stats.por_sub_origen[img.sub_origin] = (stats.por_sub_origen[img.sub_origin] || 0) + 1;
      }
    }

    return Response.json({ ok: true, stats, imagenes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});