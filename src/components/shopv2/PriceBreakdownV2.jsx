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
    <div className="bg-white rounded-2xl border border-[#EBE3D6] p-4 space-y-2">
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
      <div className="flex justify-between text-sm text-[#4B4F54]">
        <span>{fmtCLP(precioUnit)} × {cantidad}</span>
        <span className="font-semibold">{fmtCLP(subtotal)}</span>
      </div>
      {tipoLabel && (
        <div className="flex justify-between text-sm text-[#4B4F54]">
          <span className="truncate pr-2">
            {tipoLabel}{!gratis && feeUnit > 0 ? ` · ${fmtCLP(feeUnit)} × ${cantidad}` : ''}
          </span>
          <span className={`font-semibold flex-shrink-0 ${gratis ? 'text-[#0F8B6C]' : ''}`}>
            {gratis ? 'GRATIS' : `+${fmtCLP(feeTotal)}`}
          </span>
        </div>
      )}
      {descuentoMonto > 0 && (
        <div className="flex justify-between text-sm font-bold text-[#0F8B6C]">
          <span>Descuento {cantidad}u · −{descuentoPct}%</span>
          <span>−{fmtCLP(descuentoMonto)}</span>
        </div>
      )}
      <div className="pt-2 border-t border-[#EBE3D6] space-y-1.5">
        <div className="flex justify-between text-xs text-[#A78B6F]">
          <span>Neto</span>
          <span>{fmtCLP(neto)}</span>
        </div>
        <div className="flex justify-between text-xs text-[#A78B6F]">
          <span>IVA 19%</span>
          <span>{fmtCLP(iva)}</span>
        </div>
        <div className="flex justify-between pt-1.5 border-t border-[#EBE3D6]">
          <span className="font-bold text-[#2A2420]">Total</span>
          <span className="font-poppins font-bold text-lg text-[#0F8B6C]">{fmtCLP(total)}</span>
        </div>
      </div>
      <p className="text-[10px] text-[#A78B6F]">IVA incluido · envío se calcula al pagar</p>
    </div>
  );
}