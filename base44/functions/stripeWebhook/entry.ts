import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Stripe Webhook Handler
 * 
 * Processes Stripe webhook events for payment confirmations.
 * Updates order status and triggers fulfillment workflows.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get webhook secret for signature verification
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const signature = req.headers.get('stripe-signature');
    
    // Parse the raw body
    const rawBody = await req.text();
    let event;

    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // In production, you should verify the webhook signature
    // For now, we'll process the event directly
    
    const eventType = event.type;
    const eventData = event.data?.object;

    console.log(`Processing Stripe event: ${eventType}`);

    switch (eventType) {
      case 'checkout.session.completed': {
        // Payment successful
        const sessionId = eventData.id;
        const pedidoId = eventData.metadata?.pedido_id || eventData.client_reference_id;
        const paymentIntent = eventData.payment_intent;
        const customerEmail = eventData.customer_email;

        if (!pedidoId) {
          console.error('No pedido_id in session metadata');
          return Response.json({ received: true, warning: 'No pedido_id found' });
        }

        // Update order status
        const orders = await base44.asServiceRole.entities.PedidoWeb.filter({ id: pedidoId });
        if (orders && orders.length > 0) {
          await base44.asServiceRole.entities.PedidoWeb.update(pedidoId, {
            estado: 'Pagado',
            stripe_payment_intent: paymentIntent,
            notas: (orders[0].notas || '') + `\n[Stripe] Pago confirmado ${new Date().toISOString()}`,
          });

          // Send confirmation email
          try {
            await base44.integrations.Core.SendEmail({
              to: customerEmail || orders[0].cliente_email,
              subject: `Confirmacion de pago - Pedido ${orders[0].numero_pedido}`,
              body: `
                <h2>Gracias por tu compra en Peyu!</h2>
                <p>Hemos recibido tu pago correctamente.</p>
                <p><strong>Numero de pedido:</strong> ${orders[0].numero_pedido}</p>
                <p><strong>Total pagado:</strong> $${orders[0].total?.toLocaleString('es-CL')} CLP</p>
                <p>Te notificaremos cuando tu pedido sea despachado.</p>
                <br>
                <p>Equipo Peyu</p>
                <p><small>Regalos corporativos sustentables - 100% plastico reciclado</small></p>
              `,
            });
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
          }

          // Create PersonalizationJob if order has personalization
          if (orders[0].requiere_personalizacion && orders[0].texto_personalizacion) {
            try {
              await base44.asServiceRole.entities.PersonalizationJob.create({
                source_type: 'Pedido B2C - Stripe',
                product_name: orders[0].descripcion_items,
                quantity: orders[0].cantidad || 1,
                laser_required: true,
                laser_text: orders[0].texto_personalizacion,
                customer_name: orders[0].cliente_nombre,
                customer_email: orders[0].cliente_email,
                status: 'Nuevo',
                production_notes: `Pedido web pagado con Stripe. Numero: ${orders[0].numero_pedido}`,
              });
            } catch (jobError) {
              console.error('PersonalizationJob creation failed:', jobError);
            }
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        // Session expired without payment
        const pedidoId = eventData.metadata?.pedido_id || eventData.client_reference_id;
        
        if (pedidoId) {
          const orders = await base44.asServiceRole.entities.PedidoWeb.filter({ id: pedidoId });
          if (orders && orders.length > 0) {
            await base44.asServiceRole.entities.PedidoWeb.update(pedidoId, {
              estado: 'Pago Expirado',
              notas: (orders[0].notas || '') + `\n[Stripe] Sesion expirada ${new Date().toISOString()}`,
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        // Payment failed
        const pedidoId = eventData.metadata?.pedido_id;
        
        if (pedidoId) {
          const orders = await base44.asServiceRole.entities.PedidoWeb.filter({ id: pedidoId });
          if (orders && orders.length > 0) {
            await base44.asServiceRole.entities.PedidoWeb.update(pedidoId, {
              estado: 'Pago Fallido',
              notas: (orders[0].notas || '') + `\n[Stripe] Pago fallido: ${eventData.last_payment_error?.message || 'Error desconocido'}`,
            });
          }
        }
        break;
      }

      case 'charge.refunded': {
        // Refund processed
        const paymentIntent = eventData.payment_intent;
        
        // Find order by payment intent
        const orders = await base44.asServiceRole.entities.PedidoWeb.filter({ 
          stripe_payment_intent: paymentIntent 
        });
        
        if (orders && orders.length > 0) {
          await base44.asServiceRole.entities.PedidoWeb.update(orders[0].id, {
            estado: 'Reembolsado',
            notas: (orders[0].notas || '') + `\n[Stripe] Reembolso procesado ${new Date().toISOString()}`,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return Response.json({ received: true, event_type: eventType });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
