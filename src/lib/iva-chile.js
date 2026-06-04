// 🇨🇱 IVA Chile — fuente única de verdad para el desglose neto/IVA/total.
// Los precios B2B (precio_b2b_tramos) son NETOS (excluyen IVA). NUNCA etiquetar
// un neto como "IVA incluido". El desglose siempre se muestra en 3 líneas.
export const IVA_RATE = 0.19;

// Dado un monto neto (sin IVA), devuelve { neto, iva, total }.
export function desgloseIVA(neto) {
  const n = Math.round(Number(neto) || 0);
  const iva = Math.round(n * IVA_RATE);
  return { neto: n, iva, total: n + iva };
}

export const fmtCLP = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');

// Texto legal estándar para acompañar valores netos.
export const NETO_LABEL = 'Valores netos · IVA 19% se detalla aparte';