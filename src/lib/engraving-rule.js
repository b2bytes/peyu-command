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

// Color CSS de la tinta del grabado según su tono.
export const INK_CSS = {
  light: 'rgba(232,232,232,0.94)', // gris claro láser sobre producto oscuro
  dark: 'rgba(46,46,46,0.92)',     // gris oscuro láser sobre producto claro
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

// Fallback cuando el engraver NO pudo procesar el logo (CORS): mostramos el
// logo crudo pero respetando la regla — invertido a claro sobre oscuro.
export function fallbackFilter(tint) {
  return tint === 'light'
    ? 'grayscale(1) invert(1) contrast(1.25)'
    : 'grayscale(1) contrast(1.2)';
}