import { useState } from 'react';
import { Package, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';
import { getProductImage } from '@/utils/productImages';

// ════════════════════════════════════════════════════════════════════════
// LineaProductoPropuesta — Línea de la propuesta B2B con FICHA TÉCNICA real:
// imagen del producto cotizado + datos técnicos (material, dimensiones, qué
// incluye, color, personalización). Estilo "viaje de presentación" PEYU,
// profesional como una propuesta corporativa de verdad.
//
// Props:
//   linea     : item del items_json { sku, nombre, cantidad, precio_unitario, ... }
//   producto  : entidad Producto enlazada por SKU (puede ser null)
//   idx       : índice (para zebra)
// ════════════════════════════════════════════════════════════════════════
export default function LineaProductoPropuesta({ linea, producto, idx }) {
  const [open, setOpen] = useState(idx === 0); // primera línea abierta por defecto
  const cantidad = linea.cantidad || linea.qty || 0;
  const descPct = linea.descuento_pct || linea.ahorro_pct || 0;
  const subtotal = linea.line_total || linea.subtotal || 0;
  const img = producto ? getProductImage(producto) : (linea.imagen || linea.mockup_url || null);

  // Ficha técnica: prioriza datos del producto real, con fallback a la línea.
  const ficha = [
    { l: 'Material', v: producto?.material || '—' },
    { l: 'Dimensiones', v: producto?.dim_detalle_v2 || producto?.dimensiones || '—' },
    { l: 'Incluye', v: producto?.incluye_v2 || producto?.incluye || '—' },
    { l: 'Color', v: linea.color || (Array.isArray(producto?.colores) ? producto.colores.join(', ') : '—') },
    { l: 'Personalización', v: linea.personalizacion || linea.tipo_personalizacion || 'Logo láser' },
    { l: 'Garantía', v: producto?.garantia_anios ? `${producto.garantia_anios} años` : '10 años' },
  ].filter((f) => f.v && f.v !== '—');

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #EDE3D6', background: 'white' }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 p-3 text-left">
        {/* Imagen del producto cotizado */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(145deg,#F7F2EC,#EDE3D6)', border: '1px solid #EDE3D6' }}>
          {img ? (
            <img src={img} alt={linea.nombre || linea.name} referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-1" />
          ) : (
            <Package className="w-6 h-6" style={{ color: '#A08070' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight" style={{ color: '#2C1810' }}>
            {cantidad}× {linea.nombre || linea.name}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: '#A08070' }}>
            {fmtCLP(linea.precio_unitario)}/u · {linea.tier || linea.tramo || 'B2B'}
            {descPct > 0 && <span className="ml-1.5 font-bold" style={{ color: '#D96B4D' }}>−{descPct}%</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-bold text-sm" style={{ color: '#2C1810' }}>{fmtCLP(subtotal)}</span>
          {open ? <ChevronUp className="w-4 h-4" style={{ color: '#A08070' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#A08070' }} />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3.5">
          <div className="h-px mb-3" style={{ background: '#EDE3D6' }} />
          {producto?.descripcion && (
            <p className="text-[11px] leading-relaxed mb-3" style={{ color: '#4B4F54' }}>
              {producto.descripcion.slice(0, 220)}{producto.descripcion.length > 220 ? '…' : ''}
            </p>
          )}
          {/* Ficha técnica en formato propuesta corporativa */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EDE3D6' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest px-3 py-2"
              style={{ color: '#0F8B6C', background: '#F0FAF6' }}>Ficha técnica</p>
            <div className="divide-y" style={{ '--tw-divide-color': '#F2ECE2' }}>
              {ficha.map(({ l, v }) => (
                <div key={l} className="flex gap-3 px-3 py-2">
                  <span className="text-[11px] font-bold w-28 flex-shrink-0" style={{ color: '#A08070' }}>{l}</span>
                  <span className="text-[11px] flex-1" style={{ color: '#2C1810' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Detalle económico de la línea */}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {[
              { l: 'Cantidad', v: `${cantidad} u` },
              { l: 'Precio unitario neto', v: fmtCLP(linea.precio_unitario) },
              { l: 'Subtotal neto', v: fmtCLP(subtotal) },
              { l: 'Logo láser', v: cantidad >= 10 ? '✓ Gratis' : 'Aplica cargo' },
            ].map(({ l, v }) => (
              <div key={l} className="rounded-lg px-2.5 py-2" style={{ background: '#F8F3ED' }}>
                <p className="text-[10px]" style={{ color: '#A08070' }}>{l}</p>
                <p className="text-[12px] font-bold mt-0.5 flex items-center gap-1" style={{ color: '#2C1810' }}>
                  {v.startsWith('✓') && <Check className="w-3 h-3" style={{ color: '#0F8B6C' }} />}{v.replace('✓ ', '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}