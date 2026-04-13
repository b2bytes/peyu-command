// Validated real product images from peyuchile.cl

export const CATEGORY_IMAGES = {
  'Carcasas B2C': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1',
  'Entretenimiento': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=600%2C600&ssl=1',
  'Escritorio': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/dce80c23-7441-4922-a656-8627018c1e5d-1.jpeg?fit=600%2C600&ssl=1',
  'Hogar': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=600%2C600&ssl=1',
  'Corporativo': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/banner-corporativo-largo-scaled.png?fit=800%2C400&ssl=1',
};

// Hero/banner images from peyuchile.cl
export const HERO_IMAGES = [
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/11/Kit-Escritorio-Pro-2-1-1.png?fit=1920%2C640&ssl=1',
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/OK-Banners-Carcasas-2024-scaled-1.webp?fit=1920%2C640&ssl=1',
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/12/CachosBannerOficial-1.jpg?fit=1920%2C640&ssl=1',
];

// Category showcase images
export const CATEGORY_SHOWCASE = [
  { label: 'Carcasas', emoji: '📱', count: 69, img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1', cat: 'Carcasas B2C' },
  { label: 'Cachos', emoji: '🎲', count: 8, img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=600%2C600&ssl=1', cat: 'Entretenimiento' },
  { label: 'Escritorio', emoji: '🖥️', count: 7, img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/dce80c23-7441-4922-a656-8627018c1e5d-1.jpeg?fit=600%2C600&ssl=1', cat: 'Escritorio' },
  { label: 'Maceteros', emoji: '🌱', count: 6, img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=600%2C600&ssl=1', cat: 'Hogar' },
  { label: 'Posavasos', emoji: '🟢', count: 3, img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/07/WhatsApp-Image-2025-09-10-at-6.08.47-PM-2.jpeg?fit=600%2C600&ssl=1', cat: 'Hogar' },
  { label: 'Cuadros', emoji: '🖼️', count: 2, img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/image00008-2048x2027-1.webp?fit=600%2C600&ssl=1', cat: 'Hogar' },
];

export function getProductImage(sku, categoria) {
  return CATEGORY_IMAGES[categoria] || CATEGORY_IMAGES['Escritorio'];
}