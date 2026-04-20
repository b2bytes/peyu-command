// Devuelve resumen del staging actual: por tipo × estado.
// Optimización: usa límite 1 (solo necesitamos saber si hay algo) + count mediante filter con pagesize alto UNA vez.
// Para contar correctamente traemos en páginas de 500 y sumamos — más rápido que 16 queries con límite 1000.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PAGE = 500;
const MAX_PAGES = 40; // tope 20.000 items por bucket — más que suficiente

async function countRecords(svc, query) {
  let total = 0;
  let hasMore = true;
  let page = 0;
  while (hasMore && page < MAX_PAGES) {
    try {
      const list = await svc.entities.WooStagingItem.filter(query, 'imported_at', PAGE, page * PAGE);
      total += list.length;
      hasMore = list.length === PAGE;
      page++;
    } catch {
      hasMore = false;
    }
  }
  return total;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }
    const svc = base44.asServiceRole;

    const types = ['product', 'customer', 'customer_guest', 'order'];
    const statuses = ['pending', 'promoted', 'skipped', 'error'];
    const result = {};

    for (const t of types) {
      result[t] = { pending: 0, promoted: 0, skipped: 0, error: 0, total: 0 };
      for (const s of statuses) {
        const c = await countRecords(svc, { resource_type: t, status: s });
        result[t][s] = c;
        result[t].total += c;
      }
    }

    return Response.json({ ok: true, stats: result });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 200 });
  }
});