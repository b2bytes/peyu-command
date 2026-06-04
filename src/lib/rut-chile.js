// ============================================================================
// rut-chile — Validación y normalización de RUT chileno (módulo 11).
// Acepta con o sin puntos y con o sin guion. Normaliza a "XXXXXXXX-D".
// ============================================================================

// Limpia: quita puntos/espacios, deja dígitos + K, uppercase.
function limpiar(rut) {
  return String(rut || '').replace(/[.\s]/g, '').replace(/-/g, '').toUpperCase();
}

// Calcula el dígito verificador (módulo 11) para un cuerpo numérico.
function calcularDV(cuerpo) {
  let suma = 0;
  let mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

/** Devuelve true si el RUT es válido (cuerpo + dígito verificador correcto). */
export function validarRut(rut) {
  const c = limpiar(rut);
  if (c.length < 2) return false;
  const cuerpo = c.slice(0, -1);
  const dv = c.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  return calcularDV(cuerpo) === dv;
}

/** Normaliza a "XXXXXXXX-D" (sin puntos, con guion). Vacío si inválido. */
export function normalizarRut(rut) {
  const c = limpiar(rut);
  if (c.length < 2) return '';
  const cuerpo = c.slice(0, -1);
  const dv = c.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return '';
  return `${cuerpo}-${dv}`;
}

/** Formatea con puntos para mostrar: "12.345.678-9". */
export function formatearRut(rut) {
  const norm = normalizarRut(rut);
  if (!norm) return rut || '';
  const [cuerpo, dv] = norm.split('-');
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}