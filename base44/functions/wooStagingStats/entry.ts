// Devuelve resumen del staging actual: por tipo × estado. Para la UI.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }
    const svc = base44.asServiceRole;

    const types = ['product', 'customer', 'order'];
    const statuses = ['pending', 'promoted', 'skipped', 'error'];
    const result = {};

    for (const t of types) {
      result[t] = {};
      for (const s of statuses) {
        const list = await svc.entities.WooStagingItem.filter({ resource_type: t, status: s }, undefined, 1000);
        result[t][s] = list.length;
      }
      result[t].total = Object.values(result[t]).reduce((a, b) => a + b, 0);
    }

    return Response.json({ ok: true, stats: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});