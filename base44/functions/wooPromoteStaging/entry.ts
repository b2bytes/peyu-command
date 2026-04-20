// Promueve registros del staging a las entidades reales (Producto/Cliente/PedidoWeb).
// De-duplica: productos por SKU, clientes por email, pedidos por numero_pedido.
//
// Mejoras de robustez:
//  - Chunks más pequeños (default 50) para no exceder timeout
//  - Errores individuales no rompen el batch
//  - Siempre devuelve 200 con JSON (el frontend decide si seguir)
//  - Reporta cuántos quedan pendientes para que el loop del front sepa cuándo parar
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { resource_type } = body || {};
    const limit = Math.min(body?.limit || DEFAULT_LIMIT, MAX_LIMIT);

    if (!['product', 'customer', 'customer_guest', 'order'].includes(resource_type)) {
      return Response.json({ error: 'resource_type inválido' }, { status: 200 });
    }

    const svc = base44.asServiceRole;

    let pending;
    try {
      pending = await svc.entities.WooStagingItem.filter(
        { resource_type, status: 'pending' },
        'imported_at',
        limit
      );
    } catch (e) {
      return Response.json({ error: `Error leyendo staging: ${e.message}`, retryable: true }, { status: 200 });
    }

    if (!pending || pending.length === 0) {
      return Response.json({ promoted: 0, updated: 0, skipped: 0, errors: 0, processed: 0, hasMore: false });
    }

    let promoted = 0, updated = 0, skipped = 0, errors = 0;

    for (const row of pending) {
      try {
        const data = row.mapped_preview || {};

        if (resource_type === 'product') {
          if (!data.sku) {
            await svc.entities.WooStagingItem.update(row.id, { status: 'skipped', error_message: 'Sin SKU' });
            skipped++; continue;
          }
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
          const email = (data.email || '').toLowerCase().trim();
          if (!email) {
            await svc.entities.WooStagingItem.update(row.id, { status: 'skipped', error_message: 'Sin email' });
            skipped++; continue;
          }
          const existing = await svc.entities.Cliente.filter({ email });
          if (existing?.[0]) {
            // Merge conservador — no pisar campos no vacíos con vacíos
            const base = existing[0];
            const merged = { ...base };
            for (const [k, v] of Object.entries(data)) {
              if (v !== undefined && v !== null && v !== '') merged[k] = v;
            }
            if (base.fecha_primera_compra && data.fecha_primera_compra) {
              merged.fecha_primera_compra = base.fecha_primera_compra < data.fecha_primera_compra
                ? base.fecha_primera_compra : data.fecha_primera_compra;
            }
            delete merged.id; delete merged.created_date; delete merged.updated_date; delete merged.created_by;
            await svc.entities.Cliente.update(base.id, merged);
            await svc.entities.WooStagingItem.update(row.id, { status: 'promoted', target_id: base.id });
            updated++;
          } else {
            const created = await svc.entities.Cliente.create({ ...data, email });
            await svc.entities.WooStagingItem.update(row.id, { status: 'promoted', target_id: created.id });
            promoted++;
          }
        }

        else if (resource_type === 'order') {
          if (!data.numero_pedido) {
            await svc.entities.WooStagingItem.update(row.id, { status: 'skipped', error_message: 'Sin número' });
            skipped++; continue;
          }
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
        try {
          await svc.entities.WooStagingItem.update(row.id, {
            status: 'error',
            error_message: String(e.message || e).slice(0, 500),
          });
        } catch {}
      }
    }

    // ¿Quedan más pendientes? Consulta rápida con límite 1
    let hasMore = false;
    try {
      const probe = await svc.entities.WooStagingItem.filter(
        { resource_type, status: 'pending' }, undefined, 1
      );
      hasMore = (probe?.length || 0) > 0;
    } catch {}

    return Response.json({
      promoted, updated, skipped, errors,
      processed: pending.length,
      hasMore,
    });
  } catch (error) {
    return Response.json({ error: `Error interno: ${error.message}`, retryable: true }, { status: 200 });
  }
});