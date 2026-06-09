import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

import SEOHead from '@/components/SEOHead';
import { ArrowRight, Recycle, Sparkles } from 'lucide-react';
import HeroBoldV2 from '@/components/shopv2/HeroBoldV2';
import TrustSocialBarV2 from '@/components/shopv2/TrustSocialBarV2';
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
    let retries = 0;
    const cargar = () => {
      base44.entities.Producto.filter({ activo: true }, '-updated_date', 200)
        .then((data) => {
          const b2c = (data || []).filter(
            (p) => p.canal !== 'B2B Exclusivo' && p.categoria !== 'Gift Card' && p.precio_b2c
          );
          setProductos(b2c);
          setLoading(false);
        })
        .catch(() => {
          // Mantiene el skeleton visible mientras reintenta (antes el finally
          // apagaba el loading y la grilla quedaba vacía).
          if (retries < 2) { retries++; setTimeout(cargar, 1500 * retries); }
          else setLoading(false);
        });
    };
    cargar();
  }, []);

  const carcasas = useMemo(() => productos.filter((p) => p.categoria === 'Carcasas B2C'), [productos]);
  const destacados = useMemo(() => productos.slice(0, 8), [productos]);
  const heroImg = useMemo(() => {
    const c = carcasas[0] || productos[0];
    return c ? getProductImage(c) : null;
  }, [carcasas, productos]);

  return (
    <div className="min-h-screen font-inter pb-16 lg:pb-0" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <SEOHead
        title="Tienda PEYU — Regalos Corporativos 100% Sostenibles"
        description="Compra regalos corporativos hechos con plástico 100% reciclado. Personalización láser UV gratis desde 10 unidades. Envío BlueExpress a todo Chile."
        url="https://peyuchile.cl/"
        type="website"
      />
      {/* 1 · HERO BOLD */}
      <HeroBoldV2 heroImg={heroImg} onPersonaliza={() => {}} />

      {/* 1b · TRUST + SOCIAL PROOF */}
      <TrustSocialBarV2 />

      {/* 2 · STORYTELLING DE IMPACTO */}
      <ImpactStoryV2 />

      {/* CATEGORÍAS MEJORADAS 2027 */}
      <section className="w-full px-3 sm:px-4 lg:px-6 mb-8 sm:mb-12">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Sparkles className="w-4 sm:w-5 h-4 sm:h-5" style={{ color: '#C0785C' }} />
            <h2 className="font-fraunces text-lg sm:text-3xl">Explora</h2>
          </div>
          <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
            {CATEGORIAS_V2.map((c) => (
              <Link
                key={c.cat}
                to={`/CatalogoNuevo?cat=${encodeURIComponent(c.cat)}`}
                className="group flex-shrink-0 w-24 sm:w-auto rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
                style={{ border: '1.5px solid #D4C4B0', background: 'white' }}
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform inline-block">{c.emoji}</div>
                <p className="font-bold text-[11px] sm:text-sm leading-tight" style={{ color: '#2C1810' }}>{c.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* GALERÍA DE PRODUCTOS */}
      <section className="w-full px-3 sm:px-4 lg:px-6 mb-8 sm:mb-12">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="font-fraunces text-lg sm:text-3xl">Catálogo completo</h2>
            <Link to="/CatalogoNuevo" className="text-[10px] sm:text-sm font-bold hover:underline inline-flex items-center gap-1 transition-colors" style={{ color: '#C0785C' }}>
              Ver más <ArrowRight className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5" />
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

      <footer className="py-6 sm:py-10 text-center text-[9px] sm:text-xs flex items-center justify-center gap-2 sm:gap-2.5" style={{ borderTop: '1.5px solid #D4C4B0', color: '#A08070' }}>
        <Recycle className="w-3.5 sm:w-4 h-3.5 sm:h-4" style={{ color: '#8BAD8A' }} />
        <span className="font-semibold">PEYU · Plástico 100% reciclado · Hecho en Santiago 🇨🇱</span>
      </footer>

{/* MobileNavBarV2 viene del PublicPageLayout */}
    </div>
  );
}