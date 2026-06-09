/**
 * link-validator — Valida que los links internos de la app apunten a rutas válidas.
 * Ejecuta en desarrollo para advertir sobre broken links.
 */

const VALID_ROUTES = [
  '/',
  '/TiendaNueva',
  '/CatalogoNuevo',
  '/ProductoNuevo',
  '/CarritoNuevo',
  '/CheckoutNuevo',
  '/EmpresasNuevo',
  '/EmpresaProducto',
  '/CotizacionRapida',
  '/blog',
  '/nosotros',
  '/soporte',
  '/seguimiento',
  '/faq',
  '/contacto',
  '/terminos',
  '/privacidad',
  '/cookies',
  '/envios',
  '/cambios',
  '/gracias',
  '/b2b/contacto',
  '/b2b/propuesta',
  '/b2b/self-service',
  '/b2b/mi-cuenta',
  '/b2b/catalogo',
  '/personalizar',
  '/canjear',
  '/regalar-giftcard',
  '/brand',
  '/v2',
  '/design-lab',
  '/test-index',
  '/resumen-operativo',
  '/lanzamiento',
  '/propuesta-valor-peyu',
  '/founders-presentation',
  '/admin',
];

export function isValidRoute(path) {
  // Exacta
  if (VALID_ROUTES.includes(path)) return true;
  
  // Con query string (ej: /ProductoNuevo?id=123)
  const pathOnly = path.split('?')[0];
  if (VALID_ROUTES.includes(pathOnly)) return true;
  
  // Dynamic routes
  if (pathOnly.match(/^\/blog\/[^/]+$/)) return true; // /blog/:slug
  if (pathOnly.match(/^\/admin\/.+$/)) return true; // /admin/*
  
  return false;
}

/**
 * Ejecuta en desarrollo para detectar links rotos.
 */
export function validatePageLinks() {
  if (!import.meta.env.DEV) return;
  
  const links = document.querySelectorAll('a[href^="/"]');
  const broken = [];
  
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !isValidRoute(href)) {
      broken.push(href);
    }
  });
  
  if (broken.length > 0) {
    console.warn('⚠️ Broken internal links detected:', new Set(broken));
  }
}