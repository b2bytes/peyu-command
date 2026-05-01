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
      />
      <div className="min-h-full flex flex-col">

          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border-b border-white/20 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <MobileMenu items={MENU_ITEMS} />
              <Link to={productoId ? `/producto/${productoId}` : '/shop'} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <div>
                  <p className="text-sm font-poppins font-bold text-white leading-none">PEYU</p>
                  <p className="text-[10px] text-white/60 leading-none mt-0.5">Ventas Corporativas B2B</p>
                </div>
              </div>
            </div>
            <a href="https://wa.me/56935040242?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n%20corporativa" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-full gap-1.5 text-xs font-bold px-4 shadow-lg">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </Button>
            </a>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

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

            {/* Hero */}
            <div className="text-center space-y-4">
              {fromChat && (
                <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-400/40 text-purple-200 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
                  🐢 Peyu ya precargó tu solicitud — solo completa tus datos
                </div>
              )}
              {draft && (draft.mockupUrl || draft.logoUrl || draft.texto) && (
                <div className="inline-flex items-center gap-2 bg-pink-500/20 border border-pink-400/40 text-pink-200 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
                  ✨ Tu mockup y personalización fueron traídos desde <b>&nbsp;{draft.productoNombre || 'el producto'}</b>
                </div>
              )}
              {clientePrefilled && (
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
                  👋 ¡Hola de nuevo! Completamos tus datos de empresa automáticamente
                </div>
              )}
              {userPrefilled && !clientePrefilled && (
                <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/40 text-blue-200 px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
                  👤 Sesión iniciada — precargamos tu nombre y email
                </div>
              )}
              <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/40 text-teal-300 px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
                <Building2 className="w-4 h-4" /> Cotización Corporativa B2B
              </div>
              <h1 className="text-3xl md:text-5xl font-poppins font-black leading-tight text-white drop-shadow-lg">
                Regalos corporativos<br />
                <span className="text-cyan-400">con impacto real</span>
              </h1>
              <p className="text-white/70 max-w-xl mx-auto leading-relaxed text-sm md:text-base">
                Transformamos residuos plásticos en regalos únicos con tu logo. Fabricación local en Chile, personalización láser UV gratuita desde 10 unidades.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

            {/* Form Card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/30 border border-teal-400/40 flex items-center justify-center">
                  <Send className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <h2 className="font-poppins font-bold text-lg text-white">Solicitar cotización</h2>
                  <p className="text-white/50 text-xs">Respondemos en menos de 24 horas con propuesta + mockup</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/40 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm backdrop-blur-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Contact Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'Nombre contacto *', key: 'contact_name', placeholder: 'Tu nombre completo' },
                    { label: 'Empresa *', key: 'company_name', placeholder: 'Nombre de la empresa' },
                    { label: 'Email *', key: 'email', placeholder: 'correo@empresa.cl', type: 'email' },
                    { label: 'Teléfono / WhatsApp *', key: 'phone', placeholder: '+56 9 xxxx xxxx' },
                    { label: 'RUT Empresa', key: 'rut', placeholder: '12.345.678-9' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">{f.label}</label>
                      <Input
                        type={f.type || 'text'}
                        value={form[f.key]}
                        onChange={e => update(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="h-11 text-sm rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:bg-white/15 focus:border-teal-400/60 focus:ring-teal-400/30"
                      />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Fecha requerida</label>
                    <Input type="date" value={form.delivery_date} onChange={e => update('delivery_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="h-11 text-sm rounded-xl bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-teal-400/60 [color-scheme:dark]" />
                  </div>
                </div>

                {/* Product + Qty */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-2">
                      Producto de interés
                      {fromChat && form.product_interest && (
                        <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 border border-purple-400/30 px-2 py-0.5 rounded-full normal-case tracking-normal">
                          ✨ Precargado desde chat
                        </span>
                      )}
                    </label>
                    <select value={form.product_interest} onChange={e => update('product_interest', e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/60">
                      <option value="" className="bg-slate-900">Seleccionar producto...</option>
                      {/* Si el producto precargado no está en el catálogo, mostrarlo igual */}
                      {form.product_interest && !productosCatalogo.includes(form.product_interest) && (
                        <option value={form.product_interest} className="bg-slate-900">{form.product_interest}</option>
                      )}
                      {productosCatalogo.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-2">
                      Cantidad estimada (u)
                      {fromChat && form.qty_estimate && (
                        <span className="text-[10px] text-purple-300 font-bold bg-purple-500/20 border border-purple-400/30 px-2 py-0.5 rounded-full normal-case tracking-normal">
                          ✨ Detectada en chat
                        </span>
                      )}
                    </label>
                    <Input type="number" value={form.qty_estimate} onChange={e => update('qty_estimate', e.target.value)}
                      placeholder="Ej: 50, 100, 500" min="1"
                      className={`h-11 text-sm rounded-xl text-white placeholder:text-white/30 focus:bg-white/15 focus:ring-teal-400/30 ${fromChat && form.qty_estimate ? 'bg-purple-500/10 border-purple-400/40 focus:border-purple-400/60' : 'bg-white/10 border-white/20 focus:border-teal-400/60'}`} />
                  </div>
                </div>

                {/* Volume pricing hint */}
                {form.qty_estimate >= 50 && (
                  <div className="bg-teal-500/15 border border-teal-400/30 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
                    <Star className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <p className="text-xs text-teal-200">
                      {form.qty_estimate >= 500 ? '🔥 Precio especial 500+ u + personalización gratis + packaging premium' :
                       form.qty_estimate >= 200 ? '⭐ Precio preferencial 200+ u con personalización incluida' :
                       '✨ Personalización láser UV gratuita incluida para tu pedido'}
                    </p>
                  </div>
                )}

                {/* Checkboxes */}
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { key: 'personalization_needs', title: '✨ Requiero personalización con logo', sub: 'Grabado láser UV · gratis desde 10 u.', color: 'cyan' },
                    { key: 'has_plastic', title: '♻️ Tengo plástico para reciclar', sub: 'Economía circular con tus residuos', color: 'green' },
                  ].map(cb => (
                    <label key={cb.key}
                      className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${form[cb.key] ? 'border-teal-400/60 bg-teal-500/15' : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}>
                      <input type="checkbox" checked={form[cb.key]} onChange={e => update(cb.key, e.target.checked)} className="mt-0.5 accent-teal-400 w-4 h-4" />
                      <div>
                        <div className="font-semibold text-sm text-white">{cb.title}</div>
                        <div className="text-xs text-white/50 mt-0.5">{cb.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Logo Upload + Live Mockup */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3" /> Logo o brief
                      {draftLogoPreview && !archivo && (
                        <span className="text-[10px] text-pink-300 font-bold bg-pink-500/20 border border-pink-400/30 px-2 py-0.5 rounded-full normal-case tracking-normal">
                          ✨ Precargado
                        </span>
                      )}
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer h-full flex flex-col items-center justify-center min-h-[200px] ${archivo || draftLogoPreview ? 'border-teal-400/60 bg-teal-500/10' : 'border-white/20 hover:border-teal-400/40 hover:bg-white/5'}`}
                      onClick={() => document.getElementById('logo-upload').click()}>
                      {archivo ? (
                        <>
                          <Upload className="w-8 h-8 mb-3 text-teal-400" />
                          <p className="text-sm text-teal-300 font-semibold truncate max-w-full">✓ {archivo.name}</p>
                          <p className="text-[10px] text-teal-300/60 mt-1">Nuevo logo cargado</p>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setArchivo(null); }}
                            className="mt-2 text-[10px] text-white/50 hover:text-white underline">Cambiar logo</button>
                        </>
                      ) : draftLogoPreview ? (
                        <>
                          <img src={draftLogoPreview} alt="Logo precargado" className="w-16 h-16 object-contain rounded-lg bg-white/10 p-1.5 mb-2" />
                          <p className="text-sm text-teal-300 font-semibold">✓ Logo guardado</p>
                          <p className="text-[10px] text-teal-300/60 mt-1">Traído desde el producto</p>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setDraftLogoPreview(''); }}
                            className="mt-2 text-[10px] text-white/50 hover:text-white underline">Usar otro logo</button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-3 text-white/30" />
                          <p className="text-sm font-medium text-white/70">Arrastra tu logo o haz clic</p>
                          <p className="text-xs text-white/40 mt-1">PNG o SVG (recomendado) · max 10MB</p>
                          <p className="text-[10px] text-teal-300/70 mt-2 font-semibold">Ideal: fondo transparente</p>
                        </>
                      )}
                      <input id="logo-upload" type="file" className="hidden"
                        accept=".png,.svg,.jpg,.jpeg"
                        onChange={e => setArchivo(e.target.files[0])} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <Zap className="w-3 h-3" /> Preview en vivo
                      {draft?.mockupUrl && !archivo && (
                        <span className="text-[10px] text-pink-300 font-bold bg-pink-500/20 border border-pink-400/30 px-2 py-0.5 rounded-full normal-case tracking-normal">
                          ✨ Mockup listo
                        </span>
                      )}
                    </label>
                    {draft?.mockupUrl && !archivo ? (
                      <div className="rounded-2xl overflow-hidden border border-pink-400/40 bg-black/30 shadow-xl">
                        <img src={draft.mockupUrl} alt="Mockup generado" className="w-full h-auto" />
                        <p className="text-[10px] text-white/60 text-center py-1.5 bg-pink-500/20 border-t border-pink-400/30">
                          ✨ Mockup generado con IA · incluido en tu cotización
                        </p>
                      </div>
                    ) : (
                      <LogoMockupPreview logoFile={archivo} texto={form.notes ? '' : form.company_name} />
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">Notas adicionales</label>
                  <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
                    placeholder="Packaging personalizado, colores, instrucciones especiales..."
                    className="w-full border border-white/20 bg-white/10 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/60 transition backdrop-blur-sm" />
                </div>

                {/* Submit */}
                <Button type="submit" size="lg"
                  className="w-full font-bold rounded-2xl h-14 shadow-2xl shadow-teal-500/30 gap-2 text-base bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 transition-all"
                  disabled={loading}>
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
                  ) : '📋 Solicitar cotización — respondemos en <24h'}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-white/40">¿Prefieres WhatsApp directo?</p>
                  <a href="https://wa.me/56935040242?text=Hola%2C%20me%20interesa%20una%20cotizaci%C3%B3n%20corporativa%20de%20Peyu"
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-teal-400 font-semibold hover:text-teal-300 transition-colors">
                    <MessageCircle className="w-4 h-4" /> +56 9 3504 0242
                  </a>
                </div>
              </form>
            </div>

            {/* Social Proof */}
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