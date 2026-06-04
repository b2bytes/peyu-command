// ============================================================================
// PriceBreakdownLive — Desglose de precio en vivo (Neto + IVA 19% + Total)
// ----------------------------------------------------------------------------
// Mismo criterio de IVA transparente que en B2B: los montos son NETOS, se suma
// IVA 19% aparte, y luego el total. Nada de "IVA incluido" sobre netos.
// Se actualiza al cambiar opción/cantidad. Estética Warm Dusk (--ld-*).
// ============================================================================

const clp = (n) => `$${(n || 0).toLocaleString('es-CL')}`;

export default function PriceBreakdownLive({
  precioUnit,          // precio neto unitario del producto
  cantidad,
  subtotalProducto,    // precioUnit × cantidad
  tipoLabel,           // etiqueta de la personalización elegida (o null)
  cargoUnit,           // cargo unitario de personalización
  cargoTotal,          // cargo total (0 si gratis)
  gratis,              // ¿personalización gratis (≥ MOQ)?
}) {
  const neto = subtotalProducto + cargoTotal;
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  return (
    <div className="ld-card p-4 space-y-2 text-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ld-fg-muted mb-1">Resumen de precio</p>

      <div className="flex justify-between text-ld-fg-soft">
        <span>Producto · {clp(precioUnit)} × {cantidad}</span>
        <span>{clp(subtotalProducto)}</span>
      </div>

      {tipoLabel && (
        <div className="flex justify-between text-ld-fg-soft">
          <span>
            Personalización · {tipoLabel}
            {!gratis && cargoUnit > 0 && ` · ${clp(cargoUnit)} × ${cantidad}`}
          </span>
          <span className={gratis ? 'text-ld-action font-bold' : 'text-ld-fg'}>
            {gratis ? 'GRATIS' : `+${clp(cargoTotal)}`}
          </span>
        </div>
      )}

      <div className="flex justify-between text-ld-fg-soft pt-2 border-t border-ld-border">
        <span>Subtotal neto</span>
        <span>{clp(neto)}</span>
      </div>
      <div className="flex justify-between text-ld-fg-soft">
        <span>IVA (19%)</span>
        <span>{clp(iva)}</span>
      </div>
      <div className="flex justify-between pt-2 border-t border-ld-border">
        <span className="font-bold text-ld-fg">Total</span>
        <span className="font-poppins font-bold text-lg text-ld-fg">{clp(total)}</span>
      </div>
    </div>
  );
}