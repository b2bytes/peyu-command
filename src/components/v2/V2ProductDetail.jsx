import { useState } from 'react';
import { X, Leaf, ShoppingCart, MessageCircle, Check } from 'lucide-react';
import { formatCLP, getIncluye, getPersonalizacion, hasB2B } from '@/lib/v2-catalog';
import V2B2BPriceTable from './V2B2BPriceTable';

const COLORES = ['Azul', 'Negro', 'Rojo', 'Verde', 'Mixto'];

// Detalle de producto /v2 en modal full-screen mobile-first.
export default function V2ProductDetail({ producto, mode, onClose, onAddCart, onQuote }) {
  const galeria = (producto.galeria_urls && producto.galeria_urls.length > 0)
    ? producto.galeria_urls
    : (producto.imagen_url ? [producto.imagen_url] : []);
  const [activeImg, setActiveImg] = useState(galeria[0] || null);
  const [color, setColor] = useState('Azul');
  const [added, setAdded] = useState(false);
  const incluye = getIncluye(producto);

  const handleAdd = () => {
    onAddCart?.(producto, color);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="v2-glass relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto v2-scroll rounded-t-3xl sm:rounded-3xl">
        <button
          onClick={onClose}
          className="v2-btn-ghost absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Galería */}
        <div className="aspect-square sm:aspect-[4/3] overflow-hidden rounded-t-3xl" style={{ background: 'var(--v2-surface-2)' }}>
          {activeImg ? (
            <img src={activeImg} alt={producto.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🐢</div>
          )}
        </div>
        {galeria.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto v2-scrollbar-hide">
            {galeria.slice(0, 12).map((url) => (
              <button
                key={url}
                onClick={() => setActiveImg(url)}
                className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: activeImg === url ? '2px solid var(--v2-gold)' : '1px solid var(--v2-border)' }}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5">
          <span className="v2-badge-eco inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold mb-2">
            <Leaf className="w-3 h-3" /> Plástico 100% reciclado · Hecho en Chile
          </span>

          <h2 className="v2-display text-2xl mb-2" style={{ color: 'var(--v2-fg)' }}>
            {producto.nombre}
          </h2>

          {incluye && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--v2-fg-soft)' }}>
              {incluye}
            </p>
          )}

          {producto.dimensiones && (
            <p className="text-xs mb-4" style={{ color: 'var(--v2-fg-muted)' }}>
              <span className="font-semibold">Dimensiones:</span> {producto.dimensiones}
            </p>
          )}

          {/* Colores */}
          <div className="mb-5">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--v2-fg-muted)' }}>Color</p>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="v2-chip px-3 py-1.5 text-xs"
                  data-active={color === c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Precio según modo */}
          <div className="v2-card p-4 mb-5" style={{ background: 'var(--v2-surface-2)' }}>
            {mode === 'b2c' ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold" style={{ color: 'var(--v2-gold)' }}>
                  {formatCLP(producto.precio_b2c)}
                </span>
                <span className="text-xs" style={{ color: 'var(--v2-fg-subtle)' }}>IVA incluido</span>
              </div>
            ) : hasB2B(producto) ? (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--v2-teal)' }}>
                  Precios por volumen
                </p>
                <V2B2BPriceTable tramos={producto.precio_b2b_tramos} />
                <div className="mt-3 pt-3 text-xs" style={{ borderTop: '1px solid var(--v2-border)', color: 'var(--v2-fg-soft)' }}>
                  <span className="font-semibold" style={{ color: 'var(--v2-fg)' }}>Personalización: </span>
                  {getPersonalizacion(producto)}
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--v2-fg-muted)' }}>
                Solicita una cotización por volumen.
              </p>
            )}
          </div>

          {/* CTA según modo */}
          {mode === 'b2c' ? (
            <button onClick={handleAdd} className="v2-btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm">
              {added ? <><Check className="w-4 h-4" /> Agregado</> : <><ShoppingCart className="w-4 h-4" /> Agregar al carro</>}
            </button>
          ) : (
            <button onClick={() => onQuote?.(producto)} className="v2-btn-gold w-full h-12 flex items-center justify-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4" /> Cotizar / Pedir por volumen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}