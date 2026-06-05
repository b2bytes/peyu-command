import { fmtCLP } from '@/lib/shop-v2-cart';

// Desglose de precio en vivo del Shop v2 (producto × cantidad + personalización).
export default function PriceBreakdownV2({
  precioUnit, cantidad, tipoLabel, feeUnit = 0, feeTotal = 0, gratis,
}) {
  const subtotal = precioUnit * cantidad;
  const total = subtotal + feeTotal;

  return (
    <div className="bg-white rounded-2xl border border-[#E7D8C6] p-4 space-y-2">
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
      <div className="flex justify-between pt-2 border-t border-[#E7D8C6]">
        <span className="font-bold text-[#2A2420]">Total</span>
        <span className="font-poppins font-bold text-lg text-[#0F8B6C]">{fmtCLP(total)}</span>
      </div>
      <p className="text-[10px] text-[#A78B6F]">IVA incluido · envío se calcula al pagar</p>
    </div>
  );
}