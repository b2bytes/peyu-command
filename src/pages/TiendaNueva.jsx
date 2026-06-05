import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Recycle, Sparkles } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import HeroBoldV2 from '@/components/shopv2/HeroBoldV2';
import TrustSocialBarV2 from '@/components/shopv2/TrustSocialBarV2';
import LiveConfiguratorV2 from '@/components/shopv2/LiveConfiguratorV2';
import ImpactStoryV2 from '@/components/shopv2/ImpactStoryV2';
import ProductCardV2 from '@/components/shopv2/ProductCardV2';
import { CATEGORIAS_V2 } from '@/lib/shop-v2-config';
import { getProductImage } from '@/utils/productImages';

// ════════════════════════════════════════════════════════════════════════
// /TiendaNueva — Home del Shop B2C v2 (Tema 6 Conversion Machine). 4 bloques de
// engagement: Hero Bold · Configurador en vivo · Storytelling de impacto · Sticky
// móvil. AISLADO: usa carrito_v2 y rutas nuevas. NO toca la tienda viva.
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

  const carcasas = useMemo(() => productos.filter((p) => p.categoria === 'Carcasas B2C'), [productos]);
  const destacados = useMemo(() => productos.slice(0, 8), [productos]);
  const heroImg = useMemo(() => {
    const c = carcasas[0] || productos[0];
    return c ? getProductImage(c) : null;
  }, [carcasas, productos]);

  const scrollToConfig = () => {
    document.getElementById('configurador')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420] pb-20 lg:pb-0">
      <ShopV2Header />

      {/* 1 · HERO BOLD */}
      <HeroBoldV2 heroImg={heroImg} onPersonaliza={scrollToConfig} />

      {/* 1b · TRUST + SOCIAL PROOF */}
      <TrustSocialBarV2 />

      {/* 2 · CONFIGURADOR EN VIVO (sección estrella) */}
      {carcasas.length > 0 && <LiveConfiguratorV2 carcasas={carcasas} />}

      {/* 3 · STORYTELLING DE IMPACTO */}
      <ImpactStoryV2 />

      {/* CATEGORÍAS — chips scroll horizontal en móvil */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <h2 className="font-fraunces text-2xl sm:text-3xl mb-5">Explora por categoría</h2>
        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
          {CATEGORIAS_V2.map((c) => (
            <Link
              key={c.cat}
              to={`/CatalogoNuevo?cat=${encodeURIComponent(c.cat)}`}
              className="group flex-shrink-0 w-36 sm:w-auto bg-white border border-[#EBE3D6] rounded-2xl p-5 text-center hover:border-[#0F8B6C]/40 hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{c.emoji}</div>
              <p className="font-bold text-sm text-[#2A2420]">{c.label}</p>
              <p className="text-[10px] text-[#A78B6F] mt-0.5">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-14">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-fraunces text-2xl sm:text-3xl">Destacados</h2>
          <Link to="/CatalogoNuevo" className="text-sm font-bold text-[#0F8B6C] hover:underline inline-flex items-center gap-1">
            Ver todo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-white border border-[#EBE3D6] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {destacados.map((p, i) => <ProductCardV2 key={p.id} producto={p} index={i} />)}
          </div>
        )}
      </section>

      <footer className="border-t border-[#EBE3D6] py-8 text-center text-xs text-[#A78B6F] flex items-center justify-center gap-1.5">
        <Recycle className="w-3.5 h-3.5 text-[#0F8B6C]" /> PEYU Chile · Plástico reciclado · Hecho en Santiago 🇨🇱
      </footer>

      {/* 4 · STICKY móvil: CTA al configurador siempre visible */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-xl border-t border-[#EBE3D6] px-4 py-3 pb-safe">
        <button
          onClick={scrollToConfig}
          className="w-full h-13 py-3.5 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/25 transition-all active:scale-[0.99]"
        >
          <Sparkles className="w-4 h-4" /> Personaliza tu carcasa
        </button>
      </div>
    </div>
  );
}