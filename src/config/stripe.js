/**
 * Configuración de Stripe
 * Reemplaza estas variables con tus credenciales de Stripe
 */

// IMPORTANTE: Estas variables deben ser configuradas en tu servidor/ambiente
// No incluyas la secret key en el código cliente

export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_YOUR_TEST_KEY_HERE';

export const STRIPE_CONFIG = {
  publicKey: STRIPE_PUBLIC_KEY,
  // Configuración adicional aquí
};

export default STRIPE_CONFIG;
