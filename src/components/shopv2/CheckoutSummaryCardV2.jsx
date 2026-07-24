import CartItemThumbV2 from '@/components/shopv2/CartItemThumbV2';
import { fmtCLP } from '@/lib/shop-v2-cart';
import { AlertCircle, ShieldCheck } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// CheckoutSummaryCardV2 — Card "Tu pedido" del checkout cockpit.
// Items + desglose (personalización, descuento por cantidad, envío) + total.
// Se usa en el panel izquierdo desktop Y en el flujo vertical mobile,
// siempre con los mismos datos en vivo. Sin lógica propia: solo presenta.
// ════════════════════════════════════════════════════════════════════════
export default function CheckoutSummaryCardV2({
  carrito, subtotal, cargoPersonalizacion, ahorroTotal, descLineas,
  envioBluex, envio, total, descuentoGift = 0, giftcardCodigo = '', errorPago, medioPago,
}) {
  return (
    <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid var(--ck-border-soft, #E3D6C4)', boxShadow: '0 2px 16px rgba(var(--ck-fg-rgb, 44,24,16),.06)' }}>
      <h2 className="font-fraunces text-lg mb-3.5" style={{ color: 'var(--ck-fg, #2C1810)' }}>Tu pedido</h2>

      <div className="space-y-2.5 max-h-52 overflow-y-auto peyu-scrollbar pr-1 mb-4">
        {carrito.map((item) => (
          <div key={item.id} className="flex gap-2.5 items-center">
            <div className="w-12 h-12 flex-shrink-0">
              <CartItemThumbV2 imagen={item.mockupUrl || item.imagen} capas={item.capas_grabado || []} alt={item.nombre} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#2A2420] truncate">{item.nombre}</p>
              <p className="text-[10px] text-[#A78B6F]">x{item.cantidad}{item.color ? ` · ${item.color}` : ''}</p>
              {item.personalizacion && (
                <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--ck-action, #C0785C)' }}>✦ {item.personalizacion}</p>
              )}
            </div>
            <span className="text-xs font-bold text-[#2A2420]">{fmtCLP((item.precio || 0) * (item.cantidad || 1))}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-3 text-sm" style={{ borderTop: '1px solid var(--ck-border, #D4C4B0)' }}>
        <div className="flex justify-between" style={{ color: 'var(--ck-fg-soft, #7A6050)' }}>
          <span>Subtotal</span><span className="font-semibold">{fmtCLP(subtotal)}</span>
        </div>
        {cargoPersonalizacion > 0 && (
          <div className="flex justify-between" style={{ color: 'var(--ck-fg-soft, #7A6050)' }}>
            <span>Personalización</span><span className="font-semibold">+{fmtCLP(cargoPersonalizacion)}</span>
          </div>
        )}
        {ahorroTotal > 0 && (
          <div className="rounded-xl p-2.5 space-y-1" style={{ background: 'rgba(139,173,138,.1)', border: '1px solid rgba(139,173,138,.3)' }}>
            <div className="flex justify-between font-bold" style={{ color: '#5B7D5A' }}>
              <span>Ahorro por volumen</span><span>−{fmtCLP(ahorroTotal)}</span>
            </div>
            {(descLineas || []).filter((l) => l.ahorro > 0).map((l) => (
              <div key={l.sku || l.nombre} className="flex justify-between text-[11px]" style={{ color: 'var(--ck-fg-soft, #7A6050)' }}>
                <span className="truncate pr-2">
                  {l.beneficioAplicado === 'mayorista' ? '🏭 ' : ''}{l.nombre} ({l.unidades}u · {l.beneficioAplicado === 'mayorista' ? `mayorista −${l.pct}%` : `−${l.pct}%`})
                </span>
                <span className="font-semibold flex-shrink-0">−{fmtCLP(l.ahorro)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between" style={{ color: 'var(--ck-fg-soft, #7A6050)' }}>
          <span>Envío</span>
          {envioBluex
            ? (envio === 0 ? <span className="font-bold" style={{ color: '#8BAD8A' }}>GRATIS</span> : <span className="font-semibold">{fmtCLP(envio)}</span>)
            : <span className="text-xs" style={{ color: 'var(--ck-fg-muted, #A08070)' }}>Elige tu comuna</span>}
        </div>
        {descuentoGift > 0 && (
          <div className="rounded-xl p-2.5 flex justify-between" style={{ background: 'rgba(var(--ck-action-rgb, 192,120,92),.08)', border: '1px solid rgba(var(--ck-action-rgb, 192,120,92),.25)' }}>
            <span className="font-bold text-xs" style={{ color: 'var(--ck-action, #C0785C)' }}>🎁 Gift Card{giftcardCodigo ? ` ${giftcardCodigo}` : ''}</span>
            <span className="font-bold text-xs" style={{ color: 'var(--ck-action, #C0785C)' }}>−{fmtCLP(descuentoGift)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--ck-border, #D4C4B0)' }}>
          <span className="font-bold" style={{ color: 'var(--ck-fg, #2C1810)' }}>Total</span>
          <span className="font-poppins font-bold text-xl" style={{ color: 'var(--ck-action, #C0785C)' }}>{fmtCLP(total)}</span>
        </div>
        <p className="text-[10px]" style={{ color: 'var(--ck-fg-muted, #A08070)' }}>IVA incluido</p>
      </div>

      {errorPago && (
        <div className="mt-3 rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(var(--ck-action-rgb, 192,120,92),.08)', border: '1px solid rgba(var(--ck-action-rgb, 192,120,92),.3)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ck-action, #C0785C)' }} />
          <p className="text-xs font-semibold" style={{ color: 'var(--ck-action, #C0785C)' }}>{errorPago}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[11px] pt-3" style={{ color: 'var(--ck-fg-muted, #A08070)' }}>
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#8BAD8A' }} /> Pago seguro · {medioPago === 'Transferencia' ? 'Transferencia' : 'Mercado Pago'}
      </div>
    </div>
  );
}