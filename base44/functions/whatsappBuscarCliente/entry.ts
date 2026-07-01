import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// whatsappBuscarCliente — Reconocimiento de clientes recurrentes.
// ----------------------------------------------------------------------------
// Busca al cliente por teléfono o email en PedidoWeb y Cliente. Devuelve:
//   - Si es cliente nuevo: { es_nuevo: true }
//   - Si es recurrente: historial de compras, preferencias, último pedido,
//     si tiene link de pago pendiente, y sugerencias de cross-sell.
//
// Esto le da al agente MEMORIA INSTANTÁNEA: sabe quién es el cliente antes
// de que termine de escribir, sin pedirle datos repetidos.
//
// Payload: { telefono?, email? }
// ============================================================================

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { telefono, email } = await req.json().catch(() => ({}));

    if (!telefono && !email) {
      return Response.json({ error: 'Indica telefono o email para buscar.' }, { status: 400 });
    }

    // Buscar pedidos por teléfono o email
    const query = {};
    if (telefono) query['cliente_telefono'] = telefono;
    else if (email) query['cliente_email'] = email;

    const pedidos = await base44.asServiceRole.entities.PedidoWeb.filter(query, '-created_date', 20).catch(() => []);

    if (!pedidos || pedidos.length === 0) {
      // También buscar en Cliente por si tiene ficha sin pedidos
      const clientes = await base44.asServiceRole.entities.Cliente.filter(query, '-updated_date', 5).catch(() => []);
      if (clientes && clientes.length > 0) {
        const c = clientes[0];
        return Response.json({
          es_nuevo: false,
          cliente_id: c.id,
          nombre: c.nombre || c.nombre_completo || '',
          telefono: c.telefono || telefono,
          email: c.email || email,
          total_pedidos: 0,
          nota: 'Cliente registrado pero sin pedidos previos. Salúdalo por nombre si lo conoces.',
        });
      }
      return Response.json({
        es_nuevo: true,
        nota: 'Cliente nuevo. Saluda y pregunta qué busca. Captura nombre y email progresivamente.',
      });
    }

    // Cliente recurrente — armar perfil
    const pedidosValidos = pedidos.filter(p => p.estado !== 'Cancelado' && p.estado !== 'Reembolsado');
    const totalGastado = pedidosValidos.reduce((s, p) => s + (p.total || 0), 0);
    const ultimoPedido = pedidos[0];

    // Preferencias: productos más comprados
    const skuCount = {};
    const colorCount = {};
    for (const p of pedidosValidos) {
      if (Array.isArray(p.items_detalle)) {
        for (const item of p.items_detalle) {
          if (item.sku) skuCount[item.sku] = (skuCount[item.sku] || 0) + (item.cantidad || 1);
          if (item.color) colorCount[item.color] = (colorCount[item.color] || 0) + 1;
        }
      } else if (p.sku) {
        skuCount[p.sku] = (skuCount[p.sku] || 0) + (p.cantidad || 1);
      }
    }
    const topSkus = Object.entries(skuCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([sku, count]) => ({ sku, veces: count }));
    const topColores = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([color, count]) => ({ color, veces: count }));

    // ¿Tiene link pendiente?
    const pendientePago = pedidos.find(p => p.payment_status === 'pending_mp' || p.payment_status === 'pending_transfer');
    const tieneLinkActivo = pendientePago && pendientePago.expires_at && new Date(pendientePago.expires_at) > new Date();

    // Resumen de últimos 3 pedidos
    const historialReciente = pedidos.slice(0, 3).map(p => ({
      numero: p.numero_pedido,
      fecha: p.fecha,
      total: p.total,
      estado: p.estado,
      payment_status: p.payment_status,
      items: p.descripcion_items || (Array.isArray(p.items_detalle) ? p.items_detalle.map(i => `${i.cantidad}x ${i.nombre}`).join(', ') : ''),
      tracking: p.tracking || null,
    }));

    return Response.json({
      es_nuevo: false,
      nombre: ultimoPedido.cliente_nombre,
      telefono: ultimoPedido.cliente_telefono,
      email: ultimoPedido.cliente_email,
      total_pedidos: pedidosValidos.length,
      total_gastado_clp: Math.round(totalGastado),
      primer_pedido: pedidos[pedidos.length - 1]?.fecha,
      ultimo_pedido: ultimoPedido.fecha,
      preferencias: {
        productos_frecuentes: topSkus,
        colores_preferidos: topColores,
      },
      link_pago_pendiente: tieneLinkActivo ? {
        numero: pendientePago.numero_pedido,
        total: pendientePago.total,
        expira: pendientePago.expires_at,
        items: pendientePago.descripcion_items,
      } : null,
      historial_reciente: historialReciente,
      recomendacion: tieneLinkActivo
        ? `Tiene un link de pago PENDIENTE por $${pendientePago.total.toLocaleString('es-CL')} (pedido ${pendientePago.numero_pedido}). Pregúntale si quiere completar la compra o necesita ayuda.`
        : topSkus.length > 0
          ? `Cliente recurrente. Su producto más comprado es ${topSkus[0].sku}. Salúdalo por nombre y ofrece novedades relacionadas.`
          : 'Cliente recurrente. Salúdalo por nombre.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});