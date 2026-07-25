import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Trigger entity al crear/actualizar PedidoWeb.
 * Mantiene el perfil Cliente 360 sincronizado con TODO el flujo de venta:
 * web (B2C), tienda, y ahora también los pedidos que cierra el agente de
 * WhatsApp — que muchas veces llegan SIN email, solo con teléfono.
 *
 *  - Identifica al cliente por email y, si no hay, por teléfono (WhatsApp).
 *  - Recalcula total_compras_clp, num_pedidos, ticket_promedio.
 *  - Actualiza fecha_ultima_compra y sku_favorito (desde items_detalle).
 *  - Marca canal_preferido = WhatsApp cuando el pedido vino del agente.
 *  - Estado: VIP si >$1M · En Riesgo si >180d sin compra.
 */

// Últimos 8 dígitos: robusto ante +56 9 / 56 9 / 09 y espacios.
const telKey = (t) => {
  const d = String(t || '').replace(/\D/g, '');
  return d.length >= 8 ? d.slice(-8) : '';
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const pedidoId = body?.event?.entity_id || body?.data?.id || body?.pedidoId;
    if (!pedidoId) return Response.json({ error: 'pedidoId requerido' }, { status: 400 });

    const pedido = await base44.asServiceRole.entities.PedidoWeb.get(pedidoId).catch(() => null);
    if (!pedido) return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });

    // Solo pedidos realmente vendidos (no links de pago pendientes)
    const estadosValidos = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
    if (!estadosValidos.includes(pedido.estado)) {
      return Response.json({ ok: true, skipped: true, reason: `estado=${pedido.estado}` });
    }

    const email = (pedido.cliente_email || '').trim().toLowerCase();
    const telefono = pedido.cliente_telefono || '';
    const tKey = telKey(telefono);
    if (!email && !tKey) return Response.json({ ok: true, skipped: true, reason: 'sin_email_ni_telefono' });

    // ── Identificar al cliente: email primero, si no hay → teléfono ──────────
    let cliente = null;
    if (email) {
      const porEmail = await base44.asServiceRole.entities.Cliente.filter({ email });
      cliente = porEmail?.[0] || null;
    }
    if (!cliente && tKey) {
      const candidatos = await base44.asServiceRole.entities.Cliente.list('-updated_date', 500);
      cliente = candidatos.find((c) => telKey(c.telefono) === tKey) || null;
    }

    // ── Historial real del cliente (email o mismo teléfono) ──────────────────
    let historial = [];
    if (email) {
      historial = await base44.asServiceRole.entities.PedidoWeb.filter({ cliente_email: email });
    }
    if (tKey) {
      const recientes = await base44.asServiceRole.entities.PedidoWeb.list('-created_date', 500);
      const porTel = recientes.filter((p) => telKey(p.cliente_telefono) === tKey);
      const vistos = new Set(historial.map((p) => p.id));
      historial = [...historial, ...porTel.filter((p) => !vistos.has(p.id))];
    }
    if (!historial.some((p) => p.id === pedido.id)) historial.push(pedido);

    const pedidosValidos = historial.filter((p) => estadosValidos.includes(p.estado));
    const totalCompras = pedidosValidos.reduce((s, p) => s + (p.total || 0), 0);
    const numPedidos = pedidosValidos.length;
    const ticketPromedio = numPedidos > 0 ? Math.round(totalCompras / numPedidos) : 0;

    // SKU favorito desde items_detalle (fuente de verdad de los pedidos web/WA)
    const skuCount = {};
    pedidosValidos.forEach((p) => {
      (Array.isArray(p.items_detalle) ? p.items_detalle : []).forEach((it) => {
        if (it?.sku) skuCount[it.sku] = (skuCount[it.sku] || 0) + (Number(it.cantidad) || 1);
      });
      if ((!p.items_detalle || p.items_detalle.length === 0) && p.sku) {
        skuCount[p.sku] = (skuCount[p.sku] || 0) + (Number(p.cantidad) || 1);
      }
    });
    const skuFavorito = Object.entries(skuCount).sort((a, b) => b[1] - a[1])[0]?.[0] || cliente?.sku_favorito;

    const fechas = pedidosValidos.map((p) => new Date(p.created_date || p.fecha)).filter((d) => !isNaN(d)).sort((a, b) => b - a);
    const ultimaCompra = fechas[0];
    const diasInactivo = ultimaCompra ? Math.floor((Date.now() - ultimaCompra.getTime()) / 86400000) : 0;

    let estado = cliente?.estado || 'Activo';
    if (totalCompras >= 1_000_000) estado = 'VIP';
    else if (diasInactivo > 180) estado = 'En Riesgo';
    else if (diasInactivo <= 90) estado = 'Activo';

    const esB2B = pedido.tipo_cliente?.startsWith('B2B') || !!pedido.razon_social;
    const desdeWhatsApp = pedido.canal === 'WhatsApp';

    const patch = {
      email: email || cliente?.email || '',
      empresa: cliente?.empresa || pedido.razon_social || pedido.cliente_nombre || (email ? email.split('@')[0] : telefono),
      contacto: cliente?.contacto || pedido.cliente_nombre || '',
      telefono: telefono || cliente?.telefono || '',
      rut: cliente?.rut || pedido.rut_empresa || '',
      tipo: cliente?.tipo || (esB2B ? 'B2B Pyme' : 'B2C Recurrente'),
      estado,
      fecha_primera_compra: cliente?.fecha_primera_compra || fechas[fechas.length - 1]?.toISOString().split('T')[0],
      fecha_ultima_compra: ultimaCompra?.toISOString().split('T')[0],
      total_compras_clp: totalCompras,
      num_pedidos: numPedidos,
      ticket_promedio: ticketPromedio,
      sku_favorito: skuFavorito,
      canal_preferido: desdeWhatsApp ? 'WhatsApp' : (cliente?.canal_preferido || 'Web'),
      personalizacion_habitual: cliente?.personalizacion_habitual || !!pedido.requiere_personalizacion,
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
      ok: true, action, cliente_id: cliente.id, canal: pedido.canal,
      total_compras_clp: totalCompras, num_pedidos: numPedidos, estado,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});