import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ============================================================================
// actualizarCatalogoOficial · Mantenimiento de catálogo (admin)
// ----------------------------------------------------------------------------
// POST { items: [{ sku, campos: {...} }] }
// Para cada item: busca el Producto por sku y actualiza SOLO los campos
// enviados en `campos`. No toca ningún otro campo existente.
// Idempotente y seguro: un error por item no rompe el resto.
// Respuesta: { ok, actualizados, no_encontrados, errores }
// ============================================================================
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? body.items : null;
    if (!items) {
      return Response.json({ error: 'Body inválido: se esperaba { items: [...] }' }, { status: 400 });
    }

    const actualizados = [];
    const no_encontrados = [];
    const errores = [];
    const registros = [];

    for (const item of items) {
      const sku = item?.sku;
      const campos = item?.campos;

      if (!sku) {
        errores.push({ sku: sku || null, error: 'Item sin sku' });
        continue;
      }
      if (!campos || typeof campos !== 'object' || Array.isArray(campos)) {
        errores.push({ sku, error: 'Item sin objeto `campos` válido' });
        continue;
      }

      try {
        const encontrados = await base44.asServiceRole.entities.Producto.filter({ sku });
        const producto = encontrados?.[0];

        if (!producto) {
          no_encontrados.push(sku);
          continue;
        }

        await base44.asServiceRole.entities.Producto.update(producto.id, campos);
        actualizados.push(sku);

        // Releer el registro completo tal como quedó DESPUÉS del update
        const releidos = await base44.asServiceRole.entities.Producto.filter({ sku });
        if (releidos?.[0]) registros.push(releidos[0]);
      } catch (err) {
        errores.push({ sku, error: err?.message || String(err) });
      }
    }

    return Response.json({ ok: true, actualizados, no_encontrados, errores, registros });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});