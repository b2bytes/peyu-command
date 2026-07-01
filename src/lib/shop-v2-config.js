// ════════════════════════════════════════════════════════════════════════
// shop-v2-config.js — Config estática del Shop B2C v2 (categorías, branding).
// ════════════════════════════════════════════════════════════════════════

// Logo PEYU sobre crema para el hero.
export const PEYU_LOGO_CREMA =
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=600%2C600&ssl=1';

// Categorías navegables del Shop v2. `cat` matchea el campo `categoria` real
// del catálogo (entidad Producto) para filtrar sin tocar datos.
// `img` = foto REAL de un producto PEYU representativo de la categoría (no emoji,
// no IA). Se usa en las cards "Explora" del home para que se vean profesionales.
export const CATEGORIAS_V2 = [
  { label: 'Carcasas', cat: 'Carcasas B2C', emoji: '📱', desc: 'Personalizables', img: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/fff8561ca_a9c8f21bc0d5-drv-s23plus.png' },
  { label: 'Entretención y Juegos', cat: 'Entretenimiento', emoji: '🎲', desc: 'Cachos y juegos eco', img: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/a0bcf41d6_cachossbbbj3.jpg' },
  { label: 'Hogar', cat: 'Hogar', emoji: '🪴', desc: 'Maceteros y más', img: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/76984d283_redond5.jpg' },
  { label: 'Escritorio', cat: 'Escritorio', emoji: '🖊️', desc: 'Orden eco', img: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/990565b53_notebookkk4.jpg' },
  { label: 'Corporativo', cat: 'Corporativo', emoji: '🏢', desc: 'Para empresas', img: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/9516027c9_clasico1.jpg' },
];

// Avatar oficial de Peyu (tortuga PEYU). Fuente única de verdad para toda la app.
export const PEYU_AVATAR =
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/15e0c1c84_generated_image.png';