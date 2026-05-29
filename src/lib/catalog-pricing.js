// 💲 Precio oficial del catálogo PEYU por cantidad (fuente única de verdad)
// ──────────────────────────────────────────────────────────────────────────
// Usa los precios oficiales del catálogo PDF (sin IVA) que viven en el
// Producto. NO inventa descuentos: el precio unitario YA baja por tramo.
//
// Tramos oficiales (campos del Producto):
//   1–9        → precio_unitario_oficial_clp (o precio_b2c como fallback)
//   10–49      → precio_10_49_clp
//   50–99      → precio_50_99_clp
//   100–249    → precio_100_249_clp
//   250–499    → precio_250_499_clp
//   500–999    → precio_500_999_clp
//   1000–1999  → precio_1000_1999_clp
//   2000+      → precio_2000_mas_clp
//
// Cada tramo cae al anterior disponible si el campo está vacío (nunca sube).

const TRAMOS = [
  { min: 2000, campo: 'precio_2000_mas_clp',   label: '2000+ u' },
  { min: 1000, campo: 'precio_1000_1999_clp',  label: '1000–1999 u' },
  { min: 500,  campo: 'precio_500_999_clp',    label: '500–999 u' },
  { min: 250,  campo: 'precio_250_499_clp',    label: '250–499 u' },
  { min: 100,  campo: 'precio_100_249_clp',    label: '100–249 u' },
  { min: 50,   campo: 'precio_50_99_clp',      label: '50–99 u' },
  { min: 10,   campo: 'precio_10_49_clp',      label: '10–49 u' },
];

const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

/**
 * Precio unitario base (1 unidad) según catálogo oficial.
 */
export function getUnitBasePrice(p) {
  if (!p) return 0;
  return num(p.precio_unitario_oficial_clp) ?? num(p.precio_b2c) ?? 0;
}

/**
 * Devuelve el precio unitario oficial para una cantidad dada.
 * Sin descuentos fabricados: solo el tramo del catálogo.
 *
 * @returns {{ precio:number, label:string, tier:string, baseUnit:number, ahorroPct:number }}
 */
export function getCatalogPriceForQty(p, qty = 1) {
  const baseUnit = getUnitBasePrice(p);
  if (!p || !qty || qty < 10) {
    return { precio: baseUnit, label: 'Precio unitario', tier: 'b2c', baseUnit, ahorroPct: 0 };
  }

  // Busca el tramo más alto cuyo mínimo aplica Y tenga precio definido;
  // si está vacío, baja al tramo anterior con precio.
  for (const t of TRAMOS) {
    if (qty >= t.min) {
      // desde este tramo hacia abajo, toma el primero con precio
      const start = TRAMOS.indexOf(t);
      for (let i = start; i < TRAMOS.length; i++) {
        const precio = num(p[TRAMOS[i].campo]);
        if (precio) {
          const ahorroPct = baseUnit ? Math.round((1 - precio / baseUnit) * 100) : 0;
          return { precio, label: TRAMOS[i].label, tier: 'vol', baseUnit, ahorroPct };
        }
      }
      break;
    }
  }

  // Sin tramos definidos → precio base
  return { precio: baseUnit, label: 'Precio unitario', tier: 'b2c', baseUnit, ahorroPct: 0 };
}