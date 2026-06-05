import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Recycle, Sparkles, ArrowRight, Leaf, Truck, ShieldCheck } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import ProductCardV2 from '@/components/shopv2/ProductCardV2';
import { CATEGORIAS_V2, PEYU_LOGO_CREMA } from '@/lib/shop-v2-config';

// ════════════════════════════════════════════════════════════════════════
// /TiendaNueva — Home del Shop B2C v2 (página NUEVA, paralela). Fondo crema,
// hero PEYU sostenible/lúdico, categorías, productos estrella, CTA carcasa.
// ════════════════════════════════════════════════════════════════════════
export default function TiendaNueva() {
  const [estrella, setEstrella] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 200)
      .then((data) => {
        const b2c = (data || []).filter((p) => p.canal !== 'B2B Exclusivo' && p.categoria !== 'Gift Card');
        setEstrella(b2c.filter((p) => p.precio_b2c).slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF7EF] font-inter text-[#2A2420]">
      <ShopV2Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0F8B6C]/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-[#D96B4D]/10 blur-3xl" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 bg-white/70 border border-[#E7D8C6] text-[#0F8B6C] text-xs font-bold px-3 py-1.5 rounded-full">
              <Recycle className="w-3.5 h-3.5" /> Hecho con plástico 100% reciclado
            </span>
            <h1 className="font-fraunces text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-[#2A2420]">
              Diseño chileno que <span className="text-[#0F8B6C] italic">cuida el planeta</span> 🌱
            </h1>
            <p className="text-[#4B4F54] text-base sm:text-lg max-w-md leading-relaxed">
              Carcasas, cachos, maceteros y más — fabricados con plástico rescatado.
              Lúdicos, únicos y personalizables con tu logo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/CatalogoNuevo">
                <button className="inline-flex items-center gap-2 bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-[#0F8B6C]/20 transition-all hover:scale-[1.02]">
                  Ver la tienda <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/CatalogoNuevo?cat=Carcasas B2C">
                <button className="inline-flex items-center gap-2 bg-white border border-[#E7D8C6] hover:border-[#0F8B6C] text-[#2A2420] font-bold px-6 py-3.5 rounded-2xl transition-all">
                  <Sparkles className="w-4 h-4 text-[#D96B4D]" /> Personaliza tu carcasa
                </button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { icon: Leaf, t: '100% reciclado' },
                { icon: Truck, t: 'Envío a todo Chile' },
                { icon: ShieldCheck, t: 'Hecho en Chile' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-[#4B4F54]">
                  <b.icon className="w-4 h-4 text-[#0F8B6C]" /> {b.t}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-white border border-[#E7D8C6] shadow-2xl overflow-hidden flex items-center justify-center p-10">
              <img src={PEYU_LOGO_CREMA} alt="PEYU" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-[#D96B4D] text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-xl rotate-3">
              ♻️ +50.000 tapas rescatadas
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="font-fraunces text-2xl sm:text-3xl mb-5">Explora por categoría</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIAS_V2.map((c) => (
            <Link
              key={c.label}
              to={`/CatalogoNuevo?cat=${encodeURIComponent(c.cat)}`}
              className="group bg-white rounded-2xl border border-[#E7D8C6] p-5 text-center hover:-translate-y-1 hover:shadow-lg hover:border-[#0F8B6C]/40 transition-all"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{c.emoji}</div>
              <p className="font-bold text-sm text-[#2A2420]">{c.label}</p>
              <p className="text-[11px] text-[#A78B6F] mt-0.5">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUCTOS ESTRELLA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-fraunces text-2xl sm:text-3xl">Productos estrella</h2>
          <Link to="/CatalogoNuevo" className="flex items-center gap-1.5 text-sm font-bold text-[#0F8B6C] hover:gap-2.5 transition-all">
            Ver todo <ArrowRight className="w-4 h-4" />
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
            {estrella.map((p) => <ProductCardV2 key={p.id} producto={p} />)}
          </div>
        )}
      </section>

      {/* CTA FINAL */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F8B6C] to-[#0B6E55] p-8 sm:p-12 text-center text-white">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <Sparkles className="w-8 h-8 mx-auto mb-4 text-[#FBE9E1]" />
          <h2 className="font-fraunces text-2xl sm:text-3xl mb-2">Personaliza con tu logo o frase</h2>
          <p className="text-white/85 max-w-md mx-auto mb-6">
            Grabado láser UV permanente. Gratis desde 10 unidades. Ideal para regalos y empresas.
          </p>
          <Link to="/CatalogoNuevo?cat=Carcasas B2C">
            <button className="inline-flex items-center gap-2 bg-white text-[#0F8B6C] font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:scale-[1.02] transition-all">
              Empieza ahora <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#E7D8C6] py-8 text-center text-xs text-[#A78B6F]">
        PEYU Chile · Plástico reciclado · Hecho en Santiago 🇨🇱
      </footer>
    </div>
  );
}