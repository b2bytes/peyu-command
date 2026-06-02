import { useState, useEffect } from 'react';
import { X, Leaf, Check, Recycle, Ruler, Weight, Sparkles } from 'lucide-react';
import { formatCLP } from '@/lib/v2-catalog';
import V2B2BPriceTable from '@/components/v2/V2B2BPriceTable';

// Swatches de color (Warm Dusk/Day). "Mixto" = degradado multicolor.
const COLOR_HEX = {
  Azul: '#2EA7E0',
  Negro: '#1a1a1a',
  Rojo: '#F2616A',
  Verde: '#3FD3A8',
};
function ColorSwatch({ name }) {
  const isMixto = name === 'Mixto';
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px]" style={{ background: 'var(--v2-glass)', border: '1px solid var(--v2-border)', color: 'var(--v2-fg-soft)' }}>
      <span
        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
        style={{
          border: '1px solid rgba(255,255,255,0.25)',
          background: isMixto
            ? 'conic-gradient(#2EA7E0,#3FD3A8,#F2616A,#1a1a1a,#2EA7E0)'
            : (COLOR_HEX[name] || '#999'),
        }}
      />
      {name}
    </span>
  );
}

function pesoLegible(gr) {
  if (gr == null) return null;
  return gr >= 1000 ? `${(gr / 1000).toFixed(gr % 1000 === 0 ? 0 : 2)} kg` : `${gr} gr`;
}

// Ficha de detalle precisa de un producto /v2. Drawer modal sutil (sheet
// deslizante desde la derecha) con la estética Warm Dusk/Warm Day vigente.
export default function CardProductDetail({ data, onClose }) {
  const p = data || {};
  const galeria = (p.galeria_urls && p.galeria_urls.length ? p.galeria_urls : [p.imagen_url]).filter(Boolean);
  const [hero, setHero] = useState(galeria[0] || null);
  const incluye = Array.isArray(p.incluye_items_v2) ? p.incluye_items_v2 : [];
  const colores = Array.isArray(p.colores_v2) ? p.colores_v2 : [];
  const peso = pesoLegible(p.peso_pack_gr);

  // Cerrar con ESC + bloquear scroll del fondo mientras está abierto.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex justify-end items-stretch max-md:items-end max-md:justify-center" role="dialog" aria-modal="true">
      <div className="v2-drawer-backdrop" onClick={onClose} />
      <div className="v2-detail-sheet v2-scroll" data-v2-detail>
        {/* Header sticky */}
        <div className="flex items-center justify-between px-5 py-3.5 sticky top-0 z-10" style={{ background: 'var(--v2-surface)', borderBottom: '1px solid var(--v2-border)' }}>
          <span className="v2-badge-eco flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold">
            <Leaf className="w-3 h-3" /> 100% reciclado
          </span>
          <button onClick={onClose} className="v2-btn-ghost w-9 h-9 flex items-center justify-center" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-8 pt-4">
          {/* Imagen + galería */}
          <div className="rounded-2xl overflow-hidden aspect-square" style={{ background: 'var(--v2-surface-2)' }}>
            {hero
              ? <img src={hero} alt={p.nombre} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-6xl">🐢</div>}
          </div>
          {galeria.length > 1 && (
            <div className="flex gap-2 mt-2.5 overflow-x-auto v2-scrollbar-hide">
              {galeria.map((src, i) => (
                <button key={i} onClick={() => setHero(src)} data-active={hero === src}
                  className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ border: hero === src ? '2px solid var(--v2-gold)' : '1px solid var(--v2-border)' }}>
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}

          {/* Nombre + precio */}
          <h2 className="text-xl font-semibold leading-snug mt-4 v2-display" style={{ color: 'var(--v2-fg)' }}>{p.nombre}</h2>
          {p.precio_b2c != null && (
            <div className="mt-1.5">
              <span className="text-2xl font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(p.precio_b2c)}</span>
              <span className="text-[11px] ml-1.5" style={{ color: 'var(--v2-fg-subtle)' }}>IVA incl.</span>
            </div>
          )}

          {/* Incluye */}
          {incluye.length > 0 && (
            <div className="mt-5">
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--v2-fg-muted)' }}>Incluye</p>
              <ul className="space-y-1.5">
                {incluye.map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--v2-fg-soft)' }}>
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--v2-teal)' }} />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dimensiones + peso */}
          {(p.dim_detalle_v2 || peso) && (
            <div className="mt-5 grid grid-cols-1 gap-2.5">
              {p.dim_detalle_v2 && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'var(--v2-glass)', border: '1px solid var(--v2-border)' }}>
                  <Ruler className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--v2-fg-muted)' }} />
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: 'var(--v2-fg-muted)' }}>Dimensiones</p>
                    <p className="text-[13px]" style={{ color: 'var(--v2-fg-soft)' }}>{p.dim_detalle_v2}</p>
                  </div>
                </div>
              )}
              {peso && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'var(--v2-glass)', border: '1px solid var(--v2-border)' }}>
                  <Weight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--v2-fg-muted)' }} />
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: 'var(--v2-fg-muted)' }}>Peso del pack</p>
                    <p className="text-[13px]" style={{ color: 'var(--v2-fg-soft)' }}>{peso}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Colores */}
          {colores.length > 0 && (
            <div className="mt-5">
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--v2-fg-muted)' }}>Colores disponibles</p>
              <div className="flex flex-wrap gap-2">
                {colores.map((c) => <ColorSwatch key={c} name={c} />)}
              </div>
            </div>
          )}

          {/* Tapitas recicladas */}
          {p.tapitas_aprox > 0 && (
            <div className="flex items-center gap-2 mt-5 p-3 rounded-xl" style={{ background: 'var(--v2-eco-soft, var(--v2-glass))', border: '1px solid var(--v2-border)' }}>
              <Recycle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--v2-teal)' }} />
              <p className="text-[13px]" style={{ color: 'var(--v2-fg-soft)' }}>
                Hecho con <strong>~{p.tapitas_aprox} tapitas recicladas</strong>
              </p>
            </div>
          )}

          {/* Tabla precios por volumen B2B */}
          {p.precio_b2b_tramos && (
            <div className="mt-6">
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--v2-fg-muted)' }}>Precios por volumen</p>
              <V2B2BPriceTable tramos={p.precio_b2b_tramos} />
            </div>
          )}

          {/* Nota personalización */}
          <div className="flex items-start gap-2 mt-5 text-[12px]" style={{ color: 'var(--v2-fg-soft)' }}>
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--v2-gold)' }} />
            Logo personalizado gratis desde 10 u (grabado láser UV en grises).
          </div>
        </div>
      </div>
    </div>
  );
}