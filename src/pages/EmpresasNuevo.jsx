// ════════════════════════════════════════════════════════════════════════
// /EmpresasNuevo — Canal B2B completo: catálogo corporativo + embudo.
// Solo productos NO-carcasa, con precios por volumen, mockup de logo,
// diseño Warm Clay alineado al Shop v2 B2C.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Building2, Loader2, Search, Recycle, TrendingDown, Sparkles,
  ShieldCheck, Truck, FileText, ArrowRight, Star,
} from 'lucide-react';
import B2BHeader from '@/components/b2b/B2BHeader';
import B2BCatalogCard from '@/components/b2b/B2BCatalogCard';

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
    <div className="min-h-screen font-inter pb-8" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <B2BHeader />

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-5 sm:pb-6">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full mb-3 sm:mb-4"
            style={{ background: '#0F8B6C15', color: '#0F8B6C', border: '1px solid #0F8B6C30' }}>
            <Building2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Corporativo · Regalos
          </span>
          <h1 className="font-fraunces text-2xl sm:text-5xl leading-[1.1] sm:leading-[1.05] mb-3 sm:mb-4" style={{ color: '#2C1810' }}>
            Regalos corporativos<br />
            <span style={{ color: '#0F8B6C' }}>100% reciclados</span>
          </h1>
          <p className="text-xs sm:text-base leading-relaxed mb-5 sm:mb-6" style={{ color: '#7A6050' }}>
            Plástico reciclado chileno con tu logo grabado láser. Gratis desde 10u · Hasta −54% · Factura.
          </p>
          <Link
            to="/CotizacionRapida"
            className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-base px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', color: 'white', boxShadow: '0 4px 16px rgba(15,139,108,.2)' }}
          >
            Cotizar <ArrowRight className="w-3.5 sm:w-5 h-3.5 sm:h-5" />
          </Link>
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2.5 mb-3 sm:mb-6">
          {TRUST.map(({ icon: IconComp, t, s }) => (
            <div key={t} className="flex flex-col items-center text-center p-1.5 sm:p-3 rounded-lg sm:rounded-2xl" style={{ background: 'white', border: '1px solid #EDE3D6' }}>
              <div className="w-5 sm:w-8 h-5 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center mb-0.5 sm:mb-1.5" style={{ background: '#0F8B6C10' }}>
                <IconComp className="w-2.5 sm:w-4 h-2.5 sm:h-4" style={{ color: '#0F8B6C' }} />
              </div>
              <p className="text-[8px] sm:text-xs font-bold leading-tight" style={{ color: '#2C1810' }}>{t}</p>
              <p className="text-[7px] sm:text-[10px] leading-tight mt-0" style={{ color: '#A08070' }}>{s}</p>
            </div>
          ))}
        </div>

        {/* ── CATÁLOGO ── */}
        <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:gap-2.5">
          {/* Buscador */}
           <div className="relative flex-1">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#A08070' }} />
             <input
               value={search}
               onChange={e => setSearch(e.target.value)}
               placeholder="Buscar…"
               className="w-full h-9 sm:h-11 pl-9 pr-3 rounded-lg sm:rounded-xl text-[10px] sm:text-sm focus:outline-none focus:ring-2"
               style={{ background: 'white', border: '1px solid #D4C4B0', color: '#2C1810', focusRingColor: '#0F8B6C' }}
             />
           </div>

          {/* Chips de categoría */}
           <div className="flex gap-1 overflow-x-auto scrollbar-hide">
             {CATEGORIAS.map(c => {
               const count = catCounts[c] || 0;
               if (c !== 'Todos' && count === 0) return null;
               return (
                 <button
                   key={c}
                   onClick={() => setCat(c)}
                   className="flex-shrink-0 px-2.5 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all"
                   style={{
                     background: cat === c ? '#0F8B6C' : 'white',
                     color: cat === c ? 'white' : '#7A6050',
                     border: cat === c ? '1px solid #0F8B6C' : '1px solid #D4C4B0',
                     boxShadow: cat === c ? '0 1px 4px rgba(15,139,108,.15)' : 'none',
                   }}
                 >
                   {c}
                 </button>
               );
             })}
           </div>
        </div>

        {/* Grid */}
        {loading ? (
        <div className="flex items-center justify-center py-16">
         <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0F8B6C' }} />
        </div>
        ) : filtrados.length === 0 ? (
        <div className="text-center py-12">
            <p className="text-sm font-semibold" style={{ color: '#A08070' }}>Sin productos con estos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {filtrados.map(p => (
              <B2BCatalogCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── CLIENTES ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-center mb-2" style={{ color: '#A08070' }}>
          Clientes
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {CLIENTES.map(c => (
            <span key={c} className="text-[9px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'white', border: '1px solid #EDE3D6', color: '#7A6050' }}>
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-center" style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}>
          <Star className="w-6 sm:w-8 h-6 sm:h-8 text-white/70 mx-auto mb-2" />
          <h2 className="font-fraunces text-sm sm:text-3xl text-white mb-2">Pide tu cotización</h2>
          <p className="text-[10px] sm:text-sm text-white/80 mb-3 sm:mb-4 max-w-md mx-auto">
            Precios por volumen real · Grabado gratis · 24h hábiles
          </p>
          <Link
            to="/CotizacionRapida"
            className="inline-flex items-center gap-1 font-bold text-xs sm:text-sm px-5 sm:px-7 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: 'white', color: '#0F8B6C', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}
          >
            Cotizar <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t py-3 sm:py-6 text-center text-[9px] sm:text-xs" style={{ borderColor: '#D4C4B0', color: '#A08070' }}>
        <Recycle className="w-3 sm:w-3.5 h-3 sm:h-3.5 inline mr-1" style={{ color: '#0F8B6C' }} />
        PEYU · Chile · 🇨🇱
      </footer>
    </div>
  );
}