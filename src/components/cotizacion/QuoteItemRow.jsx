import { useState } from 'react';
import { Trash2, Sparkles, ChevronDown, ChevronUp, Ruler, Weight } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';
import LogoMockupPreview from '@/components/cotizacion/LogoMockupPreview';

// Mapa de colores → hex para swatches
const SWATCH_MAP = {
  'azul':'#3B7DD8','negro':'#1A1A1A','rojo':'#D63B3B','verde':'#2E8B57',
  'blanco':'#E8E8E8','amarillo':'#F5C518','naranja':'#E07020','gris':'#9CA3AF',
  'turquesa':'#0E9C9C','rosa':'#E05A8A','celeste':'#5AACE0','café':'#7B4F2E',
  'beige':'#D4C4A0','morado':'#7B3FA0',
};
function swatchColor(name) {
  if (!name) return '#D4C4B0';
  const k = name.toLowerCase();
  for (const [key, val] of Object.entries(SWATCH_MAP)) {
    if (k.includes(key)) return val;
  }
  return '#D4C4B0';
}

function getColores(p) {
  if (Array.isArray(p.colores_v2) && p.colores_v2.length) return p.colores_v2;
  if (Array.isArray(p.colores) && p.colores.length) return p.colores;
  return [];
}

// Tramos rápidos de cantidad para selección ágil
const TRAMOS_RAPIDOS = [10, 50, 100, 250, 500, 1000];

// Fila enriquecida de un producto dentro de la cotización B2B.
// Muestra: imagen, specs técnicas, colores, control de cantidad con tramos rápidos,
// mockup de logo embebido y precio unitario en vivo por tramo.
export default function QuoteItemRow({ producto, qty, onQty, onRemove, logoUrl }) {
  const [expanded, setExpanded] = useState(false);

  const b2b = getB2BPriceForQty(producto, qty);
  const unit = b2b?.precio ?? getUnitBasePrice(producto);
  const baseUnit = b2b?.baseUnit ?? getUnitBasePrice(producto);
  const ahorro = b2b?.ahorroPct ?? 0;
  const subtotal = unit * qty;
  const moq = producto.personalizacion_gratis_desde || producto.moq_personalizacion || 10;
  const logoGratis = qty >= moq;
  const colores = getColores(producto);
  const dim = producto.dim_detalle_v2 || producto.dimensiones;
  const pesoPack = producto.peso_pack_gr
    ? `Pack: ${producto.peso_pack_gr}gr`
    : producto.peso_kg ? `${(producto.peso_kg * 1000).toFixed(0)}gr/u` : null;
  const tapitas = producto.tapitas_aprox;

  // Siguiente tramo y cuántas unidades faltan para llegar
  const allTramos = TRAMOS_RAPIDOS;
  const nextTier = allTramos.find((t) => t > qty);
  const faltan = nextTier ? nextTier - qty : 0;
  const nextB2B = nextTier ? getB2BPriceForQty(producto, nextTier) : null;
  const ahorroNextPct = nextB2B?.ahorroPct || 0;

  return (
    <div className="bg-white border border-[#EBE3D6] rounded-2xl overflow-hidden">
      {/* Fila principal */}
      <div className="flex items-stretch gap-0">
        {/* Mockup inteligente de logo */}
        <div className="m-3 flex-shrink-0" style={{ width: '80px', height: '80px' }}>
          <LogoMockupPreview
            logoUrl={logoUrl}
            productImg={getProductImage(producto)}
            size="sm"
            className="!w-full !h-full !aspect-auto"
          />
        </div>

        {/* Info central */}
        <div className="flex-1 min-w-0 py-3 pr-2">
          <p className="font-bold text-sm text-[#2A2420] leading-tight mb-1 truncate">{producto.nombre}</p>

          {/* Precio + ahorro */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-sm font-bold text-[#0F8B6C]">{fmtCLP(unit)}/u</span>
            {ahorro > 0 && baseUnit !== unit && (
              <span className="text-[10px] text-[#A78B6F] line-through">{fmtCLP(baseUnit)}</span>
            )}
            {ahorro > 0 && (
              <span className="text-[10px] font-bold text-white bg-[#D96B4D] px-1.5 py-0.5 rounded-full">−{ahorro}%</span>
            )}
            {b2b?.label && (
              <span className="text-[10px] text-[#A78B6F] bg-[#EBE3D6] px-1.5 py-0.5 rounded-full">{b2b.label}</span>
            )}
          </div>

          {/* Logo gratis */}
          <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            logoGratis ? 'bg-[#0F8B6C]/10 text-[#0F8B6C]' : 'bg-[#EBE3D6] text-[#A78B6F]'
          }`}>
            <Sparkles className="w-2.5 h-2.5" />
            {logoGratis ? `✓ Logo gratis (≥${moq}u)` : `Logo gratis desde ${moq}u`}
          </div>
        </div>

        {/* Columna derecha: subtotal + eliminar */}
        <div className="flex flex-col items-end justify-between py-3 pr-3 flex-shrink-0">
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#EBE3D6] hover:border-[#D96B4D]/40 hover:text-[#D96B4D] flex items-center justify-center text-[#A78B6F] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="text-right">
            <p className="text-xs text-[#A78B6F]">{qty}u</p>
            <p className="text-sm font-bold text-[#2A2420]">{fmtCLP(subtotal)}</p>
          </div>
        </div>
      </div>

      {/* Control de cantidad + specs expandibles */}
      <div className="px-3 pb-3 space-y-2.5">
        {/* Tramos rápidos */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#A78B6F] font-semibold flex-shrink-0">Cantidad:</span>
          {TRAMOS_RAPIDOS.map((n) => {
            const tier = getB2BPriceForQty(producto, n);
            const isActive = qty === n;
            return (
              <button
                key={n}
                onClick={() => onQty(n)}
                title={tier ? `${fmtCLP(tier.precio)}/u` : ''}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  isActive
                    ? 'bg-[#0F8B6C] text-white shadow-sm'
                    : 'bg-[#FAF7F2] border border-[#EBE3D6] text-[#4B4F54] hover:border-[#0F8B6C]/40'
                }`}
              >
                {n >= 1000 ? `${n / 1000}k` : n}u
                {tier?.ahorroPct > 0 && !isActive && (
                  <span className="ml-0.5 text-[#D96B4D]">·−{tier.ahorroPct}%</span>
                )}
              </button>
            );
          })}
          {/* Input libre */}
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => onQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-16 h-7 text-center text-[11px] font-bold text-[#2A2420] bg-white border border-[#EBE3D6] rounded-lg focus:outline-none focus:border-[#0F8B6C] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="otro"
          />
        </div>

        {/* Upsell: "faltan X unidades para −Y%" */}
        {nextTier && ahorroNextPct > ahorro && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#A78B6F] bg-[#FAF7F2] border border-[#EBE3D6] rounded-lg px-2.5 py-1.5">
            <span className="text-[#D96B4D] font-bold">↑</span>
            Agrega <strong className="text-[#2A2420] mx-0.5">{faltan}u más</strong> y baja a
            <strong className="text-[#0F8B6C] ml-0.5">{fmtCLP(nextB2B.precio)}/u</strong>
            <span className="text-[#D96B4D] font-bold ml-0.5">(−{ahorroNextPct}%)</span>
          </div>
        )}

        {/* Specs expandibles */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[10px] text-[#A78B6F] hover:text-[#0F8B6C] transition-colors font-semibold"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Ocultar' : 'Ver'} especificaciones
        </button>

        {expanded && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] pt-1 border-t border-[#EBE3D6]">
            {dim && (
              <span className="flex items-center gap-1 text-[#4B4F54]">
                <Ruler className="w-3 h-3 text-[#0F8B6C]" /> {dim}
              </span>
            )}
            {pesoPack && (
              <span className="flex items-center gap-1 text-[#4B4F54]">
                <Weight className="w-3 h-3 text-[#0F8B6C]" /> {pesoPack}
              </span>
            )}
            {tapitas && (
              <span className="text-[#0F8B6C] font-semibold col-span-2">♻ ~{tapitas} tapas plásticas/u</span>
            )}
            {colores.length > 0 && (
              <div className="col-span-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[#A78B6F]">Colores:</span>
                {colores.map((c) => (
                  <div key={c} className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full ring-1 ring-black/10" style={{ background: swatchColor(c) }} />
                    <span className="text-[#4B4F54]">{c}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Peso total estimado del pedido */}
            {(producto.peso_pack_gr || producto.peso_kg) && (
              <span className="col-span-2 text-[#A78B6F]">
                Peso total {qty}u: ≈{((producto.peso_pack_gr || producto.peso_kg * 1000) * qty / 1000).toFixed(1)} kg
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}