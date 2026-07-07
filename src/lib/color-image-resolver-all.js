// ============================================================
// resolveColorImageAll — Busca la imagen correcta del color en TODAS
// las URLs disponibles del producto (imagenes_por_color + galeria_urls
// + imagen_url). Usa findColorImageMatch para encontrar la URL cuyo
// filename contiene el nombre del color.
//
// Esto resuelve el bug donde imagenes_por_color estaba mal etiquetado
// (ej: "Azul" → archivo "verdeface1copy.jpg") pero galeria_urls tiene
// URLs correctas como "...-azul.jpg".
// ============================================================

import { findColorImageMatch } from '@/lib/color-image-matcher';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';

/**
 * Recopila TODAS las URLs de imagen del producto, sin duplicados.
 */
export function getAllImageUrls(producto) {
  if (!producto) return [];
  const urls = new Set();
  const push = (u) => { if (typeof u === 'string' && u.startsWith('http')) urls.add(u); };

  push(producto.imagen_url);
  if (producto.imagenes_por_color && typeof producto.imagenes_por_color === 'object') {
    Object.values(producto.imagenes_por_color).forEach(push);
  }
  if (Array.isArray(producto.galeria_urls)) {
    producto.galeria_urls.forEach(push);
  }
  return [...urls];
}

/**
 * Resuelve la mejor imagen para un color, buscando por NOMBRE en todas las URLs.
 * Prioridad:
 *   1. findColorImageMatch en TODAS las URLs (galeria_urls + imagenes_por_color)
 *   2. imagenes_por_color[color] (mapa directo, puede estar mal etiquetado)
 *   3. imagen base del producto
 *
 * @param {object} producto
 * @param {object} color - { id, label, aliases }
 * @returns {string|null} URL de la imagen, o null si no hay color/producto
 */
export function resolveColorImageAll(producto, color) {
  if (!producto || !color) return null;

  const allUrls = getAllImageUrls(producto);

  // 1. Buscar por nombre del color en TODAS las URLs (más confiable).
  const match = findColorImageMatch(allUrls, color, { minScore: 60 });
  if (match) return allUrls[match.index];

  // 2. Fallback al mapa imagenes_por_color (puede estar mal etiquetado).
  const mapped = getProductImageForColor(producto, color);
  const base = getProductImage(producto);
  if (mapped && mapped !== base) return mapped;

  // 3. Base del producto.
  return base;
}