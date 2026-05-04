/**
 * aplicarPriceSuggestion
 * ----------------------------------------------------------------------------
 * Aplica una sugerencia de precio aprobada al Producto correspondiente.
 * Solo admin.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Solo admin' }, { status: 403 });

    const { suggestion_id, notas } = await req.json();
    if (!suggestion_id) return Response.json({ error: 'suggestion_id requerido' }, { status: 400 });

    const sr = base44.asServiceRole;
    const sug = await sr.entities.PriceSuggestion.list().then(list => list.find(s => s.id === suggestion_id));
    if (!sug) return Response.json({ error: 'Sugerencia no encontrada' }, { status: 404 });

    // Buscar producto
    const productos = await sr.entities.Producto.filter({ sku: sug.producto_sku });
    const producto = productos[0];
    if (!producto) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });

    // Aplicar precio según tipo
    const updates = {};
    switch (sug.tipo_precio) {
      case 'B2C':
        updates.precio_b2c = sug.precio_sugerido_clp;
        break;
      case 'B2B base':
        updates.precio_base_b2b = sug.precio_sugerido_clp;
        break;
      case 'B2B 50-199':
        updates.precio_50_199 = sug.precio_sugerido_clp;
        break;
      case 'B2B 200-499':
        updates.precio_200_499 = sug.precio_sugerido_clp;
        break;
      case 'B2B 500+':
        updates.precio_500_mas = sug.precio_sugerido_clp;
        break;
      default:
        updates.precio_b2c = sug.precio_sugerido_clp;
    }

    await sr.entities.Producto.update(producto.id, updates);
    await sr.entities.PriceSuggestion.update(sug.id, {
      estado: 'aplicada',
      aprobada_por: user.email,
      aprobada_en: new Date().toISOString(),
      aplicada_en: new Date().toISOString(),
      notas_humano: notas || '',
    });

    return Response.json({
      ok: true,
      producto_sku: sug.producto_sku,
      precio_anterior: sug.precio_actual_clp,
      precio_nuevo: sug.precio_sugerido_clp,
    });
  } catch (error) {
    console.error('[aplicarPriceSuggestion] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});