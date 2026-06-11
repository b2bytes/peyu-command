// ============================================================================
// whatsappCheckoutLink — Venta directa por WhatsApp (agente Peyu).
// ----------------------------------------------------------------------------
// El agente de WhatsApp llama esta función cuando el cliente ya decidió comprar.
// Crea un PedidoWeb (canal WhatsApp) con precio REAL del catálogo + envío según
// comuna (TarifaBluex), y genera el link de pago MercadoPago reutilizando
// mpCreatePreference (mismo webhook de confirmación que la web).
// Devuelve: { numero_pedido, total, link_pago, resumen }
// ============================================================================

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const normalizar = (s) => (s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      sku,
      cantidad = 1,
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      comuna,
      direccion,
      personalizacion, // texto opcional de grabado
    } = body;

    // Validaciones mínimas para que el agente pida los datos que faltan.
    const faltan = [];
    if (!sku) faltan.push('sku');
    if (!cliente_nombre) faltan.push('cliente_nombre');
    if (!cliente_telefono) faltan.push('cliente_telefono');
    if (!comuna) faltan.push('comuna');
    if (!direccion) faltan.push('direccion');
    if (faltan.length) {
      return Response.json({ error: `Faltan datos: ${faltan.join(', ')}. Pídeselos al cliente antes de generar el link.` }, { status: 400 });
    }

    const qty = Math.max(1, Math.round(Number(cantidad) || 1));

    // Producto real del catálogo (precio B2C con IVA incluido).
    const productos = await base44.asServiceRole.entities.Producto.filter({ sku });
    const producto = productos?.[0];
    if (!producto || producto.activo === false) {
      return Response.json({ error: `Producto con SKU "${sku}" no encontrado o inactivo. Usa el SKU exacto del catálogo.` }, { status: 404 });
    }
    if (!producto.precio_b2c || producto.precio_b2c <= 0) {
      return Response.json({ error: `El producto ${producto.nombre} no tiene precio B2C definido. Escala al equipo.` }, { status: 400 });
    }
    if (typeof producto.stock_actual === 'number' && producto.stock_actual < qty) {
      return Response.json({ error: `Stock insuficiente: quedan ${producto.stock_actual}u de ${producto.nombre}.` }, { status: 400 });
    }

    // Envío según comuna (tarifario BlueExpress EXPRESS); fallback conservador.
    let costoEnvio = 4990;
    const tarifas = await base44.asServiceRole.entities.TarifaBluex.filter({
      servicio: 'EXPRESS',
      comuna_normalizada: normalizar(comuna),
    }).catch(() => []);
    if (tarifas?.[0]?.tarifa_base > 0) costoEnvio = Math.round(tarifas[0].tarifa_base);

    const subtotal = Math.round(producto.precio_b2c * qty);
    const total = subtotal + costoEnvio;

    const numeroPedido = `WA-${Date.now().toString().slice(-8)}`;
    const descItems = `${qty}x ${producto.nombre} (${producto.sku})${personalizacion ? ` · Grabado: ${personalizacion}` : ''}`;

    const pedido = await base44.asServiceRole.entities.PedidoWeb.create({
      numero_pedido: numeroPedido,
      fecha: new Date().toISOString(),
      canal: 'WhatsApp',
      tipo_cliente: 'B2C Individual',
      cliente_nombre,
      cliente_telefono,
      cliente_email: cliente_email || '',
      sku: producto.sku,
      descripcion_items: descItems,
      items_detalle: [{
        sku: producto.sku,
        nombre: producto.nombre,
        personalizacion: personalizacion || '',
        precio_unitario: producto.precio_b2c,
        cantidad: qty,
      }],
      cantidad: qty,
      subtotal,
      costo_envio: costoEnvio,
      total,
      medio_pago: 'MercadoPago',
      estado: 'Nuevo',
      payment_status: 'pending_mp',
      requiere_personalizacion: !!personalizacion,
      texto_personalizacion: personalizacion || '',
      ciudad: comuna,
      direccion_envio: `${direccion}, ${comuna}`,
      courier: 'BlueExpress',
      historial: [{
        at: new Date().toISOString(),
        type: 'created',
        actor: 'agente_whatsapp',
        channel: 'whatsapp',
        detail: `Pedido creado por venta directa WhatsApp · ${descItems}`,
      }],
    });

    // Link de pago MP — reutiliza la lógica oficial (webhook + back_urls).
    const mpRes = await base44.asServiceRole.functions.invoke('mpCreatePreference', { pedido_id: pedido.id });
    const linkPago = mpRes?.data?.init_point;
    if (!linkPago) {
      return Response.json({ error: 'Pedido creado pero falló el link de pago. Escala al equipo con el número ' + numeroPedido }, { status: 500 });
    }

    return Response.json({
      numero_pedido: numeroPedido,
      total,
      subtotal,
      costo_envio: costoEnvio,
      link_pago: linkPago,
      resumen: `${descItems} · Subtotal $${subtotal.toLocaleString('es-CL')} + Envío $${costoEnvio.toLocaleString('es-CL')} (${comuna}) = Total $${total.toLocaleString('es-CL')} CLP (IVA incl.)`,
      seguimiento: `https://peyuchile.cl/seguimiento`,
    });
  } catch (error) {
    console.error('whatsappCheckoutLink error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});