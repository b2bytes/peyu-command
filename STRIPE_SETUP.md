# Configuración de Stripe

Este documento explica cómo configurar Stripe para el checkout del carrito de Peyu.

## 1. Obtener credenciales de Stripe

1. Ve a [stripe.com](https://stripe.com)
2. Crea una cuenta o inicia sesión
3. Ve a **Dashboard > Developers > API Keys**
4. Copia tu **Publishable key** (comienza con `pk_`)
5. Copia tu **Secret key** (comienza con `sk_`) - **NUNCA compartas esto**

## 2. Configurar variables de entorno

Agrega estas variables en tu archivo `.env`:

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

## 3. Crear endpoint de checkout

Necesitas crear un endpoint en tu servidor para crear sesiones de Stripe. 

### Opción A: Si usas Node.js/Express

Crea un archivo `src/api/checkout.js`:

```javascript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { total, email, nombre, pedidoId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'clp',
            product_data: {
              name: `Pedido Peyu #${pedidoId}`,
            },
          },
          quantity: 1,
          unit_amount: total, // en centavos
        },
      ],
      mode: 'payment',
      customer_email: email,
      success_url: `${process.env.APP_URL}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/carrito`,
      metadata: {
        pedidoId,
        cliente: nombre,
      },
    });

    res.json({ sessionUrl: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Opción B: Si usas Vercel Functions

Crea `api/checkout-session.js`:

```javascript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { total, email, nombre, pedidoId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'clp',
            product_data: {
              name: `Pedido Peyu #${pedidoId}`,
            },
          },
          quantity: 1,
          unit_amount: total,
        },
      ],
      mode: 'payment',
      customer_email: email,
      success_url: `${process.env.APP_URL}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/carrito`,
      metadata: {
        pedidoId,
        cliente: nombre,
      },
    });

    return res.status(200).json({ sessionUrl: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

## 4. Manejar webhook de Stripe

Para actualizar el estado del pedido cuando se completa el pago:

```javascript
import Stripe from 'stripe';
import { base44 } from '@/api/base44Client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { pedidoId } = session.metadata;

      // Actualizar estado del pedido en base44
      await base44.entities.PedidoWeb.update(pedidoId, {
        estado: 'Confirmado',
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
      });
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
```

## 5. Variables de entorno necesarias

```env
# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
APP_URL=http://localhost:5173  # o tu URL en producción
```

## 6. Obtener Webhook Secret

1. En Stripe Dashboard, ve a **Developers > Webhooks**
2. Crea un webhook con endpoint: `https://tudominio.com/api/webhook-stripe`
3. Selecciona eventos: `checkout.session.completed`
4. Copia el **Signing secret**

## Testing

Para probar en desarrollo:

1. Usa las credenciales de prueba de Stripe (`pk_test_...`)
2. En el checkout, usa la tarjeta de prueba: `4242 4242 4242 4242`
3. Cualquier fecha futura y CVC válido

## Documentación

- [Stripe Docs](https://stripe.com/docs)
- [Stripe Node SDK](https://github.com/stripe/stripe-node)
- [Checkout Session API](https://stripe.com/docs/api/checkout/sessions)

## Soporte

Si tienes problemas, contacta a Stripe support o revisa la consola del navegador/servidor para errores.
