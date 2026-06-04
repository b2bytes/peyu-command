// ============================================================================
// PriceBreakdownB2C — Desglose de precio en vivo para la ficha B2C.
// ----------------------------------------------------------------------------
// En B2C los precios YA incluyen IVA (precio_b2c es final). Por eso NO mostramos
// línea de IVA separada: solo Producto + Personalización + Total final.
// Se recalcula al cambiar opción de personalización o cantidad.
// Estética Warm Dusk (--ld-*).
// ============================================================================

const clp = (n) => `$${(n || 0).toLocaleString('es-CL')}`;

export default function PriceBreakdownB2C({
  precioUnit,         // precio unitario del producto (con IVA incluido)
  cantidad,
  subtotalProducto,   // precioUnit × cantidad
  tipoLabel,          // etiqueta de la personalización elegida (o null)
  cargoUnit,          // cargo unitario de personalización
  cargoTotal,         // cargo total (0 si gratis o sin personalización)
  gratis,             // ¿personalización gratis (≥ MOQ)?
}) {
  const total = subtotalProducto + cargoTotal;

  return (
    <div className="ld-card p-4 space-y-2 text-sm" style={{ background: 'var(--ld-bg)' }}>
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

      <div className="flex justify-between items-baseline pt-2 border-t border-ld-border">
        <span className="font-bold text-ld-fg">Total</span>
        <div className="text-right">
          <span className="font-poppins font-bold text-lg text-ld-fg">{clp(total)}</span>
          <span className="block text-[10px] text-ld-fg-muted">IVA incluido</span>
        </div>
      </div>
    </div>
  );
}