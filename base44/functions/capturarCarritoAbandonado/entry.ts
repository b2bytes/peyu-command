import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Captura un carrito en proceso de checkout.
 * Llamado desde el frontend cuando el usuario ingresa su email en el carrito.
 * Si en 1 hora no completa el pedido, se enviará un recordatorio automático.
 *
 * Lógica anti-duplicado:
 * - Si ya existe un CarritoAbandonado pendiente con el mismo email del último día,
 *   se actualiza en lugar de crear uno nuevo.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email, nombre, telefono, carrito_items, subtotal, total } = body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return Response.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (!Array.isArray(carrito_items) || carrito_items.length === 0) {
      return Response.json({ error: 'Carrito vacío' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Buscar si ya existe un carrito pendiente reciente del mismo email
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const existing = await base44.asServiceRole.entities.CarritoAbandonado.filter({
      email,
      estado: 'Pendiente',
    });
    const recent = (existing || []).find((c) => c.captured_at && c.captured_at > yesterday);

    const itemsLite = carrito_items.slice(0, 10).map((i) => ({
      nombre: String(i.nombre || '').slice(0, 120),
      cantidad: Number(i.cantidad) || 1,
      precio: Number(i.precio) || 0,
      imagen: String(i.imagen || ''),
      personalizacion: String(i.personalizacion || ''),
    }));

    // 🔗 Enriquecer: cruzar email con Cliente y ChatLead existentes
    // para tener visión 360° del prospecto en el panel admin.
    let clienteConocidoId = null;
    let chatLeadId = null;
    try {
      const clientes = await base44.asServiceRole.entities.Cliente.filter({ email });
      if (clientes?.[0]) clienteConocidoId = clientes[0].id;
    } catch {}
    try {
      const chatLeads = await base44.asServiceRole.entities.ChatLead.filter({ email });
      if (chatLeads?.[0]) chatLeadId = chatLeads[0].id;
    } catch {}

    const payload = {
      email,
      nombre: nombre || '',
      telefono: telefono || '',
      carrito_items: itemsLite,
      subtotal: Number(subtotal) || 0,
      total: Number(total) || 0,
      estado: 'Pendiente',
      captured_at: now,
      cliente_conocido_id: clienteConocidoId,
      chat_lead_id: chatLeadId,
    };

    let record;
    if (recent) {
      record = await base44.asServiceRole.entities.CarritoAbandonado.update(recent.id, payload);
    } else {
      record = await base44.asServiceRole.entities.CarritoAbandonado.create(payload);
    }

    return Response.json({ success: true, id: record?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});