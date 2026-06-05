// ============================================================================
// pers-combinable.js — Lógica de personalización EXCLUYENTE del Shop v2 (B2C).
// ----------------------------------------------------------------------------
// La personalización PEYU es EXCLUYENTE: el cliente elige UNA sola opción por
// ítem (Frase $3.990 · Diseño PEYU $4.990 · Imagen propia $7.990).
// Desde el MOQ (≥10u) → GRATIS.
//
// Estado controlado del personalizador (selección única):
//   {
//     tipo:  'frase' | 'peyu' | 'archivo' | null,   // opción elegida
//     texto: string,          // dato de la frase
//     disenoPeyuUrl: string,  // dato del diseño PEYU
//     logoUrl: string,        // dato del logo propio subido
//   }
// (Mantiene el nombre del archivo por retrocompatibilidad de imports.)
// ============================================================================
import { PRECIO_PERSONALIZACION, PERSONALIZACION_LABEL } from '@/lib/personalizacion-config';

// Estado inicial: ninguna opción elegida.
export const PERS_VACIO = {
  tipo: null,
  texto: '',
  disenoPeyuUrl: '',
  logoUrl: '',
};

// Tipos activos = el único tipo elegido SI ya tiene su dato listo (lista de 0/1).
export function tiposActivos(pers) {
  if (!pers || !pers.tipo) return [];
  if (pers.tipo === 'frase' && pers.texto?.trim()) return ['frase'];
  if (pers.tipo === 'peyu' && pers.disenoPeyuUrl) return ['peyu'];
  if (pers.tipo === 'archivo' && pers.logoUrl) return ['archivo'];
  return [];
}

// ¿Hay una opción elegida (aunque falte completar su dato)?
export function hayAlgunoActivado(pers) {
  return !!pers?.tipo;
}

// ¿La selección está completa? (la opción elegida tiene su dato)
export function persCompleta(pers) {
  if (!pers || !pers.tipo) return true; // sin personalización = válido
  if (pers.tipo === 'frase') return !!pers.texto?.trim();
  if (pers.tipo === 'peyu') return !!pers.disenoPeyuUrl;
  if (pers.tipo === 'archivo') return !!pers.logoUrl;
  return true;
}

// Cargo unitario del tipo elegido (0 si aún no está completo).
export function feeUnitarioCombinado(pers) {
  const t = tiposActivos(pers)[0];
  return t ? (PRECIO_PERSONALIZACION[t] || 0) : 0;
}

// Etiqueta legible del tipo elegido.
export function labelCombinada(pers) {
  const t = tiposActivos(pers)[0];
  return t ? PERSONALIZACION_LABEL[t] : null;
}

// Resumen del texto de personalización para el carrito/pedido.
export function resumenPersonalizacion(pers) {
  if (!pers?.tipo) return null;
  if (pers.tipo === 'frase' && pers.texto?.trim()) return `"${pers.texto.trim()}"`;
  if (pers.tipo === 'peyu' && pers.disenoPeyuUrl) return 'Diseño PEYU';
  if (pers.tipo === 'archivo' && pers.logoUrl) return 'Logo propio';
  return null;
}

// URL del diseño gráfico activo (para el mockup en vivo). Lista de 0/1.
export function disenosActivos(pers) {
  if (pers?.tipo === 'peyu' && pers.disenoPeyuUrl) return [{ tipo: 'peyu', url: pers.disenoPeyuUrl }];
  if (pers?.tipo === 'archivo' && pers.logoUrl) return [{ tipo: 'archivo', url: pers.logoUrl }];
  return [];
}