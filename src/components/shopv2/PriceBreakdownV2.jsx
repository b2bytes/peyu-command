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
    <div className="bg-white rounded-2xl p-4 space-y-2" style={{ border: '1.5px solid #D4C4B0' }}>
      {/* Resumen de lo que estás comprando (producto · color · cantidad) */}
      {productoNombre && (
        <div className="pb-2 mb-1 border-b border-[#EBE3D6]">
          <p className="text-sm font-bold text-[#2A2420] leading-tight">{productoNombre}</p>
          <p className="text-[11px] text-[#A78B6F] mt-0.5">
            {colorLabel ? `Color: ${colorLabel} · ` : ''}{cantidad} {cantidad === 1 ? 'unidad' : 'unidades'}
            {tipoLabel ? ` · ${tipoLabel}` : ''}
          </p>
        </div>
      )}
      <div className="flex justify-between text-sm" style={{ color: '#7A6050' }}>
        <span>{fmtCLP(precioUnit)} × {cantidad}</span>
        <span className="font-semibold">{fmtCLP(subtotal)}</span>
      </div>
      {tipoLabel && (
        <div className="flex justify-between text-sm" style={{ color: '#7A6050' }}>
          <span className="truncate pr-2">
            {tipoLabel}{!gratis && feeUnit > 0 ? ` · ${fmtCLP(feeUnit)} × ${cantidad}` : ''}
          </span>
          <span className="font-semibold flex-shrink-0" style={{ color: gratis ? '#8BAD8A' : undefined }}>
            {gratis ? 'GRATIS' : `+${fmtCLP(feeTotal)}`}
          </span>
        </div>
      )}
      {descuentoMonto > 0 && (
        <div className="flex justify-between text-sm font-bold rounded-lg px-2 py-1" style={{ color: '#8BAD8A', background: 'rgba(139,173,138,.1)' }}>
          <span>Descuento {cantidad}u · −{descuentoPct}%</span>
          <span>−{fmtCLP(descuentoMonto)}</span>
        </div>
      )}
      <div className="pt-2 space-y-1.5" style={{ borderTop: '1px solid #EDE3D6' }}>
        <div className="flex justify-between text-xs" style={{ color: '#A08070' }}>
          <span>Neto</span><span>{fmtCLP(neto)}</span>
        </div>
        <div className="flex justify-between text-xs" style={{ color: '#A08070' }}>
          <span>IVA 19%</span><span>{fmtCLP(iva)}</span>
        </div>
        <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid #EDE3D6' }}>
          <span className="font-bold" style={{ color: '#2C1810' }}>Total</span>
          <span className="font-poppins font-bold text-lg" style={{ color: '#C0785C' }}>{fmtCLP(total)}</span>
        </div>
      </div>
      <p className="text-[10px]" style={{ color: '#A08070' }}>IVA incluido · envío se calcula al pagar</p>
    </div>
  );
}