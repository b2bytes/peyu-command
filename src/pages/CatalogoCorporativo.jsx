import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Building2, Zap, Package, ArrowRight, CheckCircle, MessageCircle, Shield, Recycle, Sliders } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import B2BCatalogFilters from '@/components/B2BCatalogFilters';
import B2BQuoteModal from '@/components/B2BQuoteModal';
import { toast } from 'sonner';

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

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/">
            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow-md shadow-[#0F8B6C]/20 group-hover:scale-105 transition-transform">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[15px] font-poppins font-bold leading-none tracking-tight text-gray-900">PEYU</p>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">Catálogo Corporativo 2026</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/shop">
              <Button variant="ghost" size="sm" className="rounded-xl text-gray-600 hover:text-gray-900">Tienda B2C</Button>
            </Link>
            <Link to="/b2b/contacto">
              <Button size="sm" className="gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-md">
                <Building2 className="w-4 h-4" /> Cotizar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#080C0B]" />
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#0F8B6C] rounded-full blur-[120px] opacity-15" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[#A7D9C9] rounded-full blur-[100px] opacity-10" />
        <div className="relative max-w-4xl mx-auto px-5 py-20 text-center text-white space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/10 px-4 py-1.5 rounded-full text-sm">
            <Building2 className="w-4 h-4 text-[#A7D9C9]" />
            <span className="text-white/70">Catálogo Corporativo 2026</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-poppins font-bold leading-[1.05]">
            Regalos corporativos<br /><span style={{ color: '#A7D9C9' }}>con propósito real</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto text-lg leading-relaxed">
            100% plástico reciclado · Fabricado en Chile · Personalización láser UV gratuita desde 10 u.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/b2b/contacto">
              <Button size="lg" className="gap-2 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-2xl shadow-lg h-12 px-7">
                <Zap className="w-5 h-5 text-yellow-500" /> Cotización en &lt;24h
              </Button>
            </Link>
            <a href="https://wa.me/56935040242?text=Hola%2C%20me%20interesa%20el%20cat%C3%A1logo%20corporativo%20de%20Peyu%20Chile" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2 rounded-2xl border-white/20 text-white hover:bg-white/10 h-12 px-7">
                <MessageCircle className="w-5 h-5" /> WhatsApp Directo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── SIMULADOR DE PRECIOS ─────────────── */}
      <div className="max-w-4xl mx-auto px-5 -mt-8 mb-4">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-6 md:p-8">
          <h2 className="font-poppins font-bold text-gray-900 text-center mb-6">Simulador de precios por volumen</h2>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-gray-400 shrink-0 font-medium">Cantidad:</span>
            <input type="range" min="10" max="600" step="10" value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="flex-1 accent-[#0F8B6C]" />
            <div className="w-20">
              <input type="number" min="10" value={qty}
                onChange={e => setQty(Math.max(10, Number(e.target.value)))}
                className="w-full border border-gray-200 rounded-xl px-2 py-1.5 text-sm text-center font-bold bg-gray-50" />
            </div>
          </div>

          {/* Tier pills */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {PRICE_TIERS.map((t, i) => (
              <div key={i} className={`rounded-2xl p-3 text-center border-2 transition-all ${i === tier ? 'border-[#0F8B6C] bg-[#0F8B6C]/5' : 'border-gray-100 bg-gray-50'}`}>
                <div className="text-[10px] text-gray-400 font-medium">{t.label}</div>
                <div className={`font-bold text-sm mt-0.5 ${i === tier ? 'text-[#0F8B6C]' : 'text-gray-400'}`}>{t.badge}</div>
              </div>
            ))}
          </div>

          {/* Price display */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <p className="text-sm text-gray-400 text-center mb-4">Precio estimado Kit Escritorio Pro · {qty} unidades</p>
            <div className="flex items-center justify-center gap-10">
              <div className="text-center">
                <div className="text-sm text-gray-300 line-through">${(19990 * qty).toLocaleString('es-CL')}</div>
                <div className="text-3xl font-poppins font-bold text-gray-900">${(calcPrice(19990, qty) * qty).toLocaleString('es-CL')}</div>
                <div className="text-xs text-gray-400 mt-1">Total estimado</div>
              </div>
              <div className="w-px h-12 bg-gray-200" />
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Precio unitario</div>
                <div className="text-2xl font-poppins font-bold text-gray-900">${calcPrice(19990, qty).toLocaleString('es-CL')}</div>
                <div className="text-xs text-[#0F8B6C] font-semibold mt-1">
                  {PRICE_TIERS[tier].discount > 0 ? `Ahorro: ${PRICE_TIERS[tier].discount}%` : '✨ Laser gratis'}
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-5">
            <Link to={`/b2b/contacto?qty=${qty}`}>
              <Button className="gap-2 rounded-2xl bg-gray-900 hover:bg-gray-800 font-semibold px-7 shadow-lg">
                Solicitar cotización formal para {qty} u. <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── CATÁLOGO ───────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 py-14">
        <div className="flex items-start justify-between gap-8">
          {/* Sidebar Filtros */}
          <div className="hidden lg:block w-72 space-y-4">
            <div className="sticky top-20">
              <h3 className="font-poppins font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sliders className="w-5 h-5" /> Filtrar
              </h3>
              <B2BCatalogFilters filters={filters} onFilterChange={handleFilterChange} activeFilters={activeFilters} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filters Toggle */}
            <div className="lg:hidden mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600 font-medium">{filteredKits.length} productos encontrados</p>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                <Sliders className="w-4 h-4" /> Filtros
              </button>
            </div>

            {showMobileFilters && (
              <div className="lg:hidden mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
                <B2BCatalogFilters filters={filters} onFilterChange={handleFilterChange} activeFilters={activeFilters} />
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-2">Productos</p>
                  <h2 className="text-3xl font-poppins font-bold text-gray-900">Catálogo completo</h2>
                  <p className="text-gray-400 mt-2 text-sm">Todos incluyen personalización láser UV con tu logo</p>
                </div>
              </div>
            </div>

            {/* Productos */}
            {filteredKits.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 font-medium mb-2">No hay productos que coincidan con los filtros seleccionados</p>
                <button onClick={() => setFilters({ categoria: [], material: [], precio: [], stock: [] })} className="text-[#0F8B6C] text-sm font-medium hover:underline">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredKits.map(kit => (
            <div key={kit.id} className={`bg-white rounded-3xl overflow-hidden border-2 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${kit.destacado ? 'border-[#0F8B6C] shadow-md shadow-[#0F8B6C]/10' : 'border-gray-100'}`}>
              {kit.destacado && (
                <div className="bg-[#0F8B6C] text-white text-center text-xs py-2 font-bold tracking-widest">⭐ PRODUCTO ESTRELLA</div>
              )}
              <div className="h-36 flex items-center justify-center text-6xl" style={{ background: kit.destacado ? 'linear-gradient(135deg,#0F8B6C18,#A7D9C920)' : '#F7F7F5' }}>
                {kit.emoji}
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-poppins font-bold text-gray-900">{kit.nombre}</h3>
                  <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{kit.descripcion}</p>
                </div>
                <div className="space-y-1">
                  {kit.piezas.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle className="w-3 h-3 text-[#0F8B6C] shrink-0" /> {p}
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="text-xs text-gray-400">Desde (10 u.)</div>
                      <div className="text-2xl font-poppins font-bold text-gray-900">${kit.precio_base.toLocaleString('es-CL')}</div>
                      <div className="text-xs text-gray-400">c/u · Personalización incluida</div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="text-[10px] font-bold text-[#0F8B6C] bg-[#0F8B6C]/10 px-2 py-0.5 rounded-full">100+ u. → −8%</div>
                      <div className="text-[10px] font-bold text-[#0F8B6C] bg-[#0F8B6C]/10 px-2 py-0.5 rounded-full">500+ u. → −25%</div>
                    </div>
                  </div>
                  <button
                   onClick={() => setSelectedProduct(kit)}
                   className="w-full gap-2 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 text-sm font-medium flex items-center justify-center"
                  >
                   <Package className="w-4 h-4" /> Solicitar cotización
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

                  {/* ── VALORES ─────────────────────────── */}
      <div className="mx-4 md:mx-8 bg-gray-900 rounded-3xl p-8 md:p-12 mb-8">
        <div className="max-w-3xl mx-auto text-center text-white space-y-5">
          <h3 className="text-2xl md:text-3xl font-poppins font-bold">¿Por qué elegir Peyu?</h3>
          <div className="grid md:grid-cols-3 gap-4 py-4">
            {[
              { icon: Recycle, label: '100% Reciclado', sub: 'Plástico post-consumo real', color: '#A7D9C9' },
              { icon: Shield, label: 'Garantía 10 años', sub: 'En todos los productos', color: '#A7D9C9' },
              { icon: Zap, label: 'Laser UV gratis', sub: 'Desde 10 unidades', color: '#A7D9C9' },
            ].map((v, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <v.icon className="w-6 h-6 mx-auto mb-2" style={{ color: v.color }} />
                <p className="font-semibold text-sm">{v.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{v.sub}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['Adidas', 'Nestlé', 'BancoEstado', 'DUOC UC', 'UAI', 'Cachantún'].map(c => (
              <span key={c} className="bg-white/5 border border-white/10 text-white/40 text-xs px-3 py-1.5 rounded-full">{c}</span>
            ))}
          </div>
          <Link to="/b2b/contacto">
            <Button size="lg" className="gap-2 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-2xl mt-2 px-8 shadow-lg">
              <Building2 className="w-5 h-5" /> Solicitar cotización corporativa →
            </Button>
          </Link>
        </div>
      </div>

      <WhatsAppWidget context="b2b" />
    </div>
  );
}