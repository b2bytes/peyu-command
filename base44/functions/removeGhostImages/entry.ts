// ============================================================================
// removeGhostImages — Limpia imágenes "fantasma" repetidas en muchos productos.
//
// Detecta y elimina cualquier imagen cuyo URL contenga los patrones detectores
// (ej. `wb-marr` para la foto de olas, `wb-log_peyu` para el logo PP). Estas
// vienen de un import viejo de WooCommerce y se asignaron por error a muchos
// productos.
//
// Body:
//   { mode: "preview" | "apply" }
// Devuelve cuántos productos están afectados y qué cambios aplicaría.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Patrones que identifican las imágenes "ghost" (substring case-insensitive)
const GHOST_PATTERNS = [
  'wb-marr',       // foto de olas/agua
  'wb-log_peyu',   // logo PP
];

const isGhost = (url) => {
  if (!url) return false;
  const u = String(url).toLowerCase();
  return GHOST_PATTERNS.some(p => u.includes(p));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: solo admin' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode === 'apply' ? 'apply' : 'preview';

    // Cargamos TODOS los productos (no solo activos) en lotes para no romper.
    let allProducts = [];
    let skip = 0;
    const PAGE = 200;
    while (true) {
      const page = await base44.asServiceRole.entities.Producto.list('-updated_date', PAGE, skip);
      if (!page || page.length === 0) break;
      allProducts.push(...page);
      if (page.length < PAGE) break;
      skip += PAGE;
      if (allProducts.length > 5000) break; // safety
    }

    const changes = [];
    for (const p of allProducts) {
      const galeria = Array.isArray(p.galeria_urls) ? p.galeria_urls : [];
      const galeriaCleaned = galeria.filter(u => !isGhost(u));
      const imagenIsGhost = isGhost(p.imagen_url);

      const galeriaChanged = galeriaCleaned.length !== galeria.length;
      if (!imagenIsGhost && !galeriaChanged) continue;

      // Si la imagen principal era fantasma, elegimos la primera real disponible
      let nuevaPrincipal = p.imagen_url;
      if (imagenIsGhost) {
        nuevaPrincipal = galeriaCleaned[0] || null;
      }

      changes.push({
        producto_id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        principal_ghost: imagenIsGhost,
        galeria_removidas: galeria.length - galeriaCleaned.length,
        nueva_principal: nuevaPrincipal,
        antes: {
          imagen_url: p.imagen_url,
          galeria_count: galeria.length,
        },
        despues: {
          imagen_url: nuevaPrincipal,
          galeria_count: galeriaCleaned.length,
        },
      });

      if (mode === 'apply') {
        await base44.asServiceRole.entities.Producto.update(p.id, {
          imagen_url: nuevaPrincipal,
          galeria_urls: galeriaCleaned,
        });
      }
    }

    return Response.json({
      ok: true,
      mode,
      total_productos_escaneados: allProducts.length,
      productos_afectados: changes.length,
      principal_reemplazada: changes.filter(c => c.principal_ghost).length,
      total_imagenes_removidas: changes.reduce((s, c) => s + c.galeria_removidas + (c.principal_ghost ? 1 : 0), 0),
      patrones_detectores: GHOST_PATTERNS,
      sample: changes.slice(0, 25),
      total_changes: changes.length,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack?.slice(0, 400) }, { status: 500 });
  }
});