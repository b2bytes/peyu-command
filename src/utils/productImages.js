// ============================================================
// Validated product images from peyuchile.cl (April 2026)
// Each SKU has its own unique, real product photo
// ============================================================

// SKU-specific images — highest priority
export const SKU_IMAGES = {
  // Soporte Celular marmolado verde
  'SOPC-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/09/greencel-1.jpg?fit=800%2C800&ssl=1',
  // Soporte Notebook - Kit Escritorio Pro foto 2
  'SONB-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/11/Kit-Escritorio-Pro-2.jpg?fit=800%2C600&ssl=1',
  // Llavero soporte celular - azul
  'LLAV-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/09/bluecel-1-1.jpg?fit=800%2C800&ssl=1',
  // Kit Escritorio Corporativo 5 piezas
  'KIT-ESCR-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/dce80c23-7441-4922-a656-8627018c1e5d-1.jpeg?fit=800%2C800&ssl=1',
  // Macetero Ecológico
  'MACE-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=800%2C800&ssl=1',
  // Lámpara Chillka
  'LAMP-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/lampara-1.webp?fit=756%2C945&ssl=1',
  // Pack Cachos 6u
  'CACH-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=800%2C800&ssl=1',
  // Posavasos Set x4
  'POSAV-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/07/WhatsApp-Image-2025-09-10-at-6.08.47-PM-2.jpeg?fit=600%2C600&ssl=1',
  // Carcasa iPhone Fibra Trigo (compostable)
  'CARC-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/photoroom_20250605_115937.jpeg?fit=600%2C600&ssl=1',
};

// Category fallbacks (used when SKU is unknown)
export const CATEGORY_IMAGES = {
  'Carcasas B2C': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1',
  'Entretenimiento': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=600%2C600&ssl=1',
  'Escritorio': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/09/greencel-1.jpg?fit=600%2C600&ssl=1',
  'Hogar': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=600%2C600&ssl=1',
  'Corporativo': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/dce80c23-7441-4922-a656-8627018c1e5d-1.jpeg?fit=600%2C600&ssl=1',
};

// Hero/banner images from peyuchile.cl
export const HERO_IMAGES = [
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/11/Kit-Escritorio-Pro-2-1-1.png?fit=1920%2C640&ssl=1',
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/OK-Banners-Carcasas-2024-scaled-1.webp?fit=1920%2C640&ssl=1',
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/12/CachosBannerOficial-1.jpg?fit=1920%2C640&ssl=1',
];

// Category showcase grid - each with its own unique validated image
export const CATEGORY_SHOWCASE = [
  {
    label: 'Carcasas',
    count: 69,
    img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1',
    cat: 'Carcasas B2C',
  },
  {
    label: 'Cachos',
    count: 8,
    img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=600%2C600&ssl=1',
    cat: 'Entretenimiento',
  },
  {
    label: 'Escritorio',
    count: 7,
    img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/dce80c23-7441-4922-a656-8627018c1e5d-1.jpeg?fit=600%2C600&ssl=1',
    cat: 'Escritorio',
  },
  {
    label: 'Maceteros',
    count: 6,
    img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=600%2C600&ssl=1',
    cat: 'Hogar',
  },
  {
    label: 'Posavasos',
    count: 3,
    img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/07/WhatsApp-Image-2025-09-10-at-6.08.47-PM-2.jpeg?fit=600%2C600&ssl=1',
    cat: 'Hogar',
  },
  {
    label: 'Lámparas',
    count: 1,
    img: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/foto-lampara-roja-1.jpg?fit=600%2C600&ssl=1',
    cat: 'Hogar',
  },
];

/**
 * Returns the best validated product image.
 * Priority: SKU-specific → Category fallback
 */
export function getProductImage(sku, categoria) {
  if (sku && SKU_IMAGES[sku]) return SKU_IMAGES[sku];
  return CATEGORY_IMAGES[categoria] || CATEGORY_IMAGES['Escritorio'];
}