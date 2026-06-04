// ============================================================================
// PriceBreakdownLive — Desglose de precio en vivo (B2C, IVA incluido)
// ----------------------------------------------------------------------------
// En B2C el precio_b2c YA incluye IVA, igual que el resto del flujo (paso 4,
// carrito, checkout y correo). Por eso el total = producto + personalización,
// SIN sumar 19% aparte. Mostramos "IVA incluido" para transparencia.
// Se actualiza al cambiar opción/cantidad. Estética Warm Dusk (--ld-*).
// ============================================================================

const clp = (n) => `$${(n || 0).toLocaleString('es-CL')}`;

export default function PriceBreakdownLive({
  precioUnit,          // precio unitario del producto (IVA incluido)
  cantidad,
  subtotalProducto,    // precioUnit × cantidad
  tipoLabel,           // etiqueta de la personalización elegida (o null)
  cargoUnit,           // cargo unitario de personalización
  cargoTotal,          // cargo total (0 si gratis)
  gratis,              // ¿personalización gratis (≥ MOQ)?
}) {
  const total = (subtotalProducto || 0) + (cargoTotal || 0);

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

      <div className="flex justify-between pt-2 border-t border-ld-border items-end">
        <div>
          <span className="font-bold text-ld-fg">Total</span>
          <p className="text-[10px] text-ld-fg-muted font-medium">IVA incluido</p>
        </div>
        <span className="font-poppins font-bold text-lg text-ld-fg">{clp(total)}</span>
      </div>
    </div>
  );
}