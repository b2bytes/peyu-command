// PEYU · manageProductImage
// Acciones sobre una imagen específica de un producto:
//  - delete         → quita la URL del producto (de imagen_url, galeria_urls o imagen_promo_url)
//  - promote        → la mueve de galería a imagen_url principal
//  - demote         → la mueve de principal a galería
//  - setAsPromo     → la setea como imagen_promo_url
// No borra el archivo del CDN (Base44 no expone esa API), sólo desreferencia.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { producto_id, url, action } = await req.json();
    if (!producto_id || !url || !action) {
      return Response.json({ error: 'Missing producto_id, url o action' }, { status: 400 });
    }

    const producto = await base44.asServiceRole.entities.Producto.get(producto_id);
    if (!producto) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });

    const galeria = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];
    let patch = {};

    if (action === 'delete') {
      const newPatch = {};
      if (producto.imagen_url === url) {
        // Si borramos la principal, ascendemos la 1ª de galería que no sea ella
        const sustituta = galeria.find(u => u && u !== url);
        newPatch.imagen_url = sustituta || null;
      }
      newPatch.galeria_urls = galeria.filter(u => u !== url);
      if (producto.imagen_promo_url === url) {
        newPatch.imagen_promo_url = null;
      }
      patch = newPatch;
    } else if (action === 'promote') {
      // Promover: la URL pasa a ser principal; la antigua principal pasa a galería
      const oldPrincipal = producto.imagen_url;
      const newGaleria = [...new Set([
        ...(oldPrincipal && oldPrincipal !== url ? [oldPrincipal] : []),
        ...galeria.filter(u => u !== url),
      ])];
      patch = { imagen_url: url, galeria_urls: newGaleria };
    } else if (action === 'demote') {
      // Bajar: la URL deja de ser principal y pasa a galería
      if (producto.imagen_url !== url) {
        return Response.json({ error: 'La URL no es la principal' }, { status: 400 });
      }
      const newGaleria = [...new Set([url, ...galeria])];
      // Buscamos sustituta principal: primera de la galería original distinta
      const sustituta = galeria.find(u => u && u !== url);
      patch = { imagen_url: sustituta || null, galeria_urls: newGaleria.filter(u => u !== sustituta) };
    } else if (action === 'setAsPromo') {
      patch = { imagen_promo_url: url };
    } else {
      return Response.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }

    await base44.asServiceRole.entities.Producto.update(producto_id, patch);
    return Response.json({ ok: true, action, patch });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});