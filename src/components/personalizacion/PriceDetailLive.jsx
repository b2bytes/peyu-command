import { TrendingDown } from 'lucide-react';
import { PERSONALIZACION_LABEL } from '@/lib/personalizacion-config';
import { getQtyDiscountPct, getNextQtyTeaserForSku } from '@/lib/volume-discount';

// ════════════════════════════════════════════════════════════════════════
// PriceDetailLive — Detalle de precio EN VIVO del personalizador.
// Calca exactamente las reglas del carrito (descuento por cantidad 2u→10%,
// 3+u→15%, grabado gratis ≥ MOQ) y desglosa Neto + IVA 19% (precio B2C es
// IVA incluido), para que el cliente vea aquí el MISMO total del checkout.
// ════════════════════════════════════════════════════════════════════════
const W = {
  border: '#D4C4B0', fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070',
  action: '#C0785C', green: '#5B7D5A',
};
const fmt = (n) => `$${Math.round(n).toLocaleString('es-CL')}`;

export default function PriceDetailLive({
  precioBase, cantidad, cargoPersonalizacion = 0,
  personalizacionGratis, tipoPersonalizacion, embedded = false,
}) {
  const subtotal = (precioBase || 0) * (cantidad || 1);
  const pct = getQtyDiscountPct(cantidad);
  // Math.floor = misma regla de computeQtyDiscountBySku (carrito)
  const ahorro = Math.floor(subtotal * (pct / 100));
  const total = subtotal + cargoPersonalizacion - ahorro;
  const neto = Math.round(total / 1.19);
  const iva = total - neto;
  const teaser = getNextQtyTeaserForSku(cantidad);

  return (
    <div
      className={embedded ? 'space-y-1.5' : 'rounded-2xl p-4 space-y-1.5'}
      style={embedded ? undefined : { background: '#FFFFFF', border: `1.5px solid ${W.border}` }}
    >
      {!embedded && (
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: W.fgMuted }}>
          Tu precio en vivo
        </p>
      )}
      <div className="flex justify-between text-sm" style={{ color: W.fgSoft }}>
        <span>Producto × {cantidad}</span>
        <span className="font-semibold">{fmt(subtotal)}</span>
      </div>
      {tipoPersonalizacion && (
        <div className="flex justify-between text-sm">
          <span style={{ color: W.fgSoft }}>Grabado {PERSONALIZACION_LABEL[tipoPersonalizacion] || 'láser'}</span>
          <span className="font-bold" style={{ color: personalizacionGratis ? W.green : W.fg }}>
            {personalizacionGratis ? 'GRATIS ✓' : `+${fmt(cargoPersonalizacion)}`}
          </span>
        </div>
      )}
      {ahorro > 0 && (
        <div className="flex justify-between text-sm font-bold" style={{ color: W.green }}>
          <span className="flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Descuento por cantidad (−{pct}%)
          </span>
          <span>−{fmt(ahorro)}</span>
        </div>
      )}
      <div className="flex justify-between items-end pt-2" style={{ borderTop: `1px solid ${W.border}` }}>
        <span className="font-bold text-sm" style={{ color: W.fg }}>Total</span>
        <span className="font-poppins font-bold text-lg" style={{ color: W.action }}>{fmt(total)}</span>
      </div>
      <div className="flex justify-between text-[11px]" style={{ color: W.fgMuted }}>
        <span>Neto {fmt(neto)} · IVA 19% {fmt(iva)}</span>
        <span className="font-bold" style={{ color: W.green }}>IVA incluido ✓</span>
      </div>
      {teaser && ahorro === 0 && cantidad >= 1 && (
        <p className="text-[11px] font-bold text-center rounded-xl py-1.5"
          style={{ background: 'rgba(139,173,138,.12)', color: W.green }}>
          Agrega {teaser.necesita} más y ahorra {teaser.pctSiguiente}% en este producto
        </p>
      )}
      <p className="text-[10px] text-center" style={{ color: W.fgMuted }}>
        Envío se calcula en el checkout · Mismo total en tu carrito
      </p>
    </div>
  );
}