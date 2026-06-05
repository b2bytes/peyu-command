// ============================================================================
// pers-combinable.js — Lógica de personalización COMBINABLE del Shop v2 (B2C).
// ----------------------------------------------------------------------------
// La personalización PEYU es COMBINABLE: el cliente puede sumar 1, 2 o las 3
// opciones por ítem (Frase $3.990 · Diseño PEYU $4.990 · Imagen propia $7.990).
// Los cargos se SUMAN. Desde el MOQ (≥10u) → todo GRATIS.
//
// Estado controlado del personalizador (multi-selección):
//   {
//     frase:  boolean,          // ¿activó frase?
//     peyu:   boolean,          // ¿activó diseño PEYU?
//     archivo:boolean,          // ¿activó logo propio?
//     texto: string,            // dato de la frase
//     disenoPeyuUrl: string,    // dato del diseño PEYU
//     logoUrl: string,          // dato del logo propio subido
//     aprobada: boolean,        // el cliente confirmó su selección (botón Aprobar)
//   }
// (Mantiene el nombre del archivo por retrocompatibilidad de imports.)
// ============================================================================
import { PRECIO_PERSONALIZACION, PERSONALIZACION_LABEL } from '@/lib/personalizacion-config';

const TIPOS = ['frase', 'peyu', 'archivo'];

// Estado inicial: ninguna opción activada.
export const PERS_VACIO = {
  frase: false,
  peyu: false,
  archivo: false,
  texto: '',
  disenoPeyuUrl: '',
  logoUrl: '',
  aprobada: false,
};

// ¿El tipo está activado Y tiene su dato listo?
function tipoListo(pers, tipo) {
  if (!pers?.[tipo]) return false;
  if (tipo === 'frase') return !!pers.texto?.trim();
  if (tipo === 'peyu') return !!pers.disenoPeyuUrl;
  if (tipo === 'archivo') return !!pers.logoUrl;
  return false;
}

// Tipos activos = los tipos elegidos que ya tienen su dato completo.
export function tiposActivos(pers) {
  return TIPOS.filter((t) => tipoListo(pers, t));
}

// ¿Hay alguna opción activada (aunque falte completar su dato)?
export function hayAlgunoActivado(pers) {
  return TIPOS.some((t) => !!pers?.[t]);
}

// ¿La selección está completa? (cada opción activada tiene su dato)
export function persCompleta(pers) {
  if (!hayAlgunoActivado(pers)) return true; // sin personalización = válido
  return TIPOS.every((t) => !pers[t] || tipoListo(pers, t));
}

// Cargo unitario combinado = suma de los cargos de cada tipo activo.
export function feeUnitarioCombinado(pers) {
  return tiposActivos(pers).reduce((acc, t) => acc + (PRECIO_PERSONALIZACION[t] || 0), 0);
}

// Etiqueta legible combinada (ej: "Frase + Diseño PEYU").
export function labelCombinada(pers) {
  const labels = tiposActivos(pers).map((t) => PERSONALIZACION_LABEL[t]);
  return labels.length ? labels.join(' + ') : null;
}

// Resumen del texto de personalización para el carrito/pedido.
export function resumenPersonalizacion(pers) {
  const partes = [];
  if (tipoListo(pers, 'frase')) partes.push(`"${pers.texto.trim()}"`);
  if (tipoListo(pers, 'peyu')) partes.push('Diseño PEYU');
  if (tipoListo(pers, 'archivo')) partes.push('Logo propio');
  return partes.length ? partes.join(' + ') : null;
}

// URLs de los diseños gráficos activos (para el mockup en vivo). Lista 0..2.
export function disenosActivos(pers) {
  const out = [];
  if (tipoListo(pers, 'peyu')) out.push({ tipo: 'peyu', url: pers.disenoPeyuUrl });
  if (tipoListo(pers, 'archivo')) out.push({ tipo: 'archivo', url: pers.logoUrl });
  return out;
}