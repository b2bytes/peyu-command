import { fmtCLP } from '@/lib/shop-v2-cart';

// Desglose de precio en vivo del Shop v2 (Baymard 2026 #4: transparencia total).
// producto × cantidad + personalización = total, con neto + IVA 19% desglosado.
export default function PriceBreakdownV2({
  precioUnit, cantidad, tipoLabel, feeUnit = 0, feeTotal = 0, gratis,
  descuentoPct = 0, descuentoMonto = 0,
  productoNombre, colorLabel,
}) {
  const subtotal = precioUnit * cantidad;
  const total = subtotal + feeTotal - descuentoMonto;
  // Los precios B2C ya incluyen IVA: lo desglosamos hacia atrás para transparencia.
  const neto = Math.round(total / 1.19);
  const iva = total - neto;

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
      <div className="flex justify-between text-xs sm:text-sm gap-2" style={{ color: '#7A6050' }}>
        <span className="truncate">{fmtCLP(precioUnit)}×{cantidad}</span>
        <span className="font-semibold flex-shrink-0">{fmtCLP(subtotal)}</span>
      </div>
      {tipoLabel && (
        <div className="flex justify-between text-xs sm:text-sm gap-2" style={{ color: '#7A6050' }}>
          <span className="truncate min-w-0">
            {tipoLabel}{!gratis && feeUnit > 0 ? ` ${fmtCLP(feeUnit)}` : ''}
          </span>
          <span className="font-semibold flex-shrink-0" style={{ color: gratis ? '#8BAD8A' : undefined }}>
            {gratis ? 'GRATIS' : `+${fmtCLP(feeTotal)}`}
          </span>
        </div>
      )}
      {descuentoMonto > 0 && (
        <div className="flex justify-between text-xs sm:text-sm font-bold rounded-lg px-2 py-1 gap-2" style={{ color: '#8BAD8A', background: 'rgba(139,173,138,.1)' }}>
          <span className="truncate">−{descuentoPct}%</span>
          <span className="flex-shrink-0">−{fmtCLP(descuentoMonto)}</span>
        </div>
      )}
      <div className="pt-2 space-y-1" style={{ borderTop: '1px solid #EDE3D6' }}>
        <div className="flex justify-between text-[10px] sm:text-xs gap-2" style={{ color: '#A08070' }}>
          <span>Neto</span><span className="flex-shrink-0">{fmtCLP(neto)}</span>
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs gap-2" style={{ color: '#A08070' }}>
          <span>IVA 19%</span><span className="flex-shrink-0">{fmtCLP(iva)}</span>
        </div>
        <div className="flex justify-between pt-1.5 gap-2" style={{ borderTop: '1px solid #EDE3D6' }}>
          <span className="font-bold" style={{ color: '#2C1810' }}>Total</span>
          <span className="font-poppins font-bold text-base sm:text-lg flex-shrink-0" style={{ color: '#C0785C' }}>{fmtCLP(total)}</span>
        </div>
      </div>
      <p className="text-[9px] sm:text-[10px] text-center" style={{ color: '#A08070' }}>IVA incluido</p>
    </div>
  );
}