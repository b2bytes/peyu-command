// ════════════════════════════════════════════════════════════════════════
// /EmpresasNuevo — Inicio del MODO B2B en formato cockpit de 1 pantalla
// (mismo lenguaje que /personalizar y /CotizacionRapida): header wizard con
// el recorrido B2B (Catálogo → Cotización → Propuesta), panel izquierdo con
// propuesta de valor + sellos, catálogo GIGANTE al centro con scroll propio
// y clientes + CTA a la derecha. Mobile mantiene el flujo vertical completo.
// Sin perder funciones: buscador, filtros por categoría, grid, clientes, CTAs.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SEOHead from '@/components/SEOHead';
import {
  Building2, Loader2, Search, Recycle, TrendingDown, Sparkles,
  ShieldCheck, Truck, FileText, ArrowRight, ArrowLeft, Check,
  ChevronRight, Package,
} from 'lucide-react';
import B2BCatalogCard from '@/components/b2b/B2BCatalogCard';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';

const C = {
  bg: '#F8F3ED',
  bgSoft: '#F2EBE0',
  surface: '#FFFFFF',
  border: '#D4C4B0',
  fg: '#2C1810',
  fgSoft: '#7A6050',
  fgMuted: '#A08070',
  action: '#0F8B6C',
  actionGrad: 'linear-gradient(135deg,#0F8B6C,#0B6E55)',
  actionShadow: '0 6px 20px rgba(15,139,108,.28)',
  terra: '#D96B4D',
};

// Catálogo B2B end-to-end: todo en una sola página.
const JOURNEY = [
  { label: 'Catálogo B2B', Icon: Package },
];

const CATEGORIAS = ['Todos', 'Corporativo', 'Escritorio', 'Hogar', 'Entretenimiento'];

const TRUST = [
  { icon: TrendingDown, t: 'Hasta −54%', s: 'descuento por volumen' },
  { icon: Sparkles, t: 'Logo gratis', s: 'grabado láser desde 10u' },
  { icon: FileText, t: 'Factura', s: 'datos de empresa + IVA' },
  { icon: Recycle, t: '100% Reciclado', s: 'plástico post-consumo' },
  { icon: ShieldCheck, t: '10 años', s: 'garantía del producto' },
  { icon: Truck, t: 'Despacho', s: 'a todo Chile vía Bluex' },
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
  // Fondo crema fijo (Warm Dusk): forzamos modo día mientras está abierta.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-liquid-mode');
    html.setAttribute('data-liquid-mode', 'day');
    return () => { if (prev) html.setAttribute('data-liquid-mode', prev); };
  }, []);

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

  // ── Bloques reutilizados desktop + mobile (sin duplicar lógica) ───────────
  const SearchAndChips = (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.fgMuted }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar productos…"
          className="w-full h-11 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
          style={{ background: 'white', border: `1px solid ${C.border}`, color: C.fg }}
        />
      </div>
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
                background: cat === c ? C.action : 'white',
                color: cat === c ? 'white' : C.fgSoft,
                border: `1px solid ${cat === c ? C.action : C.border}`,
                boxShadow: cat === c ? '0 2px 8px rgba(15,139,108,0.2)' : 'none',
              }}
            >
              {c} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>
    </div>
  );

  const ProductGrid = (colsDesktop = 'lg:grid-cols-3') => (
    loading ? (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.action }} />
      </div>
    ) : filtrados.length === 0 ? (
      <div className="text-center py-16">
        <p className="text-base font-semibold" style={{ color: C.fgMuted }}>Sin productos con estos filtros. Intenta otra búsqueda.</p>
      </div>
    ) : (
      <div className={`grid grid-cols-2 ${colsDesktop} gap-3 sm:gap-4`}>
        {filtrados.map(p => (
          <B2BCatalogCard key={p.id} producto={p} />
        ))}
      </div>
    )
  );

  const TrustGrid = (cols = 'grid-cols-3 sm:grid-cols-6') => (
    <div className={`grid ${cols} gap-2`}>
      {TRUST.map(({ icon: Icon, t, s }) => (
        <div key={t} className="flex flex-col items-center text-center p-2.5 rounded-xl transition-all hover:shadow-md" style={{ background: 'white', border: `1px solid ${C.border}` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ background: '#0F8B6C15' }}>
            <Icon className="w-4 h-4" style={{ color: C.action }} />
          </div>
          <p className="text-[10px] font-bold leading-tight" style={{ color: C.fg }}>{t}</p>
          <p className="text-[8px] leading-tight mt-0.5" style={{ color: C.fgMuted }}>{s}</p>
        </div>
      ))}
    </div>
  );

  // Sellos en franja compacta de 1 línea (scroll horizontal) — versión mobile
  // del TrustGrid: mismo contenido, sin ocupar 2 filas de pantalla.
  const TrustStrip = (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {TRUST.map(({ icon: Icon, t, s }) => (
        <span key={t} className="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full" style={{ background: 'white', border: `1px solid ${C.border}`, color: C.fgSoft }}>
          <Icon className="w-3 h-3" style={{ color: C.action }} />
          {t} <span className="font-semibold" style={{ color: C.fgMuted }}>· {s}</span>
        </span>
      ))}
    </div>
  );

  // Clientes en franja compacta de 1 línea (scroll horizontal) — reemplaza el
  // muro de 25 chips que dominaba la pantalla. Misma data, formato discreto.
  const ClientsStrip = (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
      <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest mr-1" style={{ color: C.fgMuted }}>
        Confían en PEYU
      </span>
      {CLIENTES.map(c => (
        <span key={c} className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'white', border: `1px solid ${C.border}`, color: C.fgSoft }}>
          {c}
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen lg:h-screen lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden font-inter max-w-[100vw] overflow-x-hidden" style={{ background: C.bg, color: C.fg }}>
      <SEOHead
        title="B2B Corporativo — PEYU | Regalos Mayoristas Sostenibles"
        description="Soluciones B2B para empresas: precios por volumen, personalización masiva con logo, facturación y despacho a todo Chile."
        url="https://peyuchile.cl/EmpresasNuevo"
        type="website"
      />

      {/* ── TOP NAV sticky (mismo patrón /personalizar y /CotizacionRapida) ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(248,243,237,.97)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 10px rgba(44,24,16,.07)' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex items-center gap-3">
          {/* Volver a la tienda */}
          <Link to="/"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white"
            style={{ border: `1.5px solid ${C.border}` }}>
            <ArrowLeft className="w-4 h-4" style={{ color: C.fgSoft }} />
          </Link>

          {/* Logo (solo desktop) */}
          <Link to="/" className="hidden lg:block flex-shrink-0 group mr-4">
            <img src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU" className="h-8 w-auto group-hover:scale-105 transition-transform" draggable={false} />
          </Link>

          {/* Brand mobile */}
          <div className="flex items-center gap-2 lg:hidden flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.actionGrad }}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-poppins font-bold text-sm leading-tight" style={{ color: C.fg }}>PEYU Empresas</p>
              <p className="text-[10px] leading-tight font-semibold" style={{ color: C.action }}>Hasta −54% por volumen · Factura</p>
            </div>
          </div>

          {/* Desktop: Paso único del catálogo */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {JOURNEY.map((s, i) => (
              <div key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(15,139,108,.10)', border: `1.5px solid ${C.action}` }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.actionGrad }}>
                  <s.Icon className="w-2.5 h-2.5" style={{ color: 'white' }} />
                </div>
                <span className="text-xs font-bold" style={{ color: C.action }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Sin CTA en header — el catálogo es autosuficiente */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: C.fgMuted }}>
              {filtrados.length} productos B2B
            </span>
          </div>

          {/* Mobile: sin CTA compacto — limpio y directo al catálogo */}
        </div>
      </header>

      {/* ── BODY DESKTOP: cockpit 3 cols, 1 pantalla, sin scroll de página ── */}
      <div className="hidden lg:flex w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 py-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden gap-5 items-stretch">

        {/* Panel izquierdo: propuesta de valor + sellos + continuidad */}
        <aside className="flex flex-col gap-3 w-64 xl:w-80 flex-shrink-0 h-full min-h-0 overflow-y-auto peyu-scrollbar pr-1">
          <div>
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-lg mb-3" style={{ background: C.action, color: 'white' }}>
              ✨ Regalos corporativos
            </span>
            <h1 className="font-fraunces text-3xl xl:text-4xl leading-[1.05] mb-2 font-bold" style={{ color: C.fg }}>
              Plástico reciclado<br />
              <span style={{ color: C.action }}>con tu logo grabado</span>
            </h1>
            <p className="text-sm leading-relaxed font-semibold" style={{ color: C.fgSoft }}>
              Desde 10u • Hasta −54% • Factura + Despacho
            </p>
          </div>

          <p className="text-sm leading-relaxed font-semibold mt-2" style={{ color: C.fgSoft }}>
            Elige un producto, explora precios por volumen, carga tu logo y solicita tu cotización en un solo paso.
          </p>

          {/* Segunda opción: propuesta rápida sin navegar el catálogo */}
          <Link to="/empresas/propuesta-rapida"
            className="block rounded-2xl p-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: C.actionGrad, boxShadow: C.actionShadow }}>
            <p className="text-white font-bold text-sm flex items-center gap-1.5">
              ⚡ ¿Sin tiempo? Propuesta rápida
              <ArrowRight className="w-4 h-4 ml-auto" />
            </p>
            <p className="text-white/85 text-[11px] font-semibold mt-1 leading-snug">
              Cuéntanos qué necesitas en 60 segundos y recibe tu propuesta formal en 24h.
            </p>
          </Link>

          {TrustGrid('grid-cols-2')}
        </aside>

        {/* Centro: catálogo GIGANTE con scroll propio (sin columna derecha:
            los clientes viven en una franja compacta bajo el catálogo) */}
        <main className="flex flex-col flex-1 min-w-0 h-full min-h-0 gap-2.5">
          <div className="flex-shrink-0">{SearchAndChips}</div>
          <div
            className="flex-1 min-h-0 rounded-3xl overflow-y-auto peyu-scrollbar p-4"
            style={{ background: C.surface, border: `1.5px solid ${C.border}` }}
          >
            {ProductGrid('lg:grid-cols-4 2xl:grid-cols-5')}
          </div>
          {/* Franja compacta de clientes (1 línea, scroll horizontal) */}
          <div className="flex-shrink-0">{ClientsStrip}</div>
          {/* Barra info inferior */}
          <div className="flex-shrink-0 flex items-center justify-center gap-3 px-4 py-2.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,.94)', border: `1px solid ${C.border}` }}>
            <p className="text-[11px] font-semibold text-center" style={{ color: C.fgMuted }}>
              {filtrados.length} productos B2B · grabado láser de tu logo gratis desde 10 unidades · elige un producto para comenzar
            </p>
          </div>
        </main>
      </div>

      {/* ── BODY MOBILE: flujo vertical compacto, sin scroll horizontal ─── */}
      <div className="lg:hidden pb-[7rem] max-w-[100vw] overflow-x-hidden">
        <section className="w-full px-3 pt-2 pb-4">
          {/* Hero ultra compacto */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block text-[9px] font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: C.action, color: 'white' }}>
                ✨ B2B
              </span>
              <h1 className="font-fraunces text-lg leading-tight font-bold truncate" style={{ color: C.fg }}>
                Plástico reciclado <span style={{ color: C.action }}>con tu logo</span>
              </h1>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: C.fgSoft }}>
              Elige productos · cotiza al instante · propuesta en 24h
            </p>
            {/* Segunda opción mobile: propuesta rápida sin navegar el catálogo */}
            <Link to="/empresas/propuesta-rapida"
              className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 active:scale-[0.99] transition-all"
              style={{ background: C.actionGrad, boxShadow: C.actionShadow }}>
              <span className="text-white font-bold text-xs">⚡ ¿Sin tiempo? Propuesta rápida en 60 seg</span>
              <ChevronRight className="w-4 h-4 text-white ml-auto flex-shrink-0" />
            </Link>
          </div>

          {/* Buscador + chips de categoría */}
          <div className="mb-3">{SearchAndChips}</div>

          {/* Productos */}
          {ProductGrid('grid-cols-2')}

          {/* Footer compacto al final */}
          <footer className="mt-6 pt-3 text-center text-[9px] flex items-center justify-center gap-2" style={{ borderTop: `1.5px solid ${C.border}`, color: C.fgMuted }}>
            <Recycle className="w-3 h-3 flex-shrink-0" style={{ color: '#8BAD8A' }} />
            <span className="font-semibold">PEYU · Plástico 100% reciclado · Santiago 🇨🇱</span>
          </footer>
        </section>
      </div>

      {/* Tabs de navegación mobile (Inicio · Tienda · Blog · B2B · Carrito) */}
      <MobileNavBarV2 />
    </div>
  );
}