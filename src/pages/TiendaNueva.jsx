import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Recycle, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import ProductCardV2 from '@/components/shopv2/ProductCardV2';
import { CATEGORIAS_V2 } from '@/lib/shop-v2-config';

// ════════════════════════════════════════════════════════════════════════
// /TiendaNueva — Home del Shop B2C v2 (estética crema). Hero + categorías +
// destacados. AISLADO: usa carrito_v2 y no toca la tienda viva.
// ════════════════════════════════════════════════════════════════════════
export default function TiendaNueva() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 200)
      .then((data) => {
        const b2c = (data || []).filter(
          (p) => p.canal !== 'B2B Exclusivo' && p.categoria !== 'Gift Card' && p.precio_b2c
        );
        setProductos(b2c);
      })
      .finally(() => setLoading(false));
  }, []);

  const destacados = useMemo(() => productos.slice(0, 8), [productos]);

  return (
    <div className="min-h-screen bg-[#FBF7EF] font-inter text-[#2A2420]">
      <ShopV2Header />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-[#0F8B6C]/10 text-[#0F8B6C] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Recycle className="w-3.5 h-3.5" /> Plástico 100% reciclado · Hecho en Chile
          </span>
          <h1 className="font-fraunces text-4xl sm:text-5xl leading-[1.05] mb-3">
            Productos que <span className="text-[#0F8B6C]">cuidan</span> el planeta
          </h1>
          <p className="text-[#4B4F54] text-base sm:text-lg mb-6">
            Carcasas, juegos y decoración hechos con plástico reciclado. Personalízalos con grabado láser.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/CatalogoNuevo">
              <button className="inline-flex items-center gap-2 bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-[#0F8B6C]/20 transition-all hover:scale-[1.02]">
                Ver la tienda <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Recycle, t: 'Plástico reciclado', d: 'Cada producto reutiliza residuos' },
            { icon: Sparkles, t: 'Personalizable', d: 'Grabado láser permanente' },
            { icon: ShieldCheck, t: 'Garantía 10 años', d: 'Calidad asegurada' },
          ].map((b, i) => (
            <div key={i} className="bg-white border border-[#E7D8C6] rounded-2xl p-4 text-center">
              <b.icon className="w-5 h-5 text-[#0F8B6C] mx-auto mb-2" />
              <p className="text-xs font-bold text-[#2A2420]">{b.t}</p>
              <p className="text-[10px] text-[#A78B6F] mt-0.5 hidden sm:block">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10">
        <h2 className="font-fraunces text-2xl mb-4">Explora por categoría</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIAS_V2.map((c) => (
            <Link
              key={c.cat}
              to={`/CatalogoNuevo?cat=${encodeURIComponent(c.cat)}`}
              className="bg-white border border-[#E7D8C6] rounded-2xl p-4 text-center hover:border-[#0F8B6C]/40 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="text-3xl mb-2">{c.emoji}</div>
              <p className="font-bold text-sm text-[#2A2420]">{c.label}</p>
              <p className="text-[10px] text-[#A78B6F] mt-0.5">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fraunces text-2xl">Destacados</h2>
          <Link to="/CatalogoNuevo" className="text-sm font-bold text-[#0F8B6C] hover:underline inline-flex items-center gap-1">
            Ver todo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-white border border-[#E7D8C6] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {destacados.map((p, i) => <ProductCardV2 key={p.id} producto={p} index={i} />)}
          </div>
        )}
      </section>

      <footer className="border-t border-[#E7D8C6] py-8 text-center text-xs text-[#A78B6F] flex items-center justify-center gap-1.5">
        <Recycle className="w-3.5 h-3.5 text-[#0F8B6C]" /> PEYU Chile · Plástico reciclado · Hecho en Santiago 🇨🇱
      </footer>
    </div>
  );
}