// Tabla de precios por volumen B2B — diseño compacto Warm Clay
import { TrendingDown } from 'lucide-react';
import { getB2BPriceForQty } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';

const TRAMOS = [
  { qty: 10,   label: '10–49 u' },
  { qty: 50,   label: '50–99 u' },
  { qty: 100,  label: '100–249 u' },
  { qty: 250,  label: '250–499 u' },
  { qty: 500,  label: '500–999 u' },
  { qty: 1000, label: '1.000+ u' },
];

export default function B2BPriceTable({ producto, qtyActual = 0 }) {
  const tramos = TRAMOS
    .map(t => ({ ...t, b2b: getB2BPriceForQty(producto, t.qty) }))
    .filter(t => t.b2b?.precio);

  if (!tramos.length) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: '#7A6050' }}>
        <TrendingDown className="w-3.5 h-3.5" style={{ color: '#0F8B6C' }} />
        Precio por volumen (neto sin IVA)
      </p>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0' }}>
        {tramos.map((t, i) => {
          const isActive = qtyActual >= t.qty && (i === tramos.length - 1 || qtyActual < tramos[i + 1]?.qty);
          return (
            <div
              key={t.qty}
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                background: isActive ? 'rgba(15,139,108,.06)' : (i % 2 === 0 ? 'white' : '#FAF7F2'),
                borderBottom: i < tramos.length - 1 ? '1px solid #EDE3D6' : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                {isActive && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#0F8B6C' }} />}
                <span className="text-xs font-semibold" style={{ color: isActive ? '#0F8B6C' : '#7A6050' }}>{t.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: isActive ? '#0F8B6C' : '#2C1810' }}>{fmtCLP(t.b2b.precio)}/u</span>
                {t.b2b.ahorroPct > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#D96B4D15', color: '#D96B4D' }}>
                    -{t.b2b.ahorroPct}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] mt-1.5 px-1" style={{ color: '#A08070' }}>
        Precios netos referenciales (sin IVA). El grabado láser de tu logo es gratis desde {producto?.personalizacion_gratis_desde || 10}u.
      </p>
    </div>
  );
}