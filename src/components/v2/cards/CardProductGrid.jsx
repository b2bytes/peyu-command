import { Leaf } from 'lucide-react';
import { formatCLP } from '@/lib/v2-catalog';

// Grilla compacta de productos dentro del río del chat. Al tocar uno, pide
// el detalle (que el cerebro devuelve como CardProduct individual).
export default function CardProductGrid({ data, perfil, onPick }) {
  const productos = data?.productos || [];
  if (productos.length === 0) return null;

  return (
    <div className="v2-fade-up grid grid-cols-2 gap-2.5 w-full max-w-[320px]">
      {productos.map((p) => {
        const tramos = p.precio_b2b_tramos || {};
        const desdeB2B = tramos.t2000_mas || tramos.t1000_1999 || tramos.unitario;
        return (
          <button key={p.id} onClick={() => onPick?.(p)} className="v2-card text-left overflow-hidden">
            <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--v2-surface-2)' }}>
              {p.imagen_url
                ? <img src={p.imagen_url} alt={p.nombre} loading="lazy" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🐢</div>}
              <span className="v2-badge-eco absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-semibold">
                <Leaf className="w-2 h-2" /> reciclado
              </span>
            </div>
            <div className="p-2">
              <h4 className="text-[11px] font-semibold leading-tight line-clamp-2" style={{ color: 'var(--v2-fg)' }}>{p.nombre}</h4>
              <p className="text-xs font-bold mt-1" style={{ color: perfil === 'b2b' ? 'var(--v2-teal)' : 'var(--v2-gold)' }}>
                {perfil === 'b2b' ? `Desde ${formatCLP(desdeB2B)}` : formatCLP(p.precio_b2c)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}