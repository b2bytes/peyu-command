import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Al crear un PedidoWeb:
 *  1. Email confirmación al cliente
 *  2. Email interno al equipo
 *  3. Descuenta stock
 *  4. Crea PersonalizationJob si requiere láser
 *  5. ✨ NUEVO: Upsert perfil Cliente (CLV, ticket promedio, segmento)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { data: pedido, event } = body;

    if (!pedido || event?.type !== 'create') {
      return Response.json({ ok: true, skip: true });
    }

    const tareas = [];

    // ── 1. EMAIL CLIENTE ──────────────────────────────────────────
    if (pedido.cliente_email) {
      const itemsTexto = pedido.descripcion_items || 'Ver detalle en tienda';
      const envioTexto = pedido.costo_envio === 0 ? 'GRATIS' : `$${(pedido.costo_envio || 0).toLocaleString('es-CL')}`;

      tareas.push(
        base44.asServiceRole.integrations.Core.SendEmail({
          to: pedido.cliente_email,
          from_name: 'Peyu Chile',
          subject: `✅ Pedido recibido ${pedido.numero_pedido} — Peyu Chile`,
          body: `
Hola ${pedido.cliente_nombre || 'cliente'},

¡Tu pedido fue recibido exitosamente! 🎉

📦 Número de pedido: ${pedido.numero_pedido}
📅 Fecha: ${pedido.fecha || new Date().toLocaleDateString('es-CL')}
💰 Total: $${(pedido.total || 0).toLocaleString('es-CL')}
🚚 Envío: ${envioTexto}
📍 Ciudad: ${pedido.ciudad || 'No especificada'}

Productos:
${itemsTexto}

${pedido.requiere_personalizacion ? '✨ Tu pedido incluye personalización láser UV. Te contactaremos para coordinar los detalles del grabado.\n\n' : ''}
Tiempo de despacho estimado: 3–7 días hábiles.

Seguimiento: https://peyuchile.cl/seguimiento?pedido=${pedido.numero_pedido}

¿Preguntas? WhatsApp +56 9 3504 0242 o ventas@peyuchile.cl.

Gracias por elegir Peyu — Plástico que renace 🐢♻️

—El equipo de Peyu Chile
          `.trim(),
        })
      );
    }

    // ── 2. EMAIL INTERNO ──────────────────────────────────────────
    tareas.push(
      base44.asServiceRole.integrations.Core.SendEmail({
        to: 'ventas@peyuchile.cl',
        from_name: 'Sistema Peyu',
        subject: `🛒 Nuevo pedido web: ${pedido.numero_pedido} — $${(pedido.total || 0).toLocaleString('es-CL')}`,
        body: `
Nuevo pedido recibido desde la tienda web.

Cliente: ${pedido.cliente_nombre}
Email: ${pedido.cliente_email}
Teléfono: ${pedido.cliente_telefono || '—'}
Ciudad: ${pedido.ciudad || '—'}
Tipo: ${pedido.tipo_cliente || 'B2C Individual'}

Número de pedido: ${pedido.numero_pedido}
Total: $${(pedido.total || 0).toLocaleString('es-CL')}
Medio de pago: ${pedido.medio_pago || 'WebPay'}

Productos:
${pedido.descripcion_items || '—'}

${pedido.requiere_personalizacion ? '⚠️ REQUIERE PERSONALIZACIÓN LÁSER\n' : ''}
Procesar en: /admin/procesar-pedidos
        `.trim(),
      })
    );

    // ── 3. STOCK ──────────────────────────────────────────────────
    if (pedido.sku && pedido.cantidad) {
      try {
        const productos = await base44.asServiceRole.entities.Producto.filter({ sku: pedido.sku });
        if (productos.length > 0) {
          const prod = productos[0];
          const nuevoStock = Math.max(0, (prod.stock_actual || 0) - pedido.cantidad);
          await base44.asServiceRole.entities.Producto.update(prod.id, { stock_actual: nuevoStock });
        }
      } catch (e) { console.warn('Stock update failed:', e.message); }
    }

    // ── 4. PERSONALIZATION JOB ────────────────────────────────────
    if (pedido.requiere_personalizacion && pedido.texto_personalizacion) {
      try {
        await base44.asServiceRole.entities.PersonalizationJob.create({
          source_type: 'Pedido B2C',
          source_id: pedido.id,
          product_name: pedido.sku || 'Producto web',
          quantity: pedido.cantidad || 1,
          laser_required: true,
          laser_text: pedido.texto_personalizacion,
          status: 'Pendiente',
          customer_name: pedido.cliente_nombre,
          customer_email: pedido.cliente_email,
        });
      } catch (e) { console.warn('PersonalizationJob creation failed:', e.message); }
    }

    // ── 5. ✨ UPSERT PERFIL CLIENTE (CLV, ticket, segmento) ──────
    if (pedido.cliente_email) {
      try {
        const existing = await base44.asServiceRole.entities.Cliente.filter({ email: pedido.cliente_email });
        const hoy = new Date().toISOString().slice(0, 10);

        if (existing.length > 0) {
          // Cliente recurrente: actualizar CLV
          const c = existing[0];
          const numPedidos = (c.num_pedidos || 0) + 1;
          const total = (c.total_compras_clp || 0) + (pedido.total || 0);
          const ticket = Math.round(total / numPedidos);

          // Detectar si es VIP (>3 pedidos o >500k CLP)
          let estado = c.estado;
          if (numPedidos >= 3 || total >= 500000) estado = 'VIP';
          else if (!estado || estado === 'En Riesgo') estado = 'Activo';

          await base44.asServiceRole.entities.Cliente.update(c.id, {
            num_pedidos: numPedidos,
            total_compras_clp: total,
            ticket_promedio: ticket,
            fecha_ultima_compra: hoy,
            estado,
            sku_favorito: pedido.sku || c.sku_favorito,
            canal_preferido: 'Web',
          });
        } else {
          // Cliente nuevo
          await base44.asServiceRole.entities.Cliente.create({
            empresa: pedido.cliente_nombre || 'Sin nombre',
            contacto: pedido.cliente_nombre,
            email: pedido.cliente_email,
            telefono: pedido.cliente_telefono,
            tipo: pedido.tipo_cliente?.includes('B2B') ? 'B2B Pyme' : 'B2C Recurrente',
            estado: 'Activo',
            fecha_primera_compra: hoy,
            fecha_ultima_compra: hoy,
            total_compras_clp: pedido.total || 0,
            num_pedidos: 1,
            ticket_promedio: pedido.total || 0,
            sku_favorito: pedido.sku,
            canal_preferido: 'Web',
            pagos_al_dia: true,
          });
        }
      } catch (e) { console.warn('Cliente upsert failed:', e.message); }
    }

    await Promise.allSettled(tareas);
    return Response.json({ ok: true, pedido: pedido.numero_pedido });
  } catch (error) {
    console.error('onNewPedidoWeb error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});