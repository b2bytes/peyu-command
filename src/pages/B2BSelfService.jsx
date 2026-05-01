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
import PublicSEO from '@/components/PublicSEO';

const STEPS = ['Productos', 'Empresa', 'Personalización', 'Propuesta'];

// Precio por volumen basado en la TABLA REAL del producto (misma que ProductoDetalle).
// Fallback a descuentos genéricos solo si el producto no tiene precios de volumen configurados.
function calcPrice(producto, qty) {
  if (!producto) return 0;
  const base = producto.precio_base_b2b || producto.precio_b2c || 5000;
  if (qty >= 500 && producto.precio_500_mas) return producto.precio_500_mas;
  if (qty >= 200 && producto.precio_200_499) return producto.precio_200_499;
  if (qty >= 50 && producto.precio_50_199) return producto.precio_50_199;
  if (qty >= 10 && producto.precio_base_b2b) return producto.precio_base_b2b;
  // Fallback si no hay tabla: descuentos porcentuales suaves sobre precio_b2c
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

  // Empresa
  const [form, setForm] = useState({
    contact_name: '', company_name: '', email: '', phone: '', rut: '', notes: '',
  });

  // Personalización
  const [personalizar, setPersonalizar] = useState(true);
  const [archivo, setArchivo] = useState(null);

  // Resultado
  const [generando, setGenerando] = useState(false);
  const [propuesta, setPropuesta] = useState(null);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState(false);

  // Drawer del carrito (solo móvil)
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(list => {
        const b2b = (list || []).filter(p => p.canal === 'B2B Exclusivo' || p.canal === 'B2B + B2C');
        setCatalogo(b2b);

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

  const categorias = ['todos', ...Array.from(new Set(catalogo.map(p => p.categoria).filter(Boolean)))];
  const catalogoFiltrado = filtroCategoria === 'todos' ? catalogo : catalogo.filter(p => p.categoria === filtroCategoria);

  const addToCart = (producto) => {
    const exists = cart.find(c => c.producto.id === producto.id);
    if (exists) {
      setCart(cart.map(c => c.producto.id === producto.id ? { ...c, cantidad: c.cantidad + 10 } : c));
    } else {
      setCart([...cart, { producto, cantidad: 10 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(c => c.producto.id === id ? { ...c, cantidad: Math.max(10, c.cantidad + delta) } : c));
  };

  const setQty = (id, val) => {
    setCart(cart.map(c => c.producto.id === id ? { ...c, cantidad: Math.max(10, parseInt(val) || 10) } : c));
  };

  const removeFromCart = (id) => setCart(cart.filter(c => c.producto.id !== id));

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
        imagen_url: c.producto.imagen_url || '',
        categoria: c.producto.categoria,
        personalizacion: personalizar,
      }));

      const res = await base44.functions.invoke('createSelfServiceProposal', {
        ...form,
        items,
        logoUrl,
        notes: form.notes,
      });

      if (res?.data?.error) throw new Error(res.data.error);
      if (!res?.data?.proposal_id) throw new Error('No se pudo generar la propuesta');

      setPropuesta(res.data);
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

  return (
    <div className="flex-1 overflow-auto font-inter pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:pb-8">
      <PublicSEO
        pageKey="b2bSelfService"
        breadcrumbs={[
          { name: 'Inicio', url: 'https://peyuchile.cl/' },
          { name: 'B2B Self-Service', url: 'https://peyuchile.cl/b2b/self-service' },
        ]}
      />
      {/* Header sticky */}
      <div className="bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border-b border-white/20 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => step > 0 && !propuesta ? setStep(step - 1) : navigate(-1)}
            className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 active:bg-white/40 flex-shrink-0"
            aria-label="Atrás"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Wand2 className="w-5 h-5 text-yellow-300 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-poppins font-bold text-white leading-none truncate">Propuesta Self-Service</p>
              <p className="text-[10px] text-white/60 leading-none mt-0.5 hidden sm:block">Genera y descarga tu propuesta al instante</p>
              <p className="text-[10px] text-white/60 leading-none mt-0.5 sm:hidden">Paso {step + 1} de {STEPS.length}</p>
            </div>
          </div>
        </div>

        {/* Botón carrito (solo móvil, steps 0-2) */}
        {step === 0 && cart.length > 0 && (
          <button
            onClick={() => setCartOpen(true)}
            className="lg:hidden relative flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{cart.length}</span>
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-yellow-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
              {cart.reduce((s, c) => s + c.cantidad, 0)}
            </span>
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Steps indicator — compacto en móvil */}
        <div className="bg-white/5 border border-white/15 rounded-2xl p-2.5 sm:p-3">
          {/* Desktop: barras con label */}
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex-1 flex items-center gap-2">
                <div className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-teal-400' : 'bg-white/15'}`} />
                <span className={`text-[10px] font-bold whitespace-nowrap ${i === step ? 'text-teal-300' : 'text-white/40'}`}>
                  {i + 1}. {label}
                </span>
              </div>
            ))}
          </div>
          {/* Móvil: solo barras + label actual */}
          <div className="sm:hidden">
            <div className="flex items-center gap-1.5 mb-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-teal-400' : 'bg-white/15'}`} />
              ))}
            </div>
            <p className="text-[11px] font-bold text-teal-300 text-center">
              {step + 1}/{STEPS.length} · {STEPS[step]}
            </p>
          </div>
        </div>

        {/* STEP 0 — Productos */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-poppins font-bold text-white">Arma tu pedido corporativo</h2>
              <p className="text-white/60 text-xs sm:text-sm">Selecciona productos, ajusta cantidades, y genera tu propuesta en 1 minuto.</p>
            </div>

            {/* Filtro categoría */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filtroCategoria === cat ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 active:bg-white/25'}`}
                >
                  {cat === 'todos' ? 'Todos' : cat}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_380px] gap-6">
              {/* Catálogo */}
              <div>
                {loadingCat ? (
                  <div className="text-center py-16 text-white/60">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Cargando catálogo...
                  </div>
                ) : catalogoFiltrado.length === 0 ? (
                  <div className="text-center py-16 text-white/60">No hay productos en esta categoría.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catalogoFiltrado.map(p => {
                      const inCart = cart.find(c => c.producto.id === p.id);
                      const precioBase = p.precio_base_b2b || p.precio_b2c || 5000;
                      return (
                        <div key={p.id} className={`bg-white/5 border rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm transition-all ${inCart ? 'border-teal-400/60 bg-teal-500/10' : 'border-white/15 hover:border-white/30'}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm text-white line-clamp-2">{p.nombre}</h3>
                              <p className="text-[10px] text-white/40 font-mono mt-0.5">{p.sku}</p>
                            </div>
                            {p.categoria && (
                              <span className="text-[9px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">{p.categoria}</span>
                            )}
                          </div>
                          <div className="flex items-end justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[10px] text-white/50">Desde 10 u.</p>
                              <p className="font-poppins font-bold text-base sm:text-lg text-white">${precioBase.toLocaleString('es-CL')}</p>
                            </div>
                            <button
                              onClick={() => addToCart(p)}
                              className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1 transition-all flex-shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" /> {inCart ? 'Agregado' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Carrito — solo desktop (sidebar sticky) */}
              <div className="hidden lg:block sticky top-24 self-start">
                <CartPanel
                  cart={cart}
                  calcPrice={calcPrice}
                  updateQty={updateQty}
                  setQty={setQty}
                  removeFromCart={removeFromCart}
                  subtotalEstimado={subtotalEstimado}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 — Empresa */}
        {step === 1 && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="text-xl sm:text-2xl font-poppins font-bold text-white">Datos de tu empresa</h2>
              <p className="text-white/60 text-xs sm:text-sm">Los necesitamos para emitir la propuesta y la factura.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { k: 'contact_name', label: 'Nombre contacto *', ph: 'Tu nombre' },
                { k: 'company_name', label: 'Empresa *', ph: 'Nombre empresa' },
                { k: 'email', label: 'Email *', ph: 'correo@empresa.cl', type: 'email' },
                { k: 'phone', label: 'Teléfono', ph: '+56 9 xxxx xxxx' },
                { k: 'rut', label: 'RUT Empresa', ph: '12.345.678-9' },
              ].map(f => (
                <div key={f.k}>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">{f.label}</label>
                  <Input type={f.type || 'text'} value={form[f.k]}
                    onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                    placeholder={f.ph}
                    className="h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5 block">Notas adicionales (opcional)</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Packaging especial, fecha requerida, etc."
                  className="w-full h-20 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/30 px-3 py-2 resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Personalización */}
        {step === 2 && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="text-xl sm:text-2xl font-poppins font-bold text-white">Personalización con tu logo</h2>
              <p className="text-white/60 text-xs sm:text-sm">Grabado láser UV gratis desde 10 unidades. Opcional.</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                onClick={() => setPersonalizar(true)}
                className={`p-3 sm:p-4 rounded-2xl border-2 transition-all ${personalizar ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-white/40 active:border-white/50'}`}
              >
                <Sparkles className="w-5 h-5 mx-auto mb-2 text-yellow-300" />
                <p className="font-bold text-sm text-white">Sí, con logo</p>
                <p className="text-[10px] text-white/50 mt-0.5">Láser UV gratis</p>
              </button>
              <button
                onClick={() => { setPersonalizar(false); setArchivo(null); }}
                className={`p-3 sm:p-4 rounded-2xl border-2 transition-all ${!personalizar ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-white/40 active:border-white/50'}`}
              >
                <Package className="w-5 h-5 mx-auto mb-2 text-white" />
                <p className="font-bold text-sm text-white">Sin personalización</p>
                <p className="text-[10px] text-white/50 mt-0.5">Producto estándar</p>
              </button>
            </div>

            {personalizar && (
              <div onClick={() => document.getElementById('ss-logo').click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${archivo ? 'border-teal-400 bg-teal-500/10' : 'border-white/20 hover:border-teal-400/60'}`}>
                <Upload className={`w-8 h-8 mx-auto mb-2 ${archivo ? 'text-teal-400' : 'text-white/40'}`} />
                {archivo ? (
                  <>
                    <p className="text-sm font-semibold text-teal-300">✓ {archivo.name}</p>
                    <button type="button" onClick={e => { e.stopPropagation(); setArchivo(null); }}
                      className="text-[10px] text-white/50 underline mt-1">Cambiar</button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-white/70 font-medium">Sube tu logo (opcional)</p>
                    <p className="text-xs text-white/40 mt-1">PNG, JPG, SVG — si no subes nada grabaremos el nombre de tu empresa</p>
                  </>
                )}
                <input id="ss-logo" type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg,.webp"
                  onChange={e => setArchivo(e.target.files?.[0] || null)} />
              </div>
            )}

            <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Al generar la propuesta:</p>
                  <ul className="text-xs text-white/70 mt-2 space-y-1">
                    <li>✓ Crearemos un mockup realista con IA de tu logo sobre el producto</li>
                    <li>✓ Calcularemos precios por volumen automáticamente</li>
                    <li>✓ Generaremos PDF oficial con términos y condiciones</li>
                    <li>✓ La podrás descargar al instante y compartir internamente</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/40 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}
          </div>
        )}

        {/* STEP 3 — Resultado */}
        {step === 3 && propuesta && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-teal-600/30 to-emerald-700/30 border border-teal-400/40 rounded-3xl p-5 sm:p-6 md:p-8 text-center backdrop-blur-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-teal-500/30">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-white mb-2">¡Propuesta lista!</h2>
              <p className="text-white/70 text-xs sm:text-sm mb-4">N° <span className="font-mono font-bold text-teal-300">{propuesta.numero}</span></p>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto mt-5 sm:mt-6">
                <div className="bg-white/10 rounded-xl p-2.5 sm:p-3 border border-white/15">
                  <p className="text-[9px] sm:text-[10px] text-white/50 uppercase">Total</p>
                  <p className="font-poppins font-bold text-white text-sm sm:text-lg">${propuesta.total.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 sm:p-3 border border-white/15">
                  <p className="text-[9px] sm:text-[10px] text-white/50 uppercase">Lead time</p>
                  <p className="font-poppins font-bold text-white text-sm sm:text-lg">{propuesta.lead_time_dias}d</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 sm:p-3 border border-white/15">
                  <p className="text-[9px] sm:text-[10px] text-white/50 uppercase">Ítems</p>
                  <p className="font-poppins font-bold text-white text-sm sm:text-lg">{propuesta.items?.length || 0}</p>
                </div>
              </div>

              {propuesta.mockup_urls?.length > 0 && (
                <div className="mt-5 rounded-2xl overflow-hidden border border-white/20 max-w-xs mx-auto">
                  <img src={propuesta.mockup_urls[0]} alt="Mockup" className="w-full h-auto" />
                  <p className="text-[10px] text-white/60 py-1.5 bg-white/5">✨ Mockup generado con IA</p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Button
                onClick={handleDescargarPDF}
                disabled={descargando}
                size="lg"
                className="h-14 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold gap-2 shadow-xl"
              >
                {descargando ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generando PDF...</>
                ) : (
                  <><Download className="w-5 h-5" /> Descargar PDF</>
                )}
              </Button>
              <Link to={`/b2b/propuesta?id=${propuesta.proposal_id}`}>
                <Button size="lg" variant="outline" className="w-full h-14 rounded-2xl border-white/30 text-white hover:bg-white/10 font-bold gap-2">
                  <FileText className="w-5 h-5" /> Ver online
                </Button>
              </Link>
            </div>

            <div className={`rounded-2xl p-4 backdrop-blur-sm text-center border ${propuesta.email_sent ? 'bg-emerald-500/15 border-emerald-400/40' : 'bg-white/5 border-white/15'}`}>
              {propuesta.email_sent ? (
                <p className="text-xs text-white/90 flex items-center justify-center gap-2 flex-wrap">
                  <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Propuesta enviada a <span className="font-bold text-emerald-200">{propuesta.email_to || form.email}</span>. Revisa tu bandeja (y spam).</span>
                </p>
              ) : (
                <p className="text-xs text-white/70">
                  Propuesta lista en <span className="font-bold text-white">{form.email}</span>.
                  Nuestro equipo se pondrá en contacto en menos de 24h.
                </p>
              )}
            </div>

            <Link to="/shop">
              <Button variant="ghost" className="w-full text-white/60 hover:text-white">Volver al inicio</Button>
            </Link>
          </div>
        )}

        {/* Footer nav — sticky en móvil para no tapar con bottom nav */}
        {step < 3 && (
          <div
            className="lg:relative fixed bottom-0 inset-x-0 lg:inset-auto bg-slate-900/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-t lg:border-t border-white/15 lg:border-white/10 px-3 lg:px-0 py-3 lg:pt-4 z-30"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
          >
            <div className="flex items-center justify-between gap-2 sm:gap-3 max-w-5xl mx-auto">
              <Button
                onClick={() => setStep(Math.max(0, step - 1))}
                variant="outline"
                disabled={step === 0}
                className="rounded-xl border-white/30 text-white hover:bg-white/10 h-11"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Atrás</span>
              </Button>
              {step < 2 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canContinue(step)}
                  className="flex-1 sm:flex-initial rounded-xl bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-bold gap-2 h-11"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerar}
                  disabled={generando}
                  className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold gap-2 shadow-lg h-11 px-3 sm:px-6"
                >
                  {generando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">Generando propuesta...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">Generar propuesta</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer del carrito (solo móvil) */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-[70]" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-white/15 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white">Tu pedido ({cart.length})</h3>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
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
                className="border-t border-white/10 p-3 flex-shrink-0"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
              >
                <Button
                  onClick={() => { setCartOpen(false); setStep(1); }}
                  className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-bold gap-2"
                >
                  Continuar con {cart.length} producto{cart.length > 1 ? 's' : ''} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}