// ============================================================
// resolveColorImageAll — Busca la imagen correcta del color para un
// producto. PRIORIDAD: el mapa manual imagenes_por_color (asignado
// por el founder desde el admin) es la FUENTE DE VERDAD. Solo si no
// hay asignación manual, caemos a match por filename en la galería.
//
// AntesPrioridad equivocada: filename primero → si la imagen base
// se llamaba "greencel-1.jpg", el match "verde" la seleccionaba como
// foto del color Verde, pisando la asignación manual del founder.
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
 * Resuelve la mejor imagen para un color.
 * Prioridad:
 *   1. imagenes_por_color[color] (mapa manual del founder — fuente de verdad)
 *   2. findColorImageMatch en TODAS las URLs (match por filename)
 *   3. imagen base del producto
 *
 * @param {object} producto
 * @param {object} color - { id, label, aliases }
 * @returns {string|null} URL de la imagen, o null si no hay color/producto
 */
export function resolveColorImageAll(producto, color) {
  if (!producto || !color) return null;
  const base = getProductImage(producto);

  // 1. PRIORIDAD: mapa manual imagenes_por_color (asignado por el founder).
  //    Si el founder asignó una foto a este color, la usamos SIN IMPORTAR
  //    el filename — es la fuente de verdad.
  const mapped = getProductImageForColor(producto, color);
  if (mapped && mapped !== base) return mapped;

  // 2. Fallback: match por nombre del color en TODAS las URLs (galeria_urls).
  //    Solo si no hay asignación manual.
  const allUrls = getAllImageUrls(producto);
  const match = findColorImageMatch(allUrls, color, { minScore: 60 });
  if (match) return allUrls[match.index];

  // 3. Base del producto.
  return base;
}