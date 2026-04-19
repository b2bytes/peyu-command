import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, ArrowRight, Building2, Plus, Minus, Trash2, Upload,
  Sparkles, Download, CheckCircle, FileText, Loader2, Zap, Package, Wand2
} from 'lucide-react';

const STEPS = ['Productos', 'Empresa', 'Personalización', 'Propuesta'];

function calcPrice(base, qty) {
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

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(list => {
        const b2b = (list || []).filter(p => p.canal === 'B2B Exclusivo' || p.canal === 'B2B + B2C');
        setCatalogo(b2b);
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

  const subtotalEstimado = cart.reduce((s, c) => {
    const base = c.producto.precio_base_b2b || c.producto.precio_b2c || 5000;
    return s + (calcPrice(base, c.cantidad) * c.cantidad);
  }, 0);

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
        precio_base: c.producto.precio_base_b2b || c.producto.precio_b2c || 5000,
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
    <div className="flex-1 overflow-auto font-inter">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border-b border-white/20 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => step > 0 && !propuesta ? setStep(step - 1) : navigate(-1)}
            className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-yellow-300" />
            <div>
              <p className="text-sm font-poppins font-bold text-white leading-none">Propuesta Self-Service</p>
              <p className="text-[10px] text-white/60 leading-none mt-0.5">Genera y descarga tu propuesta al instante</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-2xl p-3">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-teal-400' : 'bg-white/15'}`} />
              <span className={`text-[10px] font-bold whitespace-nowrap ${i === step ? 'text-teal-300' : 'text-white/40'}`}>
                {i + 1}. {label}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 0 — Productos */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-poppins font-bold text-white">Arma tu pedido corporativo</h2>
              <p className="text-white/60 text-sm">Selecciona productos, ajusta cantidades, y genera tu propuesta en 1 minuto.</p>
            </div>

            {/* Filtro categoría */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categorias.map(cat => (
                <button key={cat} onClick={() => setFiltroCategoria(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filtroCategoria === cat ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
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
                  <div className="grid sm:grid-cols-2 gap-3">
                    {catalogoFiltrado.map(p => {
                      const inCart = cart.find(c => c.producto.id === p.id);
                      const precioBase = p.precio_base_b2b || p.precio_b2c || 5000;
                      return (
                        <div key={p.id} className={`bg-white/5 border rounded-2xl p-4 backdrop-blur-sm transition-all ${inCart ? 'border-teal-400/60 bg-teal-500/10' : 'border-white/15 hover:border-white/30'}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm text-white truncate">{p.nombre}</h3>
                              <p className="text-[10px] text-white/40 font-mono mt-0.5">{p.sku}</p>
                            </div>
                            {p.categoria && (
                              <span className="text-[9px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full whitespace-nowrap">{p.categoria}</span>
                            )}
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-xs text-white/50">Desde 10 u.</p>
                              <p className="font-poppins font-bold text-lg text-white">${precioBase.toLocaleString('es-CL')}</p>
                            </div>
                            <button onClick={() => addToCart(p)}
                              className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all">
                              <Plus className="w-3.5 h-3.5" /> {inCart ? 'Agregado' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Carrito */}
              <div className="bg-white/5 border border-white/15 rounded-2xl p-4 backdrop-blur-sm sticky top-24 self-start">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-teal-400" />
                  <h3 className="font-bold text-white text-sm">Tu pedido ({cart.length})</h3>
                </div>
                {cart.length === 0 ? (
                  <p className="text-white/40 text-xs text-center py-6">Agrega productos desde el catálogo.</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {cart.map(c => {
                      const base = c.producto.precio_base_b2b || c.producto.precio_b2c || 5000;
                      const unitario = calcPrice(base, c.cantidad);
                      return (
                        <div key={c.producto.id} className="bg-white/5 rounded-xl p-2.5 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-white truncate flex-1">{c.producto.nombre}</p>
                            <button onClick={() => removeFromCart(c.producto.id)} className="text-white/40 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center bg-white/10 rounded-lg">
                              <button onClick={() => updateQty(c.producto.id, -10)} className="w-7 h-7 text-white hover:bg-white/10 rounded-l-lg">−</button>
                              <input type="number" value={c.cantidad} onChange={e => setQty(c.producto.id, e.target.value)}
                                className="w-14 h-7 text-center text-white text-xs bg-transparent focus:outline-none" />
                              <button onClick={() => updateQty(c.producto.id, 10)} className="w-7 h-7 text-white hover:bg-white/10 rounded-r-lg">+</button>
                            </div>
                            <p className="text-xs font-bold text-teal-300">${(unitario * c.cantidad).toLocaleString('es-CL')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {cart.length > 0 && (
                  <div className="border-t border-white/10 mt-3 pt-3 space-y-1">
                    <div className="flex justify-between text-xs text-white/60">
                      <span>Subtotal estimado</span>
                      <span className="font-bold text-white">${subtotalEstimado.toLocaleString('es-CL')}</span>
                    </div>
                    <p className="text-[10px] text-white/40">IVA incluido · descuento por volumen aplicado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 — Empresa */}
        {step === 1 && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="text-2xl font-poppins font-bold text-white">Datos de tu empresa</h2>
              <p className="text-white/60 text-sm">Los necesitamos para emitir la propuesta y la factura.</p>
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
              <h2 className="text-2xl font-poppins font-bold text-white">Personalización con tu logo</h2>
              <p className="text-white/60 text-sm">Grabado láser UV gratis desde 10 unidades. Opcional.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPersonalizar(true)}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${personalizar ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-white/40'}`}>
                <Sparkles className="w-5 h-5 mx-auto mb-2 text-yellow-300" />
                <p className="font-bold text-sm text-white">Sí, con logo</p>
                <p className="text-[10px] text-white/50 mt-0.5">Láser UV gratis</p>
              </button>
              <button onClick={() => { setPersonalizar(false); setArchivo(null); }}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${!personalizar ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-white/40'}`}>
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
            <div className="bg-gradient-to-br from-teal-600/30 to-emerald-700/30 border border-teal-400/40 rounded-3xl p-6 md:p-8 text-center backdrop-blur-sm">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-teal-500/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-poppins font-bold text-white mb-2">¡Propuesta lista!</h2>
              <p className="text-white/70 text-sm mb-4">N° <span className="font-mono font-bold text-teal-300">{propuesta.numero}</span></p>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-6">
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <p className="text-[10px] text-white/50 uppercase">Total</p>
                  <p className="font-poppins font-bold text-white text-lg">${propuesta.total.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <p className="text-[10px] text-white/50 uppercase">Lead time</p>
                  <p className="font-poppins font-bold text-white text-lg">{propuesta.lead_time_dias}d</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <p className="text-[10px] text-white/50 uppercase">Ítems</p>
                  <p className="font-poppins font-bold text-white text-lg">{propuesta.items?.length || 0}</p>
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
              <Button onClick={handleDescargarPDF} disabled={descargando} size="lg"
                className="h-14 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold gap-2 shadow-xl">
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

            <div className="bg-white/5 border border-white/15 rounded-2xl p-4 backdrop-blur-sm text-center">
              <p className="text-xs text-white/70">
                También te enviamos la propuesta por email a <span className="font-bold text-white">{form.email}</span>.
                Nuestro equipo se pondrá en contacto en menos de 24h para coordinar.
              </p>
            </div>

            <Link to="/shop">
              <Button variant="ghost" className="w-full text-white/60 hover:text-white">Volver al inicio</Button>
            </Link>
          </div>
        )}

        {/* Footer nav (no en step 3) */}
        {step < 3 && (
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
            <Button onClick={() => setStep(Math.max(0, step - 1))} variant="outline"
              disabled={step === 0}
              className="rounded-xl border-white/30 text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Atrás
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canContinue(step)}
                className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold gap-2">
                Continuar <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleGenerar} disabled={generando}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold gap-2 shadow-lg">
                {generando ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generando propuesta + mockup IA...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Generar propuesta y PDF</>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}