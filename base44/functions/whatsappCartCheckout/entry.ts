import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// whatsappCartCheckout — Carrito MULTI-ITEM por WhatsApp.
// ----------------------------------------------------------------------------
// El agente llama esta función cuando el cliente quiere comprar VARIOS productos
// en un solo pedido. Acepta un array de items [{sku, cantidad, color?, 
// personalizacion?}], calcula precios reales + envío, crea el PedidoWeb con
// items_detalle completo y genera un único link de pago MercadoPago.
//
// Payload:
//   { items: [{sku, cantidad, color?, personalizacion?}], cliente_nombre,
//     cliente_telefono, cliente_email?, comuna, direccion, tipo_documento? }
// ============================================================================

const normalizar = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { items, cliente_nombre, cliente_telefono, cliente_email, comuna, direccion, tipo_documento = 'Boleta' } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Se necesita al menos 1 item. Formato: items:[{sku, cantidad}]' }, { status: 400 });
    }
    const faltan = [];
    if (!cliente_nombre) faltan.push('cliente_nombre');
    if (!cliente_telefono) faltan.push('cliente_telefono');
    if (!comuna) faltan.push('comuna');
    if (!direccion) faltan.push('direccion');
    if (faltan.length) {
      return Response.json({ error: `Faltan datos: ${faltan.join(', ')}.` }, { status: 400 });
    }

    // ── Pre-pass: productos + unidades TOTALES por SKU ──────────────────────
    // Los colores NO dividen los beneficios: 4 azules + 2 negros + 4 rojos del
    // mismo SKU = 10u → grabado GRATIS y precio por volumen.
    const productosCache = {};
    const qtyPorSku = {};
    for (const item of items) {
      const qty = Math.max(1, Math.round(Number(item.cantidad) || 1));
      if (!(item.sku in productosCache)) {
        const productos = await base44.asServiceRole.entities.Producto.filter({ sku: item.sku });
        productosCache[item.sku] = productos?.[0] || null;
      }
      qtyPorSku[item.sku] = (qtyPorSku[item.sku] || 0) + qty;
    }

    // Precio unitario con beneficio por volumen — MISMA regla que la web:
    // ≥10u mismo SKU → precio mayorista B2B (tramos oficiales + IVA, si es
    // menor que el B2C) · 3+u → −15% · 2u → −10% · 1u → precio B2C normal.
    const TRAMOS = [
      { min: 2000, key: 't2000_mas' }, { min: 1000, key: 't1000_1999' },
      { min: 500, key: 't500_999' }, { min: 250, key: 't250_499' },
      { min: 100, key: 't100_249' }, { min: 50, key: 't50_99' }, { min: 10, key: 't10_49' },
    ];
    const precioConVolumen = (prod, unidadesSku) => {
      const b2c = prod.precio_b2c;
      const tramos = prod.precio_b2b_tramos;
      if (unidadesSku >= 10 && tramos && typeof tramos === 'object') {
        const idx = TRAMOS.findIndex(t => unidadesSku >= t.min);
        for (let i = idx; i < TRAMOS.length; i++) {
          const neto = Number(tramos[TRAMOS[i].key]);
          if (Number.isFinite(neto) && neto > 0) {
            const conIva = Math.round(neto * 1.19);
            if (conIva < b2c) return { precio: conIva, beneficio: `precio mayorista ${unidadesSku}u` };
            break;
          }
        }
      }
      if (unidadesSku >= 3) return { precio: Math.round(b2c * 0.85), beneficio: `-15% por ${unidadesSku}u` };
      if (unidadesSku === 2) return { precio: Math.round(b2c * 0.90), beneficio: '-10% por 2u' };
      return { precio: b2c, beneficio: '' };
    };

    // Validar items y armar el detalle
    const itemsDetalle = [];
    let subtotal = 0;
    let ahorroVolumen = 0;
    let feePersonalizacion = 0;
    const errores = [];
    const beneficios = [];

    for (const item of items) {
      const qty = Math.max(1, Math.round(Number(item.cantidad) || 1));
      const prod = productosCache[item.sku];
      if (!prod || prod.activo === false) {
        errores.push(`SKU "${item.sku}" no encontrado o inactivo.`);
        continue;
      }
      if (!prod.precio_b2c || prod.precio_b2c <= 0) {
        errores.push(`${prod.nombre} no tiene precio B2C.`);
        continue;
      }
      // Stock check (global o por color)
      if (item.color && prod.stock_por_color) {
        const stockColor = prod.stock_por_color[item.color];
        if (typeof stockColor === 'number' && stockColor < qty) {
          errores.push(`Stock insuficiente: ${prod.nombre} color ${item.color} (${stockColor}u disp).`);
          continue;
        }
      } else if (typeof prod.stock_actual === 'number' && prod.stock_actual < qty) {
        errores.push(`Stock insuficiente: ${prod.nombre} (${prod.stock_actual}u disp).`);
        continue;
      }

      const unidadesSku = qtyPorSku[item.sku];
      const { precio: precioUnit, beneficio } = precioConVolumen(prod, unidadesSku);
      const etiqueta = beneficio ? `${prod.nombre}: ${beneficio}` : '';
      if (etiqueta && !beneficios.includes(etiqueta)) beneficios.push(etiqueta);
      ahorroVolumen += Math.max(0, (prod.precio_b2c - precioUnit) * qty);
      subtotal += precioUnit * qty;

      // Fee personalización láser: gratis desde 10u del MISMO SKU sumando
      // TODOS los colores/líneas de ese SKU en el carrito.
      const tienePers = !!(item.personalizacion || item.logo_url);
      let feeLinea = 0;
      if (tienePers && unidadesSku < (prod.personalizacion_gratis_desde || 10)) {
        feeLinea = 2000 * qty; // $2.000/u por debajo del MOQ
        feePersonalizacion += feeLinea;
      }

      itemsDetalle.push({
        sku: prod.sku,
        nombre: prod.nombre,
        color: item.color || '',
        personalizacion: item.personalizacion || '',
        tipo_personalizacion: item.logo_url ? 'archivo' : (item.personalizacion ? 'frase' : ''),
        fee_personalizacion: feeLinea,
        logo_url: item.logo_url || '',
        mockup_url: item.mockup_url || '',
        posicion_grabado: item.posicion_grabado || '',
        precio_unitario: precioUnit,
        cantidad: qty,
      });
    }

    if (itemsDetalle.length === 0) {
      return Response.json({ error: `No se pudo armar el carrito: ${errores.join(' ')}` }, { status: 400 });
    }

    // Envío (1 solo shipment para todo el carrito)
    let costoEnvio = 4990;
    const tarifas = await base44.asServiceRole.entities.TarifaBluex.filter({
      servicio: 'EXPRESS',
      comuna_normalizada: normalizar(comuna),
    }).catch(() => []);
    if (tarifas?.[0]?.tarifa_base > 0) costoEnvio = Math.round(tarifas[0].tarifa_base);

    const total = subtotal + feePersonalizacion + costoEnvio;
    const numeroPedido = `WA-${Date.now().toString().slice(-8)}`;
    const descItems = itemsDetalle.map(i => `${i.cantidad}x ${i.nombre}${i.color ? ` (${i.color})` : ''}${i.personalizacion ? ` · grabado: ${i.personalizacion}` : ''}`).join(' · ');

    const pedido = await base44.asServiceRole.entities.PedidoWeb.create({
      numero_pedido: numeroPedido,
      fecha: new Date().toISOString(),
      canal: 'WhatsApp',
      tipo_cliente: 'B2C Individual',
      tipo_documento,
      cliente_nombre,
      cliente_telefono,
      cliente_email: cliente_email || '',
      sku: itemsDetalle[0].sku,
      descripcion_items: descItems,
      items_detalle: itemsDetalle,
      cantidad: itemsDetalle.reduce((s, i) => s + i.cantidad, 0),
      subtotal,
      fee_personalizacion: feePersonalizacion,
      costo_envio: costoEnvio,
      total,
      medio_pago: 'MercadoPago',
      estado: 'Nuevo',
      payment_status: 'pending_mp',
      requiere_personalizacion: itemsDetalle.some(i => !!i.personalizacion || !!i.logo_url),
      texto_personalizacion: itemsDetalle.map(i => i.personalizacion).filter(Boolean).join('; '),
      logo_url: itemsDetalle.find(i => i.logo_url)?.logo_url || '',
      mockup_url: itemsDetalle.find(i => i.mockup_url)?.mockup_url || '',
      logo_recibido: itemsDetalle.some(i => !!i.logo_url),
      ciudad: comuna,
      direccion_envio: `${direccion}, ${comuna}`,
      courier: 'BlueExpress',
      historial: [{
        at: new Date().toISOString(),
        type: 'created',
        actor: 'agente_whatsapp',
        channel: 'whatsapp',
        detail: `Pedido multi-item creado por WhatsApp · ${descItems}`,
      }],
    });

    // Link de pago MP
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) return Response.json({ error: 'MERCADOPAGO_ACCESS_TOKEN no configurado' }, { status: 500 });

    const origin = 'https://peyuchile.cl';
    const preference = {
      items: [{
        id: numeroPedido,
        title: `PEYU Chile · Pedido ${numeroPedido}`,
        description: descItems.slice(0, 250),
        quantity: 1,
        currency_id: 'CLP',
        unit_price: total,
      }],
      external_reference: numeroPedido,
      metadata: { pedido_id: pedido.id, numero_pedido: numeroPedido },
      payer: { name: cliente_nombre, email: cliente_email || '', phone: { number: cliente_telefono } },
      back_urls: {
        success: `${origin}/gracias?numero=${encodeURIComponent(numeroPedido)}&email=${encodeURIComponent(cliente_email || '')}&total=${total}&mp=success`,
        pending: `${origin}/gracias?numero=${encodeURIComponent(numeroPedido)}&email=${encodeURIComponent(cliente_email || '')}&total=${total}&mp=pending`,
        failure: `${origin}/CarritoNuevo?mp=failure&numero=${encodeURIComponent(numeroPedido)}`,
      },
      auto_return: 'approved',
      notification_url: `https://app.base44.com/api/apps/${Deno.env.get('BASE44_APP_ID')}/functions/mpWebhook`,
      statement_descriptor: 'PEYU CHILE',
      binary_mode: false,
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preference),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok || !mpData.init_point) {
      return Response.json({ error: 'Pedido creado pero falló el link de pago. N° ' + numeroPedido }, { status: 500 });
    }

    await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
      mp_preference_id: mpData.id,
      expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }).catch(() => {});

    return Response.json({
      numero_pedido: numeroPedido,
      items: itemsDetalle.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, color: i.color, personalizacion: i.personalizacion, precio: i.precio_unitario * i.cantidad })),
      subtotal,
      fee_personalizacion: feePersonalizacion,
      costo_envio: costoEnvio,
      total,
      link_pago: mpData.init_point,
      errores: errores.length ? errores : undefined,
      ahorro_volumen: ahorroVolumen > 0 ? ahorroVolumen : undefined,
      beneficios: beneficios.length ? beneficios : undefined,
      resumen: `${descItems}\nSubtotal: $${subtotal.toLocaleString('es-CL')}${ahorroVolumen > 0 ? `\n💚 Precio por volumen aplicado — ahorras $${ahorroVolumen.toLocaleString('es-CL')} (${beneficios.join(' · ')})` : ''}${feePersonalizacion > 0 ? `\nGrabado láser: $${feePersonalizacion.toLocaleString('es-CL')}` : ''}\nEnvío (${comuna}): $${costoEnvio.toLocaleString('es-CL')}\n*Total: $${total.toLocaleString('es-CL')} CLP (IVA incl.)*`,
      seguimiento: 'https://peyuchile.cl/seguimiento',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});