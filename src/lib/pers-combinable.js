// ============================================================================
// pers-combinable.js — Lógica de personalización COMBINABLE del Shop v2 (B2C).
// ----------------------------------------------------------------------------
// El cliente puede activar VARIOS tipos a la vez (frase + Diseño PEYU + logo).
// Cada tipo activo suma su propio cargo por unidad. Desde el MOQ → todo GRATIS.
//
// Estado controlado del personalizador:
//   {
//     frase:   boolean,  texto: string,          // Frase / texto
//     peyu:    boolean,  disenoPeyuUrl: string,   // Diseño de la galería PEYU
//     archivo: boolean,  logoUrl: string,         // Logo propio subido
//   }
// ============================================================================
import { PRECIO_PERSONALIZACION, PERSONALIZACION_LABEL } from '@/lib/personalizacion-config';

// Estado inicial: nada activado.
export const PERS_VACIO = {
  frase: false, texto: '',
  peyu: false, disenoPeyuUrl: '',
  archivo: false, logoUrl: '',
};

// Tipos activos y "completos" (con su dato listo).
export function tiposActivos(pers) {
  if (!pers) return [];
  const out = [];
  if (pers.frase && pers.texto?.trim()) out.push('frase');
  if (pers.peyu && pers.disenoPeyuUrl) out.push('peyu');
  if (pers.archivo && pers.logoUrl) out.push('archivo');
  return out;
}

// ¿Hay al menos un tipo activado (aunque falte completar su dato)?
export function hayAlgunoActivado(pers) {
  return !!(pers?.frase || pers?.peyu || pers?.archivo);
}

// ¿La selección está completa? (cada tipo activado tiene su dato)
export function persCompleta(pers) {
  if (!pers) return true;
  if (pers.frase && !pers.texto?.trim()) return false;
  if (pers.peyu && !pers.disenoPeyuUrl) return false;
  if (pers.archivo && !pers.logoUrl) return false;
  return true;
}

// Cargo unitario sumado de todos los tipos activos y completos.
export function feeUnitarioCombinado(pers) {
  return tiposActivos(pers).reduce((sum, t) => sum + (PRECIO_PERSONALIZACION[t] || 0), 0);
}

// Etiqueta legible combinada: "Frase + Diseño PEYU + Tu logo".
export function labelCombinada(pers) {
  const labels = tiposActivos(pers).map((t) => PERSONALIZACION_LABEL[t]);
  return labels.length ? labels.join(' + ') : null;
}

// Resumen del texto de personalización para el carrito/pedido.
// Combina la frase y las etiquetas de los diseños activos.
export function resumenPersonalizacion(pers) {
  const partes = [];
  if (pers?.frase && pers.texto?.trim()) partes.push(`"${pers.texto.trim()}"`);
  if (pers?.peyu && pers.disenoPeyuUrl) partes.push('Diseño PEYU');
  if (pers?.archivo && pers.logoUrl) partes.push('Logo propio');
  return partes.length ? partes.join(' + ') : null;
}

// URLs de los diseños gráficos activos (para el mockup en vivo).
export function disenosActivos(pers) {
  const out = [];
  if (pers?.peyu && pers.disenoPeyuUrl) out.push({ tipo: 'peyu', url: pers.disenoPeyuUrl });
  if (pers?.archivo && pers.logoUrl) out.push({ tipo: 'archivo', url: pers.logoUrl });
  return out;
}