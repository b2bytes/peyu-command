import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Check, Package, Layers, TrendingDown } from 'lucide-react';

/**
 * Toggle en el carrito para cambiar entre items individuales o bundle con descuento.
 *
 * Lógica:
 * - Recibe el carrito actual (items + setCarrito).
 * - Llama getBundleSuggestions con los SKUs del carrito.
 * - Si encuentra un bundle que matchea ≥50% de los items → muestra toggle.
 * - Modo "individual": precios normales (estado actual del carrito).
 * - Modo "bundle": aplica descuento del bundle prorrateado a los items del bundle.
 * - El padre (Carrito) actualiza el localStorage cuando cambia el modo.
 */
export default function CartBundleToggle({ carrito, setCarrito }) {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Detectar si está activo: hay items con bundle_active === true
  const isBundleActive = carrito.some(i => i.bundle_active === true);

  useEffect(() => {
    if (!carrito || carrito.length < 2) {
      setLoading(false);
      return;
    }
    const skus = Array.from(new Set(carrito.map(i => i.sku).filter(Boolean)));
    if (skus.length < 2) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('getBundleSuggestions', {
          mode: 'cart',
          skus,
        });
        const list = res?.data?.bundles || [];
        if (!alive) return;
        // Tomar el primer bundle cuyos SKUs estén COMPLETAMENTE en el carrito
        const exact = list.find(b => b.products.every(p => skus.includes(p.sku)));
        setBundle(exact || null);
      } catch (e) {
        console.warn('CartBundleToggle:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [carrito.length]); // eslint-disable-line

  if (loading || !bundle) return null;

  // Calcular ahorro actual vs bundle
  const bundleSkus = new Set(bundle.products.map(p => p.sku));
  const itemsInBundle = carrito.filter(i => bundleSkus.has(i.sku));
  const subtotalIndividual = itemsInBundle.reduce((s, i) => {
    // Si están con bundle_active, el precio guardado YA tiene descuento → restaurar precio_original
    const basePrice = i.bundle_active && i.precio_original ? i.precio_original : i.precio;
    return s + basePrice * i.cantidad;
  }, 0);
  const bundleTotal = Math.floor(subtotalIndividual * (1 - bundle.discount_pct / 100));
  const savings = subtotalIndividual - bundleTotal;

  const toggleBundle = () => {
    let updated;
    if (isBundleActive) {
      // Restaurar precios originales
      updated = carrito.map(i => {
        if (i.bundle_active && i.precio_original) {
          return { ...i, precio: i.precio_original, bundle_active: false, precio_original: undefined };
        }
        return i;
      });
    } else {
      // Aplicar descuento bundle prorrateado a items del bundle
      const factor = 1 - bundle.discount_pct / 100;
      updated = carrito.map(i => {
        if (bundleSkus.has(i.sku)) {
          return {
            ...i,
            precio_original: i.precio,
            precio: Math.floor(i.precio * factor),
            bundle_active: true,
            bundle_id: bundle.id,
            bundle_name: bundle.name,
          };
        }
        return i;
      });
    }
    setCarrito(updated);
    localStorage.setItem('carrito', JSON.stringify(updated));
  };

  return (
    <div className={`border rounded-3xl p-5 shadow-sm transition-all ${
      isBundleActive
        ? 'bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-300'
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isBundleActive ? 'bg-violet-500 text-white' : 'bg-violet-100 text-violet-700'
        }`}>
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Bundle detectado por IA
          </p>
          <h3 className="font-poppins font-bold text-base text-gray-900 leading-tight">{bundle.name}</h3>
          {bundle.tagline && <p className="text-xs text-gray-500 mt-0.5">{bundle.tagline}</p>}
        </div>
      </div>

      {/* Toggle */}
      <div className="bg-white/70 border border-gray-200 rounded-2xl p-1 grid grid-cols-2 gap-1 mb-3">
        <button
          onClick={() => isBundleActive && toggleBundle()}
          className={`rounded-xl py-2.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            !isBundleActive ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Individual
        </button>
        <button
          onClick={() => !isBundleActive && toggleBundle()}
          className={`rounded-xl py-2.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            isBundleActive ? 'bg-violet-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Bundle −{bundle.discount_pct}%
        </button>
      </div>

      {/* Comparación */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Compra individual</span>
          <span className={`font-mono ${isBundleActive ? 'line-through text-gray-400' : 'text-gray-900 font-bold'}`}>
            ${subtotalIndividual.toLocaleString('es-CL')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-violet-700 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Bundle ({bundle.products.length} productos)
          </span>
          <span className={`font-poppins font-bold ${isBundleActive ? 'text-violet-700 text-base' : 'text-gray-700'}`}>
            ${bundleTotal.toLocaleString('es-CL')}
          </span>
        </div>
        <div className={`flex items-center justify-between pt-2 border-t ${isBundleActive ? 'border-violet-200' : 'border-gray-100'}`}>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Ahorro bundle
          </span>
          <span className="text-emerald-700 font-bold">${savings.toLocaleString('es-CL')}</span>
        </div>
      </div>

      {isBundleActive && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-violet-700 bg-violet-100/70 rounded-xl px-3 py-2">
          <Check className="w-3.5 h-3.5" />
          <span className="font-semibold">Descuento bundle aplicado</span>
        </div>
      )}
    </div>
  );
}