import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Recalcula rating_promedio y rating_count de cada Producto a partir de las
// ResenaPedido (rating_producto). Resuelve los SKUs de cada reseña vía el
// campo denormalizado skus, o —para reseñas antiguas— buscando el PedidoWeb.
// Se dispara automáticamente al crear/editar una reseña y sirve de backfill.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    // Si hay usuario logueado, debe ser admin. Sin usuario = invocación por automatización.
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const svc = base44.asServiceRole;

    const resenas = await svc.entities.ResenaPedido.list('-created_date', 500);
    const pedidosCache = {};
    const porSku = {}; // sku -> { sum, count }

    for (const r of resenas) {
      if (!r.rating_producto) continue;
      let skus = Array.isArray(r.skus) && r.skus.length > 0 ? r.skus : null;
      if (!skus && r.pedido_id) {
        if (!(r.pedido_id in pedidosCache)) {
          pedidosCache[r.pedido_id] = await svc.entities.PedidoWeb.get(r.pedido_id).catch(() => null);
        }
        const p = pedidosCache[r.pedido_id];
        if (p) {
          const set = new Set();
          (p.items_detalle || []).forEach((it) => { if (it && it.sku) set.add(it.sku); });
          if (p.sku) set.add(p.sku);
          skus = [...set];
        }
      }
      (skus || []).forEach((sku) => {
        if (!porSku[sku]) porSku[sku] = { sum: 0, count: 0 };
        porSku[sku].sum += r.rating_producto;
        porSku[sku].count += 1;
      });
    }

    let actualizados = 0;
    for (const sku of Object.keys(porSku)) {
      const prods = await svc.entities.Producto.filter({ sku });
      const promedio = Math.round((porSku[sku].sum / porSku[sku].count) * 10) / 10;
      for (const prod of prods) {
        await svc.entities.Producto.update(prod.id, {
          rating_promedio: promedio,
          rating_count: porSku[sku].count,
        });
        actualizados++;
      }
    }

    return Response.json({
      ok: true,
      resenas_procesadas: resenas.length,
      skus_con_rating: Object.keys(porSku).length,
      productos_actualizados: actualizados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}