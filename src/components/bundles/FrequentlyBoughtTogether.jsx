import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Plus, ShoppingCart, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * "Frequently Bought Together" en página de producto.
 * - Llama getBundleSuggestions con el SKU del producto actual.
 * - Si hay bundle, muestra card con los productos + precio bundle vs individual.
 * - Botón "Agregar bundle al carrito" agrega todos los items con el descuento aplicado.
 */
export default function FrequentlyBoughtTogether({ productSku, onBundleAdded }) {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!productSku) return;
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('getBundleSuggestions', {
          mode: 'product',
          sku: productSku,
        });
        const list = res?.data?.bundles || [];
        if (alive && list.length > 0) setBundle(list[0]);
      } catch (e) {
        console.warn('FBT load:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [productSku]);

  if (loading || !bundle) return null;

  const handleAddBundle = () => {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const newItems = bundle.products.map(p => ({
      id: Math.random(),
      productoId: p.id,
      sku: p.sku,
      nombre: p.nombre,
      // Aplicamos el descuento bundle prorrateado a cada producto
      precio: Math.floor(p.precio_final * (1 - bundle.discount_pct / 100)),
      cantidad: 1,
      imagen: p.imagen_url,
      bundle_id: bundle.id,
      bundle_name: bundle.name,
    }));
    const updated = [...carrito, ...newItems];
    localStorage.setItem('carrito', JSON.stringify(updated));
    window.dispatchEvent(new Event('peyu:cart-added'));
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
    onBundleAdded?.(bundle);
  };

  return (
    <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/8 to-fuchsia-500/10 backdrop-blur-sm border border-violet-400/30 rounded-3xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-violet-500/30 border border-violet-400/40 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-violet-200" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-violet-300 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Frequently Bought Together · IA
          </p>
          <h3 className="font-poppins font-bold text-base text-white leading-tight">{bundle.name}</h3>
          {bundle.tagline && (
            <p className="text-xs text-violet-200/70 mt-0.5">{bundle.tagline}</p>
          )}
        </div>
      </div>

      {/* Productos en línea con "+" */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {bundle.products.map((p, i) => (
          <div key={p.sku} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-center gap-1 w-[88px]">
              <div className="w-[88px] h-[88px] rounded-2xl overflow-hidden bg-white/10 border border-white/15">
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              <p className="text-[10px] text-white/70 font-medium leading-tight text-center line-clamp-2 w-full">
                {p.nombre}
              </p>
              <p className="text-[10px] text-white/50 line-through">
                ${p.precio_final.toLocaleString('es-CL')}
              </p>
            </div>
            {i < bundle.products.length - 1 && (
              <Plus className="w-4 h-4 text-violet-300/60 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Pricing comparison */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-white/50">Precio individual</span>
          <span className="text-white/40 line-through font-mono">
            ${bundle.pricing.subtotal_individual.toLocaleString('es-CL')}
          </span>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-violet-200 text-sm font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Precio bundle
          </span>
          <span className="text-white text-xl font-poppins font-bold tabular-nums">
            ${bundle.pricing.bundle_price.toLocaleString('es-CL')}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-300 font-bold">−{bundle.discount_pct}% bundle</span>
          <span className="text-emerald-300 font-bold">
            Ahorras ${bundle.pricing.savings.toLocaleString('es-CL')}
          </span>
        </div>
      </div>

      {/* Rationale IA */}
      {bundle.ai_rationale && (
        <p className="text-[11px] text-white/45 italic leading-relaxed mb-4 px-1">
          <Sparkles className="w-2.5 h-2.5 inline -mt-0.5 mr-1 text-violet-300/80" />
          {bundle.ai_rationale}
        </p>
      )}

      {/* CTA */}
      <Button
        onClick={handleAddBundle}
        disabled={added}
        className="w-full h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold gap-2 shadow-lg shadow-violet-500/30 disabled:opacity-100"
      >
        {added ? (
          <><Check className="w-4 h-4" /> Bundle agregado al carrito</>
        ) : (
          <><ShoppingCart className="w-4 h-4" /> Agregar bundle · Ahorra ${bundle.pricing.savings.toLocaleString('es-CL')}</>
        )}
      </Button>

      {bundle.co_occurrence_count >= 2 && (
        <p className="text-[10px] text-violet-200/50 text-center mt-2 font-medium">
          🔥 {bundle.co_occurrence_count} clientes lo compraron juntos
        </p>
      )}
    </div>
  );
}