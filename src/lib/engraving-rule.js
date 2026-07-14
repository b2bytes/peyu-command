// ════════════════════════════════════════════════════════════════════════
// engraving-rule.js — REGLA ÚNICA del grabado láser PEYU (todos los flujos).
// ----------------------------------------------------------------------------
// Producto OSCURO → tinta GRIS CLARA (#E8E8E8) compuesta con blend `screen`.
// Producto CLARO  → tinta GRIS OSCURA (#2E2E2E) compuesta con blend `multiply`.
//
// El tono del producto se detecta con detectImageTone() (logo-engraver), que
// devuelve la tinta contraria: 'light' (clara) sobre oscuro, 'dark' sobre claro.
//
// TODOS los previews de mockup (ficha B2C EngravedLayer/MockupLivePreviewV2,
// cotizador B2B LogoMockupPreview, /personalizar LaserEngravePreview) importan
// de aquí — nunca dupliques estos valores en un componente.
// ════════════════════════════════════════════════════════════════════════

// Color CSS de la tinta del grabado según su tono. Grises EVIDENTES (no
// blanco/negro puro): el mockup debe leerse como grabado láser gris.
export const INK_CSS = {
  light: 'rgba(214,214,214,0.95)', // gris claro láser (#D6D6D6) sobre producto oscuro/colorido
  dark: 'rgba(84,84,84,0.95)',     // gris oscuro láser (#545454) sobre producto claro
};

// Blend mode que hace VISIBLE la tinta sobre el producto:
// tinta clara solo aclara (screen) · tinta oscura solo oscurece (multiply).
export function inkBlend(tint) {
  return tint === 'light' ? 'screen' : 'multiply';
}

// Bisel 3D del láser: reflejo + surco de medio píxel → el trazo se ve hundido.
export function biselFx(tint) {
  return tint === 'light'
    ? 'drop-shadow(0 0.8px 0.5px rgba(0,0,0,0.55)) drop-shadow(0 -0.6px 0.5px rgba(255,255,255,0.25))'
    : 'drop-shadow(0 0.8px 0.5px rgba(255,255,255,0.5)) drop-shadow(0 -0.6px 0.5px rgba(0,0,0,0.32))';
}

// Tono de tinta a partir de un color HEX conocido. Se usa cuando la imagen
// base se re-pinta con un filtro CSS (tinte de color sin foto real): en ese
// caso detectImageTone leería la foto ORIGINAL y no el color que el cliente
// está viendo. Misma regla/umbral que detectImageTone: SOLO colores realmente
// OSCUROS (negro, azul marino) → tinta clara; azules medios/celestes y todo
// lo demás → tinta gris OSCURA. Se usa el MAYOR entre luminancia y promedio
// RGB para no castigar los azules (el canal azul pesa poco en la luminancia).
export function toneFromHex(hex) {
  const m = String(hex || '').replace('#', '');
  if (m.length < 6) return null;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const eff = Math.max(lum, (r + g + b) / 3);
  return eff >= 100 ? 'dark' : 'light';
}

// Fallback cuando el engraver NO pudo procesar el logo (CORS): mostramos el
// logo crudo pero respetando la regla — invertido a claro sobre oscuro.
export function fallbackFilter(tint) {
  return tint === 'light'
    ? 'grayscale(1) invert(0.85) contrast(1.15)' // trazos → gris claro (no blanco puro)
    : 'grayscale(1) contrast(1.15) brightness(1.1)'; // trazos → gris oscuro suave
}