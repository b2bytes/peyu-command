import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAgentCatalogLinks · Catálogo real de PEYU para usar en campañas Meta.
// ----------------------------------------------------------------------------
// Da al Estratega de Meta Ads acceso a los productos reales con su URL pública
// (landing/CTA del anuncio), SKU, precio B2C, stock, categoría e imagen. Así
// puede armar campañas apuntando a la ficha exacta del producto y elegir el
// mejor creativo/landing sin inventar links.
//
// Payload:
//   { query?, categoria?, solo_con_stock?, limit? }
//   - query: filtra por nombre/sku/categoría (texto libre)
//   - categoria: filtra por categoría exacta
//   - solo_con_stock: true = solo productos con stock_actual > 0
//   - limit: máximo de productos (default 20)
//
// Devuelve cada producto con:
//   { sku, nombre, categoria, precio_b2c, stock, url_producto, url_catalogo,
//     imagen_url, activo }
// La URL de ficha apunta a la cara nueva /ProductoNuevo?sku=... (pública).
// ============================================================================

const SITE = 'https://peyuchile.cl';
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query = '', categoria = '', solo_con_stock = false, limit = 20 } = await req.json().catch(() => ({}));

    let productos = await base44.asServiceRole.entities.Producto.filter({ activo: true }, '-updated_date', 400);

    if (categoria) {
      const c = norm(categoria);
      productos = productos.filter((p) => norm(p.categoria).includes(c));
    }
    if (query) {
      const q = norm(query);
      productos = productos.filter((p) =>
        norm(p.nombre).includes(q) || norm(p.sku).includes(q) ||
        norm(p.categoria).includes(q) || norm(p.descripcion).includes(q)
      );
    }
    if (solo_con_stock) {
      productos = productos.filter((p) => (p.stock_actual || 0) > 0);
    }

    const items = productos.slice(0, Math.min(limit, 50)).map((p) => ({
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      precio_b2c: p.precio_b2c || null,
      stock: p.stock_actual ?? null,
      // URL pública de la ficha (CTA/landing del anuncio). Las landings de
      // colección también sirven como destino de campañas de catálogo.
      url_producto: p.sku ? `${SITE}/ProductoNuevo?sku=${encodeURIComponent(p.sku)}` : `${SITE}/CatalogoNuevo`,
      url_catalogo: `${SITE}/CatalogoNuevo`,
      imagen_url: p.imagen_promo_url || p.imagen_url || null,
      activo: p.activo,
    }));

    return Response.json({
      ok: true,
      count: items.length,
      landings: {
        catalogo_b2c: `${SITE}/CatalogoNuevo`,
        empresas_b2b: `${SITE}/EmpresasNuevo`,
        fiestas_empresas: `${SITE}/fiestas-patrias/empresas`,
      },
      productos: items,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});