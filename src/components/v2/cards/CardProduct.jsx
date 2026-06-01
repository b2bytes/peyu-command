import { useState } from 'react';
import { Leaf, ShoppingCart, MessageCircle, Check } from 'lucide-react';
import { formatCLP } from '@/lib/v2-catalog';

const COLORES = ['Azul', 'Negro', 'Rojo', 'Verde'];

// Card de UN producto, renderizada dentro del río del chat /v2.
export default function CardProduct({ data, perfil, onAddCart, onQuote }) {
  const p = data || {};
  const esCacho = (p.categoria_v2 === 'Cachos');
  const colores = esCacho ? [...COLORES, 'Mixto'] : COLORES;
  const [color, setColor] = useState(colores[0]);
  const [added, setAdded] = useState(false);
  const tramos = p.precio_b2b_tramos || {};
  const desdeB2B = tramos.t2000_mas || tramos.t1000_1999 || tramos.unitario;

  const handleAdd = () => {
    onAddCart?.(p, color);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="v2-card v2-fade-up overflow-hidden w-full max-w-[300px]">
      <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--v2-surface-2)' }}>
        {p.imagen_url
          ? <img src={p.imagen_url} alt={p.nombre} loading="lazy" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">🐢</div>}
        <span className="v2-badge-eco absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 text-[9px] font-semibold">
          <Leaf className="w-2.5 h-2.5" /> 100% reciclado
        </span>
      </div>

      <div className="p-3.5">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--v2-fg)' }}>
          {p.nombre}
        </h3>
        {p.incluye_v2 && (
          <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--v2-fg-muted)' }}>{p.incluye_v2}</p>
        )}

        {/* Colores */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {colores.map((c) => (
            <button key={c} onClick={() => setColor(c)} data-active={color === c} className="v2-chip px-2.5 py-1 text-[10px]">
              {c}
            </button>
          ))}
        </div>

        <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid var(--v2-border)' }}>
          {perfil === 'b2b' ? (
            <div className="mb-2.5">
              <span className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>Desde</span>
              <span className="text-lg font-bold ml-1" style={{ color: 'var(--v2-teal)' }}>{formatCLP(desdeB2B)}</span>
              <span className="text-[10px] ml-1" style={{ color: 'var(--v2-fg-subtle)' }}>c/u · sin IVA</span>
              {p.personalizacion_v2 && (
                <p className="text-[10px] mt-1" style={{ color: 'var(--v2-fg-soft)' }}>✦ {p.personalizacion_v2}</p>
              )}
            </div>
          ) : (
            <div className="mb-2.5">
              <span className="text-lg font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(p.precio_b2c)}</span>
              <span className="text-[10px] ml-1" style={{ color: 'var(--v2-fg-subtle)' }}>IVA incl.</span>
            </div>
          )}

          {perfil === 'b2b' ? (
            <button onClick={() => onQuote?.(p)} className="v2-btn-gold w-full h-10 flex items-center justify-center gap-2 text-xs">
              <MessageCircle className="w-3.5 h-3.5" /> Cotizar / Pedir por volumen
            </button>
          ) : (
            <button onClick={handleAdd} className="v2-btn-primary w-full h-10 flex items-center justify-center gap-2 text-xs">
              {added ? <><Check className="w-3.5 h-3.5" /> Agregado</> : <><ShoppingCart className="w-3.5 h-3.5" /> Agregar al carro</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}