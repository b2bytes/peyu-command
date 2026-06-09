// ════════════════════════════════════════════════════════════════════════
// /EmpresasNuevo — Canal B2B completo: catálogo corporativo + embudo.
// Solo productos NO-carcasa, con precios por volumen, mockup de logo,
// diseño Warm Clay alineado al Shop v2 B2C.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SEOHead from '@/components/SEOHead';
import {
  Building2, Loader2, Search, Recycle, TrendingDown, Sparkles,
  ShieldCheck, Truck, FileText, ArrowRight, Star,
} from 'lucide-react';
import B2BHeader from '@/components/b2b/B2BHeader';
import B2BCatalogCard from '@/components/b2b/B2BCatalogCard';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';

const CATEGORIAS = ['Todos', 'Corporativo', 'Escritorio', 'Hogar', 'Entretenimiento'];

const TRUST = [
  { icon: TrendingDown, t: 'Hasta −54%', s: 'descuento por volumen' },
  { icon: Sparkles,    t: 'Logo gratis', s: 'grabado láser desde 10u' },
  { icon: FileText,    t: 'Factura',     s: 'datos de empresa + IVA' },
  { icon: Recycle,     t: '100% Reciclado', s: 'plástico post-consumo' },
  { icon: ShieldCheck, t: '10 años',     s: 'garantía del producto' },
  { icon: Truck,       t: 'Despacho',    s: 'a todo Chile vía Bluex' },
];

// Clientes reales del catálogo oficial
const CLIENTES = [
  'Cachantún', 'Entel', 'Metro de Santiago', 'Nestlé', 'Lucchetti',
  'Enel', 'DuocUC', 'Adidas', 'Salfa', 'Siemens', 'Puma', 'CBRE',
  'Booking.com', 'Zurich', 'Santander', 'Aguas Andinas', 'Teletón',
  'Motorola', 'Dockers', 'W Santiago', 'Marley Coffee', 'Abastible',
  'Universidad Adolfo Ibáñez', 'Alto del Carmen', 'Antofagasta Minerals',
];

export default function EmpresasNuevo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Todos');

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 200)
      .then(data => {
        // Solo productos B2B: excluir carcasas, GiftCards y B2C exclusivo
        const b2b = (data || []).filter(p =>
          p.sku &&
          p.canal !== 'B2C Exclusivo' &&
          p.categoria !== 'Carcasas B2C' &&
          p.categoria !== 'Gift Card' &&
          !p.nombre?.toLowerCase().includes('gift card')
        );
        setProductos(b2b);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    let list = productos;
    if (cat !== 'Todos') list = list.filter(p => p.categoria === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.nombre || '').toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q));
    }
    return list;
  }, [productos, cat, search]);

  const catCounts = useMemo(() => {
    const map = { 'Todos': productos.length };
    CATEGORIAS.slice(1).forEach(c => { map[c] = productos.filter(p => p.categoria === c).length; });
    return map;
  }, [productos]);

  return (
    <div className="min-h-screen font-inter pb-16 lg:pb-0" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <SEOHead
        title="B2B Corporativo — PEYU | Regalos Mayoristas Sostenibles"
        description="Soluciones B2B para empresas: precios por volumen, personalización masiva con logo, facturación y despacho a todo Chile."
        url="https://peyuchile.cl/EmpresasNuevo"
        type="website"
      />
      <B2BHeader />

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-10 pb-6 sm:pb-10">
        <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-8">
          <span className="inline-block text-xs sm:text-sm font-bold px-3 py-1 rounded-lg mb-2 sm:mb-4" style={{ background: '#0F8B6C', color: 'white' }}>
            ✨ Regalos corporativos
          </span>
          <h1 className="font-fraunces text-2xl sm:text-5xl leading-[1.2] sm:leading-[1.05] mb-2 sm:mb-4 font-bold" style={{ color: '#2C1810' }}>
            Plástico reciclado<br />
            <span style={{ color: '#0F8B6C' }}>con tu logo grabado</span>
          </h1>
          <p className="text-xs sm:text-base leading-relaxed mb-4 sm:mb-6 font-semibold" style={{ color: '#7A6050' }}>
            Desde 10u • Hasta −54% • Factura + Despacho
          </p>
          <Link
            to="/CotizacionRapida"
            className="inline-flex items-center gap-2 font-bold text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', color: 'white', boxShadow: '0 8px 24px rgba(15,139,108,.35)' }}
          >
            Pedir cotización <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
          </Link>
          </div>

          {/* Trust strip */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 my-6 sm:my-8">
            {TRUST.map(({ icon: Icon, t, s }) => (
              <div key={t} className="flex flex-col items-center text-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all hover:shadow-md" style={{ background: 'white', border: '1px solid #EDE3D6' }}>
                <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-lg flex items-center justify-center mb-1 sm:mb-2" style={{ background: '#0F8B6C15' }}>
                  <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" style={{ color: '#0F8B6C' }} />
                </div>
                <p className="text-[10px] sm:text-xs font-bold leading-tight" style={{ color: '#2C1810' }}>{t}</p>
                <p className="text-[8px] sm:text-[10px] leading-tight mt-0.5" style={{ color: '#A08070' }}>{s}</p>
              </div>
            ))}
          </div>

        {/* ── CATÁLOGO ── */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          {/* Buscador */}
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A08070' }} />
             <input
               value={search}
               onChange={e => setSearch(e.target.value)}
               placeholder="Buscar productos…"
               className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
               style={{ background: 'white', border: '1px solid #D4C4B0', color: '#2C1810', outlineColor: '#0F8B6C', boxShadow: 'focus' ? '0 0 0 3px rgba(15,139,108,0.1)' : 'none' }}
             />
           </div>

          {/* Chips de categoría */}
           <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
             {CATEGORIAS.map(c => {
               const count = catCounts[c] || 0;
               if (c !== 'Todos' && count === 0) return null;
               return (
                 <button
                   key={c}
                   onClick={() => setCat(c)}
                   className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                   style={{
                     background: cat === c ? '#0F8B6C' : 'white',
                     color: cat === c ? 'white' : '#7A6050',
                     border: `1px solid ${cat === c ? '#0F8B6C' : '#D4C4B0'}`,
                     boxShadow: cat === c ? '0 2px 8px rgba(15,139,108,0.2)' : 'none',
                   }}
                 >
                   {c} {count > 0 && `(${count})`}
                 </button>
               );
             })}
           </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0F8B6C' }} />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold" style={{ color: '#A08070' }}>Sin productos con estos filtros. Intenta otra búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtrados.map(p => (
              <B2BCatalogCard key={p.id} producto={p} />
            ))}
          </div>
        )}
        </section>

      {/* ── CLIENTES ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-center mb-4 sm:mb-6" style={{ color: '#A08070' }}>
          Clientes que confían en PEYU
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
          {CLIENTES.map(c => (
            <span key={c} className="text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-full transition-all hover:shadow-md" style={{ background: 'white', border: '1px solid #EDE3D6', color: '#7A6050' }}>
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center" style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}>
          <Star className="w-7 sm:w-9 h-7 sm:h-9 text-white/70 mx-auto mb-3 sm:mb-4" />
          <h2 className="font-fraunces text-2xl sm:text-3xl text-white mb-2 sm:mb-3">Pide tu cotización</h2>
          <p className="text-sm sm:text-base text-white/80 mb-5 sm:mb-6 max-w-md mx-auto leading-relaxed">
            Precios por volumen real • Grabado gratis • Respuesta en 24h hábiles
          </p>
          <Link
            to="/CotizacionRapida"
            className="inline-flex items-center gap-2 font-bold text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: 'white', color: '#0F8B6C', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
          >
            Cotizar ahora <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
          </Link>
        </div>
      </section>

      <footer className="py-6 sm:py-8 text-center text-[9px] sm:text-xs flex items-center justify-center gap-2 sm:gap-2.5" style={{ borderTop: '1.5px solid #D4C4B0', color: '#A08070' }}>
         <Recycle className="w-3.5 sm:w-4 h-3.5 sm:h-4" style={{ color: '#8BAD8A' }} />
         <span className="font-semibold">PEYU · Plástico 100% reciclado · Hecho en Santiago 🇨🇱</span>
       </footer>

      <MobileNavBarV2 />
    </div>
  );
}