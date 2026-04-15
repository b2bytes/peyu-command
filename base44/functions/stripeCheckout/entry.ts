import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Stripe Checkout Session Creator
 * 
 * Creates a Stripe Checkout session for B2C orders.
 * Called from the cart when customer selects Stripe as payment method.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { pedidoId, total, email, nombre, items } = await req.json();

    if (!pedidoId || !total) {
      return Response.json({ error: 'pedidoId y total requeridos' }, { status: 400 });
    }

    // Get Stripe secret key from secrets
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return Response.json({ 
        error: 'Stripe no configurado. Agrega STRIPE_SECRET_KEY en variables de entorno.' 
      }, { status: 500 });
    }

    // Get the order to validate
    const orders = await base44.asServiceRole.entities.PedidoWeb.filter({ id: pedidoId });
    if (!orders || orders.length === 0) {
      return Response.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }
    const order = orders[0];

    // Build line items for Stripe
    const lineItems = items?.map((item: any) => ({
      price_data: {
        currency: 'clp',
        product_data: {
          name: item.nombre || 'Producto Peyu',
          description: item.personalizacion ? `Con personalizacion: ${item.personalizacion}` : undefined,
        },
        unit_amount: Math.round(item.precio * 100) / item.cantidad, // Convert to cents per unit
      },
      quantity: item.cantidad || 1,
    })) || [{
      price_data: {
        currency: 'clp',
        product_data: {
          name: `Pedido ${order.numero_pedido}`,
        },
        unit_amount: total,
      },
      quantity: 1,
    }];

    // Create Stripe session
    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': `${Deno.env.get('PUBLIC_URL') || 'https://peyu.cl'}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}&pedido=${pedidoId}`,
        'cancel_url': `${Deno.env.get('PUBLIC_URL') || 'https://peyu.cl'}/carrito`,
        'customer_email': email || order.cliente_email,
        'client_reference_id': pedidoId,
        'metadata[pedido_id]': pedidoId,
        'metadata[numero_pedido]': order.numero_pedido || '',
        'line_items[0][price_data][currency]': 'clp',
        'line_items[0][price_data][product_data][name]': `Pedido ${order.numero_pedido}`,
        'line_items[0][price_data][unit_amount]': String(total),
        'line_items[0][quantity]': '1',
      }),
    });

    const session = await sessionResponse.json();

    if (session.error) {
      console.error('Stripe error:', session.error);
      return Response.json({ error: session.error.message }, { status: 400 });
    }

    // Update order with Stripe session ID
    await base44.asServiceRole.entities.PedidoWeb.update(pedidoId, {
      stripe_session_id: session.id,
      estado: 'Pendiente Pago',
    });

    return Response.json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
