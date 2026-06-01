import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Devuelve un resumen LIMPIO del catálogo actual (solo campos clave) para
// poder cruzarlo con el catálogo oficial del PDF, detectar duplicados,
// fotos cruzadas y productos faltantes. No modifica nada.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    let body = {};
    try { body = await req.json(); } catch (_) { /* sin body */ }
    const soloCatalogo = body.soloCatalogo ?? true; // por defecto solo categorías del PDF
    const filtroCat = body.categoria; // opcional: una sola categoría

    const productos = await base44.asServiceRole.entities.Producto.list('-created_date', 500);
    const CATS_PDF = ['Entretenimiento', 'Escritorio', 'Hogar'];

    let lista = productos || [];
    if (filtroCat) lista = lista.filter((p) => p.categoria === filtroCat);
    else if (soloCatalogo) lista = lista.filter((p) => CATS_PDF.includes(p.categoria));

    // Tabla ultra-compacta: solo lo necesario para el matching contra el PDF.
    const resumen = lista.map((p) => ({
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      cat: p.categoria,
      activo: p.activo,
      b2c: p.precio_b2c,
      img: p.imagen_url ? p.imagen_url.split('/').pop() : null,
      gal: Array.isArray(p.galeria_urls) ? p.galeria_urls.length : 0,
    }));

    // Detección simple de posibles duplicados por nombre normalizado
    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const byName = {};
    resumen.forEach((r) => {
      const k = norm(r.nombre);
      (byName[k] = byName[k] || []).push({ id: r.id, sku: r.sku, nombre: r.nombre });
    });
    const posibles_duplicados = Object.values(byName).filter((arr) => arr.length > 1);

    // Una línea por producto: SKU | activo | cat | nombre | img | #galería
    const lineas = resumen.map((r) =>
      `${r.sku} | ${r.activo ? 'ON ' : 'off'} | ${r.cat[0]} | ${r.nombre} | img:${r.img || 'NO'} | gal:${r.gal}`
    );

    return Response.json({
      total: resumen.length,
      activos: resumen.filter((r) => r.activo).length,
      posibles_duplicados,
      lineas,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});