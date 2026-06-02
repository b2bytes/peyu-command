import { useState } from 'react';
import { Leaf, ShoppingCart, MessageCircle, Check, Eye } from 'lucide-react';
import { formatCLP, getB2BDesde } from '@/lib/v2-catalog';
import CardProductDetail from './CardProductDetail';

const COLORES = ['Azul', 'Negro', 'Rojo', 'Verde'];

// Card de UN producto, renderizada dentro del río del chat /v2.
export default function CardProduct({ data, perfil, onAddCart, onQuote }) {
  const p = data || {};
  const esCacho = (p.categoria_v2 === 'Cachos');
  const colores = esCacho ? [...COLORES, 'Mixto'] : COLORES;
  const [color, setColor] = useState(colores[0]);
  const [added, setAdded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const desde = getB2BDesde(p.precio_b2b_tramos);

  const handleAdd = () => {
    onAddCart?.(p, color);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="v2-card v2-fade-up overflow-hidden w-full max-w-[440px] flex sm:flex-row flex-col">
      <div className="relative sm:w-[190px] w-full sm:aspect-auto aspect-square flex-shrink-0 overflow-hidden" style={{ background: 'var(--v2-surface-2)' }}>
        {p.imagen_url
          ? <img src={p.imagen_url} alt={p.nombre} loading="lazy" decoding="async" className="w-full h-full object-cover" style={{ backfaceVisibility: 'hidden' }} />
          : <div className="w-full h-full flex items-center justify-center text-5xl">🐢</div>}
        <span className="v2-badge-eco absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold">
          <Leaf className="w-3 h-3" /> 100% reciclado
        </span>
      </div>

      <div className="p-4 flex-1 min-w-0 flex flex-col">
        <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 v2-display" style={{ color: 'var(--v2-fg)' }}>
          {p.nombre}
        </h3>
        {p.incluye_v2 && (
          <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--v2-fg-muted)' }}>{p.incluye_v2}</p>
        )}
        <button onClick={() => setShowDetail(true)} className="flex items-center gap-1 text-[11px] font-medium mt-1.5 self-start hover:underline" style={{ color: 'var(--v2-teal)' }}>
          <Eye className="w-3.5 h-3.5" /> Ver detalle
        </button>

        {/* Colores */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {colores.map((c) => (
            <button key={c} onClick={() => setColor(c)} data-active={color === c} className="v2-chip px-3 py-1.5 text-[11px]">
              {c}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-3.5 mt-3.5" style={{ borderTop: '1px solid var(--v2-border)' }}>
          {perfil === 'b2b' ? (
            <div className="mb-3">
              <span className="text-[11px]" style={{ color: 'var(--v2-fg-muted)' }}>Desde</span>
              <span className="text-xl font-bold ml-1.5" style={{ color: 'var(--v2-teal)' }}>{formatCLP(desde?.precio)}</span>
              <span className="text-[11px] ml-1.5" style={{ color: 'var(--v2-fg-subtle)' }}>c/u + IVA · ({desde?.label})</span>
              {desde?.ahorro && (
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--v2-fg-subtle)' }}>hasta {formatCLP(desde.ahorro)} c/u en 2.000+</p>
              )}
              {p.personalizacion_v2 && (
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--v2-fg-soft)' }}>✦ {p.personalizacion_v2}</p>
              )}
            </div>
          ) : (
            <div className="mb-3">
              <span className="text-xl font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(p.precio_b2c)}</span>
              <span className="text-[11px] ml-1.5" style={{ color: 'var(--v2-fg-subtle)' }}>IVA incl.</span>
            </div>
          )}

          {perfil === 'b2b' ? (
            <button onClick={() => onQuote?.(p)} className="v2-btn-gold w-full h-11 flex items-center justify-center gap-2 text-[13px]">
              <MessageCircle className="w-4 h-4" /> Cotizar / Pedir por volumen
            </button>
          ) : (
            <button onClick={handleAdd} className="v2-btn-primary w-full h-11 flex items-center justify-center gap-2 text-[13px]">
              {added ? <><Check className="w-4 h-4" /> Agregado</> : <><ShoppingCart className="w-4 h-4" /> Agregar al carro</>}
            </button>
          )}
        </div>
      </div>

      {showDetail && <CardProductDetail data={p} onClose={() => setShowDetail(false)} />}
    </div>
  );
}