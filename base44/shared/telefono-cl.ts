// Normaliza un teléfono chileno al formato internacional que exige WhatsApp
// Cloud API (56 + 9 dígitos). Devuelve null si el número no es utilizable.
export function normalizarTelefono(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('56') && d.length === 11) return d;      // 569XXXXXXXX
  if (d.startsWith('9') && d.length === 9) return `56${d}`;  // 9XXXXXXXX
  if (d.length === 8) return `569${d}`;
  return d.length >= 11 ? d : null;
}

/** Horas transcurridas desde una fecha ISO hasta ahora (o hasta `ahora`). */
export function horasDesde(fecha, ahora = Date.now()) {
  return (ahora - new Date(fecha).getTime()) / 3_600_000;
}

/** Primer nombre legible para saludar. */
export function primerNombre(nombreCompleto, fallback = 'Hola') {
  return (nombreCompleto || '').split(' ')[0] || fallback;
}