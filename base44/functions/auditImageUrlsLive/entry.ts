// PEYU · auditImageUrlsLive
// Hace HEAD a la imagen_url de cada producto activo y detecta cuáles están
// realmente rotas (404, timeout). Devuelve la lista de productos a re-matchear.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function urlIsAlive(url) {
  if (!url) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { method: 'GET', signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(t);
    if (!r.ok) return false;
    const ct = r.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return false;
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 300);

    const results = [];
    let alive = 0, dead = 0;

    // Procesar en lotes paralelos de 10
    for (let i = 0; i < productos.length; i += 10) {
      const chunk = productos.slice(i, i + 10);
      const checks = await Promise.all(chunk.map(async (p) => {
        const ok = await urlIsAlive(p.imagen_url);
        return { p, ok };
      }));
      for (const { p, ok } of checks) {
        if (ok) alive += 1;
        else {
          dead += 1;
          results.push({
            id: p.id,
            sku: p.sku,
            nombre: p.nombre,
            categoria: p.categoria,
            imagen_url: p.imagen_url,
            galeria_count: Array.isArray(p.galeria_urls) ? p.galeria_urls.length : 0,
          });
        }
      }
    }

    return Response.json({
      ok: true,
      total: productos.length,
      alive,
      dead,
      productos_rotos: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});