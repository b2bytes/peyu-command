import { Package, Leaf, Recycle } from 'lucide-react';

const GRAMOS_POR_TAPITA = 2.2;

export default function ProductIncludesV2({ producto, cantidad = 1 }) {
  if (!producto) return null;

  const items = Array.isArray(producto.incluye_items_v2) && producto.incluye_items_v2.length
    ? producto.incluye_items_v2
    : (producto.incluye_v2 || producto.incluye
        ? String(producto.incluye_v2 || producto.incluye).split(/[·,•\n]/).map((s) => s.trim()).filter(Boolean)
        : []);

  const tapitas = (producto.tapitas_aprox || 0) * cantidad;
  const gramos = Math.round(tapitas * GRAMOS_POR_TAPITA);

  if (!items.length && !tapitas) return null;

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="bg-white rounded-2xl p-4" style={{ border: '1.5px solid #D4C4B0' }}>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 flex-shrink-0" style={{ color: '#C0785C' }} />
            <h3 className="text-sm font-bold" style={{ color: '#2C1810' }}>Qué incluye</h3>
          </div>
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#7A6050' }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#C0785C' }} />
                {it}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tapitas > 0 && (
        <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,rgba(139,173,138,.12),rgba(91,125,90,.06))', border: '1.5px solid rgba(139,173,138,.35)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 flex-shrink-0" style={{ color: '#8BAD8A' }} />
            <h3 className="text-sm font-bold" style={{ color: '#5B7D5A' }}>Tu impacto positivo</h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#7A6050' }}>
            Con esta compra salvas aprox.{' '}
            <span className="font-poppins font-bold" style={{ color: '#5B7D5A' }}>{gramos.toLocaleString('es-CL')} g</span>{' '}
            de plástico (~{tapitas.toLocaleString('es-CL')} tapitas) de terminar en vertederos u océanos.
          </p>
          <Recycle className="absolute -bottom-3 -right-3 w-20 h-20" style={{ color: 'rgba(139,173,138,.1)' }} />
        </div>
      )}
    </div>
  );
}