import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProductImage } from '@/utils/productImages';
import {
  ArrowLeft, Check, Building2, ShoppingCart, Shield, Truck, Zap,
  Star, Recycle, Sparkles, ChevronRight, Heart, Share2,
  RotateCcw, BadgeCheck, Copy, X, Gift
} from 'lucide-react';
import MockupGenerator from '@/components/MockupGenerator';
import { saveMockupDraft } from '@/lib/mockup-draft';
import { getColoresProducto } from '@/lib/color-parser';
import { getPackSize } from '@/lib/pack-parser';
import PackColorPicker from '@/components/producto/PackColorPicker';
import GiftCardVisual from '@/components/giftcard/GiftCardVisual';
import ImpactoAmbientalProducto from '@/components/producto/ImpactoAmbientalProducto';
import FrequentlyBoughtTogether from '@/components/bundles/FrequentlyBoughtTogether';
import { getTipoMaterial } from '@/lib/impacto-ambiental';
import SEO from '@/components/SEO';
import { buildOrganizationSchema, buildProductSchema, buildBreadcrumbSchema, combineSchemas } from '@/lib/schemas-peyu';
import { trackAddToCart } from '@/lib/analytics-peyu';
import { track } from '@/lib/activity-tracker';


// Los colores ahora se extraen dinámicamente desde la descripción del producto
// vía `getColoresProducto` (lib/color-parser).
const getColores = getColoresProducto;

const REVIEWS_MOCK = [
  { autor: 'Martina G.', ciudad: 'Providencia', rating: 5, txt: 'Calidad increíble. El marmolado es único, exactamente como en la foto.', fecha: 'Hace 3 días', verificado: true },
  { autor: 'Rodrigo T.', ciudad: 'Las Condes', rating: 5, txt: 'El grabado láser quedó perfecto. Lo regalé en el aniversario de la empresa y todos lo amaron.', fecha: 'Hace 1 semana', verificado: true },
  { autor: 'Carolina V.', ciudad: 'Ñuñoa', rating: 4, txt: 'Muy buen producto. Llegó antes de lo esperado y en embalaje impecable.', fecha: 'Hace 2 semanas', verificado: true },
];

const GARANTIAS = [
  { icon: Shield, label: 'Garantía 10 años', sub: 'En plástico reciclado', color: '#2dd4bf' },
  { icon: Truck, label: 'Envío a todo Chile', sub: 'Gratis sobre $40.000', color: '#60a5fa' },
  { icon: RotateCcw, label: '30 días devolución', sub: 'Sin preguntas', color: '#fb923c' },
  { icon: BadgeCheck, label: 'Hecho en Chile', sub: 'Fábrica Santiago', color: '#34d399' },
];

const SKU_IMAGES_ALT = {
  'CARC-AIRP-12':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/amarillo.webp?fit=600%2C600&ssl=1',
  'CARC-IP16E':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/photoroom_20250605_115909.jpeg?fit=600%2C600&ssl=1',
  'CARC-HW-P30':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-Huawei-p30-Biodegradable-rosa.webp?fit=600%2C600&ssl=1',
  'CARC-HW-P30L':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-Huawei-p30-lite-Biodegradable-turquesa.webp?fit=600%2C600&ssl=1',
  'CARC-IP11':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-11-Biodegradable-nuevo-rosa.webp?fit=600%2C600&ssl=1',
  'CARC-IP13':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-Biodegradable-azul.webp?fit=600%2C600&ssl=1',
  'CARC-IP13M':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-mini-Biodegradable-turquesa-1.webp?fit=600%2C600&ssl=1',
  'CARC-IP13P':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/aasasas.webp?fit=600%2C600&ssl=1',
  'CARC-IP13PM':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-pro-Max-Biodegradable-azul.webp?fit=600%2C600&ssl=1',
  'CARC-IP14':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-amarillo.webp?fit=600%2C600&ssl=1',
  'CARC-IP14PL':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-Plus-azul.webp?fit=600%2C600&ssl=1',
  'CARC-IP14P':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-amarillo.webp?fit=600%2C600&ssl=1',
  'CARC-IP14PM':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-Max-biodegradable-negro.webp?fit=600%2C600&ssl=1',
  'CARC-IP15PM':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-Max-biodegradable-negro.webp?fit=600%2C600&ssl=1',
  'CARC-IP16':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/i16-turquesa.jpg?fit=600%2C600&ssl=1',
  'CARC-IP16PL':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/i16-plus-amarillo.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH4TT':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/44.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH4':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/4.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH5':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/5-2.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH5TT':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/55-2.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH6':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/6-1.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH6TT':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/66.jpg?fit=600%2C600&ssl=1',
  'ENT-JENGA':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2026/03/jenga.jpg?fit=600%2C600&ssl=1',
  'HOG-LAMP':      'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/lampara-2.webp?fit=600%2C600&ssl=1',
  'HOG-MACE-XL':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/bowlcoverst-Photoroom.jpg?fit=600%2C600&ssl=1',
  'HOG-CUADRO2':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/image00008-scaled-1.jpeg?fit=600%2C600&ssl=1',
  'HOG-CUADRO1':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/frontrettor-Photoroom.jpg?fit=600%2C600&ssl=1',
};

// Decodifica entidades HTML comunes (&#8220; &#8221; &amp; &nbsp; etc.) y limpia
// caracteres invisibles que algunos productos importados desde WooCommerce traen.
function cleanDescripcion(raw) {
  if (!raw) return '';
  return raw
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[⭐🌾]/g, '')
    .replace(/\uFFFD/g, '')        // replacement char � (encoding roto)
    .replace(/[\u0000-\u001F\u007F]/g, ' ') // caracteres de control invisibles
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parsea descripción tipo "✓ ítem 1\n✓ ítem 2" en { intro, bullets[] }
function parseGiftCardDescription(raw) {
  const clean = cleanDescripcion(raw);
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  const intro = [];
  const bullets = [];
  const outro = [];
  let foundBullets = false;
  let bulletsDone = false;
  for (const line of lines) {
    if (/^[✓✔•·\-]/.test(line)) {
      foundBullets = true;
      bullets.push(line.replace(/^[✓✔•·\-]\s*/, ''));
    } else if (!foundBullets) {
      intro.push(line);
    } else {
      bulletsDone = true;
      outro.push(line);
    }
  }
  return { intro: intro.join(' '), bullets, outro: outro.join(' ') };
}

function getPrecioVolumen(producto, cantidad) {
  if (!producto) return null;
  if (cantidad >= 500 && producto.precio_500_mas) return { precio: producto.precio_500_mas, label: '500+ u.' };
  if (cantidad >= 200 && producto.precio_200_499) return { precio: producto.precio_200_499, label: '200–499 u.' };
  if (cantidad >= 50 && producto.precio_50_199) return { precio: producto.precio_50_199, label: '50–199 u.' };
  if (cantidad >= 10 && producto.precio_base_b2b) return { precio: producto.precio_base_b2b, label: 'Base B2B' };
  return null;
}

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ctaRef = useRef(null);
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [cantidad, setCantidad] = useState(1);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [coloresPack, setColoresPack] = useState([]); // multi-color para packs
  const [personalizacion, setPersonalizacion] = useState('');
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregado, setAgregado] = useState(false);
  const [vistaActiva, setVistaActiva] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [showB2BTable, setShowB2BTable] = useState(false);
  const [tabActiva, setTabActiva] = useState('descripcion');
  const [mockupOpen, setMockupOpen] = useState(false);
  const [mockupGenerado, setMockupGenerado] = useState('');

  useEffect(() => {
    // Scroll al tope cuando cambiamos de producto (al hacer clic en relacionados).
    // El layout usa un wrapper con `overflow-auto`, así que scrollean ambos.
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.querySelectorAll('.overflow-auto, .overflow-y-auto').forEach(el => {
      if (el.scrollTop > 0) el.scrollTop = 0;
    });

    base44.entities.Producto.list().then(data => {
      const prod = data.find(p => p.id === id);
      setProducto(prod);
      if (prod) {
        // Trazabilidad 360°: registrar product view
        track.productView(prod);
        const colores = getColores(prod);
        const firstId = colores[0]?.id || null;
        setColorSeleccionado(firstId);
        // Si es pack, inicializamos array con N copias del primer color
        const packN = getPackSize(prod);
        if (packN && firstId) {
          setColoresPack(Array.from({ length: packN }, () => firstId));
        } else {
          setColoresPack([]);
        }
        setRelacionados(data.filter(p => p.id !== id && p.canal !== 'B2B Exclusivo' && p.categoria === prod.categoria).slice(0, 4));
      }
    });
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (ctaRef.current) setShowStickyBar(ctaRef.current.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const precioFinal = producto ? Math.floor((producto.precio_b2c || 9990) * 0.85) : 0;
  const ahorro = producto ? (producto.precio_b2c || 9990) - precioFinal : 0;
  const precioVolumen = getPrecioVolumen(producto, cantidad);
  const precioActual = precioVolumen ? precioVolumen.precio : precioFinal;

  const agregarAlCarrito = () => {
    // Resumen legible del pack para mostrar en carrito (ej. "2× Negro · 1× Verde")
    const packSummary = (packSize && coloresPack.length === packSize)
      ? (() => {
          const counts = {};
          coloresPack.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
          return Object.entries(counts)
            .map(([id, n]) => {
              const c = colores.find(x => x.id === id);
              return `${n}× ${c?.label || id}`;
            })
            .join(' · ');
        })()
      : null;

    const item = {
      id: Math.random(), productoId: producto.id, sku: producto.sku, nombre: producto.nombre,
      precio: precioActual, cantidad,
      color: packSize ? null : (colorSeleccionado || null),
      colores_pack: packSize ? coloresPack : null,
      pack_resumen: packSummary,
      personalizacion: personalizacion || null,
      imagen: getProductImage(producto),
    };
    const nuevo = [...carrito, item];
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
    setAgregado(true);
    // 📊 Funnel event: add_to_cart (GA4)
    trackAddToCart({ ...item, sku: producto.sku, categoria: producto.categoria });
    // Trazabilidad 360°: add_to_cart en ActivityLog
    track.addToCart({ ...item, sku: producto.sku, id: producto.id });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Mira este producto sustentable de PEYU Chile: ${producto?.nombre}`;
    if (navigator.share) {
      try { await navigator.share({ title: producto?.nombre, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg('¡Enlace copiado!');
      setTimeout(() => setShareMsg(''), 2500);
    }
  };

  const imgPrincipal = producto ? getProductImage(producto) : '';
  const imgAlterna = producto ? (SKU_IMAGES_ALT[producto.sku] || imgPrincipal) : '';
  // Galería: imagen principal + alterna (si difiere) + imágenes de la galería
  // del producto (de WooCommerce) sin duplicados.
  const galeria = producto
    ? Array.from(new Set([
        imgPrincipal,
        imgAlterna !== imgPrincipal ? imgAlterna : null,
        ...(Array.isArray(producto.galeria_urls) ? producto.galeria_urls : []),
      ].filter(Boolean)))
    : [];

  if (!producto) return (
    <div className="flex-1 flex items-center justify-center py-20 ld-canvas min-h-screen">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--ld-border)', borderTopColor: 'var(--ld-action)' }} />
        <p className="text-ld-fg-muted text-sm font-medium">Cargando producto...</p>
      </div>
    </div>
  );

  const colores = getColores(producto);
  const packSize = getPackSize(producto); // null si no es pack

  // ── Detección de Gift Card ────────────────────────────────────────
  // Si el producto es una giftcard (por categoría, sku o nombre), mostramos
  // el visual oficial PEYU en lugar de imagen genérica + UI específica.
  const isGiftCard = (
    producto.categoria === 'Gift Card' ||
    /gift\s*card/i.test(producto.nombre || '') ||
    /^GC-/i.test(producto.sku || '')
  );
  // Para giftcards, mapeamos el precio al monto más cercano de la línea oficial
  const giftCardMonto = isGiftCard
    ? [10000, 20000, 50000, 100000].reduce((prev, curr) =>
        Math.abs(curr - precioFinal) < Math.abs(prev - precioFinal) ? curr : prev, 20000)
    : null;

  // SEO: schema.org Product + Breadcrumb + Organization en un solo @graph
  const canonicalUrl = `https://peyuchile.cl/producto/${producto.id}`;
  const productImageForSeo = imgPrincipal;
  // Galería deduplicada para schema (Google premia múltiples imágenes)
  const seoImages = Array.from(new Set([imgPrincipal, imgAlterna].filter(Boolean)));
  const productJsonLd = combineSchemas(
    buildOrganizationSchema(),
    buildBreadcrumbSchema([
      { name: 'Inicio', url: 'https://peyuchile.cl/' },
      { name: 'Tienda', url: 'https://peyuchile.cl/shop' },
      { name: producto.categoria, url: `https://peyuchile.cl/shop?cat=${encodeURIComponent(producto.categoria || '')}` },
      { name: producto.nombre, url: canonicalUrl },
    ]),
    buildProductSchema({
      ...producto,
      images: seoImages,
      imagen_url: productImageForSeo,
      precio_final: precioFinal,
      canonicalUrl,
      rating: { value: 5.0, count: 127 },
    }),
  );

  // ── Título y descripción dinámicos ─────────────────────────────────
  // Estructura: "{Nombre} {Categoría} {Material} | PEYU Chile" (~60 chars)
  const materialCorto = producto.material?.includes('100%')
    ? '100% Reciclado'
    : producto.material?.includes('Trigo')
      ? 'Compostable'
      : 'Sustentable';
  const seoTitleRaw = `${producto.nombre} · ${materialCorto} · $${precioFinal.toLocaleString('es-CL')} | PEYU Chile`;
  const seoTitle = seoTitleRaw.length > 65
    ? `${producto.nombre} · ${materialCorto} | PEYU Chile`.slice(0, 65)
    : seoTitleRaw;

  // Descripción: incluye material, precio, lead time, personalización y origen
  const descripcionLimpia = producto.descripcion?.replace(/[⭐🌾✨💚🇨🇱♻️]/g, '').trim();
  const stockHint = producto.stock_actual > 0 ? '✓ Stock disponible. ' : '';
  const personalizacionHint = producto.moq_personalizacion
    ? `Personalización láser UV gratis desde ${producto.moq_personalizacion} u. `
    : '';
  const seoDescriptionRaw = descripcionLimpia
    ? `${descripcionLimpia.slice(0, 90)}. ${materialCorto}, hecho en Chile. ${stockHint}${personalizacionHint}Envío gratis sobre $40.000.`
    : `${producto.nombre}: ${materialCorto.toLowerCase()}, fabricado en Chile. Desde $${precioFinal.toLocaleString('es-CL')}. ${personalizacionHint}${stockHint}Garantía ${producto.garantia_anios || 10} años. Envío a todo el país.`;
  const seoDescription = seoDescriptionRaw.replace(/\s+/g, ' ').trim().slice(0, 160);

  return (
    <>
    <SEO
      title={seoTitle}
      description={seoDescription}
      canonical={canonicalUrl}
      image={productImageForSeo}
      type="product"
      jsonLd={productJsonLd}
      product={{
        price: precioFinal,
        currency: 'CLP',
        availability: producto.stock_actual === 0 ? 'out of stock'
          : producto.stock_actual <= 5 ? 'limited availability'
          : 'in stock',
        condition: 'new',
        brand: 'PEYU',
        sku: producto.sku,
        category: producto.categoria,
        retailerItemId: producto.sku,
      }}
    />
    <div className="flex-1 overflow-auto font-inter ld-canvas min-h-screen">

        {/* STICKY CTA BAR */}
        <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${showStickyBar ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="ld-glass-strong border-b border-ld-border shadow-2xl">
            <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img src={imgPrincipal} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-ld-border" />
                <p className="font-semibold text-sm text-ld-fg truncate">{producto.nombre}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="font-poppins font-bold text-ld-fg">${precioActual.toLocaleString('es-CL')}</p>
                {agregado ? (
                  <Link to="/cart">
                    <Button size="sm" className="ld-btn-primary gap-2 rounded-full">
                      <ShoppingCart className="w-4 h-4" /> Ver carrito
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={agregarAlCarrito} size="sm" className="ld-btn-primary gap-2 rounded-full">
                    <ShoppingCart className="w-4 h-4" /> Agregar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div className="ld-glass-strong border-b border-ld-border px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 ld-btn-ghost rounded-xl flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-ld-fg" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-sm" style={{ background: 'var(--ld-grad-action)' }}>P</div>
              <span className="font-poppins font-bold text-sm text-ld-fg hidden sm:inline">PEYU Chile</span>
            </Link>
          </div>
          <Link to="/cart" className="relative">
            <Button size="sm" className="ld-btn-primary gap-2 rounded-full">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Carrito</span>
              {carrito.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow ring-2" style={{ background: 'var(--ld-highlight)', borderColor: 'var(--ld-bg)' }}>
                  {carrito.length}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {/* Breadcrumb */}
        <nav aria-label="Migas de pan" className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-xs text-ld-fg-muted">
          <Link to="/" className="hover:text-ld-fg transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <Link to="/shop" className="hover:text-ld-fg transition-colors">Tienda</Link>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span>{producto.categoria}</span>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span className="text-ld-fg font-medium truncate max-w-[200px]" aria-current="page">{producto.nombre}</span>
        </nav>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-10">

          {/* MAIN GRID — más denso, columna info más estrecha */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-5 lg:gap-7">

            {/* LEFT: GALERÍA */}
            <div className="space-y-3">
              {/* Main visual: GiftCard oficial o imagen del producto */}
              {isGiftCard ? (
                <div className="space-y-4">
                  <div className="ld-card p-4 sm:p-6 shadow-2xl">
                    <GiftCardVisual monto={giftCardMonto} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { e: '⚡', t: 'Entrega instantánea', s: 'Email en segundos' },
                      { e: '♻️', t: 'Sin impresión', s: 'Digital, cero residuos' },
                      { e: '📅', t: 'Vigencia 12 meses', s: 'Sin apuros' },
                    ].map((b, i) => (
                      <div key={i} className="ld-glass rounded-2xl p-3 text-center">
                        <div className="text-2xl mb-1">{b.e}</div>
                        <div className="text-[11px] font-bold text-ld-fg leading-tight">{b.t}</div>
                        <div className="text-[10px] text-ld-fg-muted mt-0.5">{b.s}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
              <div className="relative ld-card overflow-hidden shadow-xl mx-auto w-full max-w-[460px] lg:max-w-none bg-white" style={{ aspectRatio: '1' }}>
                <img
                  src={galeria[vistaActiva] || imgPrincipal}
                  alt={`${producto.nombre} · ${producto.material || 'Plástico reciclado'} · ${producto.categoria} · PEYU Chile`}
                  width="600"
                  height="600"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500"
                  onError={e => {
                    if (e.target.src !== imgPrincipal && imgPrincipal) {
                      e.target.src = imgPrincipal;
                    } else {
                      e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1';
                    }
                  }}
                />
                {vistaActiva === 3 && personalizacion && (
                  <div className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none">
                    <div className="bg-gray-900/75 backdrop-blur text-yellow-400 text-sm font-bold tracking-[0.2em] px-5 py-2 rounded-xl border border-yellow-400/30"
                      style={{ textShadow: '0 0 12px rgba(212,175,55,0.6)', fontFamily: 'monospace' }}>
                      {personalizacion.toUpperCase()}
                    </div>
                  </div>
                )}
                {/* Material badge */}
                <div className="absolute top-4 left-4">
                  <span className="ld-glass-strong inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-ld-fg shadow">
                    <Recycle className="w-3 h-3" style={{ color: 'var(--ld-action)' }} />
                    {producto.material?.includes('100%') ? '100% Reciclado' : 'Compostable'}
                  </span>
                </div>
                {/* Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button onClick={() => setWishlist(!wishlist)}
                    className="w-9 h-9 ld-glass-strong rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                    <Heart className={`w-4 h-4 transition-colors ${wishlist ? 'fill-red-500 text-red-500' : 'text-ld-fg-muted'}`} />
                  </button>
                  <button onClick={handleShare}
                    className="w-9 h-9 ld-glass-strong rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                    {shareMsg ? <Check className="w-4 h-4" style={{ color: 'var(--ld-action)' }} /> : <Share2 className="w-4 h-4 text-ld-fg-muted" />}
                  </button>
                </div>
                {shareMsg && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 ld-glass-strong text-ld-fg text-xs font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
                    <Copy className="w-3 h-3" /> {shareMsg}
                  </div>
                )}
              </div>
              )}

              {/* Thumbnails */}
              {!isGiftCard && galeria.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {galeria.slice(0, 4).map((img, i) => (
                  <button key={`${img}-${i}`} onClick={() => setVistaActiva(i)}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all bg-white ${vistaActiva === i ? 'shadow-lg scale-[1.03]' : 'opacity-70 hover:opacity-100'}`}
                    style={{ borderColor: vistaActiva === i ? 'var(--ld-action)' : 'var(--ld-border)' }}>
                    <img
                      src={img}
                      alt={`${producto.nombre} - vista ${i + 1}`}
                      width="150"
                      height="150"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={e => { if (e.target.src !== imgPrincipal && imgPrincipal) e.target.src = imgPrincipal; }}
                    />
                  </button>
                ))}
              </div>
              )}

              {/* Sustainability story / Cómo funciona la GiftCard */}
              {isGiftCard ? (
                <div className="ld-card p-6 space-y-4 shadow-xl mt-6 relative overflow-hidden">
                  <div aria-hidden className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--ld-action-soft)', opacity: 0.5 }} />
                  <div className="relative flex items-center gap-2">
                    <Gift className="w-5 h-5" style={{ color: 'var(--ld-action)' }} />
                    <h3 className="font-poppins font-bold text-sm text-ld-fg">¿Cómo funciona?</h3>
                  </div>
                  <ol className="relative space-y-2.5 text-sm text-ld-fg-soft">
                    {[
                      <><strong className="text-ld-fg">Compras la Gift Card</strong> con el monto que quieras</>,
                      <>Le <strong className="text-ld-fg">enviamos un email</strong> al destinatario con el código y tu mensaje</>,
                      <>Canjea el código en <strong className="text-ld-fg">peyuchile.cl/canjear</strong> o en el checkout</>,
                    ].map((content, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--ld-grad-action)' }}>{i + 1}</span>
                        <span>{content}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="relative flex gap-4 pt-2 flex-wrap border-t border-ld-border">
                    {[['⚡', 'Entrega instantánea'], ['📅', 'Válida 12 meses'], ['♻️', 'Sin plástico ni papel']].map(([e, l]) => (
                      <div key={l} className="flex items-center gap-1.5 text-xs text-ld-fg-muted pt-2">
                        <span>{e}</span><span>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                (() => {
                  const tipo = getTipoMaterial(producto);
                  const isFibra = tipo === 'fibra_trigo';
                  return (
                  <div className="ld-card p-6 space-y-3 shadow-xl mt-6 relative overflow-hidden">
                    <div aria-hidden className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: isFibra ? 'var(--ld-highlight-soft)' : 'var(--ld-action-soft)', opacity: 0.5 }} />
                    <div className="relative flex items-center gap-2">
                      <span className="text-xl">{isFibra ? '🌾' : '♻️'}</span>
                      <h3 className="font-poppins font-bold text-sm text-ld-fg">
                        {isFibra ? 'Nacida del trigo, devuelta a la tierra' : 'Plástico chileno con segunda vida'}
                      </h3>
                    </div>
                    <p className="relative text-ld-fg-soft text-sm leading-relaxed">
                      {isFibra
                        ? 'Esta carcasa está hecha con paja de trigo: el residuo agrícola que tradicionalmente se quema en el campo y contamina el aire. La valorizamos en un biocomposite duradero que protege tu equipo igual que una carcasa convencional, pero al final de su vida útil se composta en 90-180 días sin dejar microplásticos. Cada unidad evita ~2.4 kg de CO₂ frente a una carcasa de policarbonato virgen.'
                        : 'Este producto se fabrica con plástico post-consumo recolectado en Santiago — botellas, tapas y envases que iban al vertedero o al mar. Cada pieza es única: el marmolado nace del proceso de inyección artesanal con materiales reciclados mezclados a mano. Cada unidad rescata ~30 g de plástico y evita ~2.1 kg de CO₂.'}
                    </p>
                    <div className="relative flex gap-4 pt-1 flex-wrap">
                      {(isFibra
                        ? [['🌾', 'Paja valorizada'], ['🌱', 'Compostable'], ['🇨🇱', 'Hecho en Chile']]
                        : [['♻️', '100% Reciclado'], ['🛡️', '10 años garantía'], ['🇨🇱', 'Hecho en Chile']]
                      ).map(([e, l]) => (
                        <div key={l} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: isFibra ? 'var(--ld-highlight)' : 'var(--ld-action)' }}>
                          <span>{e}</span><span>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })()
              )}
            </div>

            {/* RIGHT: INFO + CTA */}
            <div className="space-y-3.5 lg:sticky lg:top-20 lg:self-start">

              {/* Header */}
              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>{producto.categoria}</span>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-mono ld-glass-soft text-ld-fg-muted border border-ld-border">{producto.sku}</span>
                  {producto.stock_actual !== undefined && producto.stock_actual <= 5 && producto.stock_actual > 0 && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold animate-pulse" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>⚡ Últimas {producto.stock_actual} u.</span>
                  )}
                </div>
                <h1 className="ld-display text-3xl lg:text-4xl text-ld-fg leading-tight mb-2">{producto.nombre}</h1>
                {producto.descripcion && (
                  isGiftCard ? (
                    (() => {
                      const { intro, bullets, outro } = parseGiftCardDescription(producto.descripcion);
                      return (
                        <div className="space-y-2.5 mt-2">
                          {intro && <p className="text-sm text-ld-fg-soft leading-relaxed">{intro}</p>}
                          {bullets.length > 0 && (
                            <ul className="space-y-1.5">
                              {bullets.map((b, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-ld-fg-soft">
                                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ld-action)' }} />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {outro && <p className="text-xs text-ld-fg-muted leading-relaxed pt-1">{outro}</p>}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-ld-fg-soft leading-relaxed whitespace-pre-line">{cleanDescripcion(producto.descripcion)}</p>
                  )
                )}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <span className="text-sm font-bold text-ld-fg">5.0</span>
                  <span className="text-xs text-ld-fg-muted">· 127 reseñas verificadas</span>
                </div>
              </div>

              {/* Precio */}
              <div className="ld-card p-4 shadow-lg space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {precioVolumen ? (
                      <>
                        <p className="text-[10px] font-bold mb-0.5 uppercase tracking-wider" style={{ color: 'var(--ld-highlight)' }}>Precio volumen ({precioVolumen.label})</p>
                        <p className="ld-display text-4xl text-ld-fg leading-none">${precioVolumen.precio.toLocaleString('es-CL')}</p>
                        <p className="text-[10px] text-ld-fg-muted mt-1">por unidad · IVA incluido</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-ld-fg-muted line-through">${(producto.precio_b2c || 9990).toLocaleString('es-CL')}</p>
                        <p className="ld-display text-4xl text-ld-fg leading-none">${precioFinal.toLocaleString('es-CL')}</p>
                        <p className="text-[10px] text-ld-fg-muted mt-1">IVA incluido</p>
                      </>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    {!precioVolumen && <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>−15% online</span>}
                    {!precioVolumen && <p className="text-[10px] font-semibold" style={{ color: 'var(--ld-action)' }}>Ahorras ${ahorro.toLocaleString('es-CL')}</p>}
                    {precioVolumen && <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>Precio B2B</span>}
                  </div>
                </div>
                {precioFinal * cantidad < 40000 && !precioVolumen && (
                  <div className="flex items-center gap-2 text-xs font-semibold rounded-xl p-2.5" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>
                    <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                    Agrega ${(40000 - precioFinal * cantidad).toLocaleString('es-CL')} más para envío gratis
                  </div>
                )}
                {(producto.precio_50_199 || producto.precio_base_b2b) && (
                  <button onClick={() => setShowB2BTable(!showB2BTable)}
                    className="text-xs font-bold flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: 'var(--ld-action)' }}>
                    <Sparkles className="w-3 h-3" />
                    {showB2BTable ? 'Ocultar' : 'Ver'} precios por volumen B2B
                    <ChevronRight className={`w-3 h-3 transition-transform ${showB2BTable ? 'rotate-90' : ''}`} />
                  </button>
                )}
                {showB2BTable && (
                  <div className="rounded-xl overflow-hidden border border-ld-border ld-glass-soft">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: 'var(--ld-action-soft)' }}>
                          <th className="px-3 py-2 text-left font-bold text-ld-fg">Cantidad</th>
                          <th className="px-3 py-2 text-right font-bold text-ld-fg">Precio/u</th>
                          <th className="px-3 py-2 text-right font-bold text-ld-fg">Descuento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ld-border">
                        {[
                          { label: '1–9 u.', precio: precioFinal, base: true },
                          producto.precio_base_b2b && { label: '10–49 u.', precio: producto.precio_base_b2b },
                          producto.precio_50_199 && { label: '50–199 u.', precio: producto.precio_50_199 },
                          producto.precio_200_499 && { label: '200–499 u.', precio: producto.precio_200_499 },
                          producto.precio_500_mas && { label: '500+ u.', precio: producto.precio_500_mas },
                        ].filter(Boolean).map((tier, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-semibold text-ld-fg-soft">{tier.label}</td>
                            <td className="px-3 py-2 text-right font-bold text-ld-fg">${tier.precio.toLocaleString('es-CL')}</td>
                            <td className="px-3 py-2 text-right font-bold" style={{ color: 'var(--ld-action)' }}>
                              {i === 0 ? '—' : `−${Math.round((1 - tier.precio / (producto.precio_b2c || 9990)) * 100)}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[10px] text-ld-fg-muted px-3 py-2">* Personalización láser UV gratis desde {producto.moq_personalizacion || 10} u.</p>
                  </div>
                )}
              </div>

              {/* Color selector — Pack: por unidad / Normal: color global */}
              {!isGiftCard && colores.length > 0 && (
                packSize ? (
                  <PackColorPicker
                    packSize={packSize}
                    colores={colores}
                    value={coloresPack}
                    onChange={setColoresPack}
                  />
                ) : (
                  <div>
                    <label className="text-sm font-bold text-ld-fg mb-2.5 block">
                      Color: <span className="font-normal text-ld-fg-muted">{colores.find(c => c.id === colorSeleccionado)?.label || ''}</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {colores.map(c => (
                        <button key={c.id} onClick={() => setColorSeleccionado(c.id)}
                          title={c.label}
                          className="w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 shadow-md"
                          style={{ backgroundColor: c.hex, borderColor: colorSeleccionado === c.id ? 'var(--ld-action)' : 'var(--ld-border)', boxShadow: colorSeleccionado === c.id ? '0 0 0 3px var(--ld-action-soft)' : undefined }}>
                          {colorSeleccionado === c.id && <Check className="w-4 h-4 text-white mx-auto drop-shadow" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Cantidad */}
              <div>
                <label className="text-sm font-bold text-ld-fg mb-2 block">Cantidad</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center ld-card overflow-hidden">
                    <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      className="w-11 h-11 hover:bg-ld-bg-soft font-bold text-xl text-ld-fg transition-colors flex items-center justify-center">−</button>
                    <input
                      type="number" min="1" value={cantidad}
                      onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 h-11 text-center font-bold text-ld-fg border-x border-ld-border focus:outline-none text-sm bg-transparent" />
                    <button onClick={() => setCantidad(cantidad + 1)}
                      className="w-11 h-11 hover:bg-ld-bg-soft font-bold text-xl text-ld-fg transition-colors flex items-center justify-center">+</button>
                  </div>
                  {cantidad >= 500 && producto.precio_500_mas && (
                    <span className="text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>
                      <Sparkles className="w-3 h-3" /> Máximo descuento
                    </span>
                  )}
                  {cantidad >= 200 && cantidad < 500 && producto.precio_200_499 && (
                    <span className="text-xs font-bold px-3 py-2 rounded-xl" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>−{Math.round((1 - producto.precio_200_499 / (producto.precio_b2c || 9990)) * 100)}% vol.</span>
                  )}
                  {cantidad >= 50 && cantidad < 200 && producto.precio_50_199 && (
                    <span className="text-xs font-bold px-3 py-2 rounded-xl" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>−{Math.round((1 - producto.precio_50_199 / (producto.precio_b2c || 9990)) * 100)}% vol.</span>
                  )}
                  {cantidad >= 10 && cantidad < 50 && (
                    <span className="text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>
                      <Sparkles className="w-3 h-3" /> Láser gratis
                    </span>
                  )}
                </div>
                <p className="text-xs text-ld-fg-muted mt-2">Total: <span className="font-bold text-ld-fg">${(precioActual * cantidad).toLocaleString('es-CL')}</span></p>
              </div>

              {/* Personalización — no aplicable a giftcards */}
              {!isGiftCard && producto.moq_personalizacion && (
                <div className="ld-card p-4 space-y-3" style={{ background: 'var(--ld-highlight-soft)' }}>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-ld-fg flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: 'var(--ld-highlight)' }} /> Personalización láser UV
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--ld-highlight)' }}>
                      GRATIS desde {producto.moq_personalizacion} u.
                    </span>
                  </div>
                  <Input value={personalizacion} onChange={e => setPersonalizacion(e.target.value.slice(0, 25))}
                    placeholder="Tu nombre, logo, frase favorita..."
                    className="ld-input text-sm rounded-xl h-11 font-medium tracking-wide bg-ld-bg text-ld-fg placeholder:text-ld-fg-muted" />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-ld-fg-soft">Área: {producto.area_laser_mm || '40×25mm'} · Grabado permanente</p>
                    <div className="flex items-center gap-2">
                      {personalizacion && (
                        <button onClick={() => setPersonalizacion('')} className="text-ld-fg-muted hover:text-ld-fg">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-xs font-bold" style={{ color: personalizacion.length >= 22 ? 'var(--ld-highlight)' : 'var(--ld-fg-muted)' }}>{personalizacion.length}/25</span>
                    </div>
                  </div>
                  {personalizacion && (
                    <div className="rounded-xl px-4 py-2 text-center bg-slate-900 border border-yellow-500/40">
                      <p className="font-bold tracking-[0.2em] text-sm text-yellow-400" style={{ fontFamily: 'monospace' }}>{personalizacion.toUpperCase()}</p>
                      <p className="text-white/40 text-[9px] mt-0.5">Preview del grabado láser</p>
                    </div>
                  )}

                  {/* Mockup IA real */}
                  <button
                    type="button"
                    onClick={() => setMockupOpen(true)}
                    className="ld-btn-primary w-full flex items-center justify-center gap-2 text-xs font-bold rounded-xl py-2.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {mockupGenerado ? 'Regenerar mockup con IA' : 'Probar mi mockup realista con IA'}
                  </button>

                  {mockupGenerado && (
                    <div className="rounded-xl overflow-hidden border border-ld-border bg-white">
                      <img src={mockupGenerado} alt="Mockup generado" className="w-full h-auto" />
                      <p className="text-[10px] text-ld-fg-muted text-center py-1.5" style={{ background: 'var(--ld-action-soft)' }}>✨ Mockup generado con IA · referencial</p>
                    </div>
                  )}
                </div>
              )}

              {/* CTAs — B2C funnel */}
              <div ref={ctaRef} className="space-y-2.5">
                {agregado ? (
                  <div className="space-y-2">
                    <div className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>
                      <Check className="w-4 h-4" />
                      <span>¡Producto agregado al carrito!</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/cart">
                        <Button size="sm" className="ld-btn-primary w-full h-10 rounded-xl font-semibold gap-2 text-xs">
                          <ShoppingCart className="w-3.5 h-3.5" /> Ir al carrito
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => setAgregado(false)}
                        className="ld-btn-ghost w-full h-10 rounded-xl text-ld-fg font-semibold text-xs">
                        Seguir comprando
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={agregarAlCarrito} size="lg"
                    className="ld-btn-primary w-full h-12 font-bold text-sm gap-2 rounded-xl hover:scale-[1.01] transition-all duration-200">
                    <ShoppingCart className="w-4 h-4" /> Agregar al carrito · ${(precioActual * cantidad).toLocaleString('es-CL')}
                  </Button>
                )}

                {/* B2B funnel */}
                {!isGiftCard && (
                <div className="ld-card p-4 space-y-3 relative overflow-hidden">
                  <div aria-hidden className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--ld-action-soft)', opacity: 0.6 }} />
                  <div className="relative flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ld-action)' }}>Canal Corporativo B2B</p>
                  </div>
                  <p className="relative text-xs text-ld-fg-soft leading-relaxed">
                    ¿Necesitas +10 unidades con tu logo? Cotización con mockup en menos de 24 horas. Precios por volumen y personalización láser gratis.
                  </p>
                  <div className="relative grid grid-cols-2 gap-2">
                    <Link
                      to={`/b2b/contacto?productoId=${producto.id}&nombre=${encodeURIComponent(producto.nombre || '')}${mockupGenerado ? '&mockup=1' : ''}${personalizacion ? `&texto=${encodeURIComponent(personalizacion)}` : ''}`}
                      onClick={() => {
                        if (mockupGenerado || personalizacion) {
                          saveMockupDraft({
                            productoId: producto.id,
                            productoNombre: producto.nombre,
                            productoSku: producto.sku,
                            productoCategoria: producto.categoria,
                            color: colores.find(c => c.id === colorSeleccionado)?.label || '',
                            texto: personalizacion || '',
                            mockupUrl: mockupGenerado || '',
                          });
                        }
                      }}
                    >
                      <Button size="sm" className="ld-btn-primary w-full font-bold gap-1.5 rounded-xl h-10 text-xs">
                        <Building2 className="w-3.5 h-3.5" /> Cotizar B2B
                      </Button>
                    </Link>
                    <a href={`https://wa.me/56933766573?text=${encodeURIComponent(`Hola, me interesa cotizar el producto: ${producto.nombre} (SKU: ${producto.sku}) para mi empresa`)}`}
                      target="_blank" rel="noreferrer" className="block">
                      <Button size="sm" className="ld-btn-ghost w-full font-bold gap-1.5 rounded-xl text-ld-fg h-10 text-xs">
                        💬 WhatsApp B2B
                      </Button>
                    </a>
                  </div>
                </div>
                )}

                {/* Atajo a flujo de regalo personalizado para gift cards */}
                {isGiftCard && (
                  <Link to="/regalar-giftcard" className="block">
                    <Button size="lg" className="ld-btn-primary w-full h-12 gap-2 rounded-2xl font-bold">
                      <Gift className="w-4 h-4" /> Regalar con mensaje personalizado
                    </Button>
                  </Link>
                )}
              </div>

              {/* Garantías */}
              <div className="grid grid-cols-4 gap-1.5">
                {GARANTIAS.map((g, i) => (
                  <div key={i} className="ld-card flex flex-col items-center gap-1 p-2 text-center">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ld-action-soft)' }}>
                      <g.icon className="w-3 h-3" style={{ color: 'var(--ld-action)' }} />
                    </div>
                    <p className="text-[9px] font-bold text-ld-fg leading-tight">{g.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="mt-9">
            <div className="flex gap-0 border-b border-ld-border mb-4 overflow-x-auto scrollbar-hide">
              {[
                { id: 'descripcion', label: 'Descripción' },
                { id: 'specs', label: 'Especificaciones' },
                { id: 'faq', label: 'Preguntas frecuentes' },
              ].map(t => (
                <button key={t.id} onClick={() => setTabActiva(t.id)}
                  className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
                  style={{
                    borderColor: tabActiva === t.id ? 'var(--ld-action)' : 'transparent',
                    color: tabActiva === t.id ? 'var(--ld-action)' : 'var(--ld-fg-muted)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {tabActiva === 'descripcion' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="ld-display text-2xl text-ld-fg">Sobre este producto</h3>
                  <p className="text-sm text-ld-fg-soft leading-relaxed whitespace-pre-line">
                    {cleanDescripcion(producto.descripcion) || `${producto.nombre} es un producto diseñado y fabricado en Chile con materiales ${producto.material?.includes('100%') ? '100% reciclados post-consumo' : 'compostables de fibra de trigo'}. Cada unidad es única gracias al proceso de inyección artesanal.`}
                  </p>
                  <ul className="space-y-2">
                    {[
                      `Material: ${producto.material}`,
                      `Garantía: ${producto.garantia_anios || 10} años`,
                      producto.area_laser_mm && `Área grabado láser: ${producto.area_laser_mm}`,
                      'Fabricado en Santiago, Chile',
                      'Compatible con personalización UV',
                    ].filter(Boolean).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ld-fg-soft">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ld-action)' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <ImpactoAmbientalProducto producto={producto} />
              </div>
            )}

            {tabActiva === 'specs' && (
              <div className="ld-card overflow-hidden max-w-lg">
                <div className="divide-y divide-ld-border">
                  {[
                    ['Material', producto.material],
                    ['Categoría', producto.categoria],
                    ['SKU', producto.sku],
                    ['Canal', producto.canal],
                    ['Garantía', `${producto.garantia_anios || 10} años`],
                    ['Lead time s/personalización', `${producto.lead_time_sin_personal || 7} días hábiles`],
                    ['Lead time c/personalización', `${producto.lead_time_con_personal || 9} días hábiles`],
                    producto.area_laser_mm && ['Área grabado UV', producto.area_laser_mm],
                    producto.moq_personalizacion && ['MOQ personalización', `${producto.moq_personalizacion} unidades`],
                    ['Stock actual', producto.stock_actual > 0 ? `${producto.stock_actual} u. disponibles` : 'Consultar disponibilidad'],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} className="px-5 py-3 flex items-center justify-between text-sm">
                      <span className="text-ld-fg-muted font-medium">{k}</span>
                      <span className="font-semibold text-ld-fg text-right max-w-[55%]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tabActiva === 'faq' && (
              <div className="space-y-3 max-w-2xl">
                {[
                  ['¿Cuánto demora el despacho?', `Sin personalización: ${producto.lead_time_sin_personal || 7} días hábiles. Con grabado láser UV: ${producto.lead_time_con_personal || 9} días hábiles. Todo Chile vía Starken, Chilexpress o BlueExpress.`],
                  ['¿Puedo personalizar con mi logo?', `Sí. Ofrecemos grabado láser UV permanente en área de ${producto.area_laser_mm || '40×25mm'}. Gratis desde ${producto.moq_personalizacion || 10} unidades.`],
                  ['¿El color marmolado es exactamente igual al de la foto?', 'El marmolado es un proceso artesanal, por lo que cada pieza tiene variaciones únicas. Los colores base son los mismos pero el patrón nunca se repite.'],
                  ['¿Qué pasa si el producto llega dañado?', 'Ofrecemos 30 días de devolución sin preguntas. Además, todos nuestros productos tienen garantía de 10 años contra defectos de fabricación.'],
                  ['¿Tienen precios especiales para empresas?', `Sí. Desde ${producto.moq_personalizacion || 10} unidades accedes a precios B2B. Desde 50 unidades, descuento adicional.`],
                ].map(([q, a], i) => (
                  <details key={i} className="group ld-card overflow-hidden">
                    <summary className="px-5 py-4 cursor-pointer font-semibold text-sm text-ld-fg flex items-center justify-between list-none hover:bg-ld-bg-soft transition-colors">
                      {q}
                      <ChevronRight className="w-4 h-4 text-ld-fg-muted group-open:rotate-90 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-5 pb-4 text-sm text-ld-fg-soft leading-relaxed border-t border-ld-border pt-3">{a}</div>
                  </details>
                ))}
              </div>
            )}
          </div>

          {/* REVIEWS */}
          <div className="mt-12 space-y-4">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--ld-action)' }}>Reseñas verificadas</p>
                <h2 className="ld-display text-3xl text-ld-fg">Lo que dicen nuestros clientes</h2>
              </div>
              <div className="ld-card hidden sm:flex items-center gap-2 px-4 py-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="font-poppins font-bold text-ld-fg">5.0</span>
                <span className="text-xs text-ld-fg-muted">/ 127</span>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {REVIEWS_MOCK.map((r, i) => (
                <div key={i} className="ld-card p-5 hover:-translate-y-1 transition-all shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-ld-fg-subtle'}`} />
                      ))}
                    </div>
                    {r.verificado && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>
                        <BadgeCheck className="w-3 h-3" /> Verificado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ld-fg-soft italic leading-relaxed mb-4">"{r.txt}"</p>
                  <div className="flex items-center gap-2.5 pt-3 border-t border-ld-border">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--ld-grad-action)' }}>
                      {r.autor[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ld-fg">{r.autor}</p>
                      <p className="text-[10px] text-ld-fg-muted">{r.ciudad} · {r.fecha}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FREQUENTLY BOUGHT TOGETHER — bundle IA */}
          <div className="mt-9">
            <FrequentlyBoughtTogether productSku={producto.sku} />
          </div>

          {/* RELACIONADOS */}
          {relacionados.length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--ld-action)' }}>También te podría gustar</p>
                  <h2 className="ld-display text-3xl text-ld-fg">Productos relacionados</h2>
                </div>
                <Link to="/shop" className="flex items-center gap-1.5 text-sm font-bold transition-colors hover:opacity-80" style={{ color: 'var(--ld-action)' }}>
                  Ver todos <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relacionados.map(p => (
                  <Link key={p.id} to={`/producto/${p.id}`}>
                    <div className="group ld-card overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-lg">
                      <div className="aspect-square overflow-hidden bg-white">
                        <img
                          src={getProductImage(p)}
                          alt={`${p.nombre} · ${p.categoria || 'PEYU'}`}
                          width="300"
                          height="300"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1'; }}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-xs text-ld-fg line-clamp-2 transition-colors leading-snug" style={{ transitionProperty: 'color' }}>{p.nombre}</h3>
                        <p className="font-poppins font-bold text-sm mt-1" style={{ color: 'var(--ld-action)' }}>${Math.floor((p.precio_b2c || 9990) * 0.85).toLocaleString('es-CL')}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <MockupGenerator
          open={mockupOpen}
          onOpenChange={setMockupOpen}
          productName={producto.nombre}
          productCategory={producto.categoria}
          productSku={producto.sku}
          productImageUrl={galeria[vistaActiva] || imgPrincipal}
          initialText={personalizacion}
          initialColor={colores.find(c => c.id === colorSeleccionado)?.label || ''}
          onGenerated={(url, extra = {}) => {
            setMockupGenerado(url);
            // Persistir draft con todo el contexto para que B2BContacto lo recupere
            saveMockupDraft({
              productoId: producto.id,
              productoNombre: producto.nombre,
              productoSku: producto.sku,
              productoCategoria: producto.categoria,
              color: colores.find(c => c.id === colorSeleccionado)?.label || '',
              texto: extra.texto || personalizacion || '',
              logoUrl: extra.logoUrl || '',
              mockupUrl: url,
            });
          }}
        />
    </div>
    </>
  );
}