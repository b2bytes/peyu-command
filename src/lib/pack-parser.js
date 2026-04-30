// ============================================================================
// pack-parser — Detecta si un producto es un "pack" (multi-unidad fija) y
// devuelve cuántas unidades vienen incluidas. Ej: "Pack 3 maceteros", "Set de 2",
// "Trío de carcasas".
// ----------------------------------------------------------------------------
// PEYU vende algunos productos como packs cerrados (ej. 3 maceteros). El
// cliente B2C debe poder elegir el color de CADA unidad dentro del pack
// (ej. "2 negros + 1 verde"). Este helper expone:
//   - getPackSize(producto) → número de unidades dentro del pack (>=2) o null
// ============================================================================

const SPANISH_NUM = {
  dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  duo: 2, dúo: 2, trio: 3, trío: 3, cuarteto: 4, par: 2,
};

/**
 * Detecta si un producto es un pack y devuelve cuántas unidades trae.
 * Devuelve null si no es un pack (producto unitario normal).
 */
export function getPackSize(producto) {
  if (!producto) return null;
  const text = `${producto.nombre || ''} ${producto.descripcion || ''}`.toLowerCase();

  // No tratamos como packs a las giftcards ni a productos B2B exclusivos
  // (esos se cotizan distinto).
  const sku = String(producto.sku || '').toUpperCase();
  if (sku.startsWith('GC-')) return null;

  // 1) Patrones numéricos: "pack de 3", "set 2", "x3", "3 unidades"
  const patternsNum = [
    /pack\s*(?:de\s*)?(\d{1,2})/i,
    /set\s*(?:de\s*)?(\d{1,2})/i,
    /kit\s*(?:de\s*)?(\d{1,2})/i,
    /\bx\s*(\d{1,2})\b/i,
    /(\d{1,2})\s*unidades?/i,
    /(\d{1,2})\s*piezas?/i,
    /(\d{1,2})\s*pack/i,
  ];
  for (const re of patternsNum) {
    const m = text.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 2 && n <= 12) return n;
    }
  }

  // 2) Palabras: "trío", "dúo", "par"
  for (const [word, n] of Object.entries(SPANISH_NUM)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) return n;
  }

  return null;
}