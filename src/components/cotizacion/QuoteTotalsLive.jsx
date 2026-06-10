import { TrendingDown } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// QuoteTotalsLive — Desglose B2B EN VIVO de la cotización (Warm Dusk).
// Subtotal base → descuento por volumen → Neto (sin IVA) → IVA 19% → Total.
// Se reutiliza en el paso Productos, Revisar y el panel lateral del cockpit.
// ════════════════════════════════════════════════════════════════════════
const W = {
  border: '#D4C4B0', fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070',
  green: '#0F8B6C', terra: '#D96B4D',
};

export default function QuoteTotalsLive({
  qtyTotal = 0, totalSinDesc = 0, ahorroTotal = 0, totalNeto = 0, totalConIVA = 0,
  compact = false,
}) {
  return (
    <div
      className={compact ? 'space-y-1.5' : 'rounded-2xl px-4 py-4 space-y-2'}
      style={compact ? undefined : { background: '#FFFFFF', border: `2px solid ${W.green}` }}
    >
      {!compact && (
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: W.fgMuted }}>
          Detalle en vivo · {qtyTotal.toLocaleString('es-CL')} unidades
        </p>
      )}
      <div className="flex justify-between text-sm" style={{ color: W.fgSoft }}>
        <span>Subtotal (precio base)</span>
        <span className="font-semibold">{fmtCLP(totalSinDesc)}</span>
      </div>
      {ahorroTotal > 0 && (
        <div className="flex justify-between text-sm font-bold" style={{ color: W.terra }}>
          <span className="flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Descuento por volumen
          </span>
          <span>−{fmtCLP(ahorroTotal)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm pt-1.5" style={{ borderTop: `1px solid ${W.border}` }}>
        <span className="font-bold" style={{ color: W.fg }}>Neto (sin IVA)</span>
        <span className="font-bold" style={{ color: W.green }}>{fmtCLP(totalNeto)}</span>
      </div>
      <div className="flex justify-between text-[11px]" style={{ color: W.fgMuted }}>
        <span>IVA 19%</span>
        <span>{fmtCLP(totalConIVA - totalNeto)}</span>
      </div>
      <div className="flex justify-between items-end pt-1.5" style={{ borderTop: `2px solid ${W.green}` }}>
        <span className="font-bold text-sm" style={{ color: W.green }}>Total c/IVA</span>
        <span className="font-fraunces font-bold text-2xl" style={{ color: W.green }}>{fmtCLP(totalConIVA)}</span>
      </div>
      {!compact && (
        <p className="text-[10px] text-center" style={{ color: W.fgMuted }}>
          Precio referencial por volumen · Sin compromiso
        </p>
      )}
    </div>
  );
}