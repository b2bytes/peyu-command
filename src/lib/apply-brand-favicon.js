// Aplica el favicon oficial del Manual de Marca de Peyu en runtime:
// tortuga crema sobre cuadrado redondeado verde PEYU (512×512), generado
// exactamente del trazo original — mismo asset que la lámina del kit.
import { buildFavicon } from '@/lib/logo-variants';

let applied = false;

export async function applyBrandFavicon() {
  if (applied) return;
  applied = true;
  try {
    const url = await buildFavicon();
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = url;

    let apple = document.querySelector('link[rel="apple-touch-icon"]');
    if (!apple) {
      apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      document.head.appendChild(apple);
    }
    apple.href = url;
  } catch { /* sin favicon dinámico: se mantiene el estático */ }
}