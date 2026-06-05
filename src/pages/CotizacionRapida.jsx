import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Building2, Loader2, ArrowRight, ArrowLeft, Recycle, Package, ShoppingCart, Sparkles, TrendingDown } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import QuoteProductPicker from '@/components/cotizacion/QuoteProductPicker';
import QuoteItemRow from '@/components/cotizacion/QuoteItemRow';
import QuoteContactForm from '@/components/cotizacion/QuoteContactForm';
import QuoteResultCard from '@/components/cotizacion/QuoteResultCard';
import QuoteStepper from '@/components/cotizacion/QuoteStepper';
import QuoteProductModal from '@/components/cotizacion/QuoteProductModal';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// /CotizacionRapida — VIAJE guiado de cotización B2B por volumen (Shop v2).
// Un solo flujo, paso a paso (Productos → Datos → Revisar), moderno y fluido.
// El backend crea un B2BLead y devuelve el desglose. AISLADO del flujo B2C.
// ════════════════════════════════════════════════════════════════════════
const FORM_INICIAL = {
  company_name: '', contact_name: '', email: '', phone: '',
  delivery_date: '', personalization_needs: false,
};

const trans = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

export default function CotizacionRapida() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]); // [{ producto, qty }]
  const [form, setForm] = useState(FORM_INICIAL);
  const [step, setStep] = useState(0); // 0 productos · 1 datos · 2 revisar
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null); // producto en ficha emergente

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 200)
      .then((data) => {
        const cotizables = (data || []).filter(
          (p) => p.sku && p.canal !== 'B2C Exclusivo' && p.categoria !== 'Gift Card'
        );
        setProductos(cotizables);
      });
  }, []);

  const selectedSkus = useMemo(() => items.map((i) => i.producto.sku), [items]);

  const totalNeto = useMemo(
    () => items.reduce((acc, it) => {
      const b2b = getB2BPriceForQty(it.producto, it.qty);
      const unit = b2b?.precio ?? getUnitBasePrice(it.producto);
      return acc + unit * it.qty;
    }, 0),
    [items]
  );
  const qtyTotal = useMemo(() => items.reduce((a, it) => a + it.qty, 0), [items]);

  const addProducto = (p) => setItems((prev) => [...prev, { producto: p, qty: 50 }]);
  const setQty = (sku, qty) => setItems((prev) => prev.map((it) => it.producto.sku === sku ? { ...it, qty } : it));
  const removeItem = (sku) => setItems((prev) => prev.filter((it) => it.producto.sku !== sku));

  const datosOk = form.company_name.trim() && form.contact_name.trim() && form.email.trim();
  // El paso máximo alcanzable: necesita productos para pasar de 0, y datos para llegar a 2.
  const maxStep = items.length === 0 ? 0 : datosOk ? 2 : 1;

  const goTo = (s) => { setError(''); setStep(Math.min(s, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const next = () => {
    setError('');
    if (step === 0 && items.length === 0) { setError('Agrega al menos un producto para continuar.'); return; }
    if (step === 1 && !datosOk) { setError('Completa empresa, nombre y email.'); return; }
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
        items: items.map((it) => ({ sku: it.producto.sku, qty: it.qty })),
      });
      if (res.data?.ok) {
        setResult(res.data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res.data?.error || 'No se pudo enviar la cotización. Intenta de nuevo.');
      }
    } catch {
      setError('No se pudo enviar la cotización. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const reset = () => { setResult(null); setItems([]); setForm(FORM_INICIAL); setStep(0); };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420] pb-28 sm:pb-12">
      <ShopV2Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {result ? (
          <QuoteResultCard result={result} empresa={form.company_name} email={form.email} onReset={reset} />
        ) : (
          <>
            {/* Hero compacto */}
            <div className="text-center mb-7">
              <span className="inline-flex items-center gap-1.5 bg-[#0F8B6C]/10 text-[#0F8B6C] text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                <Building2 className="w-3.5 h-3.5" /> Cotización para empresas
              </span>
              <h1 className="font-fraunces text-3xl sm:text-4xl mb-2 leading-tight">
                Tu pedido corporativo, <span className="text-[#0F8B6C]">en 3 pasos</span>
              </h1>
              <p className="text-sm text-[#4B4F54] max-w-md mx-auto">
                Arma tu pedido, mira el precio por volumen en vivo y recibe tu presupuesto. Hasta −33% por volumen.
              </p>
            </div>

            <QuoteStepper step={step} onStep={goTo} maxStep={maxStep} />

            <AnimatePresence mode="wait">
              {/* ── PASO 1 · Productos ── */}
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={trans}>
                  <div className="bg-white border border-[#EBE3D6] rounded-3xl p-5 sm:p-6">
                    <h2 className="font-bold text-lg text-[#2A2420] mb-1 flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#0F8B6C]" /> Elige tus productos
                    </h2>
                    <p className="text-xs text-[#A78B6F] mb-4">Agrega los productos que quieres cotizar. El descuento se aplica solo al subir las cantidades.</p>
                    <QuoteProductPicker productos={productos} selectedSkus={selectedSkus} onAdd={addProducto} onView={setPreview} />
                  </div>

                  {items.length > 0 && (
                    <div className="mt-4 space-y-2.5">
                      <p className="text-xs font-bold text-[#4B4F54] px-1">En tu cotización ({items.length})</p>
                      {items.map((it) => (
                        <QuoteItemRow
                          key={it.producto.sku}
                          producto={it.producto}
                          qty={it.qty}
                          onQty={(q) => setQty(it.producto.sku, q)}
                          onRemove={() => removeItem(it.producto.sku)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── PASO 2 · Datos ── */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={trans}>
                  <div className="bg-white border border-[#EBE3D6] rounded-3xl p-5 sm:p-6">
                    <h2 className="font-bold text-lg text-[#2A2420] mb-1 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#0F8B6C]" /> Tus datos de empresa
                    </h2>
                    <p className="text-xs text-[#A78B6F] mb-4">Para preparar tu presupuesto formal con factura. Un ejecutivo te contacta en 24h hábiles.</p>
                    <QuoteContactForm form={form} setForm={setForm} />
                  </div>
                </motion.div>
              )}

              {/* ── PASO 3 · Revisar ── */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={trans}>
                  <div className="bg-white border border-[#EBE3D6] rounded-3xl p-5 sm:p-6">
                    <h2 className="font-bold text-lg text-[#2A2420] mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-[#0F8B6C]" /> Revisa y solicita
                    </h2>

                    <div className="space-y-2 mb-4">
                      {items.map((it) => {
                        const b2b = getB2BPriceForQty(it.producto, it.qty);
                        const unit = b2b?.precio ?? getUnitBasePrice(it.producto);
                        return (
                          <div key={it.producto.sku} className="flex items-center justify-between gap-2 text-sm bg-[#FAF7F2] rounded-xl px-3.5 py-2.5">
                            <span className="text-[#2A2420] truncate">
                              <span className="font-bold">{it.qty}×</span> {it.producto.nombre}
                              <span className="text-[#A78B6F] text-[11px] ml-1">({fmtCLP(unit)}/u)</span>
                            </span>
                            <span className="font-bold text-[#2A2420] flex-shrink-0">{fmtCLP(unit * it.qty)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-[#EBE3D6] pt-3 space-y-1.5 mb-2">
                      <div className="flex justify-between text-sm text-[#4B4F54]">
                        <span>Unidades totales</span><span className="font-bold">{qtyTotal.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-[#2A2420]">Estimado neto</span>
                        <span className="font-fraunces text-2xl text-[#0F8B6C]">{fmtCLP(totalNeto)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#A78B6F] bg-[#0F8B6C]/5 rounded-xl px-3 py-2">
                      <Building2 className="w-3.5 h-3.5 text-[#0F8B6C] flex-shrink-0" />
                      <span><strong className="text-[#2A2420]">{form.company_name}</strong> · {form.contact_name} · {form.email}</span>
                    </div>

                    {form.personalization_needs && (
                      <div className="flex items-center gap-2 text-[11px] text-[#D96B4D] mt-2 px-1">
                        <Sparkles className="w-3.5 h-3.5" /> Con personalización láser de tu logo
                      </div>
                    )}

                    <p className="text-[11px] text-[#A78B6F] text-center mt-4">Precio neto referencial (sin IVA). Sin compromiso.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="text-xs font-semibold text-[#D96B4D] bg-[#D96B4D]/10 border border-[#D96B4D]/30 rounded-xl p-3 mt-4">{error}</p>
            )}

            {/* Barra de navegación inferior (sticky en mobile, inline en desktop) */}
            <div className="fixed sm:static bottom-0 inset-x-0 z-30 sm:z-0 bg-[#FAF7F2]/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-0 border-t sm:border-0 border-[#EBE3D6] px-4 sm:px-0 py-3 sm:py-0 sm:mt-6">
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                {step > 0 && (
                  <button
                    onClick={back}
                    className="h-12 px-4 rounded-2xl bg-white border border-[#EBE3D6] hover:border-[#0F8B6C]/40 text-[#4B4F54] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>
                )}

                {/* Resumen rápido + CTA */}
                {items.length > 0 && (
                  <div className="hidden sm:flex flex-col mr-auto pl-1">
                    <span className="text-[11px] text-[#A78B6F] leading-tight">{qtyTotal.toLocaleString('es-CL')} u · estimado neto</span>
                    <span className="font-bold text-[#0F8B6C] leading-tight">{fmtCLP(totalNeto)}</span>
                  </div>
                )}

                {step < 2 ? (
                  <button
                    onClick={next}
                    className="flex-1 sm:flex-none sm:ml-0 h-12 px-6 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all active:scale-[0.99]"
                  >
                    {step === 0 ? 'Continuar' : 'Revisar pedido'} <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={enviar}
                    disabled={enviando}
                    className="flex-1 sm:flex-none h-12 px-6 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] disabled:opacity-40 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all active:scale-[0.99]"
                  >
                    {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <>Solicitar presupuesto <ArrowRight className="w-4 h-4" /></>}
                  </button>
                )}
              </div>
            </div>

            {/* Beneficios de confianza al pie del viaje */}
            <div className="grid grid-cols-3 gap-3 mt-8 sm:mt-10">
              {[
                { Icon: TrendingDown, t: 'Hasta −33%', s: 'por volumen' },
                { Icon: Building2, t: 'Factura', s: 'datos de empresa' },
                { Icon: Recycle, t: '100% reciclado', s: 'reporte ESG' },
              ].map(({ Icon, t, s }) => (
                <div key={t} className="text-center">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#EBE3D6] flex items-center justify-center mx-auto mb-1.5">
                    <Icon className="w-4 h-4 text-[#0F8B6C]" />
                  </div>
                  <p className="text-xs font-bold text-[#2A2420] leading-tight">{t}</p>
                  <p className="text-[10px] text-[#A78B6F]">{s}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <QuoteProductModal
        producto={preview}
        onClose={() => setPreview(null)}
        onAdd={addProducto}
        yaAgregado={preview ? selectedSkus.includes(preview.sku) : false}
      />

      <footer className="border-t border-[#EBE3D6] py-8 text-center text-xs text-[#A78B6F] flex items-center justify-center gap-1.5">
        <Recycle className="w-3.5 h-3.5 text-[#0F8B6C]" /> PEYU Chile · Plástico reciclado · Hecho en Santiago 🇨🇱
      </footer>
    </div>
  );
}