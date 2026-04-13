import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data: pedido, event } = body;

    if (!pedido || event?.type !== 'create') {
      return Response.json({ ok: true, skip: true });
    }

    const tareas = [];

    // ── 1. EMAIL DE CONFIRMACIÓN AL CLIENTE ──────────────────────────
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

¿Preguntas? Escríbenos al +56 9 3504 0242 (WhatsApp) o a ventas@peyuchile.cl.

Gracias por elegir Peyu — Plástico que renace 🐢♻️

—El equipo de Peyu Chile
Francisco Bilbao 3775, local 6, Providencia · peyuchile.cl
          `.trim(),
        })
      );
    }

    // ── 2. EMAIL INTERNO AL EQUIPO ───────────────────────────────────
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

Número de pedido: ${pedido.numero_pedido}
Total: $${(pedido.total || 0).toLocaleString('es-CL')}
Envío: $${(pedido.costo_envio || 0).toLocaleString('es-CL')}
Medio de pago: ${pedido.medio_pago || 'WebPay'}

Productos:
${pedido.descripcion_items || '—'}

${pedido.requiere_personalizacion ? '⚠️ REQUIERE PERSONALIZACIÓN LÁSER — contactar al cliente para coordinar.\n' : ''}

Gestionar en: /ecommerce
        `.trim(),
      })
    );

    // ── 3. DESCUENTO DE STOCK (si hay SKU definido) ───────────────────
    if (pedido.sku && pedido.cantidad) {
      try {
        const productos = await base44.asServiceRole.entities.Producto.filter({ sku: pedido.sku });
        if (productos.length > 0) {
          const prod = productos[0];
          const stockActual = prod.stock_actual || 0;
          const nuevoStock = Math.max(0, stockActual - pedido.cantidad);
          await base44.asServiceRole.entities.Producto.update(prod.id, { stock_actual: nuevoStock });
        }
      } catch (e) {
        console.warn('Stock update failed (non-critical):', e.message);
      }
    }

    // ── 4. CREAR PersonalizationJob si requiere personalización ──────
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
      } catch (e) {
        console.warn('PersonalizationJob creation failed:', e.message);
      }
    }

    await Promise.allSettled(tareas);

    return Response.json({ ok: true, pedido: pedido.numero_pedido });
  } catch (error) {
    console.error('onNewPedidoWeb error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});