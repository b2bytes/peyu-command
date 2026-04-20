// Lista staging items con filtros. Para el modal de preview antes de promover.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { resource_type, status = 'pending', limit = 50, search = '' } = body || {};

    const svc = base44.asServiceRole;
    const query = { resource_type };
    if (status !== 'all') query.status = status;

    let items = await svc.entities.WooStagingItem.filter(query, '-imported_at', limit);

    // Búsqueda en memoria (nombre / sku / email)
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        (i.nombre || '').toLowerCase().includes(q) ||
        (i.sku || '').toLowerCase().includes(q) ||
        (i.email || '').toLowerCase().includes(q)
      );
    }

    // Retornar solo lo esencial para la UI (no el raw_data completo)
    const slim = items.map(i => ({
      id: i.id,
      woo_id: i.woo_id,
      resource_type: i.resource_type,
      sku: i.sku,
      nombre: i.nombre,
      email: i.email,
      status: i.status,
      target_id: i.target_id,
      error_message: i.error_message,
      imported_at: i.imported_at,
      mapped_preview: i.mapped_preview,
    }));

    return Response.json({ ok: true, items: slim, count: slim.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});