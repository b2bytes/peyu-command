// ════════════════════════════════════════════════════════════════════════
// shop-v2-config.js — Config estática del Shop B2C v2 (categorías, branding).
// ════════════════════════════════════════════════════════════════════════

// Logo PEYU sobre crema para el hero.
export const PEYU_LOGO_CREMA =
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=600%2C600&ssl=1';

// Categorías navegables del Shop v2. `cat` matchea el campo `categoria` real
// del catálogo (entidad Producto) para filtrar sin tocar datos.
export const CATEGORIAS_V2 = [
  { label: 'Carcasas', cat: 'Carcasas B2C', emoji: '📱', desc: 'Personalizables' },
  { label: 'Entretención y Juegos', cat: 'Entretenimiento', emoji: '🎲', desc: 'Cachos y juegos eco' },
  { label: 'Hogar', cat: 'Hogar', emoji: '🪴', desc: 'Maceteros y más' },
  { label: 'Escritorio', cat: 'Escritorio', emoji: '🖊️', desc: 'Orden eco' },
  { label: 'Corporativo', cat: 'Corporativo', emoji: '🏢', desc: 'Para empresas' },
];