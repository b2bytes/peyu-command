import { Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// CartQuoteBridgeV2 — Puente carro único compra ↔ cotización B2B.
// El MISMO carrito_v2 se cotiza con factura y precios por volumen:
// la cotización lee las líneas del carro, sin re-elegir productos.
// ════════════════════════════════════════════════════════════════════════
export default function CartQuoteBridgeV2() {
  return (
    <Link
      to="/CotizacionRapida"
      className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:-translate-y-0.5"
      style={{ background: 'rgba(15,139,108,.07)', border: '1.5px solid rgba(15,139,108,.3)' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,139,108,.12)' }}>
        <Building2 className="w-4 h-4" style={{ color: '#0F8B6C' }} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-bold" style={{ color: '#0F8B6C' }}>¿Pedido para tu empresa?</p>
        <p className="text-[11px]" style={{ color: '#7A6050' }}>Cotiza este mismo carrito con factura y hasta −54% por volumen</p>
      </div>
      <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: '#0F8B6C' }} />
    </Link>
  );
}