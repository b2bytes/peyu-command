import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageCircle, Upload, CheckCircle, Building2, Package, Clock, Zap, Recycle, Star, ShoppingCart, Home, Grid3x3, HelpCircle, Heart, Send, Image as ImageIcon } from 'lucide-react';
import MobileMenu from '@/components/MobileMenu';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import LogoMockupPreview from '@/components/b2b/LogoMockupPreview';
import { getProductImage } from '@/utils/productImages';
import { readMockupDraft, clearMockupDraft } from '@/lib/mockup-draft';
import PublicSEO from '@/components/PublicSEO';
import { track } from '@/lib/activity-tracker';
import NewsletterCTA from '@/components/newsletter/NewsletterCTA';
import { buildFaqSchema } from '@/lib/schemas-peyu';

// FAQ Schema — Google muestra estas Q&A como rich snippet (acordeón) en SERP.
// Optimizado para keywords B2B chilenas con intención comercial alta.
const B2B_FAQS = [
  { q: '¿Cuál es el mínimo de unidades para regalos corporativos?', a: 'Trabajamos desde 10 unidades en adelante con personalización láser UV gratuita. No exigimos pedidos mínimos altos como otras imprentas: ideal para PYMEs, startups y eventos pequeños.' },
  { q: '¿Cuánto demora una cotización corporativa?', a: 'Respondemos toda solicitud B2B en menos de 24 horas hábiles con propuesta detallada en PDF, mockup de tu logo grabado en el producto y precios por volumen. Si necesitas algo urgente, escríbenos por WhatsApp al +56 9 3504 0242.' },
  { q: '¿Hacen factura electrónica a empresa?', a: 'Sí, emitimos factura electrónica con IVA a nombre de tu empresa. Aceptamos pago con transferencia, orden de compra (OC) y crédito 30 días para empresas con historial.' },
  { q: '¿Despachan a regiones de Chile?', a: 'Sí, despachamos a todo Chile vía BlueExpress, Starken y Chilexpress. Lead time típico: 7 días sin personalización, 9 días con grabado láser UV. Envío gratis B2C sobre $40.000.' },
  { q: '¿Qué tipo de personalización ofrecen?', a: 'Grabado láser UV permanente en plástico reciclado y fibra de trigo compostable. Incluye mockup gratuito de tu logo antes de producción. Compatible con logos vectoriales (SVG, AI, PDF) o imágenes en alta resolución (PNG con fondo transparente).' },
  { q: '¿Por qué elegir productos PEYU vs imprentas tradicionales?', a: 'PEYU es fabricante chileno con producción local en Santiago: plástico 100% reciclado post-consumo o fibra de trigo compostable, garantía 10 años, política ESG con trazabilidad de material y huella de carbono evitada estimada en factura.' },
];

const MENU_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/shop', label: 'Tienda', icon: ShoppingCart },
  { href: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3 },
  { href: '/b2b/contacto', label: 'B2B', icon: Building2 },
  { href: '/nosotros', label: 'Nosotros', icon: Heart },
  { href: '/soporte', label: 'Soporte', icon: HelpCircle },
];

const FEATURES = [
  { icon: Zap, label: 'Laser UV gratis', sub: 'Desde 10 unidades', color: '#f97316' },
  { icon: Clock, label: 'Propuesta en <24h', sub: 'Con mockup de tu logo', color: '#0F8B6C' },
  { icon: Package, label: 'Entrega en 7 días', sub: 'Fabricación local Chile', color: '#06b6d4' },
  { icon: Recycle, label: 'Plástico 100% reciclado', sub: 'Impacto ESG real', color: '#a3e635' },
];

// Fallback estático (se reemplaza con productos reales del inventario al montar)
const PRODUCTOS_FALLBACK = [
  'Kit Escritorio (5 piezas)', 'Posavasos Corporativos', 'Maceteros Corporativos',
  'Cachos / Cubiletes', 'Lámparas Corporativas', 'Paletas Corporativas', 'Otro / Consultar',
];

const CLIENTES = ['Adidas', 'Nestlé', 'BancoEstado', 'DUOC UC', 'UAI', 'Falabella'];

// Flujo paso a paso (3 pasos) que reemplaza el formulario largo.
const STEPS = [
  { icon: Package, title: 'Elige tu producto', sub: 'Arma tu pedido con los productos sostenibles que quieras personalizar.' },
  { icon: ImageIcon, title: 'Sube tu logo', sub: 'Generamos un mockup real de tu logo grabado láser en menos de 24h.' },
  { icon: CheckCircle, title: 'Recibe tu propuesta', sub: 'Propuesta + PDF con precios por volumen, lista para aprobar.' },
];

function calcularScore(form, tieneArchivo) {
  let score = 10;
  if ((form.qty_estimate || 0) >= 500) score += 40;
  else if ((form.qty_estimate || 0) >= 100) score += 30;
  else if ((form.qty_estimate || 0) >= 50) score += 20;
  else if ((form.qty_estimate || 0) >= 10) score += 10;
  if (form.email) score += 15;
  if (form.phone) score += 10;
  if (form.rut) score += 10;
  if (form.personalization_needs) score += 5;
  if (form.delivery_date) score += 5;
  if (tieneArchivo) score += 10;
  if (form.has_plastic) score += 5;
  return Math.min(score, 100);
}

export default function B2BContacto() {
  const [searchParams] = useSearchParams();
  const productoId = searchParams.get('productoId');
  const productoNombre = searchParams.get('nombre');
  const qtyParam = parseInt(searchParams.get('qty') || '', 10);
  const personalizacionParam = searchParams.get('personalizacion') === '1';
  const fromChat = searchParams.get('from') === 'chat';
  const notasParam = searchParams.get('notas') || '';
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const [form, setForm] = useState({
    contact_name: '', company_name: '', email: '', phone: '', rut: '',
    product_interest: productoNombre || '',
    qty_estimate: Number.isFinite(qtyParam) && qtyParam > 0 ? String(qtyParam) : '',
    delivery_date: '',
    personalization_needs: personalizacionParam,
    has_plastic: false,
    notes: notasParam,
    source: 'Formulario Web',
    status: 'Nuevo', urgency: 'Normal',
  });

  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [productosCatalogo, setProductosCatalogo] = useState(PRODUCTOS_FALLBACK);

  // ✨ Draft de personalización/mockup traído desde la página del producto.
  // Si el cliente generó un mockup y luego hizo clic en "Cotizar B2B", recuperamos
  // el mockup, logo y texto aquí — evitando regenerar nada.
  const [draft, setDraft] = useState(null);
  const [draftLogoPreview, setDraftLogoPreview] = useState(''); // preview en el dropzone cuando el logo viene del draft
  // 👤 Flags para saber si precargamos datos desde perfil autenticado
  const [userPrefilled, setUserPrefilled] = useState(false);
  const [clientePrefilled, setClientePrefilled] = useState(false);

  // Cargar productos reales del inventario (B2B + B2B/B2C) para el selector
  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }).then(list => {
      const b2b = (list || [])
        .filter(p => p.canal === 'B2B Exclusivo' || p.canal === 'B2B + B2C')
        .map(p => p.nombre)
        .filter(Boolean);
      const unique = Array.from(new Set(b2b)).sort();
      if (unique.length) setProductosCatalogo([...unique, 'Otro / Consultar']);
    }).catch(() => {});
  }, []);

  // 🎨 Recuperar draft de mockup/personalización (viene de ProductoDetalle)
  useEffect(() => {
    const d = readMockupDraft(productoId);
    if (!d) return;
    setDraft(d);
    if (d.logoUrl) setDraftLogoPreview(d.logoUrl);
    setForm(prev => ({
      ...prev,
      // Priorizar producto/texto del draft si no vinieron por URL
      product_interest: prev.product_interest || d.productoNombre || '',
      personalization_needs: true,
      notes: prev.notes || (d.texto ? `Texto/mensaje para grabado: "${d.texto}"${d.color ? ` · Color: ${d.color}` : ''}` : prev.notes),
    }));
  }, [productoId]);

  // 👤 Precarga datos del usuario autenticado + ficha Cliente (si existe)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me || cancelled) return;

        // 1. Precarga desde la cuenta (nombre + email)
        setForm(prev => ({
          ...prev,
          contact_name: prev.contact_name || me.full_name || '',
          email: prev.email || me.email || '',
        }));
        setUserPrefilled(true);

        // 2. Buscar ficha Cliente por email (datos corporativos)
        if (me.email) {
          try {
            const matches = await base44.entities.Cliente.filter({ email: me.email });
            const cliente = matches?.[0];
            if (cliente && !cancelled) {
              setForm(prev => ({
                ...prev,
                company_name: prev.company_name || cliente.empresa || '',
                phone: prev.phone || cliente.telefono || '',
                rut: prev.rut || cliente.rut || '',
                contact_name: prev.contact_name || cliente.contacto || me.full_name || '',
              }));
              setClientePrefilled(true);
            }
          } catch {}
        }
      } catch {
        // Usuario no autenticado → flujo normal, no hacemos nada
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name || !form.company_name || !form.email || !form.phone) {
      setError('Por favor completa nombre, empresa, email y teléfono.');
      return;
    }
    setLoading(true);
    setError('');

    // Logo: nuevo archivo > logo del draft > nada
    let logoUrl = draft?.logoUrl || '';
    if (archivo) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      logoUrl = file_url;
    }

    // Mockup ya generado en el draft (lo reutilizamos sin regenerar)
    const existingMockup = draft?.mockupUrl || '';

    const tieneArchivoOLogo = !!archivo || !!logoUrl;
    const score = calcularScore({ ...form, qty_estimate: Number(form.qty_estimate) || 0 }, tieneArchivoOLogo);
    const urgency = score >= 70 ? 'Alta' : score >= 40 ? 'Normal' : 'Baja';

    const leadCreado = await base44.entities.B2BLead.create({
      ...form,
      qty_estimate: Number(form.qty_estimate) || 0,
      lead_score: score,
      logo_url: logoUrl,
      brief_url: logoUrl,
      urgency,
      mockup_urls: existingMockup ? [existingMockup] : [],
      utm_source: fromChat ? 'chat_peyu' : (document.referrer || 'directo'),
    });

    if (leadCreado?.id) {
      // Trazabilidad 360°: registrar form submit con identificación
      track.b2bFormSubmit({
        leadId: leadCreado.id,
        company: form.company_name,
        email: form.email,
        name: form.contact_name,
        qty: Number(form.qty_estimate) || 0,
      });

      base44.functions.invoke('scoreLead', { leadId: leadCreado.id }).catch(() => {});

      // Solo generar mockup si NO viene uno del draft y tenemos material base
      if (!existingMockup && (logoUrl || form.company_name)) {
        let productImageUrl = '';
        let productCategory = 'Corporativo';
        try {
          const productos = await base44.entities.Producto.filter({ activo: true });
          const prod = productos.find(p => p.nombre === form.product_interest);
          if (prod) {
            productImageUrl = getProductImage(prod.sku, prod.categoria);
            productCategory = prod.categoria || 'Corporativo';
          }
        } catch {}

        base44.functions.invoke('generateMockup', {
          productName: form.product_interest || 'Producto Peyu',
          productCategory,
          productImageUrl,
          logoUrl,
          text: logoUrl ? '' : form.company_name,
        }).then(res => {
          const mockupUrl = res?.data?.mockup_url;
          if (mockupUrl) {
            base44.entities.B2BLead.update(leadCreado.id, { mockup_urls: [mockupUrl] }).catch(() => {});
          }
        }).catch(() => {});
      }
    }

    // Draft consumido → limpiarlo para no contaminar futuras solicitudes
    clearMockupDraft();
    setEnviado(true);
    setLoading(false);
  };

  const bgStyle = {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.80) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.80) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };

  if (enviado) {
    return (
      <div className="min-h-full flex items-center justify-center p-4 font-inter">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto shadow-2xl shadow-teal-500/30">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-poppins font-bold text-white">¡Solicitud enviada!</h2>
            <p className="text-white/70 mt-2 leading-relaxed text-sm">Carlos del equipo Peyu te contactará en menos de 24 horas con una propuesta personalizada y mockup de tu logo.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-left space-y-3 shadow-xl">
            <p className="font-semibold text-sm text-white">¿Necesitas respuesta urgente?</p>
            <p className="text-xs text-white/60">Escríbenos directamente por WhatsApp:</p>
            <a href="https://wa.me/56935040242?text=Hola%2C%20acabo%20de%20enviar%20una%20solicitud%20de%20cotizaci%C3%B3n%20corporativa%20por%20la%20web%20de%20Peyu" target="_blank" rel="noopener noreferrer">
              <Button className="w-full gap-2 rounded-xl font-semibold text-white" style={{ backgroundColor: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
              </Button>
            </a>
          </div>
          <Link to="/shop">
            <Button variant="outline" className="w-full rounded-xl border-white/30 text-white hover:bg-white/10">Ver catálogo completo</Button>
          </Link>

          {/* Newsletter B2B — calendario corporativo + tips ESG */}
          <NewsletterCTA
            variant="b2b"
            defaultEmail={form.email}
            defaultName={form.contact_name}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto font-inter">
      <PublicSEO
        pageKey="b2bContacto"
        breadcrumbs={[
          { name: 'Inicio', url: 'https://peyuchile.cl/' },
          { name: 'B2B', url: 'https://peyuchile.cl/b2b/contacto' },
        ]}
        jsonLd={buildFaqSchema(B2B_FAQS)}
      />
      <div className="min-h-full flex flex-col">

          {/* Header — compacto, sin logo duplicado */}
          <div className="bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border-b border-white/20 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-40 backdrop-blur-md">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <MobileMenu items={MENU_ITEMS} />
              <Link to={productoId ? `/producto/${productoId}` : '/shop'} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Link>
              <p className="text-sm font-poppins font-bold text-white leading-none truncate">Cotización B2B</p>
            </div>
            <a href="https://wa.me/56935040242?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n%20corporativa" target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-full gap-1.5 text-xs font-bold px-3 sm:px-4 shadow-lg">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </Button>
            </a>
          </div>

          {/* Content — paddings reducidos en mobile para más densidad */}
          <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-8">

            {/* Quick access row: self-service + mi cuenta */}
            <div className="grid md:grid-cols-2 gap-3">
              <Link to="/b2b/self-service">
                <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/40 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm hover:from-purple-500/40 hover:to-pink-500/40 transition-all cursor-pointer h-full">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl flex-shrink-0">⚡</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins font-bold text-white text-sm">Genera tu propuesta tú mismo</p>
                    <p className="text-[11px] text-white/70 mt-0.5">Arma pedido + PDF al instante.</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-white rotate-180 flex-shrink-0" />
                </div>
              </Link>
              <Link to="/b2b/mi-cuenta">
                <div className="bg-gradient-to-r from-teal-500/30 to-emerald-500/30 border border-teal-400/40 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm hover:from-teal-500/40 hover:to-emerald-500/40 transition-all cursor-pointer h-full">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-xl flex-shrink-0">🏢</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins font-bold text-white text-sm">Ya tengo cuenta corporativa</p>
                    <p className="text-[11px] text-white/70 mt-0.5">Ver cotizaciones, mockups y repetir pedidos.</p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-white rotate-180 flex-shrink-0" />
                </div>
              </Link>
            </div>

            {/* Hero — compacto en mobile, los badges de pre-carga consolidados */}
            <div className="text-center space-y-3 sm:space-y-4">
              {(fromChat || (draft && (draft.mockupUrl || draft.logoUrl || draft.texto)) || clientePrefilled || userPrefilled) && (
                <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/40 text-purple-200 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold backdrop-blur-sm">
                  {clientePrefilled
                    ? '👋 Datos de empresa precargados'
                    : draft && (draft.mockupUrl || draft.logoUrl)
                    ? '✨ Mockup precargado del producto'
                    : fromChat
                    ? '🐢 Peyu precargó tu solicitud'
                    : '👤 Datos precargados'}
                </div>
              )}
              <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/40 text-teal-300 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-sm">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Cotización B2B
              </div>
              <h1 className="text-[1.6rem] sm:text-3xl md:text-5xl font-poppins font-black leading-[1.1] text-white drop-shadow-lg">
                Regalos corporativos<br />
                <span className="text-cyan-400">con impacto real</span>
              </h1>
              <p className="text-white/70 max-w-xl mx-auto leading-relaxed text-xs sm:text-sm md:text-base">
                Transformamos residuos plásticos en regalos únicos con tu logo. Fabricación local · personalización láser UV gratuita desde 10 u.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {FEATURES.map((f, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl p-4 text-center hover:bg-white/10 hover:-translate-y-1 transition-all shadow-lg">
                  <div className="w-10 h-10 rounded-xl mx-auto mb-2.5 flex items-center justify-center" style={{ background: f.color + '25', border: `1px solid ${f.color}40` }}>
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <div className="font-semibold text-xs text-white font-poppins leading-tight">{f.label}</div>
                  <div className="text-[10px] text-white/50 mt-0.5">{f.sub}</div>
                </div>
              ))}
            </div>

            {/* Cómo funciona — flujo paso a paso ordenado y responsive */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-bold text-teal-300">Cómo funciona</p>
                <h2 className="text-xl sm:text-2xl font-poppins font-bold text-white mt-1">Tu cotización en 3 pasos</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                {STEPS.map((s, i) => (
                  <div key={i} className="relative bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl p-5 hover:bg-white/10 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-poppins font-bold text-sm mb-3 shadow-lg">
                      {i + 1}
                    </div>
                    <s.icon className="w-5 h-5 text-teal-300 mb-2" />
                    <p className="font-poppins font-bold text-white text-sm leading-tight">{s.title}</p>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs paso a paso — elegir un camino */}
            <div className="grid sm:grid-cols-2 gap-3">
              <Link to="/b2b/self-service">
                <Button size="lg" className="w-full h-14 font-bold rounded-2xl gap-2 text-sm bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0 shadow-xl">
                  ⚡ Armar mi propuesta ahora
                </Button>
              </Link>
              <a href="https://wa.me/56935040242?text=Hola%2C%20me%20interesa%20una%20cotizaci%C3%B3n%20corporativa%20de%20Peyu"
                target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full h-14 font-bold rounded-2xl gap-2 text-sm bg-green-500 hover:bg-green-600 text-white border-0 shadow-xl">
                  <MessageCircle className="w-5 h-5" /> Cotizar por WhatsApp
                </Button>
              </a>
            </div>

            {/* Social Proof — cierre de confianza */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center space-y-3">
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Empresas que confían en PEYU</p>
              <div className="flex flex-wrap justify-center gap-3">
                {CLIENTES.map(c => (
                  <span key={c} className="bg-white/10 border border-white/20 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-full">{c}</span>
                ))}
              </div>
            </div>

            <div className="pb-8" />
          </div>
      </div>
    </div>
  );
}