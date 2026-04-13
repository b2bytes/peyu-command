import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Building2, Zap, Package, ArrowRight, CheckCircle, MessageCircle } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

const PRICE_TIERS = [
  { label: '10–49 u.', discount: 0, badge: 'Gratis personalización' },
  { label: '50–199 u.', discount: 8, badge: '-8%' },
  { label: '200–499 u.', discount: 15, badge: '-15%' },
  { label: '500+ u.', discount: 25, badge: '-25%' },
];

const KITS = [
  {
    id: 'kit-escritorio',
    nombre: 'Kit Escritorio Pro',
    descripcion: 'El regalo corporativo estrella de Peyu. 5 piezas de uso diario para la oficina.',
    emoji: '🖥️',
    piezas: ['Soporte celular', 'Soporte notebook', 'Llavero soporte', 'Posavaso', 'Separador'],
    precio_base: 19990,
    sku: 'KIT-ESC-PRO',
    destacado: true,
  },
  {
    id: 'posavasos',
    nombre: 'Set Posavasos Corporativos',
    descripcion: 'Set de posavasos marmolados 100% reciclados. Presentación premium en caja.',
    emoji: '🟢',
    piezas: ['6 posavasos circulares', 'Caja presentación', 'Tarjeta sustentabilidad'],
    precio_base: 7990,
    sku: 'POS-COR-SET',
    destacado: false,
  },
  {
    id: 'cachos',
    nombre: 'Pack Cachos Corporativos',
    descripcion: 'Juego de cachos en plástico reciclado. Ideal para eventos y aniversarios.',
    emoji: '🎲',
    piezas: ['Pack 5 cachos', 'Dados', 'Bolsa algodón orgánico'],
    precio_base: 21990,
    sku: 'CAC-COR-P5',
    destacado: false,
  },
  {
    id: 'macetero',
    nombre: 'Macetero Corporativo',
    descripcion: 'Macetero marmolado para plantas de escritorio. Diseño único irrepetible.',
    emoji: '🌱',
    piezas: ['Macetero con platito', 'Logo grabado láser', 'Instructivo cuidado'],
    precio_base: 5990,
    sku: 'MAC-COR-ECO',
    destacado: false,
  },
  {
    id: 'lampara',
    nombre: 'Lámpara Corporativa Chillka',
    descripcion: 'Lámpara LED de diseño con material reciclado. El regalo premium.',
    emoji: '💡',
    piezas: ['Lámpara LED vintage', 'Base plástico reciclado', 'Cable tejido'],
    precio_base: 23490,
    sku: 'LAM-COR-LED',
    destacado: false,
  },
  {
    id: 'soporte-cel',
    nombre: 'Soporte Celular Corporativo',
    descripcion: 'Soporte de celular ergonómico para escritorio. El más vendido.',
    emoji: '📱',
    piezas: ['Soporte ajustable', 'Antideslizante', '100% reciclado'],
    precio_base: 6990,
    sku: 'SOC-COR-ERG',
    destacado: false,
  },
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
  const [selectedKit, setSelectedKit] = useState(null);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    base44.entities.Producto.filter({ canal: 'B2B + B2C' }).then(setProductos).catch(() => {});
  }, []);

  const tier = qty >= 500 ? 3 : qty >= 200 ? 2 : qty >= 50 ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <div className="flex items-center gap-2.5 hover:opacity-80 transition">
              <div className="w-8 h-8 rounded-full bg-[#0F8B6C] flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-poppins font-bold leading-none" style={{ color: '#0F8B6C' }}>PEYU</h1>
                <p className="text-xs text-muted-foreground leading-none">Catálogo Corporativo 2026</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/shop">
              <Button variant="ghost" size="sm">Tienda B2C</Button>
            </Link>
            <Link to="/b2b/contacto">
              <Button size="sm" className="gap-2" style={{ backgroundColor: '#006D5B' }}>
                <Building2 className="w-4 h-4" />
                Cotizar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #006D5B 100%)' }} className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium">
            <Building2 className="w-4 h-4" />
            Catálogo Corporativo 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-poppins leading-tight">
            Regalos corporativos<br />con propósito real
          </h1>
          <p className="text-white/70 max-w-xl mx-auto text-lg">
            100% plástico reciclado · Fabricado en Chile · Personalización láser UV gratuita desde 10 unidades
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/b2b/contacto">
              <Button size="lg" className="gap-2 bg-white text-[#006D5B] hover:bg-white/90 font-semibold">
                <Zap className="w-5 h-5" />
                Cotización en &lt;24h
              </Button>
            </Link>
            <a
              href="https://wa.me/56935040242?text=Hola%2C%20me%20interesa%20el%20cat%C3%A1logo%20corporativo%20de%20Peyu%20Chile"
              target="_blank" rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2 border-white text-white hover:bg-white/10">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Directo
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Pricing simulator */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
          <h2 className="font-bold font-poppins text-center mb-4">Simulador de precios por volumen</h2>
          <div className="flex items-center gap-4 mb-5">
            <span className="text-sm text-muted-foreground shrink-0">Cantidad:</span>
            <input
              type="range"
              min="10" max="600" step="10"
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="flex-1 accent-[#006D5B]"
            />
            <div className="w-20">
              <input
                type="number"
                min="10"
                value={qty}
                onChange={e => setQty(Math.max(10, Number(e.target.value)))}
                className="w-full border border-input rounded-md px-2 py-1 text-sm text-center"
              />
            </div>
          </div>
          {/* Tier badges */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {PRICE_TIERS.map((t, i) => (
              <div key={i} className={`rounded-xl p-3 text-center border-2 transition ${i === tier ? 'border-[#006D5B] bg-green-50' : 'border-border'}`}>
                <div className="text-xs text-muted-foreground">{t.label}</div>
                <div className={`font-bold text-sm mt-0.5 ${i === tier ? 'text-[#006D5B]' : ''}`}>{t.badge}</div>
              </div>
            ))}
          </div>
          {/* Price per kit */}
          <div className="bg-[#F7F7F5] rounded-xl p-4">
            <p className="text-sm text-muted-foreground text-center mb-3">Precio estimado Kit Escritorio Pro ({qty} unidades)</p>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground line-through">${(19990 * qty).toLocaleString('es-CL')}</div>
                <div className="text-2xl font-bold text-[#006D5B]">${(calcPrice(19990, qty) * qty).toLocaleString('es-CL')}</div>
                <div className="text-xs text-muted-foreground">Total estimado</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Precio unitario</div>
                <div className="text-xl font-bold">${calcPrice(19990, qty).toLocaleString('es-CL')}</div>
                <div className="text-xs text-green-600">
                  {PRICE_TIERS[tier].discount > 0 ? `Ahorro: ${PRICE_TIERS[tier].discount}%` : 'Personalización gratis'}
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <Link to={`/b2b/contacto?qty=${qty}`}>
              <Button className="gap-2" style={{ backgroundColor: '#006D5B' }}>
                Solicitar cotización formal para {qty} unidades
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Catálogo productos */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-poppins">Catálogo completo</h2>
          <p className="text-muted-foreground mt-1">Todos incluyen personalización láser UV con tu logo</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {KITS.map(kit => (
            <div
              key={kit.id}
              className={`bg-white rounded-xl border-2 overflow-hidden hover:shadow-md transition-shadow ${
                kit.destacado ? 'border-[#006D5B]' : 'border-border'
              }`}
            >
              {kit.destacado && (
                <div className="bg-[#006D5B] text-white text-center text-xs py-1.5 font-semibold">
                  ⭐ PRODUCTO ESTRELLA
                </div>
              )}
              {/* Image area */}
              <div
                className="h-36 flex items-center justify-center text-5xl"
                style={{ background: kit.destacado ? 'linear-gradient(135deg, #006D5B20, #006D5B10)' : '#F7F7F5' }}
              >
                {kit.emoji}
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold font-poppins">{kit.nombre}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{kit.descripcion}</p>
                </div>
                {/* Incluye */}
                <div className="space-y-1">
                  {kit.piezas.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-[#006D5B] shrink-0" />
                      {p}
                    </div>
                  ))}
                </div>
                {/* Precio */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Desde (10 u.)</div>
                      <div className="text-xl font-bold text-[#006D5B]">${kit.precio_base.toLocaleString('es-CL')}</div>
                      <div className="text-xs text-muted-foreground">c/u · Personalización incluida</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 font-medium">100+ u. → -8%</div>
                      <div className="text-xs text-green-700 font-medium">500+ u. → -25%</div>
                    </div>
                  </div>
                </div>
                <Link to={`/b2b/contacto?productoId=${kit.id}&nombre=${encodeURIComponent(kit.nombre)}`}>
                  <Button className="w-full gap-2 mt-1" style={{ backgroundColor: '#006D5B' }} size="sm">
                    <Package className="w-4 h-4" />
                    Solicitar cotización
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof + CTA final */}
      <div className="bg-[#0F172A] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center text-white space-y-4">
          <h3 className="text-2xl font-bold font-poppins">¿Listo para cotizar?</h3>
          <p className="text-white/60">Recibe propuesta formal con mockup de tu logo en menos de 24 horas.</p>
          <div className="flex flex-wrap justify-center gap-4 py-3">
            {['Adidas', 'Nestlé', 'BancoEstado', 'DUOC UC', 'UAI'].map(c => (
              <span key={c} className="bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full">{c}</span>
            ))}
          </div>
          <Link to="/b2b/contacto">
            <Button size="lg" className="gap-2 bg-white text-[#006D5B] hover:bg-white/90 font-bold mt-2">
              <Building2 className="w-5 h-5" />
              Solicitar cotización corporativa →
            </Button>
          </Link>
        </div>
      </div>

      <WhatsAppWidget context="b2b" />
    </div>
  );
}