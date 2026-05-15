// ============================================================================
// syncClienteFromVentaTienda — Cliente 360° desde tienda física
// ----------------------------------------------------------------------------
// Trigger entity al crear una VentaTienda. Si hay teléfono o nombre, crea/
// actualiza una ficha Cliente para que las ventas presenciales también
// alimenten el CRM (Cliente 360°), no solo las ventas web.
//
// Match strategy: por teléfono (más confiable en tienda) o por nombre exacto.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const ventaId = body?.event?.entity_id || body?.data?.id;
    if (!ventaId) return Response.json({ ok: true, skipped: 'sin_id' });

    const ventas = await base44.asServiceRole.entities.VentaTienda.filter({ id: ventaId });
    const venta = ventas?.[0];
    if (!venta) return Response.json({ ok: true, skipped: 'no_encontrado' });

    const telefono = (venta.cliente_telefono || '').trim();
    const nombre = (venta.cliente_nombre || '').trim();

    // Sin teléfono ni nombre no podemos identificar al cliente
    if (!telefono && !nombre) {
      return Response.json({ ok: true, skipped: 'sin_identificador' });
    }

    // Match por teléfono (preferido) o nombre
    let existing = null;
    if (telefono) {
      const byPhone = await base44.asServiceRole.entities.Cliente.filter({ telefono });
      existing = byPhone?.[0];
    }
    if (!existing && nombre) {
      const byName = await base44.asServiceRole.entities.Cliente.filter({ empresa: nombre });
      existing = byName?.[0];
    }

    const now = new Date().toISOString();
    const fechaCompra = venta.fecha || now.split('T')[0];
    const monto = Number(venta.total) || 0;

    if (existing) {
      // Update: incrementar agregados
      const numPedidos = (existing.num_pedidos || 0) + 1;
      const totalCompras = (existing.total_compras_clp || 0) + monto;
      const ticketPromedio = Math.round(totalCompras / numPedidos);

      await base44.asServiceRole.entities.Cliente.update(existing.id, {
        fecha_ultima_compra: fechaCompra,
        total_compras_clp: totalCompras,
        num_pedidos: numPedidos,
        ticket_promedio: ticketPromedio,
        canal_preferido: 'Tienda Física',
        estado: totalCompras >= 1_000_000 ? 'VIP' : (existing.estado || 'Activo'),
      });
      return Response.json({ ok: true, action: 'updated', cliente_id: existing.id });
    }

    // Create: nuevo cliente desde tienda
    const nuevo = await base44.asServiceRole.entities.Cliente.create({
      empresa: nombre || `Cliente tienda · ${telefono || 'sin-tel'}`,
      contacto: nombre || '',
      telefono,
      tipo: venta.tipo_venta === 'Regalo corporativo' ? 'B2B Pyme' : 'Tienda Física',
      estado: 'Activo',
      fecha_primera_compra: fechaCompra,
      fecha_ultima_compra: fechaCompra,
      total_compras_clp: monto,
      num_pedidos: 1,
      ticket_promedio: monto,
      sku_favorito: venta.sku,
      canal_preferido: 'Tienda Física',
      personalizacion_habitual: !!venta.personalizacion_laser,
    });

    return Response.json({ ok: true, action: 'created', cliente_id: nuevo.id });
  } catch (err) {
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
});