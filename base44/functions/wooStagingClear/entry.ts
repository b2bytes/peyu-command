// Limpia el staging: borra todos los registros del tipo y status indicados.
// Útil para re-importar desde cero o limpiar los ya promovidos.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { resource_type, status } = body || {};
    if (!['product', 'customer', 'order'].includes(resource_type)) {
      return Response.json({ error: 'resource_type inválido' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const query = { resource_type };
    if (status && status !== 'all') query.status = status;

    let deleted = 0;
    // Borra en lotes de 200 hasta que no quede nada
    while (true) {
      const batch = await svc.entities.WooStagingItem.filter(query, undefined, 200);
      if (batch.length === 0) break;
      for (const row of batch) {
        try { await svc.entities.WooStagingItem.delete(row.id); deleted++; } catch {}
      }
      if (batch.length < 200) break;
    }

    return Response.json({ ok: true, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});