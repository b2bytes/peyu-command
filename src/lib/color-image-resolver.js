// ============================================================================
// color-image-resolver — Fuente de verdad para "¿qué imagen muestro según el
// color elegido?". Lee producto.imagenes_por_color (mapa color → URL).
//
// ⚠️ Hoy las 360 URLs de imagenes_por_color son TODAS generated_image.png
// (imágenes IA, no fotos reales). Mientras el cliente no suba las fotos reales
// por color, PRIORIZAMOS la imagen base (imagen_url) antes que una IA que puede
// no representar bien el color. Cuando lleguen fotos reales (URLs que NO sean
// generated_image.png), las usamos directamente.
//
// Si el color elegido no tiene URL en el mapa → fallback a imagen base. NUNCA
// devuelve vacío ni deja una imagen rota.
// ============================================================================

// Una URL es "IA placeholder" si apunta a un generated_image.png de la galería IA.
function esImagenIA(url) {
  return typeof url === 'string' && /generated_image\.png/i.test(url);
}

/**
 * Devuelve la URL de imagen que corresponde al color seleccionado.
 * @param {object} producto - registro Producto (con imagenes_por_color, imagen_url)
 * @param {string} colorLabel - etiqueta o id del color elegido (ej. "Turquesa")
 * @param {string} baseUrl - imagen base ya resuelta (fallback)
 * @returns {string} URL final a mostrar
 */
export function resolveColorImage(producto, colorLabel, baseUrl) {
  if (!producto) return baseUrl || '';
  const mapa = producto.imagenes_por_color || {};
  const url = colorLabel ? (mapa[colorLabel] || mapa[String(colorLabel)]) : null;

  // Sin URL para ese color → imagen base.
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return baseUrl || producto.imagen_url || '';
  }
  // Foto real por color → la usamos. IA placeholder → preferimos la base.
  if (esImagenIA(url)) return baseUrl || producto.imagen_url || url;
  return url;
}