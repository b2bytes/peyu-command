// ============================================================================
// /fiestas-patrias — Landing MADRE de campaña Fiestas Patrias 2026.
// Ángulo: "Lo chileno de verdad". Bifurca a B2C (canasta) y B2B (kits corp).
// Diseño Warm Dusk + acentos patrios. Pure conversion, sin tocar el home.
// ============================================================================
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Recycle, Truck, ShieldCheck, ShoppingBag, Briefcase, ArrowRight, MapPin, Star } from 'lucide-react';
import SEO from '@/components/SEO';
import CountdownDieciocho from '@/components/fiestas/CountdownDieciocho';
import { base44 } from '@/api/base44Client';

const PILARES = [
  { icon: MapPin, t: '100% chileno', d: 'Diseñado y fabricado en Chile, con materia prima reciclada nacional.' },
  { icon: Truck, t: 'Entrega antes del 18', d: 'Despacho garantizado a tiempo si pides dentro de plazo.' },
  { icon: Recycle, t: 'Material reciclado', d: 'Cada producto rescata tapitas plásticas del vertedero.' },
  { icon: ShieldCheck, t: '10 años de garantía', d: 'Calidad premium que dura más que una temporada.' },
];

export default function FiestasPatrias() {
  useEffect(() => {
    try {
      base44.analytics.track({ eventName: 'fiestas_landing_view', properties: { variante: 'madre' } });
    } catch {}
  }, []);

  return (
    <div className="min-h-screen font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <SEO
        title="PEYU Fiestas Patrias 2026 — Lo chileno de verdad 🇨🇱"
        description="Productos 100% chilenos, calidad premium y entrega garantizada antes del 18. Arma tu canasta de Fiestas o regala kits corporativos con identidad."
        canonical="https://peyuchile.cl/fiestas-patrias"
      />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg,#FBF5EE 0%,#F6E7DB 55%,#F2D9C9 100%)' }}
        />
        {/* franja patria sutil arriba */}
        <div className="absolute top-0 inset-x-0 h-1.5 flex">
          <div className="flex-1" style={{ background: '#0F3D91' }} />
          <div className="flex-1" style={{ background: '#FFFFFF' }} />
          <div className="flex-1" style={{ background: '#D52B1E' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-5 pt-14 pb-16 text-center">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: 'rgba(168,68,58,.1)', color: '#A8443A' }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Campaña Fiestas Patrias · 18 de septiembre
          </span>

          <h1 className="font-fraunces text-4xl sm:text-6xl leading-[1.02] mb-4">
            Lo chileno <span style={{ color: '#A8443A' }}>de verdad</span>
          </h1>
          <p className="text-base sm:text-xl max-w-2xl mx-auto mb-8" style={{ color: '#7A6050' }}>
            Este 18, regala identidad. Productos 100% chilenos, premium y sostenibles,
            con <strong style={{ color: '#2C1810' }}>entrega garantizada antes del 18</strong>.
          </p>

          <div className="mb-9 flex justify-center">
            <CountdownDieciocho />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
            <Link
              to="/fiestas-patrias/canasta"
              className="flex-1 h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 10px 28px rgba(192,120,92,.35)' }}
            >
              <ShoppingBag className="w-5 h-5" /> Arma tu canasta
            </Link>
            <Link
              to="/fiestas-patrias/empresas"
              className="flex-1 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:-translate-y-0.5"
              style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}
            >
              <Briefcase className="w-5 h-5" style={{ color: '#A8443A' }} /> Kits corporativos
            </Link>
          </div>
        </div>
      </section>

      {/* ── BIFURCACIÓN B2C / B2B ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <div className="grid sm:grid-cols-2 gap-5">
          {/* B2C */}
          <Link to="/fiestas-patrias/canasta" className="group rounded-3xl p-7 transition-all hover:-translate-y-1"
            style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 8px 24px rgba(44,24,16,.06)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(192,120,92,.12)' }}>
              <ShoppingBag className="w-6 h-6" style={{ color: '#C0785C' }} />
            </div>
            <h2 className="font-fraunces text-2xl mb-2">Para ti y los tuyos</h2>
            <p className="text-sm mb-4" style={{ color: '#7A6050' }}>
              Arma tu canasta de Fiestas con un clic. Productos chilenos premium para tu mesa, tu asado y tus regalos.
            </p>
            <span className="inline-flex items-center gap-1.5 font-bold text-sm" style={{ color: '#A8443A' }}>
              Ver la canasta <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          {/* B2B */}
          <Link to="/fiestas-patrias/empresas" className="group rounded-3xl p-7 transition-all hover:-translate-y-1"
            style={{ background: '#2C1810', border: '1.5px solid #2C1810', boxShadow: '0 8px 24px rgba(44,24,16,.18)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,.1)' }}>
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-fraunces text-2xl mb-2 text-white">Para tu empresa</h2>
            <p className="text-sm mb-4" style={{ color: '#D4C4B0' }}>
              Regala con identidad. Kits corporativos con tu marca, factura y despacho a oficina. Desde 20 unidades.
            </p>
            <span className="inline-flex items-center gap-1.5 font-bold text-sm text-white">
              Cotizar kit corporativo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </section>

      {/* ── PILARES ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PILARES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid #D4C4B0' }}>
              <Icon className="w-5 h-5 mb-2" style={{ color: '#C0785C' }} />
              <p className="font-bold text-sm mb-1">{t}</p>
              <p className="text-xs leading-snug" style={{ color: '#7A6050' }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CIERRE ──────────────────────────────────────────────────── */}
      <section className="px-5 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(135deg,#A8443A,#7A2E26)' }}>
          <div className="flex justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#F2D9C9' }} />)}
          </div>
          <h2 className="font-fraunces text-2xl sm:text-3xl text-white mb-3">El 18 se acerca. No te quedes sin tu pedido.</h2>
          <p className="text-sm mb-6" style={{ color: '#F2D9C9' }}>
            Entrega garantizada antes del 18 de septiembre comprando dentro de plazo. Stock limitado.
          </p>
          <Link to="/CatalogoNuevo"
            className="inline-flex items-center gap-2 h-13 px-7 py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5"
            style={{ background: 'white', color: '#A8443A' }}>
            Ver toda la tienda <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}