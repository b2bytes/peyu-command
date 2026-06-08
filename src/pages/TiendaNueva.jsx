import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Recycle } from 'lucide-react';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
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
    <div className="min-h-screen font-inter pb-16 lg:pb-0 overflow-x-hidden" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <ShopV2Header />

      {/* 1 · HERO BOLD */}
      <HeroBoldV2 heroImg={heroImg} onPersonaliza={scrollToConfig} />

      {/* 1b · TRUST + SOCIAL PROOF */}
      <TrustSocialBarV2 />

      {/* 2 · CONFIGURADOR EN VIVO (sección estrella) */}
      {carcasas.length > 0 && <LiveConfiguratorV2 carcasas={carcasas} />}

      {/* 3 · STORYTELLING DE IMPACTO */}
      <ImpactStoryV2 />

      {/* CATEGORÍAS */}
      <section className="w-full px-3 sm:px-8 lg:px-12 mb-4 sm:mb-8">
        <div className="max-w-screen-xl mx-auto">
          <h2 className="font-fraunces text-lg sm:text-3xl mb-2.5 sm:mb-4">Explora por categoría</h2>
          <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {CATEGORIAS_V2.map((c) => (
              <Link
                key={c.cat}
                to={`/CatalogoNuevo?cat=${encodeURIComponent(c.cat)}`}
                className="group flex-shrink-0 w-28 sm:w-auto bg-white rounded-xl sm:rounded-3xl p-2 sm:p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all"
                style={{ border: '1.5px solid #D4C4B0' }}
              >
                <div className="text-lg sm:text-3xl mb-0.5 sm:mb-2 group-hover:scale-110 transition-transform">{c.emoji}</div>
                <p className="font-bold text-[10px] sm:text-sm" style={{ color: '#2C1810' }}>{c.label}</p>
                <p className="text-[8px] sm:text-[10px] mt-0" style={{ color: '#A08070' }}>{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="w-full px-3 sm:px-8 lg:px-12 mb-6 sm:mb-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-2.5 sm:mb-4">
            <h2 className="font-fraunces text-lg sm:text-3xl">Destacados</h2>
            <Link to="/CatalogoNuevo" className="text-[10px] sm:text-sm font-bold hover:underline inline-flex items-center gap-1" style={{ color: '#C0785C' }}>
              Ver todo <ArrowRight className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl animate-pulse" style={{ background: '#EDE3D6', border: '1px solid #D4C4B0' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
               {destacados.map((p, i) => <ProductCardV2 key={p.id} producto={p} index={i} />)}
             </div>
          )}
        </div>
      </section>

      <footer className="py-4 sm:py-8 text-center text-[9px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5" style={{ borderTop: '1px solid #D4C4B0', color: '#A08070' }}>
        <Recycle className="w-3 sm:w-3.5 h-3 sm:h-3.5" style={{ color: '#8BAD8A' }} /> PEYU · Reciclado · 🇨🇱
      </footer>

      {/* Menú inferior mobile */}
      <MobileNavBarV2 />
    </div>
  );
}