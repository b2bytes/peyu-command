// ============================================================================
// CrossSellCarousel · Carrusel de cross-sell B2B con SECUENCIA ESTRATÉGICA 2027.
//
// Estrategia de conversión (price-anchoring descendente):
//   1º sugerencia → producto CARO   (> $10.000)  → ancla el ticket alto
//   2º sugerencia → producto MEDIO  ($5.000–$10.000)
//   3º sugerencia → producto BARATO (< $5.000)   → cierre fácil, "ya que estás"
//   4º+ → resto del catálogo ordenado por precio desc.
//
// Tras agregar un producto, avanza automáticamente al siguiente tier para
// mantener el relato y no abrumar (un toque a la vez = más conversión).
// ============================================================================
import { useMemo, useState, useEffect } from 'react';
import { Plus, Sparkles, TrendingUp, Check, ArrowRight } from 'lucide-react';
import { getProductImage } from '@/utils/productImages.js';

function precioRef(p) {
  return p?.precio_base_b2b || p?.precio_b2c || 0;
}

// Construye la secuencia estratégica: caro → medio → barato → resto desc.
function buildSequence(disponibles) {
  const caros   = disponibles.filter(p => precioRef(p) > 10000).sort((a, b) => precioRef(b) - precioRef(a));
  const medios  = disponibles.filter(p => precioRef(p) >= 5000 && precioRef(p) <= 10000).sort((a, b) => precioRef(b) - precioRef(a));
  const baratos = disponibles.filter(p => precioRef(p) < 5000 && precioRef(p) > 0).sort((a, b) => precioRef(b) - precioRef(a));

  const seq = [];
  if (caros[0]) seq.push(caros[0]);
  if (medios[0]) seq.push(medios[0]);
  if (baratos[0]) seq.push(baratos[0]);

  // Resto (sin repetir) ordenado por precio descendente
  const usados = new Set(seq.map(p => p.id));
  const resto = disponibles.filter(p => !usados.has(p.id)).sort((a, b) => precioRef(b) - precioRef(a));
  return [...seq, ...resto];
}

const TIER_LABELS = [
  { titulo: 'El favorito corporativo', sub: 'Máximo impacto de marca', icon: TrendingUp, color: 'amber' },
  { titulo: 'Ideal para complementar', sub: 'Equilibrio perfecto', icon: Sparkles, color: 'cyan' },
  { titulo: 'Súmalo ya que estás', sub: 'Detalle que suma', icon: Plus, color: 'teal' },
];

const COLORS = {
  amber: { chip: 'text-amber-300 bg-amber-500/15 border-amber-400/30', icon: 'text-amber-300', btn: 'from-amber-400 to-yellow-500 shadow-amber-500/30' },
  cyan:  { chip: 'text-cyan-300 bg-cyan-500/15 border-cyan-400/30', icon: 'text-cyan-300', btn: 'from-cyan-400 to-blue-500 shadow-cyan-500/30' },
  teal:  { chip: 'text-teal-300 bg-teal-500/15 border-teal-400/30', icon: 'text-teal-300', btn: 'from-teal-400 to-cyan-500 shadow-teal-500/30' },
};

export default function CrossSellCarousel({ catalogo, cart, onAdd }) {
  const disponibles = useMemo(() => {
    const enCarrito = new Set(cart.map(c => c.producto.id));
    return catalogo.filter(p => !enCarrito.has(p.id));
  }, [catalogo, cart]);

  const secuencia = useMemo(() => buildSequence(disponibles), [disponibles]);
  const [index, setIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  // Si la secuencia cambia (se agregó/quitó algo), mantener el índice en rango
  useEffect(() => {
    if (index >= secuencia.length) setIndex(0);
  }, [secuencia.length, index]);

  if (secuencia.length === 0) return null;

  const producto = secuencia[index];
  if (!producto) return null;

  const tier = TIER_LABELS[Math.min(index, TIER_LABELS.length - 1)];
  const c = COLORS[tier.color];
  const TierIcon = tier.icon;
  const precio = precioRef(producto);

  const handleAdd = () => {
    onAdd(producto);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      // Avanza al siguiente tier de la secuencia (caro → medio → barato → ...)
      setIndex(i => (i + 1) % Math.max(1, secuencia.length));
    }, 650);
  };

  return (
    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-3xl p-4 backdrop-blur-md overflow-hidden">
      {/* Header relato */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400/30 to-cyan-500/30 border border-teal-400/40 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-poppins font-extrabold text-white leading-none truncate">Completa tu pedido</p>
            <p className="text-[10px] text-white/45 leading-none mt-1">Elegidos para tu empresa</p>
          </div>
        </div>
        {/* Dots de progreso */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {secuencia.slice(0, 5).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-teal-400' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      {/* Card del producto sugerido */}
      <div className={`relative rounded-2xl bg-white/[0.04] border border-white/10 p-3 transition-all ${justAdded ? 'scale-[0.97] opacity-60' : ''}`}>
        {/* Tier badge */}
        <div className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mb-2.5 ${c.chip}`}>
          <TierIcon className="w-2.5 h-2.5" /> {tier.titulo}
        </div>

        <div className="flex gap-3">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 ring-1 ring-white/15">
            <img src={getProductImage(producto)} alt={producto.nombre} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col">
            <p className="text-sm font-bold text-white leading-tight line-clamp-2">{producto.nombre}</p>
            <p className="text-[10px] text-white/45 mt-0.5">{producto.categoria}</p>
            <div className="mt-auto pt-1.5">
              <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold leading-none">Desde</p>
              <p className="text-base font-poppins font-extrabold text-teal-300 tabular-nums leading-tight">
                ${precio.toLocaleString('es-CL')}
                <span className="text-[10px] text-white/40 font-medium ml-1">c/u</span>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={justAdded}
          className={`w-full mt-3 h-10 rounded-xl bg-gradient-to-br ${c.btn} text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-100`}
        >
          {justAdded ? (
            <><Check className="w-4 h-4" strokeWidth={3} /> Agregado</>
          ) : (
            <><Plus className="w-4 h-4" strokeWidth={2.5} /> Agregar al pedido</>
          )}
        </button>
      </div>

      {/* Skip / ver siguiente */}
      {secuencia.length > 1 && (
        <button
          onClick={() => setIndex(i => (i + 1) % secuencia.length)}
          className="w-full mt-2 text-[11px] font-semibold text-white/45 hover:text-white/80 transition flex items-center justify-center gap-1 py-1"
        >
          Ver otra sugerencia <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}