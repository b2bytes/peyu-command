import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Building2, Zap, Package, ArrowRight, CheckCircle, MessageCircle, Shield, Recycle, Sliders } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import B2BCatalogFilters from '@/components/B2BCatalogFilters';
import B2BQuoteModal from '@/components/B2BQuoteModal';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { combineSchemas, buildOrganizationSchema, buildBreadcrumbSchema } from '@/lib/schemas-peyu';

const PRICE_TIERS = [
  { label: '10–49 u.', discount: 0, badge: 'Laser gratis' },
  { label: '50–199 u.', discount: 8, badge: '−8%' },
  { label: '200–499 u.', discount: 15, badge: '−15%' },
  { label: '500+ u.', discount: 25, badge: '−25%' },
];

const KITS = [
  { id: 'kit-escritorio', nombre: 'Kit Escritorio Pro', descripcion: 'El regalo corporativo estrella. 5 piezas de uso diario para la oficina.', emoji: '🖥️', piezas: ['Soporte celular', 'Soporte notebook', 'Llavero soporte', 'Posavaso', 'Separador'], precio_base: 19990, sku: 'KIT-ESC-PRO', categoria: 'Escritorio', material: 'Plástico 100% Reciclado', stock: 'stock', destacado: true },
  { id: 'posavasos', nombre: 'Set Posavasos Corporativos', descripcion: 'Set de posavasos marmolados 100% reciclados. Presentación premium en caja.', emoji: '🟢', piezas: ['6 posavasos circulares', 'Caja presentación', 'Tarjeta sustentabilidad'], precio_base: 7990, sku: 'POS-COR-SET', categoria: 'Hogar', material: 'Plástico 100% Reciclado', stock: 'stock', destacado: false },
  { id: 'cachos', nombre: 'Pack Cachos Corporativos', descripcion: 'Juego de cachos en plástico reciclado. Ideal para eventos y aniversarios.', emoji: '🎲', piezas: ['Pack 5 cachos', 'Dados', 'Bolsa algodón orgánico'], precio_base: 21990, sku: 'CAC-COR-P5', categoria: 'Entretenimiento', material: 'Plástico 100% Reciclado', stock: 'stock', destacado: false },
  { id: 'macetero', nombre: 'Macetero Corporativo', descripcion: 'Macetero marmolado para plantas de escritorio. Diseño único irrepetible.', emoji: '🌱', piezas: ['Macetero con platito', 'Logo grabado láser', 'Instructivo cuidado'], precio_base: 5990, sku: 'MAC-COR-ECO', categoria: 'Hogar', material: 'Fibra de Trigo (Compostable)', stock: 'low_stock', destacado: false },
  { id: 'lampara', nombre: 'Lámpara Corporativa Chillka', descripcion: 'Lámpara LED de diseño con material reciclado. El regalo premium.', emoji: '💡', piezas: ['Lámpara LED vintage', 'Base plástico reciclado', 'Cable tejido'], precio_base: 23490, sku: 'LAM-COR-LED', categoria: 'Corporativo', material: 'Plástico 100% Reciclado', stock: 'on_demand', destacado: false },
  { id: 'soporte-cel', nombre: 'Soporte Celular Corporativo', descripcion: 'Soporte de celular ergonómico para escritorio. El más vendido.', emoji: '📱', piezas: ['Soporte ajustable', 'Antideslizante', '100% reciclado'], precio_base: 6990, sku: 'SOC-COR-ERG', categoria: 'Escritorio', material: 'Plástico 100% Reciclado', stock: 'stock', destacado: false },
];

function calcPrice(base, qty) {
  let discount = 0;
  if (qty >= 500) discount = 0.25;
  else if (qty >= 200) discount = 0.15;
  else if (qty >= 50) discount = 0.08;
  return Math.round(base * (1 - discount));
}

export default function CatalogoCorporativo() {
  const [qty, setQty] = useState(100);
  const [filters, setFilters] = useState({ categoria: [], material: [], precio: [], stock: [] });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const tier = qty >= 500 ? 3 : qty >= 200 ? 2 : qty >= 50 ? 1 : 0;

  const handleFilterChange = (filterType, option, isChecked) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: isChecked
        ? [...(prev[filterType] || []), option]
        : (prev[filterType] || []).filter(o => o !== option)
    }));
  };

  const applyFilters = (products) => {
    return products.filter(p => {
      if (filters.categoria.length > 0 && !filters.categoria.includes(p.categoria)) return false;
      if (filters.material.length > 0 && !filters.material.includes(p.material)) return false;
      if (filters.stock.length > 0) {
        const stockMap = { 'En Stock': 'stock', 'Bajo Stock': 'low_stock', 'Bajo Pedido': 'on_demand' };
        if (!filters.stock.some(s => stockMap[s] === p.stock)) return false;
      }
      if (filters.precio.length > 0) {
        const priceRanges = { '0-10K': [0, 10000], '10K-20K': [10000, 20000], '20K-50K': [20000, 50000], '50K+': [50000, Infinity] };
        if (!filters.precio.some(r => p.precio_base >= priceRanges[r][0] && p.precio_base < priceRanges[r][1])) return false;
      }
      return true;
    });
  };

  const activeFilters = Object.entries(filters).flatMap(([key, vals]) => vals);
  const filteredKits = applyFilters(KITS);

  const catalogoJsonLd = combineSchemas(
    buildOrganizationSchema(),
    buildBreadcrumbSchema([
      { name: 'Inicio', url: 'https://peyuchile.cl/' },
      { name: 'Catálogo B2B', url: 'https://peyuchile.cl/b2b/catalogo' },
    ]),
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">
      <SEO
        title="Catálogo Corporativo B2B · Kits Personalizados con Logo | PEYU Chile"
        description="Catálogo completo de regalos corporativos personalizables: kits escritorio, posavasos, maceteros y lámparas. Plástico 100% reciclado, descuentos hasta 25% por volumen."
        canonical="https://peyuchile.cl/b2b/catalogo"
        jsonLd={catalogoJsonLd}
      />
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow-md shadow-[#0F8B6C]/20 group-hover:scale-105 transition-transform">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[15px] font-poppins font-bold leading-none tracking-tight text-gray-900">PEYU</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Catálogo B2B 2026</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/shop">
              <Button variant="ghost" size="sm" className="rounded-lg text-gray-600 hover:text-gray-900 hidden sm:inline-flex">Tienda B2C</Button>
            </Link>
            <Link to="/b2b/contacto">
              <Button size="sm" className="gap-2 rounded-lg bg-[#0F8B6C] hover:bg-[#0a7558] text-white shadow-md">
                <Building2 className="w-4 h-4" /> Cotizar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#0F8B6C] rounded-full blur-[120px] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-5 py-16 sm:py-24 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#0F8B6C]/10 border border-[#0F8B6C]/30 px-4 py-2 rounded-full text-sm">
            <Building2 className="w-4 h-4 text-[#0F8B6C]" />
            <span className="text-[#0F8B6C] font-medium">Catálogo Corporativo B2B</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-poppins font-bold leading-[1.1] text-gray-900">
            Regalos corporativos<br /><span style={{ color: '#0F8B6C' }}>con propósito ESG real</span>
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
            100% plástico reciclado · Personalización láser UV gratis desde 10 u. · Fabricado en Chile
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/b2b/self-service">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-lg shadow-xl h-12 px-6">
                <Zap className="w-5 h-5" /> Genera tu propuesta en 1 min
              </Button>
            </Link>
            <Link to="/b2b/contacto">
              <Button size="lg" variant="outline" className="gap-2 rounded-lg border-gray-300 text-gray-900 hover:bg-gray-50 h-12 px-6 font-semibold">
                <Building2 className="w-5 h-5" /> Cotización asistida
              </Button>
            </Link>
            <a href="https://wa.me/56935040242?text=Hola%2C%20me%20interesa%20el%20cat%C3%A1logo%20corporativo%20de%20Peyu%20Chile" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2 rounded-lg border-gray-300 text-gray-900 hover:bg-gray-50 h-12 px-6 font-semibold">
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* SIMULADOR DE PRECIOS */}
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 md:p-8">
          <h2 className="font-poppins font-bold text-gray-900 text-center mb-6 text-lg">Simulador de precios por volumen</h2>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-gray-600 shrink-0 font-medium whitespace-nowrap">Cantidad:</span>
            <input type="range" min="10" max="600" step="10" value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="flex-1 accent-[#0F8B6C]" />
            <div className="w-20">
              <input type="number" min="10" value={qty}
                onChange={e => setQty(Math.max(10, Number(e.target.value)))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center font-bold bg-gray-50" />
            </div>
          </div>

          {/* Tier pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {PRICE_TIERS.map((t, i) => (
              <div key={i} className={`rounded-lg p-2.5 text-center border-2 transition-all ${i === tier ? 'border-[#0F8B6C] bg-[#0F8B6C]/5' : 'border-gray-100 bg-gray-50'}`}>
                <div className="text-[10px] text-gray-500 font-medium">{t.label}</div>
                <div className={`font-bold text-xs mt-1 ${i === tier ? 'text-[#0F8B6C]' : 'text-gray-400'}`}>{t.badge}</div>
              </div>
            ))}
          </div>

          {/* Price display */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 space-y-4">
            <p className="text-sm text-gray-600 text-center font-medium">Kit Escritorio Pro · {qty} unidades</p>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Precio original</div>
                <div className="text-lg text-gray-400 line-through">${(19990 * qty).toLocaleString('es-CL')}</div>
              </div>
              <div className="col-span-2 md:col-span-1 text-center">
                <div className="text-xs text-gray-500 mb-1">Total con descuento</div>
                <div className="text-2xl md:text-3xl font-poppins font-bold text-[#0F8B6C]">${(calcPrice(19990, qty) * qty).toLocaleString('es-CL')}</div>
              </div>
              <div className="text-center col-span-2 md:col-span-1">
                <div className="text-xs text-gray-500 mb-1">Por unidad</div>
                <div className="text-xl font-poppins font-bold text-gray-900">${calcPrice(19990, qty).toLocaleString('es-CL')}</div>
                <div className="text-xs text-[#0F8B6C] font-semibold mt-1">
                  {PRICE_TIERS[tier].discount > 0 ? `−${PRICE_TIERS[tier].discount}%` : '✨ Laser gratis'}
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link to={`/b2b/contacto?qty=${qty}`}>
              <Button className="gap-2 rounded-lg bg-[#0F8B6C] hover:bg-[#0a7558] text-white font-bold px-8 shadow-md">
                Solicitar cotización para {qty} u. <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CATÁLOGO */}
      <div className="max-w-7xl mx-auto px-5 py-12">
        <div className="flex items-start justify-between gap-8">
          {/* Sidebar Filtros */}
          <div className="hidden lg:block w-64">
            <div className="sticky top-20">
              <h3 className="font-poppins font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <Sliders className="w-5 h-5 text-[#0F8B6C]" /> Filtrar
              </h3>
              <B2BCatalogFilters filters={filters} onFilterChange={handleFilterChange} activeFilters={activeFilters} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filters Toggle */}
            <div className="lg:hidden mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600 font-medium">{filteredKits.length} productos</p>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                <Sliders className="w-4 h-4" /> Filtros
              </button>
            </div>

            {showMobileFilters && (
              <div className="lg:hidden mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <B2BCatalogFilters filters={filters} onFilterChange={handleFilterChange} activeFilters={activeFilters} />
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <p className="text-sm font-semibold text-[#0F8B6C] uppercase tracking-widest mb-2">Productos</p>
              <h2 className="text-3xl font-poppins font-bold text-gray-900">Catálogo completo</h2>
              <p className="text-gray-500 mt-2 text-sm">Todos incluyen personalización láser UV con tu logo</p>
            </div>

            {/* Productos */}
            {filteredKits.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 font-medium mb-3">No hay productos con esos filtros</p>
                <button onClick={() => setFilters({ categoria: [], material: [], precio: [], stock: [] })} className="text-[#0F8B6C] text-sm font-medium hover:underline">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredKits.map(kit => (
                  <div key={kit.id} className={`bg-white border-2 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${kit.destacado ? 'border-[#0F8B6C] shadow-md shadow-[#0F8B6C]/10' : 'border-gray-100'}`}>
                    {kit.destacado && (
                      <div className="bg-[#0F8B6C] text-white text-center text-xs py-2 font-bold tracking-widest">⭐ ESTRELLA</div>
                    )}
                    <div className="h-32 flex items-center justify-center text-5xl" style={{ background: kit.destacado ? 'linear-gradient(135deg,#0F8B6C15,#A7D9C915)' : '#F7F7F5' }}>
                      {kit.emoji}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-poppins font-bold text-gray-900 text-sm">{kit.nombre}</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{kit.descripcion}</p>
                      </div>
                      <div className="space-y-1.5">
                        {kit.piezas.slice(0, 3).map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle className="w-3 h-3 text-[#0F8B6C] shrink-0" /> {p}
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-gray-100 space-y-3">
                        <div>
                          <div className="text-xs text-gray-500">Desde (10 u.)</div>
                          <div className="text-2xl font-poppins font-bold text-gray-900">${kit.precio_base.toLocaleString('es-CL')}</div>
                          <div className="text-xs text-gray-500 mt-0.5">c/u + personalización</div>
                        </div>
                        <div className="bg-[#0F8B6C]/5 rounded-lg p-2 space-y-1">
                          <div className="text-[10px] font-bold text-[#0F8B6C]">Descuentos por volumen</div>
                          <div className="text-[10px] text-gray-600">• 100+ u. = −8% • 500+ u. = −25%</div>
                        </div>
                        <button
                          onClick={() => setSelectedProduct(kit)}
                          className="w-full gap-2 rounded-lg bg-[#0F8B6C] hover:bg-[#0a7558] text-white font-bold py-2.5 text-sm flex items-center justify-center transition-all active:scale-95"
                        >
                          <Package className="w-4 h-4" /> Cotizar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
            </div>
            </div>

            {/* Quote Modal */}
            {selectedProduct && (
            <B2BQuoteModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onSuccess={() => {
              toast.success(`Solicitud de ${selectedProduct.nombre} enviada correctamente`);
            }}
            />
            )}

            {/* VALUES */}
            <div className="max-w-6xl mx-auto px-5 py-16">
            <div className="text-center space-y-8">
            <h3 className="text-2xl md:text-3xl font-poppins font-bold text-gray-900">¿Por qué elegir Peyu?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Recycle, label: '100% Reciclado', sub: 'Plástico post-consumo certificado', color: '#0F8B6C' },
                { icon: Shield, label: 'Garantía 10 años', sub: 'En todos nuestros productos', color: '#0F8B6C' },
                { icon: Zap, label: 'Laser UV gratis', sub: 'Desde 10 unidades', color: '#0F8B6C' },
              ].map((v, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <v.icon className="w-8 h-8 mx-auto mb-3" style={{ color: v.color }} />
                  <p className="font-bold text-gray-900 text-base">{v.label}</p>
                  <p className="text-gray-500 text-sm mt-2">{v.sub}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 text-sm font-medium">Empresas que confían en Peyu</p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Adidas', 'Nestlé', 'BancoEstado', 'DUOC UC', 'UAI', 'Cachantún'].map(c => (
                  <span key={c} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-4 py-2 rounded-full">{c}</span>
                ))}
              </div>
            </div>
            <Link to="/b2b/contacto">
              <Button size="lg" className="gap-2 bg-[#0F8B6C] hover:bg-[#0a7558] text-white font-bold rounded-lg px-8 shadow-md">
                <Building2 className="w-5 h-5" /> Solicitar cotización →
              </Button>
            </Link>
            </div>
            </div>

            <WhatsAppWidget context="b2b" />
    </div>
  );
}