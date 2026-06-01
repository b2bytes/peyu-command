import { useState } from 'react';
import { Leaf, Plus, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { formatCLP } from '@/lib/v2-catalog';

// Grilla DENSA de productos dentro del río del chat (2-3 columnas).
// Muestra hasta `initial` y permite "cargar +". Cada mini-card tiene quick-add.
export default function CardProductGrid({ data, perfil, onPick, onAddCart }) {
  const productos = data?.productos || [];
  const [visible, setVisible] = useState(6);
  const [addedSku, setAddedSku] = useState(null);
  if (productos.length === 0) return null;

  const shown = productos.slice(0, visible);

  const handleQuickAdd = (e, p) => {
    e.stopPropagation();
    onAddCart?.(p, null);
    setAddedSku(p.sku);
    setTimeout(() => setAddedSku((s) => (s === p.sku ? null : s)), 1500);
  };

  return (
    <div className="v2-fade-up w-full max-w-[760px]">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {shown.map((p) => {
          const tramos = p.precio_b2b_tramos || {};
          const desdeB2B = tramos.t2000_mas || tramos.t1000_1999 || tramos.unitario;
          return (
            <button key={p.id || p.sku} onClick={() => onPick?.(p)} className="v2-mini-card text-left flex flex-col">
              <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--v2-surface-2)' }}>
                {p.imagen_url
                  ? <img src={p.imagen_url} alt={p.nombre} loading="lazy" decoding="async" className="w-full h-full object-cover" style={{ backfaceVisibility: 'hidden' }} />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🐢</div>}
                <span className="v2-badge-eco absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-semibold">
                  <Leaf className="w-2 h-2" /> ♻
                </span>
                {/* Quick add (solo B2C — en B2B se cotiza) */}
                {perfil !== 'b2b' && (
                  <span
                    onClick={(e) => handleQuickAdd(e, p)}
                    className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                    style={{ background: addedSku === p.sku ? 'var(--v2-teal)' : 'var(--v2-grad-action)', color: '#fff' }}
                  >
                    {addedSku === p.sku ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                )}
              </div>
              <div className="p-2.5 flex-1 flex flex-col">
                <h4 className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: 'var(--v2-fg)' }}>{p.nombre}</h4>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span title="Grabado láser"><Sparkles className="w-3 h-3" style={{ color: 'var(--v2-gold)' }} /></span>
                  <span title="Garantía 10 años"><ShieldCheck className="w-3 h-3" style={{ color: 'var(--v2-teal)' }} /></span>
                </div>
                <p className="text-sm font-bold mt-auto pt-1.5" style={{ color: perfil === 'b2b' ? 'var(--v2-teal)' : 'var(--v2-gold)' }}>
                  {perfil === 'b2b' ? `Desde ${formatCLP(desdeB2B)}` : formatCLP(p.precio_b2c)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {visible < productos.length && (
        <button onClick={() => setVisible((v) => v + 6)} className="v2-btn-ghost w-full h-9 mt-2.5 text-[11px] font-semibold">
          Ver más ({productos.length - visible} restantes)
        </button>
      )}
    </div>
  );
}