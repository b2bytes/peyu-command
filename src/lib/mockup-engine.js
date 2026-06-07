// ════════════════════════════════════════════════════════════════════════
// Motor de mockup inteligente PEYU B2B
// Determina automáticamente el área de grabado por categoría/SKU del producto,
// la posición óptima del logo, la opacidad y el efecto láser.
// Usado por LogoMockupPreview, B2BLogoMockup, EmpresaProducto, CotizacionRapida.
// ════════════════════════════════════════════════════════════════════════

// Zonas de grabado por categoría de producto.
// Cada zona define: top/left en % del contenedor, tamaño % del ancho, y la rotación.
export const ENGRAVE_ZONES = {
  // Cachos / pocillos: frente cilíndrico — zona centrada ligeramente alta
  Cachos: {
    top: '42%', left: '50%', size: '36%',
    shape: 'circle',
    opacity: 0.9,
    blendLight: 'grayscale(100%) brightness(0) invert(1)',
    blendDark: 'grayscale(100%) brightness(0)',
    areaLabel: 'Frente del producto',
  },
  // Escritorio: superficie plana — zona centrada
  Escritorio: {
    top: '48%', left: '50%', size: '40%',
    shape: 'square',
    opacity: 0.85,
    blendLight: 'grayscale(100%) brightness(0) invert(1)',
    blendDark: 'grayscale(100%) brightness(0)',
    areaLabel: 'Superficie superior',
  },
  // Paletas / tablas: zona centrada, más grande
  Paletas: {
    top: '46%', left: '50%', size: '42%',
    shape: 'square',
    opacity: 0.82,
    blendLight: 'grayscale(100%) brightness(0) invert(1)',
    blendDark: 'grayscale(100%) brightness(0)',
    areaLabel: 'Cara principal',
  },
  // Hogar: centrado, moderado
  Hogar: {
    top: '48%', left: '50%', size: '38%',
    shape: 'square',
    opacity: 0.85,
    blendLight: 'grayscale(100%) brightness(0) invert(1)',
    blendDark: 'grayscale(100%) brightness(0)',
    areaLabel: 'Frente del producto',
  },
  // Corporativo: más grande, centrado
  Corporativo: {
    top: '46%', left: '50%', size: '44%',
    shape: 'square',
    opacity: 0.88,
    blendLight: 'grayscale(100%) brightness(0) invert(1)',
    blendDark: 'grayscale(100%) brightness(0)',
    areaLabel: 'Cara principal',
  },
  // Default
  default: {
    top: '48%', left: '50%', size: '38%',
    shape: 'square',
    opacity: 0.85,
    blendLight: 'grayscale(100%) brightness(0) invert(1)',
    blendDark: 'grayscale(100%) brightness(0)',
    areaLabel: 'Área de grabado',
  },
};

/**
 * Devuelve la zona de grabado para un producto dado.
 * Normaliza la categoría (quita " B2C", busca por palabra clave).
 */
export function getEngraveZone(producto) {
  if (!producto) return ENGRAVE_ZONES.default;
  const cat = (producto.categoria_v2 || producto.categoria || '').replace(' B2C', '').trim();
  return ENGRAVE_ZONES[cat] || ENGRAVE_ZONES.default;
}

/**
 * Detecta si el fondo de la imagen del producto es oscuro o claro
 * analizando el promedio de píxeles centrales via canvas.
 * Devuelve 'dark' | 'light' (default 'dark' si no hay canvas disponible).
 */
export async function detectImageTone(imageUrl) {
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 40;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          // Muestreamos el centro de la imagen (área de grabado)
          const srcX = img.width * 0.3;
          const srcY = img.height * 0.3;
          const srcW = img.width * 0.4;
          const srcH = img.height * 0.4;
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          let total = 0;
          for (let i = 0; i < data.length; i += 4) {
            total += (data[i] + data[i + 1] + data[i + 2]) / 3;
          }
          const avg = total / (data.length / 4);
          resolve(avg < 128 ? 'dark' : 'light');
        } catch {
          resolve('light');
        }
      };
      img.onerror = () => resolve('light');
      img.src = imageUrl;
    } catch {
      resolve('light');
    }
  });
}

/**
 * Construye los estilos CSS del logo para el mockup:
 * - Si fondo oscuro → logo blanco (invert)
 * - Si fondo claro → logo negro (sin invert, o muy oscuro)
 * Ambos casos con opacidad adaptada al contexto.
 */
export function getLogoFilter(tone, zone) {
  if (tone === 'dark') {
    return zone?.blendLight || 'grayscale(100%) brightness(0) invert(1)';
  }
  return zone?.blendDark || 'grayscale(100%) brightness(0)';
}