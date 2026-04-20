// Promueve registros del staging a las entidades reales (Producto/Cliente/PedidoWeb).
// De-duplica: productos por SKU, clientes por email, pedidos por numero_pedido.
// Solo admin. Procesa en lotes de `limit` (default 100).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { resource_type, limit = 100 } = body || {};
    if (!['product', 'customer', 'customer_guest', 'order'].includes(resource_type)) {
      return Response.json({ error: 'resource_type debe ser product, customer, customer_guest u order' }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    const pending = await svc.entities.WooStagingItem.filter(
      { resource_type, status: 'pending' },
      'imported_at',
      limit
    );

    if (pending.length === 0) {
      return Response.json({ promoted: 0, updated: 0, skipped: 0, remaining: 0 });
    }

    let promoted = 0, updated = 0, skipped = 0, errors = 0;

    for (const row of pending) {
      try {
        const data = row.mapped_preview || {};

        if (resource_type === 'product') {
          if (!data.sku) { await svc.entities.WooStagingItem.update(row.id, { status: 'skipped', error_message: 'Sin SKU' }); skipped++; continue; }
          const existing = await svc.entities.Producto.filter({ sku: data.sku });
          if (existing?.[0]) {
            await svc.entities.Producto.update(existing[0].id, data);
            await svc.entities.WooStagingItem.update(row.id, { status: 'promoted', target_id: existing[0].id });
            updated++;
          } else {
            const created = await svc.entities.Producto.create(data);
            await svc.entities.WooStagingItem.update(row.id, { status: 'promoted', target_id: created.id });
            promoted++;
          }
        }

        else if (resource_type === 'customer' || resource_type === 'customer_guest') {
          if (!data.email) { await svc.entities.WooStagingItem.update(row.id, { status: 'skipped', error_message: 'Sin email' }); skipped++; continue; }
          const existing = await svc.entities.Cliente.filter({ email: data.email });
          if (existing?.[0]) {
            // No sobreescribir campos ya existentes con datos más pobres — merge conservador
            const merged = { ...existing[0], ...data };
            // Preservar primera compra más antigua
            if (existing[0].fecha_primera_compra && data.fecha_primera_compra) {
              merged.fecha_primera_compra = existing[0].fecha_primera_compra < data.fecha_primera_compra
                ? existing[0].fecha_primera_compra : data.fecha_primera_compra;
            }
            await svc.entities.Cliente.update(existing[0].id, merged);
            await svc.entities.WooStagingItem.update(row.id, { status: 'promoted', target_id: existing[0].id });
            updated++;
          } else {
            const created = await svc.entities.Cliente.create(data);
            await svc.entities.WooStagingItem.update(row.id, { status: 'promoted', target_id: created.id });
            promoted++;
          }
        }

        else if (resource_type === 'order') {
          if (!data.numero_pedido) { await svc.entities.WooStagingItem.update(row.id, { status: 'skipped', error_message: 'Sin número' }); skipped++; continue; }
          const existing = await svc.entities.PedidoWeb.filter({ numero_pedido: data.numero_pedido });
          if (existing?.[0]) {
            await svc.entities.PedidoWeb.update(existing[0].id, data);
            await svc.entities.WooStagingItem.update(row.id, { status: 'promoted', target_id: existing[0].id });
            updated++;
          } else {
            const created = await svc.entities.PedidoWeb.create(data);
            await svc.entities.WooStagingItem.update(row.id, { status: 'promoted', target_id: created.id });
            promoted++;
          }
        }
      } catch (e) {
        errors++;
        try { await svc.entities.WooStagingItem.update(row.id, { status: 'error', error_message: String(e.message || e).slice(0, 500) }); } catch {}
      }
    }

    // Contar restantes
    const remainingList = await svc.entities.WooStagingItem.filter({ resource_type, status: 'pending' }, undefined, 1);
    const remaining = pending.length === limit ? pending.length : 0; // estimación simple
    const moreLeft = remainingList.length > 0;

    return Response.json({ promoted, updated, skipped, errors, hasMore: moreLeft, processed: pending.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});