import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, ArrowRight, Building2, Plus, Minus, Trash2, Upload,
  Sparkles, Download, CheckCircle, FileText, Loader2, Zap, Package, Wand2, ShoppingBag, X
} from 'lucide-react';
import CartPanel from '@/components/b2b/selfservice/CartPanel';
import ProposalDeliveryActions from '@/components/b2b/selfservice/ProposalDeliveryActions';
import SelfServiceProductCard from '@/components/b2b/selfservice/SelfServiceProductCard';
import StepperProgress from '@/components/b2b/selfservice/StepperProgress';
import PublicSEO from '@/components/PublicSEO';
import AnchorProductBanner from '@/components/b2b/selfservice/AnchorProductBanner';
import CrossSellCarousel from '@/components/b2b/selfservice/CrossSellCarousel';
import PhoneCountryInput from '@/components/b2b/selfservice/PhoneCountryInput';
import EngravingPositionPicker from '@/components/producto/EngravingPositionPicker';
import DeliveryMethodPicker from '@/components/b2b/selfservice/DeliveryMethodPicker';
import MobileOrderBar from '@/components/b2b/selfservice/MobileOrderBar';

const STEPS = ['Productos', 'Empresa', 'Personalización', 'Propuesta'];
const PERSIST_KEY = 'peyu_b2b_flow';

// Precio por volumen basado en la TABLA REAL del producto (misma que ProductoDetalle).
// Fallback a descuentos genéricos solo si el producto no tiene precios de volumen configurados.
function calcPrice(producto, qty) {
  if (!producto) return 0;

  // Prioridad 1: precio_b2b_tramos (catálogo oficial, 8 tramos sin IVA)
  const t = producto.precio_b2b_tramos;
  if (t && typeof t === 'object') {
    if (qty >= 2000 && t.t2000_mas)  return t.t2000_mas;
    if (qty >= 1000 && t.t1000_1999) return t.t1000_1999;
    if (qty >= 500 && t.t500_999)    return t.t500_999;
    if (qty >= 250 && t.t250_499)    return t.t250_499;
    if (qty >= 100 && t.t100_249)    return t.t100_249;
    if (qty >= 50 && t.t50_99)       return t.t50_99;
    if (qty >= 10 && t.t10_49)       return t.t10_49;
    if (t.unitario)                  return t.unitario;
  }

  const base = producto.precio_base_b2b || producto.precio_b2c || 5000;
  // Prioridad 2: tabla legacy
  if (qty >= 500 && producto.precio_500_mas) return producto.precio_500_mas;
  if (qty >= 200 && producto.precio_200_499) return producto.precio_200_499;
  if (qty >= 50 && producto.precio_50_199) return producto.precio_50_199;
  if (qty >= 10 && producto.precio_base_b2b) return producto.precio_base_b2b;
  // Prioridad 3: fallback porcentual sobre precio_b2c
  let discount = 0;
  if (qty >= 500) discount = 0.25;
  else if (qty >= 200) discount = 0.15;
  else if (qty >= 50) discount = 0.08;
  return Math.round(base * (1 - discount));
}

export default function B2BSelfService() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [catalogo, setCatalogo] = useState([]);
  const [loadingCat, setLoadingCat] = useState(true);

  // Carrito: { producto, cantidad }
  const [cart, setCart] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  // Producto con el que el cliente llegó desde "Cotizar B2B" (para hero del onboarding)
  const [anchorProducto, setAnchorProducto] = useState(null);

  // Empresa
  const [form, setForm] = useState({
    contact_name: '', company_name: '', email: '', phone: '', rut: '', notes: '',
  });

  // Personalización
  const [personalizar, setPersonalizar] = useState(true);
  const [archivo, setArchivo] = useState(null);
  const [posicionGrabado, setPosicionGrabado] = useState('centro');

  // Entrega: retiro en tienda o despacho a domicilio
  const [entrega, setEntrega] = useState({ metodo: 'Despacho a domicilio', direccion: '', comuna: '' });

  // Resultado
  const [generando, setGenerando] = useState(false);
  const [propuesta, setPropuesta] = useState(null);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState(false);

  // Regenerar mockup (posición del logo)
  const [regenerando, setRegenerando] = useState(false);
  const [mockupActual, setMockupActual] = useState(null);

  // Drawer del carrito (solo móvil)
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(list => {
        const b2b = (list || []).filter(p => p.canal === 'B2B Exclusivo' || p.canal === 'B2B + B2C');
        setCatalogo(b2b);

        // 🎯 Producto pre-anclado al embudo B2B ("Cotizar B2B").
        // Dos vías soportadas:
        //   1. ?sku=XXX en la URL → robusto, sobrevive a recargas y links compartidos.
        //   2. sessionStorage 'peyu_b2b_anchor' → trae además cantidad/personalización
        //      cuando se ancla desde la página de detalle del producto.
        // En ambos casos: producto YA en el carrito + salto al paso "Empresa".
        // Esto elimina la "galería vacía" que hacía perder el producto seleccionado.
        try {
          const params = new URLSearchParams(window.location.search);
          const skuParam = params.get('sku');
          const anchorRaw = sessionStorage.getItem('peyu_b2b_anchor');
          const anchor = anchorRaw ? JSON.parse(anchorRaw) : null;
          const targetSku = anchor?.sku || skuParam;

          if (targetSku) {
            const producto = b2b.find(p => p.sku === targetSku);
            if (producto) {
              setCart([{ producto, cantidad: Math.max(10, anchor?.cantidad || 10) }]);
              setAnchorProducto(producto); // mostrarlo en el hero del paso Empresa
              if (anchor?.personalizar === false) setPersonalizar(false);
              setStep(1); // saltar directo a "Empresa" — su producto ya está elegido
            }
            sessionStorage.removeItem('peyu_b2b_anchor');
          }
        } catch { /* ignore */ }

        // Repetir pedido: si venimos del panel "Mi cuenta" con sessionStorage cargado,
        // precargamos carrito y form, y saltamos directo al paso de Personalización.
        try {
          const params = new URLSearchParams(window.location.search);
          if (params.get('repeat') === '1') {
            const raw = sessionStorage.getItem('peyu_b2b_repeat');
            if (raw) {
              const { cart: savedCart, form: savedForm } = JSON.parse(raw);
              const rebuilt = (savedCart || [])
                .map(c => {
                  const producto = b2b.find(p => p.sku === c.sku);
                  return producto ? { producto, cantidad: c.cantidad || 10 } : null;
                })
                .filter(Boolean);
              if (rebuilt.length > 0) {
                setCart(rebuilt);
                if (savedForm) setForm(f => ({ ...f, ...savedForm }));
                setStep(2); // saltar a Personalización
              }
              sessionStorage.removeItem('peyu_b2b_repeat');
            }
          }
        } catch { /* ignore */ }
      })
      .finally(() => setLoadingCat(false));
  }, []);

  // ── Persistencia del flujo (cada paso es persistente) ──────────────────
  // Restaura form, personalización, paso y carrito (rehidratado por SKU) si el
  // usuario recarga o vuelve más tarde. Las vías de anchor/repeat tienen
  // prioridad: si setearon un step, no lo pisamos.
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (loadingCat || restored) return;
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.form) setForm(f => ({ ...f, ...saved.form }));
        if (typeof saved.personalizar === 'boolean') setPersonalizar(saved.personalizar);
        // Rehidratar carrito solo si está vacío (no pisar anchor/repeat)
        setCart(prev => {
          if (prev.length > 0) return prev;
          const rebuilt = (saved.cart || [])
            .map(c => {
              const producto = catalogo.find(p => p.sku === c.sku);
              return producto ? { producto, cantidad: c.cantidad || 10 } : null;
            })
            .filter(Boolean);
          return rebuilt.length > 0 ? rebuilt : prev;
        });
        // Restaurar paso solo si no estamos ya en uno avanzado por anchor/repeat
        setStep(s => (s === 0 && typeof saved.step === 'number' && !propuesta) ? saved.step : s);
      }
    } catch { /* ignore */ }
    setRestored(true);
  }, [loadingCat, restored, catalogo, propuesta]);

  // Guardar cada cambio relevante del flujo
  useEffect(() => {
    if (!restored || propuesta) return;
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify({
        step,
        form,
        personalizar,
        cart: cart.map(c => ({ sku: c.producto.sku, cantidad: c.cantidad })),
        savedAt: Date.now(),
      }));
    } catch { /* ignore */ }
  }, [step, form, personalizar, cart, restored, propuesta]);

  // Al completar la propuesta, limpiar el flujo persistido
  useEffect(() => {
    if (propuesta) { try { localStorage.removeItem(PERSIST_KEY); } catch { /* ignore */ } }
  }, [propuesta]);

  const categorias = ['todos', ...Array.from(new Set(catalogo.map(p => p.categoria).filter(Boolean)))];
  const catalogoFiltrado = filtroCategoria === 'todos' ? catalogo : catalogo.filter(p => p.categoria === filtroCategoria);

  // ── Mutaciones del carrito (forma FUNCIONAL prev => …) ──────────────────
  // Usar prev evita pisar el carrito al navegar entre pasos o re-renderizar
  // por los efectos de persistencia. "Agregar más producto" solo cambia el
  // paso visible; estas funciones ACUMULAN, nunca resetean.
  const addToCart = (producto) => {
    setCart(prev => {
      const exists = prev.find(c => c.producto.id === producto.id);
      if (exists) {
        return prev.map(c => c.producto.id === producto.id ? { ...c, cantidad: c.cantidad + 10 } : c);
      }
      return [...prev, { producto, cantidad: 10 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => c.producto.id === id ? { ...c, cantidad: Math.max(10, c.cantidad + delta) } : c));
  };

  const setQty = (id, val) => {
    setCart(prev => prev.map(c => c.producto.id === id ? { ...c, cantidad: Math.max(10, parseInt(val) || 10) } : c));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.producto.id !== id));

  const subtotalEstimado = cart.reduce((s, c) => s + (calcPrice(c.producto, c.cantidad) * c.cantidad), 0);

  const canContinue = (s) => {
    if (s === 0) return cart.length > 0;
    if (s === 1) return form.contact_name && form.company_name && form.email;
    return true;
  };

  const handleGenerar = async () => {
    setGenerando(true);
    setError('');
    try {
      let logoUrl = '';
      if (archivo) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
        logoUrl = file_url;
      }

      const items = cart.map(c => ({
        sku: c.producto.sku,
        nombre: c.producto.nombre,
        qty: c.cantidad,
        cantidad: c.cantidad,
        // Pasamos toda la tabla de volumen + precio_b2c para que el backend use los mismos tiers que ProductoDetalle
        precio_b2c: c.producto.precio_b2c,
        precio_base_b2b: c.producto.precio_base_b2b,
        precio_50_199: c.producto.precio_50_199,
        precio_200_499: c.producto.precio_200_499,
        precio_500_mas: c.producto.precio_500_mas,
        // Catálogo oficial: 8 tramos de precio mayorista sin IVA
        precio_b2b_tramos: c.producto.precio_b2b_tramos || null,
        imagen_url: c.producto.imagen_url || '',
        categoria: c.producto.categoria,
        personalizacion: personalizar,
      }));

      // Timeout de seguridad: si el backend no responde en 40s, cortamos y
      // mostramos error claro en vez de dejar el botón pegado para siempre.
      const invokeWithTimeout = Promise.race([
        base44.functions.invoke('createSelfServiceProposal', {
          ...form,
          items,
          logoUrl,
          notes: form.notes,
          posicion_grabado: posicionGrabado,
          metodo_entrega: entrega.metodo,
          direccion_entrega: entrega.direccion,
          comuna_entrega: entrega.comuna,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('La generación tardó demasiado. Intenta de nuevo o escríbenos por WhatsApp.')), 40000)
        ),
      ]);
      const res = await invokeWithTimeout;

      if (res?.data?.error) throw new Error(res.data.error);
      if (!res?.data?.proposal_id) throw new Error('No se pudo generar la propuesta');

      setPropuesta(res.data);
      setMockupActual(res.data.mockup_urls?.[0] || null);
      setStep(3);
    } catch (e) {
      setError(e.message || 'Error generando la propuesta');
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (!propuesta?.proposal_id) return;
    setDescargando(true);
    try {
      const res = await base44.functions.invoke('generateProposalPDF', { proposalId: propuesta.proposal_id });
      const { pdf_base64, filename } = res.data;
      const byteChars = atob(pdf_base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `PEYU-Propuesta-${propuesta.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo descargar el PDF. Revisa la propuesta online.');
    } finally {
      setDescargando(false);
    }
  };

  // Regenera el mockup con la posición del logo elegida (cuando quedó mal ubicado)
  const handleRegenerarMockup = async (nuevaPosicion) => {
    if (!propuesta?.proposal_id || regenerando) return;
    setRegenerando(true);
    try {
      const res = await base44.functions.invoke('regenerateProposalMockup', {
        proposalId: propuesta.proposal_id,
        posicion: nuevaPosicion,
      });
      if (res?.data?.mockup_url) {
        setMockupActual(res.data.mockup_url);
        setPosicionGrabado(nuevaPosicion);
        setPropuesta(p => ({ ...p, mockup_urls: res.data.mockup_urls }));
      }
    } catch {
      alert('No se pudo regenerar el mockup. Intenta de nuevo.');
    } finally {
      setRegenerando(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto font-inter pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:pb-8">
      <PublicSEO
        pageKey="b2bSelfService"
        breadcrumbs={[
          { name: 'Inicio', url: 'https://peyuchile.cl/' },
          { name: 'B2B Self-Service', url: 'https://peyuchile.cl/b2b/self-service' },
        ]}
      />
      {/* Header sticky — premium glass + glow (Liquid Dual safe) */}
      <div className="ld-glass-strong border-b border-ld-border px-3 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => step > 0 && !propuesta ? setStep(step - 1) : navigate(-1)}
            className="w-10 h-10 bg-white/15 hover:bg-white/25 active:bg-white/35 border border-white/20 rounded-xl flex items-center justify-center transition-all flex-shrink-0 backdrop-blur-md"
            aria-label="Atrás"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
              <Wand2 className="w-4 h-4 text-amber-950" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-poppins font-extrabold text-white leading-none tracking-tight truncate">Propuesta Self-Service</p>
              <p className="text-[10px] sm:text-[11px] text-white/70 leading-none mt-1 truncate">
                <span className="hidden sm:inline">Genera y descarga tu propuesta al instante · </span>
                <span className="font-semibold text-teal-200">Paso {step + 1}/{STEPS.length}</span>
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Steps indicator premium */}
        <StepperProgress steps={STEPS} current={step} />

        {/* STEP 0 — Productos */}
        {step === 0 && (
          <div className="space-y-5">
            {/* Hero del step — más visual */}
            <div className="bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-transparent border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/15 border border-teal-400/30 px-2.5 py-1 rounded-full mb-3">
                  <ShoppingBag className="w-3 h-3" /> Catálogo B2B
                </div>
                <h2 className="text-2xl sm:text-3xl font-poppins font-extrabold text-white tracking-tight leading-tight">
                  Arma tu pedido corporativo
                </h2>
                <p className="text-white/65 text-sm mt-1.5 max-w-xl leading-relaxed">
                  Selecciona productos, ajusta cantidades y genera tu propuesta personalizada con mockup IA en menos de 1 minuto.
                </p>
              </div>
            </div>

            {/* Filtro categoría — chips premium · scroll horizontal sticky bajo el header en móvil */}
            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide sticky top-[60px] z-30 lg:static ld-glass-strong lg:bg-transparent lg:backdrop-blur-none rounded-none lg:rounded-none">
              {categorias.map(cat => {
                const active = filtroCategoria === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFiltroCategoria(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                      active
                        ? 'bg-gradient-to-br from-teal-400 to-cyan-500 text-white border-teal-300/50 shadow-lg shadow-teal-500/30 scale-105'
                        : 'bg-white/[0.06] text-white/65 border-white/10 hover:bg-white/[0.10] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {cat === 'todos' ? '✨ Todos' : cat}
                  </button>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-5 lg:gap-6">
              {/* Catálogo */}
              <div>
                {loadingCat ? (
                  <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden animate-pulse">
                        <div className="aspect-square bg-white/5" />
                        <div className="p-4 space-y-2">
                          <div className="h-3 bg-white/10 rounded w-3/4" />
                          <div className="h-2 bg-white/10 rounded w-1/2" />
                          <div className="h-6 bg-white/10 rounded w-1/3 mt-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : catalogoFiltrado.length === 0 ? (
                  <div className="text-center py-16 bg-white/[0.03] border border-white/10 rounded-3xl">
                    <Package className="w-10 h-10 text-white/30 mx-auto mb-3" />
                    <p className="text-white/60 text-sm font-medium">No hay productos en esta categoría</p>
                    <button onClick={() => setFiltroCategoria('todos')} className="text-teal-300 text-xs font-bold mt-2 hover:underline">Ver todos</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {catalogoFiltrado.map(p => (
                      <SelfServiceProductCard
                        key={p.id}
                        producto={p}
                        inCart={cart.find(c => c.producto.id === p.id)}
                        onAdd={addToCart}
                        onUpdateQty={updateQty}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Carrito — solo desktop (sidebar sticky con botón de avanzar integrado) */}
              <div className="hidden lg:block sticky top-24 self-start">
                <CartPanel
                  cart={cart}
                  calcPrice={calcPrice}
                  updateQty={updateQty}
                  setQty={setQty}
                  removeFromCart={removeFromCart}
                  subtotalEstimado={subtotalEstimado}
                  onContinue={() => setStep(1)}
                  continueLabel="Continuar"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 — Empresa */}
        {step === 1 && (
          <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-5 lg:gap-6 items-start">
            <div className="space-y-5 max-w-2xl">
              <div className="bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-transparent border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
                <div className="relative">
                  {/* Confirmación del producto anclado — el cliente ve QUE su producto
                      no se perdió. Onboarding premium 360°. */}
                  {anchorProducto && (
                    <div className="mb-4">
                      <AnchorProductBanner producto={anchorProducto} cantidadTotal={cart.reduce((s, c) => s + c.cantidad, 0)} itemsCount={cart.length} />
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-1 rounded-full mb-3">
                    <Building2 className="w-3 h-3" /> Datos de la empresa
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-poppins font-extrabold text-white tracking-tight leading-tight">
                    ¿A nombre de quién?
                  </h2>
                  <p className="text-white/65 text-sm mt-1.5 leading-relaxed">
                    Los necesitamos para emitir la propuesta oficial y la factura electrónica.
                  </p>
                  {anchorProducto && (
                    <button
                      onClick={() => setStep(0)}
                      className="text-xs font-bold text-teal-300 hover:text-teal-200 mt-3 inline-flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar más productos
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-sm">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { k: 'contact_name', label: 'Nombre contacto', required: true, ph: 'Tu nombre completo' },
                    { k: 'company_name', label: 'Empresa', required: true, ph: 'Nombre empresa' },
                    { k: 'email', label: 'Email', required: true, ph: 'correo@empresa.cl', type: 'email' },
                    { k: 'rut', label: 'RUT Empresa', ph: '12.345.678-9' },
                  ].map(f => (
                    <div key={f.k} className={f.k === 'rut' ? 'md:col-span-2' : ''}>
                      <label className="text-[10px] font-bold text-white/55 uppercase tracking-[0.1em] mb-1.5 flex items-center gap-1">
                        {f.label}
                        {f.required && <span className="text-teal-300">*</span>}
                      </label>
                      <Input
                        type={f.type || 'text'}
                        value={form[f.k]}
                        onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                        placeholder={f.ph}
                        className="h-12 rounded-xl bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus-visible:border-teal-400/60 focus-visible:bg-white/[0.10] transition-all"
                      />
                    </div>
                  ))}
                  {/* Teléfono con selector de país LATAM (+56 fijo por defecto) */}
                  <div>
                    <label className="text-[10px] font-bold text-white/55 uppercase tracking-[0.1em] mb-1.5 block">
                      Teléfono
                    </label>
                    <PhoneCountryInput
                      value={form.phone}
                      onChange={(val) => setForm({ ...form, phone: val })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-white/55 uppercase tracking-[0.1em] mb-1.5 block">
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Packaging especial, fecha requerida, otra información relevante..."
                      className="w-full h-24 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder:text-white/30 px-3.5 py-2.5 resize-none focus:outline-none focus:border-teal-400/60 focus:bg-white/[0.10] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Cross-sell estratégico — visible en móvil (el sidebar es solo desktop) */}
              <div className="lg:hidden">
                <CrossSellCarousel catalogo={catalogo} cart={cart} onAdd={addToCart} />
              </div>
            </div>

            {/* Resumen pedido + cross-sell estratégico (sticky desktop) */}
            <div className="hidden lg:block sticky top-24 self-start space-y-4">
              <CartPanel
                cart={cart}
                calcPrice={calcPrice}
                updateQty={updateQty}
                setQty={setQty}
                removeFromCart={removeFromCart}
                subtotalEstimado={subtotalEstimado}
              />
              <CrossSellCarousel catalogo={catalogo} cart={cart} onAdd={addToCart} />
            </div>
          </div>
        )}

        {/* STEP 2 — Personalización */}
        {step === 2 && (
          <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-5 lg:gap-6 items-start">
            <div className="space-y-5 max-w-2xl">
              {anchorProducto && (
                <AnchorProductBanner producto={anchorProducto} cantidadTotal={cart.reduce((s, c) => s + c.cantidad, 0)} itemsCount={cart.length} />
              )}
              <div className="bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2.5 py-1 rounded-full mb-3">
                    <Sparkles className="w-3 h-3" /> Personalización
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-poppins font-extrabold text-white tracking-tight leading-tight">
                    ¿Llevas tu logo grabado?
                  </h2>
                  <p className="text-white/65 text-sm mt-1.5 leading-relaxed">
                    Grabado láser UV <span className="text-amber-300 font-semibold">gratis</span> desde 10 unidades. Acabado profesional, permanente y sostenible.
                  </p>
                </div>
              </div>

              {/* Toggle cards premium */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPersonalizar(true)}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all overflow-hidden ${
                    personalizar
                      ? 'border-teal-400 bg-gradient-to-br from-teal-500/25 to-cyan-500/15 shadow-lg shadow-teal-500/20'
                      : 'border-white/15 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.07]'
                  }`}
                >
                  {personalizar && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-3 h-3 text-slate-900" strokeWidth={3} />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-amber-500/30">
                    <Sparkles className="w-5 h-5 text-amber-950" />
                  </div>
                  <p className="font-poppins font-bold text-sm text-white">Sí, con mi logo</p>
                  <p className="text-[10px] text-white/55 mt-1">Láser UV · gratis</p>
                </button>
                <button
                  onClick={() => { setPersonalizar(false); setArchivo(null); }}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all overflow-hidden ${
                    !personalizar
                      ? 'border-teal-400 bg-gradient-to-br from-teal-500/25 to-cyan-500/15 shadow-lg shadow-teal-500/20'
                      : 'border-white/15 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.07]'
                  }`}
                >
                  {!personalizar && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-3 h-3 text-slate-900" strokeWidth={3} />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-2.5">
                    <Package className="w-5 h-5 text-white/80" />
                  </div>
                  <p className="font-poppins font-bold text-sm text-white">Sin personalización</p>
                  <p className="text-[10px] text-white/55 mt-1">Producto estándar</p>
                </button>
              </div>

              {personalizar && (
                <div
                  onClick={() => document.getElementById('ss-logo').click()}
                  className={`border-2 border-dashed rounded-3xl p-7 sm:p-8 text-center cursor-pointer transition-all backdrop-blur-sm ${
                    archivo
                      ? 'border-teal-400/60 bg-teal-500/10'
                      : 'border-white/20 bg-white/[0.03] hover:border-amber-400/60 hover:bg-amber-500/5'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
                    archivo ? 'bg-teal-500/25 border border-teal-400/40' : 'bg-white/5 border border-white/15'
                  }`}>
                    <Upload className={`w-6 h-6 ${archivo ? 'text-teal-300' : 'text-white/50'}`} />
                  </div>
                  {archivo ? (
                    <>
                      <p className="text-sm font-bold text-teal-300">✓ {archivo.name}</p>
                      <button type="button" onClick={e => { e.stopPropagation(); setArchivo(null); }}
                        className="text-[11px] text-white/55 underline mt-2 hover:text-white">Cambiar archivo</button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-white font-semibold">Sube tu logo</p>
                      <p className="text-xs text-white/50 mt-1.5">PNG, JPG, SVG · Máx 5MB</p>
                      <p className="text-[10px] text-white/35 mt-2 italic">Si no subes nada, grabaremos el nombre de tu empresa</p>
                    </>
                  )}
                  <input id="ss-logo" type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={e => setArchivo(e.target.files?.[0] || null)} />
                </div>
              )}

              {/* Posición del grabado — clave para que el logo no quede donde no es */}
              {personalizar && (
                <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
                  <EngravingPositionPicker
                    value={posicionGrabado}
                    onChange={setPosicionGrabado}
                    areaLaser={cart[0]?.producto?.area_laser_mm}
                  />
                  <p className="text-[10px] text-white/40 mt-2.5">
                    Dónde irá tu logo grabado sobre el producto. Podrás ajustarlo y regenerar el mockup después.
                  </p>
                </div>
              )}

              {/* Método de entrega: retiro o despacho */}
              <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-sm">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-1 rounded-full mb-4">
                  <Package className="w-3 h-3" /> ¿Cómo recibes tu pedido?
                </div>
                <DeliveryMethodPicker
                  metodo={entrega.metodo}
                  direccion={entrega.direccion}
                  comuna={entrega.comuna}
                  onChange={setEntrega}
                />
              </div>

              {/* Benefits — visualmente premium */}
              <div className="bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-transparent border border-teal-400/25 rounded-3xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                    <Zap className="w-4 h-4 text-amber-950" />
                  </div>
                  <p className="font-poppins font-bold text-white text-sm">Al generar tu propuesta:</p>
                </div>
                <ul className="space-y-2 text-xs text-white/75">
                  {[
                    'Mockup realista con IA de tu logo sobre el producto',
                    'Cálculo automático de precios por volumen',
                    'PDF oficial con términos y condiciones',
                    'Descarga inmediata + envío por email',
                  ].map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-teal-300 flex-shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="bg-red-500/15 border border-red-400/40 text-red-300 px-4 py-3 rounded-2xl text-sm backdrop-blur-sm">{error}</div>
              )}
            </div>

            {/* Resumen pedido (sticky desktop) — botón Generar cotización integrado */}
            <div className="hidden lg:block sticky top-24 self-start">
              <CartPanel
                cart={cart}
                calcPrice={calcPrice}
                updateQty={updateQty}
                setQty={setQty}
                removeFromCart={removeFromCart}
                subtotalEstimado={subtotalEstimado}
                onContinue={handleGenerar}
                continueLabel={generando ? 'Generando…' : 'Generar cotización'}
              />
            </div>
          </div>
        )}

        {/* STEP 3 — Resultado / Celebración */}
        {step === 3 && propuesta && (
          <div className="space-y-5 max-w-3xl mx-auto">
            {/* Hero celebración */}
            <div className="relative bg-gradient-to-br from-teal-600/40 via-cyan-600/30 to-emerald-700/40 border border-teal-400/40 rounded-3xl p-6 sm:p-8 md:p-10 text-center backdrop-blur-xl overflow-hidden shadow-2xl shadow-teal-500/20">
              {/* Glow decoration */}
              <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-teal-500/40 ring-4 ring-white/10 ring-offset-4 ring-offset-transparent animate-in zoom-in duration-500">
                  <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl sm:text-4xl font-poppins font-extrabold text-white mb-2 tracking-tight">¡Propuesta lista! 🎉</h2>
                <p className="text-white/75 text-sm sm:text-base mb-1">Generada en menos de 60 segundos</p>
                <p className="text-white/50 text-xs">N° <span className="font-mono font-bold text-teal-200">{propuesta.numero}</span></p>

                {/* KPI cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto mt-6">
                  {[
                    { label: 'Total', val: `$${propuesta.total.toLocaleString('es-CL')}`, color: 'from-teal-400 to-cyan-500' },
                    { label: 'Lead time', val: `${propuesta.lead_time_dias} días`, color: 'from-amber-400 to-yellow-500' },
                    { label: 'Ítems', val: propuesta.items?.length || 0, color: 'from-cyan-400 to-blue-500' },
                  ].map((k, i) => (
                    <div key={i} className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/15 hover:bg-white/[0.12] transition">
                      <p className="text-[9px] sm:text-[10px] text-white/55 uppercase tracking-wider font-bold mb-1">{k.label}</p>
                      <p className={`font-poppins font-extrabold text-sm sm:text-xl bg-gradient-to-r ${k.color} bg-clip-text text-transparent tabular-nums leading-tight`}>
                        {k.val}
                      </p>
                    </div>
                  ))}
                </div>

                {(mockupActual || propuesta.mockup_urls?.length > 0) && (
                  <div className="mt-6 max-w-sm mx-auto">
                    <div className="relative rounded-2xl overflow-hidden border border-white/25 shadow-xl">
                      <img src={mockupActual || propuesta.mockup_urls[0]} alt="Mockup propuesta" className="w-full h-auto block" />
                      {regenerando && (
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-7 h-7 text-teal-300 animate-spin" />
                          <p className="text-xs text-white/80 font-semibold">Regenerando mockup…</p>
                        </div>
                      )}
                      <p className="text-[10px] text-white/70 py-2 bg-white/[0.06] border-t border-white/10 font-medium">
                        ✨ Mockup generado con IA
                      </p>
                    </div>

                    {/* Regenerar: el logo quedó donde no es → reposicionar */}
                    <div className="mt-3 bg-white/[0.06] border border-white/15 rounded-2xl p-3">
                      <p className="text-[11px] text-white/70 font-semibold mb-2 flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                        ¿El logo quedó mal ubicado? Reposiciónalo:
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'arriba', label: 'Arriba' },
                          { id: 'centro', label: 'Centro' },
                          { id: 'abajo', label: 'Abajo' },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            disabled={regenerando}
                            onClick={() => handleRegenerarMockup(opt.id)}
                            className={`text-[11px] font-bold py-2 rounded-xl border transition-all disabled:opacity-40 ${
                              posicionGrabado === opt.id
                                ? 'border-teal-400 bg-teal-500/20 text-teal-200'
                                : 'border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTAs principales */}
            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                onClick={handleDescargarPDF}
                disabled={descargando}
                size="lg"
                className="h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-bold gap-2 shadow-xl shadow-teal-500/30 transition-all hover:shadow-teal-500/50 hover:scale-[1.02]"
              >
                {descargando ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generando PDF...</>
                ) : (
                  <><Download className="w-5 h-5" /> Descargar PDF</>
                )}
              </Button>
              <Link to={`/b2b/propuesta?id=${propuesta.proposal_id}`}>
                <Button size="lg" variant="outline" className="w-full h-14 rounded-2xl border-white/25 bg-white/[0.04] text-white hover:bg-white/10 hover:border-white/40 font-bold gap-2 backdrop-blur-md">
                  <FileText className="w-5 h-5" /> Ver online
                </Button>
              </Link>
            </div>

            {anchorProducto && (
              <AnchorProductBanner producto={anchorProducto} cantidadTotal={cart.reduce((s, c) => s + c.cantidad, 0)} itemsCount={cart.length} />
            )}

            {/* Envío multicanal: Email · WhatsApp · Ambos */}
            <ProposalDeliveryActions propuesta={propuesta} form={form} />

            <Link to="/shop">
              <Button variant="ghost" className="w-full text-white/55 hover:text-white hover:bg-white/5 rounded-xl">
                ← Volver a la tienda
              </Button>
            </Link>
          </div>
        )}

        {/* Footer nav — sticky en móvil, glass premium.
            En STEP 0 móvil se OCULTA: la bottom bar fija (MobileOrderBar) maneja el avance. */}
        {step < 3 && (
          <div
            className={`lg:relative fixed bottom-0 inset-x-0 lg:inset-auto bg-slate-900/90 lg:bg-transparent backdrop-blur-2xl lg:backdrop-blur-none border-t lg:border-t border-white/15 lg:border-white/10 px-3 lg:px-0 py-3 lg:pt-4 z-30 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.4)] lg:shadow-none ${step === 0 ? 'hidden lg:block' : ''}`}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
          >
            <div className="flex items-center justify-between gap-2 sm:gap-3 max-w-6xl mx-auto">
              <Button
                onClick={() => setStep(Math.max(0, step - 1))}
                variant="outline"
                disabled={step === 0}
                className="rounded-xl border-white/20 bg-white/[0.04] text-white hover:bg-white/10 hover:border-white/30 h-12 backdrop-blur-md disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline font-semibold">Atrás</span>
              </Button>
              {step < 2 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canContinue(step)}
                  className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 active:from-teal-600 active:to-cyan-700 text-white font-bold gap-2 h-12 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all px-5 sm:px-7 disabled:opacity-40 disabled:shadow-none"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerar}
                  disabled={generando}
                  className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 hover:from-teal-500 hover:via-cyan-600 hover:to-blue-600 text-white font-bold gap-2 shadow-xl shadow-teal-500/40 hover:shadow-teal-500/60 transition-all h-12 px-4 sm:px-7"
                >
                  {generando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">Generando propuesta...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">Generar propuesta</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar fija (solo móvil, step 0) — siempre visible con subtotal */}
      {step === 0 && (
        <MobileOrderBar
          cart={cart}
          subtotalEstimado={subtotalEstimado}
          onOpen={() => setCartOpen(true)}
        />
      )}

      {/* Drawer del carrito (solo móvil) — premium glass */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-[70]" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setCartOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-t border-white/20 rounded-t-[2rem] shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-5 pb-4 pt-2 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400/30 to-cyan-500/30 border border-teal-400/40 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <h3 className="font-poppins font-extrabold text-white text-base leading-none">Tu pedido</h3>
                  <p className="text-[10px] text-white/55 mt-0.5">{cart.length} {cart.length === 1 ? 'producto' : 'productos'}</p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <CartPanel
                cart={cart}
                calcPrice={calcPrice}
                updateQty={updateQty}
                setQty={setQty}
                removeFromCart={removeFromCart}
                subtotalEstimado={subtotalEstimado}
                compact
              />
            </div>

            {cart.length > 0 && (
              <div
                className="border-t border-white/10 p-4 flex-shrink-0 bg-slate-950/50 backdrop-blur-md"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
              >
                <Button
                  onClick={() => { setCartOpen(false); setStep(1); }}
                  className="w-full rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-bold gap-2 h-14 text-base shadow-lg shadow-teal-500/30"
                >
                  Generar cotización · {cart.length} producto{cart.length > 1 ? 's' : ''}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}