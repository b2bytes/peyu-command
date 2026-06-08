import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  Building2, Loader2, ArrowRight, ArrowLeft, Recycle, Package,
  ShoppingCart, Sparkles, TrendingDown, Upload, X, Check,
} from 'lucide-react';
import LogoMockupPreview from '@/components/cotizacion/LogoMockupPreview';
import MockupGalleryB2B from '@/components/cotizacion/MockupGalleryB2B';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import QuoteProductPicker from '@/components/cotizacion/QuoteProductPicker';
import QuoteItemRow from '@/components/cotizacion/QuoteItemRow';
import QuoteContactForm from '@/components/cotizacion/QuoteContactForm';
import QuoteResultCard from '@/components/cotizacion/QuoteResultCard';
import QuoteStepper from '@/components/cotizacion/QuoteStepper';
import QuoteProductModal from '@/components/cotizacion/QuoteProductModal';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { getProductImage } from '@/utils/productImages';
import { fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// /CotizacionRapida — Flujo B2B: Productos → Datos → Revisar.
// Logo del cliente persistente en todas las etapas (mockup branding).
// ════════════════════════════════════════════════════════════════════════
const FORM_INICIAL = {
  company_name: '', rut: '', giro: '',
  contact_name: '', cargo: '', email: '', phone: '',
  direccion: '', comuna: '', delivery_date: '',
  urgency: 'Normal', personalization_needs: false, notes: '',
};

const trans = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

// Panel flotante de branding: mockup inteligente con grabado láser simulado
function LogoBrandingPanel({ logoUrl, onLogoChange, primerProducto }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onLogoChange(file_url);
    } catch {
      onLogoChange(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  }, [onLogoChange]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const productImg = primerProducto ? getProductImage(primerProducto) : null;

  return (
    <div className="bg-white border border-[#EBE3D6] rounded-2xl overflow-hidden">
      {/* Mockup inteligente */}
      <div
        className="cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !logoUrl && inputRef.current?.click()}
      >
        <LogoMockupPreview logoUrl={logoUrl} productImg={productImg} size="md" />
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#2A2420]">
            {logoUrl ? <span className="text-[#0F8B6C]">✓ Mockup listo</span> : 'Tu logo grabado en el producto'}
          </p>
          {logoUrl && (
            <button onClick={() => onLogoChange(null)}
              className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#EBE3D6] flex items-center justify-center text-[#A78B6F] hover:text-[#D96B4D] transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {uploading ? (
          <div className="h-9 flex items-center justify-center gap-2 text-xs text-[#0F8B6C]">
            <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
          </div>
        ) : logoUrl ? (
          <button onClick={() => inputRef.current?.click()}
            className="w-full text-[11px] font-semibold text-[#0F8B6C] border border-[#0F8B6C]/30 rounded-xl py-1.5 hover:bg-[#0F8B6C]/5 transition-colors">
            Cambiar logo
          </button>
        ) : (
          <button onClick={() => inputRef.current?.click()}
            className="w-full h-9 rounded-xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5" /> Subir logo (PNG/SVG/JPG)
          </button>
        )}
        <p className="text-[9px] text-[#A78B6F] text-center mt-1.5">PNG transparente · Simula grabado láser UV real</p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    </div>
  );
}

export default function CotizacionRapida() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [step, setStep] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null); // logo persistente
  const prefilledRef = useRef(false);

  const urlParams = new URLSearchParams(window.location.search);
  const urlSku = urlParams.get('sku');
  const urlQty = parseInt(urlParams.get('qty'), 10) || 50;

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 200)
      .then((data) => {
        const cotizables = (data || []).filter(
          (p) => p.sku && p.canal !== 'B2C Exclusivo' && p.categoria !== 'Gift Card'
        );
        setProductos(cotizables);
        if (urlSku && !prefilledRef.current) {
          const match = cotizables.find(p => p.sku === urlSku);
          if (match) { setItems([{ producto: match, qty: urlQty }]); prefilledRef.current = true; }
        }
      });
  }, []); // eslint-disable-line

  const selectedSkus = useMemo(() => items.map((i) => i.producto.sku), [items]);

  const totalNeto = useMemo(
    () => items.reduce((acc, it) => {
      const b2b = getB2BPriceForQty(it.producto, it.qty);
      const unit = b2b?.precio ?? getUnitBasePrice(it.producto);
      return acc + unit * it.qty;
    }, 0),
    [items]
  );
  const totalSinDesc = useMemo(
    () => items.reduce((acc, it) => acc + getUnitBasePrice(it.producto) * it.qty, 0),
    [items]
  );
  const ahorroTotal = totalSinDesc - totalNeto;
  const qtyTotal = useMemo(() => items.reduce((a, it) => a + it.qty, 0), [items]);
  const totalConIVA = Math.round(totalNeto * 1.19);

  const primerProducto = items[0]?.producto || null;

  const addProducto = (p) => setItems((prev) => [...prev, { producto: p, qty: 50 }]);
  const setQty = (sku, qty) => setItems((prev) => prev.map((it) => it.producto.sku === sku ? { ...it, qty } : it));
  const removeItem = (sku) => setItems((prev) => prev.filter((it) => it.producto.sku !== sku));

  const datosOk = form.company_name.trim() && form.rut.trim() && form.contact_name.trim() && form.email.trim() && form.phone.trim();
  const maxStep = items.length === 0 ? 0 : datosOk ? 2 : 1;

  const goTo = (s) => { setError(''); setStep(Math.min(s, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = () => {
    setError('');
    if (step === 0 && items.length === 0) { setError('Agrega al menos un producto para continuar.'); return; }
    if (step === 1 && !datosOk) { setError('Completa: empresa, RUT, nombre, email y teléfono.'); return; }
    goTo(step + 1);
  };
  const back = () => goTo(Math.max(0, step - 1));

  const enviar = async () => {
    setError('');
    if (!items.length || !datosOk) { setError('Faltan datos para enviar.'); return; }
    setEnviando(true);
    try {
      const res = await base44.functions.invoke('quickB2BQuoteV2', {
        ...form,
        logo_url: logoUrl || null,
        items: items.map((it) => ({ sku: it.producto.sku, qty: it.qty })),
      });
      if (res.data?.ok) {
        setResult(res.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res.data?.error || 'No se pudo enviar. Intenta de nuevo.');
      }
    } catch {
      setError('No se pudo enviar. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const reset = () => { setResult(null); setItems([]); setForm(FORM_INICIAL); setStep(0); setLogoUrl(null); };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420] pb-28 sm:pb-12">
      <ShopV2Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {result ? (
          <QuoteResultCard result={result} empresa={form.company_name} email={form.email} onReset={reset} logoUrl={logoUrl} />
        ) : (
          <>
            {/* Hero compacto */}
            <div className="text-center mb-5 sm:mb-8">
              <span className="inline-flex items-center gap-1.5 bg-[#0F8B6C]/10 text-[#0F8B6C] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full mb-2 sm:mb-3">
                <Building2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Cotización para empresas
              </span>
              <h1 className="font-fraunces text-2xl sm:text-4xl leading-tight mb-2 sm:mb-3">
                Tu pedido corporativo, <span className="text-[#0F8B6C]">en 3 pasos</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#4B4F54] max-w-xl mx-auto">
                Arma tu carrito, completa datos y recibe presupuesto con precios por volumen.
              </p>
            </div>

            <QuoteStepper step={step} onStep={goTo} maxStep={maxStep} />

            {/* Layout con panel de logo persistente en desktop */}
             <div className="flex gap-6 items-start mt-8">
               {/* Contenido principal */}
               <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {/* ── PASO 1 · Productos ── */}
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={trans}>
                      <div className="bg-white border border-[#EBE3D6] rounded-3xl p-6 sm:p-7">
                        <h2 className="font-bold text-lg text-[#2A2420] mb-2 flex items-center gap-2">
                          <Package className="w-5 h-5 text-[#0F8B6C]" /> Paso 1: Elige productos
                        </h2>
                        <p className="text-xs text-[#A78B6F] mb-5">
                          Navega el catálogo o busca. Haz clic para ver detalles o <strong>+</strong> para agregar. Precios por volumen en vivo.
                        </p>
                        <QuoteProductPicker
                          productos={productos}
                          selectedSkus={selectedSkus}
                          onAdd={addProducto}
                          onView={setPreview}
                        />
                      </div>

                      {items.length > 0 && (
                       <div className="mt-6 pt-4 border-t border-[#EBE3D6] space-y-3">
                          <p className="text-xs font-bold text-[#2A2420] flex items-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5 text-[#0F8B6C]" />
                            Tu carrito: {items.length} {items.length === 1 ? 'producto' : 'productos'} · {qtyTotal} unidades
                          </p>
                          {items.map((it) => (
                            <QuoteItemRow
                              key={it.producto.sku}
                              producto={it.producto}
                              qty={it.qty}
                              onQty={(q) => setQty(it.producto.sku, q)}
                              onRemove={() => removeItem(it.producto.sku)}
                              logoUrl={logoUrl}
                            />
                          ))}
                          {/* Mini resumen */}
                          <div className="bg-[#0F8B6C]/5 border border-[#0F8B6C]/15 rounded-2xl px-4 py-3 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-semibold text-[#4B4F54]">Subtotal ({qtyTotal} u)</p>
                              {ahorroTotal > 0 && (
                                <p className="text-[10px] text-[#0F8B6C] font-bold">Ahorras {fmtCLP(ahorroTotal)}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-fraunces text-xl font-bold text-[#0F8B6C]">{fmtCLP(totalNeto)}</p>
                              <p className="text-[10px] text-[#A78B6F]">+ IVA = {fmtCLP(totalConIVA)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Panel mockup en mobile */}
                      <div className="sm:hidden mt-4">
                        <MockupGalleryB2B
                          items={items.length > 0 ? items : (primerProducto ? [{ producto: primerProducto }] : [])}
                          logoUrl={logoUrl}
                          onLogoChange={setLogoUrl}
                          showUploader={true}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* ── PASO 2 · Datos ── */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={trans}>
                      <div className="bg-white border border-[#EBE3D6] rounded-3xl p-6 sm:p-7">
                        <h2 className="font-bold text-lg text-[#2A2420] mb-2 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-[#0F8B6C]" /> Paso 2: Datos de empresa
                        </h2>
                        <p className="text-xs text-[#A78B6F] mb-5">
                          Completa tu empresa, RUT, contacto y email. Un ejecutivo de PEYU te contacta en 24h hábiles.
                        </p>
                        <QuoteContactForm form={form} setForm={setForm} />
                      </div>
                      {/* Panel mockup mobile paso 2 */}
                      <div className="sm:hidden mt-4">
                        <MockupGalleryB2B
                          items={items}
                          logoUrl={logoUrl}
                          onLogoChange={setLogoUrl}
                          showUploader={true}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* ── PASO 3 · Revisar ── */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={trans}>
                      <div className="bg-white border border-[#EBE3D6] rounded-3xl p-6 sm:p-7">
                        <h2 className="font-bold text-lg text-[#2A2420] mb-5 flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5 text-[#0F8B6C]" /> Paso 3: Revisa y solicita
                        </h2>

                        {/* Líneas con mockup de logo */}
                        <div className="space-y-2.5 mb-4">
                          {items.map((it) => {
                            const b2b = getB2BPriceForQty(it.producto, it.qty);
                            const unit = b2b?.precio ?? getUnitBasePrice(it.producto);
                            const baseUnit = b2b?.baseUnit ?? getUnitBasePrice(it.producto);
                            const ahorro = b2b?.ahorroPct ?? 0;
                            const subtotalLinea = unit * it.qty;
                            const productImg = getProductImage(it.producto);

                            return (
                              <div key={it.producto.sku} className="bg-[#FAF7F2] border border-[#EBE3D6] rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                           {/* Thumb con mockup inteligente */}
                                           <div className="flex-shrink-0 rounded-lg overflow-hidden border border-[#EBE3D6]" style={{ width: '52px', height: '52px', background: '#F2ECE2' }}>
                                             <LogoMockupPreview
                                               logoUrl={logoUrl}
                                               productImg={productImg}
                                               size="sm"
                                               className="!w-full !h-full !aspect-auto"
                                               showBadge={false}
                                             />
                                           </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-[#2A2420] truncate">
                                      {it.qty}× {it.producto.nombre}
                                    </p>
                                    <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                                      <span className="text-[12px] font-bold text-[#0F8B6C]">{fmtCLP(unit)}/u</span>
                                      {ahorro > 0 && baseUnit !== unit && (
                                        <span className="text-[10px] text-[#A78B6F] line-through">{fmtCLP(baseUnit)}</span>
                                      )}
                                      {ahorro > 0 && (
                                        <span className="text-[10px] font-bold text-white bg-[#D96B4D] px-1.5 py-0.5 rounded-full">−{ahorro}%</span>
                                      )}
                                      {b2b?.label && (
                                        <span className="text-[10px] text-[#A78B6F] bg-[#EBE3D6] px-1.5 py-0.5 rounded-full">{b2b.label}</span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="font-bold text-[#2A2420] flex-shrink-0 text-sm">{fmtCLP(subtotalLinea)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Totales */}
                        <div className="border-t border-[#EBE3D6] pt-3 space-y-1.5 mb-3">
                          <div className="flex justify-between text-sm text-[#4B4F54]">
                            <span>Unidades totales</span>
                            <span className="font-bold">{qtyTotal.toLocaleString('es-CL')}</span>
                          </div>
                          {ahorroTotal > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#D96B4D]">Ahorro por volumen</span>
                              <span className="font-bold text-[#D96B4D]">−{fmtCLP(ahorroTotal)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm text-[#4B4F54]">
                            <span>Neto (sin IVA)</span>
                            <span className="font-bold">{fmtCLP(totalNeto)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-[#A78B6F]">
                            <span>IVA (19%)</span>
                            <span>{fmtCLP(totalConIVA - totalNeto)}</span>
                          </div>
                          <div className="flex justify-between items-end pt-1 border-t border-[#EBE3D6]">
                            <span className="text-sm font-bold text-[#2A2420]">Total estimado c/IVA</span>
                            <span className="font-fraunces text-2xl text-[#0F8B6C]">{fmtCLP(totalConIVA)}</span>
                          </div>
                        </div>

                        {/* Empresa */}
                        <div className="flex items-center gap-2 text-[11px] text-[#A78B6F] bg-[#0F8B6C]/5 rounded-xl px-3 py-2 mb-2">
                          <Building2 className="w-3.5 h-3.5 text-[#0F8B6C] flex-shrink-0" />
                          <span>
                            <strong className="text-[#2A2420]">{form.company_name}</strong>
                            {form.rut && <span> · RUT {form.rut}</span>}
                            {' · '}{form.contact_name} · {form.email}
                          </span>
                        </div>

                        {/* Logo confirmado */}
                        {logoUrl && (
                          <div className="flex items-center gap-2 text-[11px] text-[#0F8B6C] bg-[#0F8B6C]/5 rounded-xl px-3 py-2 mb-2">
                            <Check className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Logo incluido para mockup y grabado láser</span>
                            <img src={logoUrl} alt="logo" className="w-6 h-6 object-contain ml-auto rounded border border-[#EBE3D6]" />
                          </div>
                        )}

                        {form.personalization_needs && (
                          <div className="flex items-center gap-2 text-[11px] text-[#D96B4D] px-1">
                            <Sparkles className="w-3.5 h-3.5" /> Con personalización láser de tu logo
                          </div>
                        )}

                        <p className="text-[11px] text-[#A78B6F] text-center mt-4">
                          Precio referencial por volumen (sin IVA). Sin compromiso.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <p className="text-xs font-semibold text-[#D96B4D] bg-[#D96B4D]/10 border border-[#D96B4D]/30 rounded-xl p-3 mt-4">{error}</p>
                )}

                {/* Barra de navegación inferior */}
                 <div className="fixed sm:static bottom-0 inset-x-0 z-30 sm:z-0 bg-[#FAF7F2]/98 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-0 border-t sm:border-0 border-[#EBE3D6] px-4 sm:px-0 py-2.5 sm:py-0 sm:mt-10 pb-safe">
                   <div className="max-w-5xl mx-auto flex items-center gap-2.5 sm:gap-4">
                     {step > 0 && (
                       <button
                         onClick={back}
                         className="h-11 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-white border border-[#EBE3D6] hover:border-[#0F8B6C]/40 hover:bg-[#F8F3ED] text-[#4B4F54] font-bold text-sm flex items-center gap-1.5 transition-colors flex-shrink-0"
                       >
                         <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Atrás</span>
                       </button>
                     )}

                     {items.length > 0 && (
                       <div className="hidden sm:flex flex-col mr-auto pl-2">
                         <span className="text-[11px] text-[#A78B6F] leading-tight">{qtyTotal.toLocaleString('es-CL')} u · neto</span>
                         <span className="font-bold text-[#0F8B6C] text-sm leading-tight">{fmtCLP(totalNeto)}</span>
                       </div>
                     )}

                     {step < 2 ? (
                       <button
                         onClick={next}
                         className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-7 rounded-xl sm:rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all active:scale-[0.98]"
                       >
                         {step === 0 ? 'Continuar' : 'Revisar'} <ArrowRight className="w-4 h-4" />
                       </button>
                     ) : (
                       <button
                         onClick={enviar}
                         disabled={enviando}
                         className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-7 rounded-xl sm:rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all active:scale-[0.98]"
                       >
                         {enviando
                           ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                           : <>Solicitar <span className="hidden sm:inline">presupuesto</span> <ArrowRight className="w-4 h-4" /></>
                         }
                       </button>
                     )}
                   </div>
                 </div>

                {/* Trust badges */}
                <div className="mt-12 pt-8 border-t border-[#EBE3D6]">
                  <p className="text-xs font-bold text-[#A78B6F] uppercase tracking-wide mb-4">Ventajas PEYU</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { Icon: TrendingDown, t: 'Hasta −54%', s: 'por volumen' },
                      { Icon: Building2,    t: 'Factura',    s: 'formalizada' },
                      { Icon: Recycle,      t: '100% Reciclado', s: 'ESG incluido' },
                    ].map(({ Icon, t, s }) => (
                      <div key={t} className="text-center">
                        <div className="w-9 h-9 rounded-lg bg-[#0F8B6C]/10 flex items-center justify-center mx-auto mb-2">
                          <Icon className="w-4 h-4 text-[#0F8B6C]" />
                        </div>
                        <p className="text-xs font-bold text-[#2A2420] leading-tight">{t}</p>
                        <p className="text-[10px] text-[#A78B6F]">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── PANEL LATERAL: GALERÍA DE MOCKUPS (desktop, sticky) ── */}
              <div className="hidden sm:block w-80 flex-shrink-0 sticky top-20 self-start space-y-4">
                <MockupGalleryB2B
                  items={items.length > 0 ? items : (primerProducto ? [{ producto: primerProducto, qty: 1 }] : [])}
                  logoUrl={logoUrl}
                  onLogoChange={setLogoUrl}
                  showUploader={true}
                />

                {/* Mini resumen lateral */}
                {items.length > 0 && (
                  <div className="bg-white border border-[#EBE3D6] rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#A78B6F]">Resumen</p>
                    <div className="space-y-1">
                      {items.map((it) => {
                        const b2b = getB2BPriceForQty(it.producto, it.qty);
                        const unit = b2b?.precio ?? getUnitBasePrice(it.producto);
                        return (
                          <div key={it.producto.sku} className="flex justify-between text-[11px]">
                            <span className="text-[#4B4F54] truncate max-w-[110px]">{it.qty}× {it.producto.nombre}</span>
                            <span className="font-bold text-[#2A2420] flex-shrink-0">{fmtCLP(unit * it.qty)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-[#EBE3D6] pt-2 flex justify-between">
                      <span className="text-[11px] font-bold text-[#2A2420]">Neto</span>
                      <span className="text-[11px] font-bold text-[#0F8B6C]">{fmtCLP(totalNeto)}</span>
                    </div>
                    {ahorroTotal > 0 && (
                      <p className="text-[10px] text-[#D96B4D] font-bold text-center">Ahorras {fmtCLP(ahorroTotal)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <QuoteProductModal
        producto={preview}
        onClose={() => setPreview(null)}
        onAdd={addProducto}
        yaAgregado={preview ? selectedSkus.includes(preview.sku) : false}
        logoUrl={logoUrl}
      />

      <footer className="border-t border-[#EBE3D6] py-8 text-center text-xs text-[#A78B6F] flex items-center justify-center gap-1.5">
        <Recycle className="w-3.5 h-3.5 text-[#0F8B6C]" /> PEYU Chile · Plástico reciclado · Hecho en Santiago 🇨🇱
      </footer>
    </div>
  );
}