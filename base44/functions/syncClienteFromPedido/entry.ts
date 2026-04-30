import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Trigger entity al crear/actualizar PedidoWeb.
 * Mantiene el perfil Cliente 360 sincronizado automáticamente:
 *  - Crea Cliente si no existe (match por email)
 *  - Actualiza total_compras_clp, num_pedidos, ticket_promedio
 *  - Actualiza fecha_ultima_compra y sku_favorito (más recurrente)
 *  - Calcula estado: VIP si >$1M; En Riesgo si >180d sin compra
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const pedidoId = body?.event?.entity_id || body?.data?.id || body?.pedidoId;
    if (!pedidoId) return Response.json({ error: 'pedidoId requerido' }, { status: 400 });

    const pedidos = await base44.asServiceRole.entities.PedidoWeb.filter({ id: pedidoId });
    const pedido = pedidos?.[0];
    if (!pedido) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });

    // Solo procesar pedidos pagados/confirmados (no carritos abandonados)
    const estadosValidos = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
    if (!estadosValidos.includes(pedido.estado)) {
      return Response.json({ ok: true, skipped: true, reason: `estado=${pedido.estado}` });
    }

    const email = pedido.email || pedido.cliente_email;
    if (!email) return Response.json({ ok: true, skipped: true, reason: 'sin_email' });

    // Match por email
    const existing = await base44.asServiceRole.entities.Cliente.filter({ email });
    let cliente = existing?.[0];

    // Recopilar todos los pedidos del email para recalcular agregados correctamente
    const todosPedidos = await base44.asServiceRole.entities.PedidoWeb.filter({ email });
    const pedidosValidos = todosPedidos.filter(p => estadosValidos.includes(p.estado));

    const totalCompras = pedidosValidos.reduce((s, p) => s + (p.total || 0), 0);
    const numPedidos = pedidosValidos.length;
    const ticketPromedio = numPedidos > 0 ? Math.round(totalCompras / numPedidos) : 0;

    // SKU favorito: el más repetido en items_json
    const skuCount = {};
    pedidosValidos.forEach(p => {
      try {
        const items = typeof p.items_json === 'string' ? JSON.parse(p.items_json) : (p.items_json || []);
        items.forEach(it => {
          const sku = it.sku || it.nombre;
          if (sku) skuCount[sku] = (skuCount[sku] || 0) + (it.qty || it.cantidad || 1);
        });
      } catch { /* ignorar parse errors */ }
    });
    const skuFavorito = Object.entries(skuCount).sort((a, b) => b[1] - a[1])[0]?.[0] || cliente?.sku_favorito;

    // Calcular estado según comportamiento
    const ahora = new Date();
    const ultimaCompra = pedidosValidos
      .map(p => new Date(p.created_date))
      .sort((a, b) => b - a)[0];
    const diasInactivo = ultimaCompra ? Math.floor((ahora - ultimaCompra) / (1000 * 60 * 60 * 24)) : 0;

    let estado = cliente?.estado || 'Activo';
    if (totalCompras >= 1_000_000) estado = 'VIP';
    else if (diasInactivo > 180) estado = 'En Riesgo';
    else if (diasInactivo <= 90) estado = 'Activo';

    const patch = {
      email,
      empresa: cliente?.empresa || pedido.empresa || pedido.cliente_nombre || email.split('@')[0],
      contacto: cliente?.contacto || pedido.cliente_nombre || pedido.contacto,
      telefono: cliente?.telefono || pedido.telefono,
      tipo: cliente?.tipo || (pedido.empresa ? 'B2B Pyme' : 'B2C Recurrente'),
      estado,
      fecha_primera_compra: cliente?.fecha_primera_compra || pedidosValidos
        .map(p => p.created_date)
        .sort()[0]?.split('T')[0],
      fecha_ultima_compra: ultimaCompra?.toISOString().split('T')[0],
      total_compras_clp: totalCompras,
      num_pedidos: numPedidos,
      ticket_promedio: ticketPromedio,
      sku_favorito: skuFavorito,
      canal_preferido: cliente?.canal_preferido || 'Web',
    };

    let action;
    if (cliente) {
      await base44.asServiceRole.entities.Cliente.update(cliente.id, patch);
      action = 'updated';
    } else {
      cliente = await base44.asServiceRole.entities.Cliente.create(patch);
      action = 'created';
    }

    return Response.json({
      ok: true,
      action,
      cliente_id: cliente.id,
      total_compras_clp: totalCompras,
      num_pedidos: numPedidos,
      estado,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});