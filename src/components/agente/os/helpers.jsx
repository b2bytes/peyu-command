// ============================================================================
// PEYU OS · helpers compartidos — formato, urgencia, imagen producto
// ============================================================================
export const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');
export const fmtNum = (n) => (n != null ? Number(n).toLocaleString('es-CL') : '0');

// Días hasta vencimiento (negativo = ya venció)
export function diasParaVencer(fecha) {
  if (!fecha) return null;
  return Math.floor((new Date(fecha) - new Date()) / 86400000);
}

// Resuelve imagen real del producto desde los campos del catálogo
export function imagenProducto(p) {
  if (!p) return null;
  return p.imagen_url || (Array.isArray(p.galeria_urls) && p.galeria_urls[0]) || null;
}

// Sub-agentes PEYU OS
export const SUB_AGENTES = [
  { id: 'ventas', label: 'Ventas', emoji: '💰' },
  { id: 'produccion', label: 'Producción', emoji: '🏭' },
  { id: 'datos', label: 'Datos', emoji: '📊' },
  { id: 'marketing', label: 'Marketing', emoji: '📣' },
];

// Teléfonos del equipo para WhatsApp directo
export const TEAM_PHONES = { joaquin: '56935040242', carlos: '56935040242' };