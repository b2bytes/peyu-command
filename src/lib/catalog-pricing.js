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

// Tramos B2B (objeto precio_b2b_tramos) → mínimo de unidades y label.
// Fuente de verdad del cotizador corporativo. Escala correctamente por volumen.
const TRAMOS_B2B = [
  { min: 2000, key: 't2000_mas',   label: '2000+ u' },
  { min: 1000, key: 't1000_1999',  label: '1000–1999 u' },
  { min: 500,  key: 't500_999',    label: '500–999 u' },
  { min: 250,  key: 't250_499',    label: '250–499 u' },
  { min: 100,  key: 't100_249',    label: '100–249 u' },
  { min: 50,   key: 't50_99',      label: '50–99 u' },
  { min: 10,   key: 't10_49',      label: '10–49 u' },
  { min: 1,    key: 'unitario',    label: '1–9 u' },
];

/**
 * Precio unitario B2B oficial para una cantidad, leyendo precio_b2b_tramos.
 * Escala de verdad (no topado): 10→−10% · 100→−20% · 500→−28% · 1000→−30% · 2000→−33%
 * (o los oficiales del catálogo PDF si existen). Cae al tramo anterior con precio.
 *
 * @returns {{ precio:number, label:string, baseUnit:number, ahorroPct:number }|null}
 */
export function getB2BPriceForQty(producto, qty = 1) {
  const tramos = producto?.precio_b2b_tramos;
  if (!tramos || typeof tramos !== 'object') return null;
  const baseUnit = num(tramos.unitario) ?? getUnitBasePrice(producto);
  const idx = TRAMOS_B2B.findIndex((t) => qty >= t.min);
  if (idx < 0) return null;
  // Desde ese tramo hacia abajo (menor volumen), toma el primero con precio.
  for (let i = idx; i < TRAMOS_B2B.length; i++) {
    const precio = num(tramos[TRAMOS_B2B[i].key]);
    if (precio) {
      const ahorroPct = baseUnit ? Math.round((1 - precio / baseUnit) * 100) : 0;
      return { precio, label: TRAMOS_B2B[i].label, baseUnit, ahorroPct };
    }
  }
  return null;
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