import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// diagnosticoCatalogo · Foto liviana del catálogo (admin)
// ----------------------------------------------------------------------------
// POST { categoria?: string }  -> si se pasa categoria, devuelve SOLO las
// líneas de esa categoría (para no truncar). Sin categoria: solo conteos +
// lista de categorías con cuántos productos hay en cada una.
// ============================================================================
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const filtroCat = body?.categoria || null;

    const all = [];
    let skip = 0;
    const pageSize = 100;
    while (true) {
      const batch = await base44.asServiceRole.entities.Producto.list('-created_date', pageSize, skip);
      if (!batch || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < pageSize) break;
      skip += pageSize;
      if (skip > 2000) break;
    }

    const porCategoria = {};
    for (const p of all) {
      const c = p.categoria || 'SIN_CATEGORIA';
      porCategoria[c] = (porCategoria[c] || 0) + 1;
    }

    if (!filtroCat) {
      return Response.json({
        ok: true,
        total: all.length,
        activos: all.filter((p) => p.activo).length,
        verificados: all.filter((p) => p.catalogo_oficial_verificado).length,
        sin_imagen: all.filter((p) => !p.imagen_url).length,
        por_categoria: porCategoria,
      });
    }

    const lineas = all
      .filter((p) => p.categoria === filtroCat)
      .map((p) =>
        [
          p.sku,
          (p.nombre || '').slice(0, 60),
          p.canal,
          p.precio_b2c || 0,
          p.activo ? 'ON' : 'off',
          p.imagen_url ? 'img' : 'NOIMG',
          `g${Array.isArray(p.galeria_urls) ? p.galeria_urls.length : 0}`,
        ].join(' | ')
      );

    return Response.json({ ok: true, categoria: filtroCat, count: lineas.length, lineas });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});