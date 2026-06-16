// ============================================================================
// /fiestas-patrias/canasta — Landing B2C campaña Fiestas Patrias.
// Gancho: "Arma tu canasta de Fiestas con un clic". Muestra productos reales
// del catálogo y empuja a /CatalogoNuevo. Diseño Warm Dusk + acentos patrios.
// ============================================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Recycle, Gift, ArrowRight, Sparkles, Check } from 'lucide-react';
import SEO from '@/components/SEO';
import CountdownDieciocho from '@/components/fiestas/CountdownDieciocho';
import { fmtCLP } from '@/lib/shop-v2-cart';
import { base44 } from '@/api/base44Client';

const INCLUYE = [
  'Productos 100% chilenos y reciclados',
  'Personalízalos con grabado láser gratis (desde 10u)',
  'Despacho a todo Chile vía BlueExpress',
  'Pago con Mercado Pago o transferencia',
];

export default function FiestasCanasta() {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    try { base44.analytics.track({ eventName: 'fiestas_landing_view', properties: { variante: 'canasta_b2c' } }); } catch {}
    base44.entities.Producto
      .filter({ activo: true, mostrar_en_v2: true }, '-created_date', 6)
      .then(setProductos)
      .catch(() => setProductos([]));
  }, []);

  return (
    <div className="min-h-screen font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <SEO
        title="Arma tu Canasta de Fiestas Patrias — PEYU Chile 🇨🇱"
        description="Productos 100% chilenos y reciclados para tu 18. Arma tu canasta de Fiestas con un clic y recíbela antes del 18 de septiembre. Pago seguro y despacho a todo Chile."
        canonical="https://peyuchile.cl/fiestas-patrias/canasta"
      />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#FBF5EE 0%,#F6E7DB 60%,#F2D9C9 100%)' }} />
        <div className="absolute top-0 inset-x-0 h-1.5 flex">
          <div className="flex-1" style={{ background: '#0F3D91' }} />
          <div className="flex-1" style={{ background: '#FFFFFF' }} />
          <div className="flex-1" style={{ background: '#D52B1E' }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: 'rgba(168,68,58,.1)', color: '#A8443A' }}>
            <Sparkles className="w-3.5 h-3.5" /> Edición Fiestas Patrias
          </span>
          <h1 className="font-fraunces text-4xl sm:text-5xl leading-[1.05] mb-4">
            Arma tu canasta de Fiestas <span style={{ color: '#A8443A' }}>con un clic</span>
          </h1>
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8" style={{ color: '#7A6050' }}>
            Productos chilenos premium para tu mesa, tu asado y tus regalos. Recíbelos
            <strong style={{ color: '#2C1810' }}> antes del 18</strong>.
          </p>
          <div className="mb-9 flex justify-center"><CountdownDieciocho /></div>
          <Link to="/CatalogoNuevo"
            className="inline-flex items-center gap-2 h-14 px-8 rounded-2xl text-white font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 10px 28px rgba(192,120,92,.35)' }}>
            <ShoppingBag className="w-5 h-5" /> Empezar mi canasta
          </Link>
        </div>
      </section>

      {/* ── PRODUCTOS REALES ────────────────────────────────────────── */}
      {productos.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 py-12">
          <h2 className="font-fraunces text-2xl sm:text-3xl text-center mb-8">Lo más pedido para el 18</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map((p) => (
              <Link key={p.id} to={`/ProductoNuevo?id=${p.id}`} className="group rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
                style={{ background: 'white', border: '1px solid #D4C4B0', boxShadow: '0 6px 18px rgba(44,24,16,.06)' }}>
                <div className="aspect-square overflow-hidden" style={{ background: '#F2EBE1' }}>
                  {p.imagen_url && (
                    <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm leading-tight line-clamp-2 mb-1">{p.nombre}</p>
                  {p.precio_b2c > 0 && <p className="font-poppins font-extrabold text-sm" style={{ color: '#C0785C' }}>{fmtCLP(p.precio_b2c)}</p>}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/CatalogoNuevo" className="inline-flex items-center gap-1.5 font-bold text-sm" style={{ color: '#A8443A' }}>
              Ver todos los productos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── QUÉ INCLUYE ─────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-5 py-12">
        <div className="rounded-3xl p-7" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
          <div className="flex items-center gap-2 mb-5">
            <Gift className="w-5 h-5" style={{ color: '#C0785C' }} />
            <h2 className="font-fraunces text-2xl">Tu canasta incluye</h2>
          </div>
          <ul className="space-y-3">
            {INCLUYE.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(192,120,92,.15)' }}>
                  <Check className="w-3 h-3" style={{ color: '#C0785C' }} />
                </span>
                <span className="text-sm" style={{ color: '#2C1810' }}>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CIERRE ──────────────────────────────────────────────────── */}
      <section className="px-5 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl p-8 text-center" style={{ background: 'linear-gradient(135deg,#A8443A,#7A2E26)' }}>
          <h2 className="font-fraunces text-2xl sm:text-3xl text-white mb-3">Compra hoy, recibe antes del 18</h2>
          <p className="text-sm mb-6" style={{ color: '#F2D9C9' }}>
            Entrega garantizada comprando dentro de plazo. Después no aseguramos llegar a tiempo.
          </p>
          <Link to="/CatalogoNuevo"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5"
            style={{ background: 'white', color: '#A8443A' }}>
            <ShoppingBag className="w-5 h-5" /> Armar mi canasta ahora
          </Link>
        </div>
      </section>
    </div>
  );
}