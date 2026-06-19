import { fmtCLP } from '@/lib/shop-v2-cart';

// Desglose de precio en vivo del Shop v2 (Baymard 2026 #4: transparencia total).
// producto × cantidad + personalización = total, con neto + IVA 19% desglosado.
export default function PriceBreakdownV2({
  precioUnit, cantidad, tipoLabel, feeUnit = 0, feeTotal = 0, gratis,
  descuentoPct = 0, descuentoMonto = 0,
  productoNombre, colorLabel,
  precioUnitOriginal = 0, mayoristaLabel = '', mayoristaPct = 0,
  precioUnitNetoMayorista = 0,
}) {
  const esMayorista = !!mayoristaLabel && precioUnitOriginal > precioUnit;
  const subtotal = precioUnit * cantidad;
  const total = subtotal + feeTotal - descuentoMonto;
  // Los precios B2C ya incluyen IVA: lo desglosamos hacia atrás para transparencia.
  const neto = Math.round(total / 1.19);
  const iva = total - neto;
  // Neto unitario: mayorista usa el tramo oficial B2B (base real de la fórmula);
  // resto, el con-IVA dividido por 1.19.
  const netoUnit = esMayorista && precioUnitNetoMayorista > 0
    ? precioUnitNetoMayorista
    : Math.round(precioUnit / 1.19);

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2" style={{ border: '1.5px solid #D4C4B0' }}>
      {/* Resumen de lo que estás comprando (producto · color · cantidad) */}
      {productoNombre && (
        <div className="pb-2 mb-1 border-b border-[#EBE3D6]">
          <p className="text-xs sm:text-sm font-bold text-[#2A2420] leading-tight line-clamp-2">{productoNombre}</p>
          <p className="text-[10px] sm:text-[11px] text-[#A78B6F] mt-0.5">
            {colorLabel ? `${colorLabel} · ` : ''}{cantidad}u{tipoLabel ? ` · ${tipoLabel}` : ''}
          </p>
        </div>
      )}

      {/* ── Bloque MAYORISTA detallado: la fórmula clara con IVA / sin IVA ──
          Se activa desde 10u del mismo producto. Muestra el precio unitario
          mayorista (con y sin IVA), cuánto baja vs el B2C, y la cuenta. */}
      {esMayorista ? (
        <div className="rounded-xl p-2.5 sm:p-3 space-y-1.5" style={{ background: 'rgba(139,173,138,.1)', border: '1px solid rgba(139,173,138,.35)' }}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-bold truncate" style={{ color: '#5B7D5A' }}>
              🏭 Precio mayorista · {mayoristaLabel}
            </span>
            {mayoristaPct > 0 && (
              <span className="text-[10px] sm:text-[11px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full" style={{ color: 'white', background: '#5B7D5A' }}>
                −{mayoristaPct}%
              </span>
            )}
          </div>
          <div className="flex justify-between text-[11px] sm:text-xs gap-2" style={{ color: '#7A6050' }}>
            <span>Precio normal (c/IVA)</span>
            <span className="line-through flex-shrink-0" style={{ color: '#A08070' }}>{fmtCLP(precioUnitOriginal)}/u</span>
          </div>
          <div className="flex justify-between text-[11px] sm:text-xs font-bold gap-2" style={{ color: '#2C1810' }}>
            <span>Precio mayorista (c/IVA)</span>
            <span className="flex-shrink-0" style={{ color: '#5B7D5A' }}>{fmtCLP(precioUnit)}/u</span>
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] gap-2" style={{ color: '#8A7260' }}>
            <span>Precio mayorista (neto, sin IVA)</span>
            <span className="flex-shrink-0">{fmtCLP(netoUnit)}/u</span>
          </div>
          <div className="flex justify-between text-[11px] sm:text-xs font-bold pt-1.5 gap-2" style={{ borderTop: '1px dashed rgba(139,173,138,.5)', color: '#2C1810' }}>
            <span>{fmtCLP(precioUnit)} × {cantidad}u</span>
            <span className="flex-shrink-0">{fmtCLP(subtotal)}</span>
          </div>
        </div>
      ) : (
        <div className="flex justify-between text-xs sm:text-sm gap-2" style={{ color: '#7A6050' }}>
          <span className="truncate">{fmtCLP(precioUnit)} × {cantidad}</span>
          <span className="font-semibold flex-shrink-0">{fmtCLP(subtotal)}</span>
        </div>
      )}
      {tipoLabel && (
        <div className="flex justify-between text-xs sm:text-sm gap-2" style={{ color: '#7A6050' }}>
          <span className="truncate min-w-0">
            {tipoLabel}{!gratis && feeUnit > 0 ? ` ${fmtCLP(feeUnit)}/u` : ''}
          </span>
          <span className="font-semibold flex-shrink-0" style={{ color: gratis ? '#8BAD8A' : undefined }}>
            {gratis ? 'GRATIS' : `+${fmtCLP(feeTotal)}`}
          </span>
        </div>
      )}
      {descuentoMonto > 0 && (
        <div className="flex justify-between text-xs sm:text-sm font-bold rounded-lg px-2 py-1 gap-2" style={{ color: '#8BAD8A', background: 'rgba(139,173,138,.1)' }}>
          <span className="truncate">Descuento −{descuentoPct}%</span>
          <span className="flex-shrink-0">−{fmtCLP(descuentoMonto)}</span>
        </div>
      )}
      <div className="pt-2 space-y-1.5" style={{ borderTop: '1.5px solid #D4C4B0' }}>
        <div className="flex justify-between text-[10px] sm:text-xs font-semibold gap-2" style={{ color: '#2C1810' }}>
          <span>Subtotal neto (sin IVA)</span><span className="flex-shrink-0">{fmtCLP(neto)}</span>
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs gap-2" style={{ color: '#8A7260' }}>
          <span>+ IVA 19%</span><span className="flex-shrink-0">{fmtCLP(iva)}</span>
        </div>
        <div className="flex justify-between pt-1.5 gap-2 font-bold" style={{ borderTop: '1px solid #EDE3D6', color: '#2C1810' }}>
          <span>Total final (con IVA)</span>
          <span className="font-poppins text-base sm:text-lg flex-shrink-0" style={{ color: '#C0785C' }}>{fmtCLP(total)}</span>
        </div>
      </div>
      <p className="text-[9px] sm:text-[10px] text-center italic" style={{ color: '#A08070' }}>Todos los precios incluyen IVA</p>
    </div>
  );
}