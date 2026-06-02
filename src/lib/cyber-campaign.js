// ============================================================
// PEYU — Campaña "Cyber de Junio" (CYBER PEYU)
// ------------------------------------------------------------
// Fuente ÚNICA de verdad de la campaña Cyber. Para apagar la
// campaña cuando termine, basta poner CYBER_ENABLED = false
// (o dejar que expire sola al pasar CYBER_END).
//
// NOTA DE MARCA: no usamos "CyberDay" (marca CCS) ni "Cyber
// Monday" (es de noviembre). Usamos el lema genérico cálido
// "CYBER PEYU" / "Cyber de Junio".
//
// El % de descuento NO está confirmado: usamos el placeholder
// CYBER_DISCOUNT_LABEL ("-XX%"). Cuando Diego confirme, cambia
// solo esa constante (ej. "-30%").
// ============================================================

// 🔌 INTERRUPTOR PRINCIPAL — pon en false para apagar TODO.
export const CYBER_ENABLED = true;

// Fin de la campaña (medianoche del mié 3 jun 2026, hora Chile).
export const CYBER_END = '2026-06-04T03:00:00Z'; // 03 jun 23:59 CLT ≈ 04 jun 03:00 UTC

// Placeholder de descuento — cámbialo cuando se confirme el %.
// Si lo dejas null, los textos dirán "ofertas Cyber" sin número.
export const CYBER_DISCOUNT_LABEL = '-XX%';

// Copys centralizados (fácil de editar).
export const CYBER_COPY = {
  bar: '⚡ CYBER PEYU — Ofertas con causa · Termina mañana',
  barShort: '⚡ CYBER PEYU · Ofertas con causa',
  heroLine: 'Cyber de Junio en PEYU — los regalos que el planeta también agradece ♻️',
  microUrgency: '⏳ Precios Cyber hasta mañana',
  badge: 'CYBER',
  greeting: 'Estamos en Cyber 🐢 tengo precios especiales hasta mañana — ¿buscas algo para alguien especial o para tu empresa?',
};

// ¿Está la campaña activa AHORA? (flag + dentro de ventana).
export function isCyberActive(now = new Date()) {
  if (!CYBER_ENABLED) return false;
  return now.getTime() <= new Date(CYBER_END).getTime();
}

// ¿Este producto tiene oferta Cyber real? (solo si trae precio_oferta < precio_b2c).
export function tieneOfertaCyber(producto) {
  if (!producto) return false;
  const oferta = Number(producto.precio_oferta || 0);
  const base = Number(producto.precio_b2c || 0);
  return oferta > 0 && base > 0 && oferta < base;
}

// % de descuento real de un producto en oferta (entero). Null si no aplica.
export function descuentoCyberPct(producto) {
  if (!tieneOfertaCyber(producto)) return null;
  return Math.round((1 - producto.precio_oferta / producto.precio_b2c) * 100);
}