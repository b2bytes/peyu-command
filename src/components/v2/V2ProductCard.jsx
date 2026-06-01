import { Leaf } from 'lucide-react';
import { formatCLP, getIncluye, hasB2B, V2_B2B_TRAMOS } from '@/lib/v2-catalog';

// Card de producto /v2. Muestra imagen, nombre, incluye_v2 y precio según modo.
export default function V2ProductCard({ producto, mode, onOpen, index = 0 }) {
  const incluye = getIncluye(producto);
  const tramos = producto.precio_b2b_tramos || {};
  const desdeB2B = tramos.t2000_mas || tramos.t1000_1999 || tramos.unitario;

  return (
    <button
      onClick={() => onOpen(producto)}
      className="v2-card v2-fade-up text-left overflow-hidden flex flex-col w-full"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}
    >
      <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--v2-surface-2)' }}>
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🐢</div>
        )}
        <span className="v2-badge-eco absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold">
          <Leaf className="w-2.5 h-2.5" /> 100% reciclado
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--v2-fg)' }}>
          {producto.nombre}
        </h3>
        {incluye && (
          <p className="text-[11px] mt-1 line-clamp-2 flex-1" style={{ color: 'var(--v2-fg-muted)' }}>
            {incluye}
          </p>
        )}

        <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--v2-border)' }}>
          {mode === 'b2c' ? (
            <div>
              <span className="text-base font-bold" style={{ color: 'var(--v2-gold)' }}>
                {formatCLP(producto.precio_b2c)}
              </span>
              <span className="text-[10px] ml-1" style={{ color: 'var(--v2-fg-subtle)' }}>IVA incl.</span>
            </div>
          ) : hasB2B(producto) ? (
            <div>
              <span className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>Desde</span>
              <span className="text-base font-bold ml-1" style={{ color: 'var(--v2-teal)' }}>
                {formatCLP(desdeB2B)}
              </span>
              <span className="text-[10px] ml-1" style={{ color: 'var(--v2-fg-subtle)' }}>c/u · sin IVA</span>
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--v2-fg-muted)' }}>Cotizar por volumen</span>
          )}
        </div>
      </div>
    </button>
  );
}