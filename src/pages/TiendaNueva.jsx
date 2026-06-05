import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Recycle, ShieldCheck, Sparkles, Truck, Lock } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import ProductCardV2 from '@/components/shopv2/ProductCardV2';
import { CATEGORIAS_V2 } from '@/lib/shop-v2-config';
import { getProductImage } from '@/utils/productImages';

// ════════════════════════════════════════════════════════════════════════
// /TiendaNueva — Home del Shop B2C v2 (Tema 6 Conversion Machine). Hero potente
// con foto real + categorías + destacados. AISLADO: usa carrito_v2.
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
  const heroImg = useMemo(() => {
    const carcasa = productos.find((p) => p.categoria === 'Carcasas B2C');
    return carcasa ? getProductImage(carcasa) : (productos[0] ? getProductImage(productos[0]) : null);
  }, [productos]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420]">
      <ShopV2Header />

      {/* HERO potente — split editorial */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#0F8B6C]/10 text-[#0F8B6C] text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              <Recycle className="w-3.5 h-3.5" /> Plástico 100% reciclado · Hecho en Chile
            </span>
            <h1 className="font-fraunces text-4xl sm:text-5xl lg:text-6xl leading-[1.02] mb-4">
              Diseño que <span className="text-[#0F8B6C] italic">cuida</span> el planeta
            </h1>
            <p className="text-[#4B4F54] text-base sm:text-lg leading-relaxed mb-7 max-w-md">
              Carcasas, juegos y decoración hechos con plástico reciclado.
              Personalízalos con grabado láser permanente.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/CatalogoNuevo">
                <button className="inline-flex items-center gap-2 bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold px-7 py-4 rounded-2xl shadow-lg shadow-[#0F8B6C]/25 transition-all hover:scale-[1.02]">
                  Ver la tienda <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/CatalogoNuevo?cat=Carcasas%20B2C" className="font-bold text-sm text-[#4B4F54] hover:text-[#0F8B6C] px-2 transition-colors">
                Carcasas →
              </Link>
            </div>
          </div>

          {/* Foto hero real con glass sutil */}
          {heroImg && (
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#0F8B6C]/10 to-[#D96B4D]/8 rounded-[2.5rem] blur-2xl" />
              <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-white border border-[#EBE3D6] shadow-[0_24px_60px_-24px_rgba(74,63,51,0.4)]">
                <img src={heroImg} alt="PEYU plástico reciclado" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 border border-[#EBE3D6] shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#A78B6F]">Impacto real</p>
                <p className="font-poppins font-bold text-[#0F8B6C] text-sm">+2.5 ton de plástico salvado</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Recycle, t: '100% reciclado' },
            { icon: Sparkles, t: 'Personalizable' },
            { icon: Truck, t: 'Envío BlueExpress' },
            { icon: Lock, t: 'Pago seguro' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-white border border-[#EBE3D6] rounded-2xl px-4 py-3.5">
              <b.icon className="w-5 h-5 text-[#0F8B6C] flex-shrink-0" />
              <p className="text-xs font-bold text-[#2A2420]">{b.t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <h2 className="font-fraunces text-2xl sm:text-3xl mb-5">Explora por categoría</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIAS_V2.map((c) => (
            <Link
              key={c.cat}
              to={`/CatalogoNuevo?cat=${encodeURIComponent(c.cat)}`}
              className="group bg-white border border-[#EBE3D6] rounded-2xl p-5 text-center hover:border-[#0F8B6C]/40 hover:shadow-lg hover:-translate-y-1 transition-all"
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
    </div>
  );
}