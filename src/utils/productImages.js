// Real product images from peyuchile.cl
export const SKU_IMAGES = {
  'CAKC-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1',
  'KIT-ESCR-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/dce80c23-7441-4922-a656-8627018c1e5d-1.jpeg?fit=800%2C800&ssl=1',
  'MACE-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=600%2C600&ssl=1',
  'CACH-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=600%2C600&ssl=1',
  'POSAV-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/07/WhatsApp-Image-2025-09-10-at-6.08.47-PM-2.jpeg?fit=600%2C600&ssl=1',
  'LLAV-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/09/greencel-1.jpg?fit=800%2C800&ssl=1',
  'SONB-001': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/b672bd1c-9e11-4728-a485-d7c03344aebc-1.jpeg?fit=800%2C800&ssl=1',
};

export const CATEGORY_IMAGES = {
  'Escritorio': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/dce80c23-7441-4922-a656-8627018c1e5d-1.jpeg?fit=800%2C800&ssl=1',
  'Hogar': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=600%2C600&ssl=1',
  'Entretenimiento': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=600%2C600&ssl=1',
  'Corporativo': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/officeportada-scaled.jpg?fit=800%2C600&ssl=1',
  'Carcasas B2C': 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1',
};

export function getProductImage(sku, categoria) {
  return SKU_IMAGES[sku] || CATEGORY_IMAGES[categoria] || 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/09/dce80c23-7441-4922-a656-8627018c1e5d-1.jpeg?fit=800%2C800&ssl=1';
}