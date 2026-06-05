import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Loader2, ArrowRight, Recycle, Package } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import QuoteProductPicker from '@/components/cotizacion/QuoteProductPicker';
import QuoteItemRow from '@/components/cotizacion/QuoteItemRow';
import QuoteContactForm from '@/components/cotizacion/QuoteContactForm';
import QuoteResultCard from '@/components/cotizacion/QuoteResultCard';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// /CotizacionRapida — Cotización rápida por volumen para clientes corporativos,
// en la plataforma nueva (Shop v2). El cliente agrega productos + cantidades,
// ve precios por volumen en vivo y envía. El backend crea un B2BLead y devuelve
// el desglose. AISLADO: no toca la tienda viva ni el flujo B2C.
// ════════════════════════════════════════════════════════════════════════
const FORM_INICIAL = {
  company_name: '', contact_name: '', email: '', phone: '',
  delivery_date: '', personalization_needs: false,
};

export default function CotizacionRapida() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]); // [{ producto, qty }]
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

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

  const puedeEnviar = items.length > 0 && form.company_name.trim() && form.contact_name.trim() && form.email.trim();

  const enviar = async () => {
    setError('');
    if (!puedeEnviar) { setError('Completa empresa, nombre, email y agrega al menos un producto.'); return; }
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

  const reset = () => { setResult(null); setItems([]); setForm(FORM_INICIAL); };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420] pb-20">
      <ShopV2Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {result ? (
          <QuoteResultCard result={result} empresa={form.company_name} email={form.email} onReset={reset} />
        ) : (
          <>
            {/* Encabezado */}
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 bg-[#0F8B6C]/10 text-[#0F8B6C] text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                <Building2 className="w-3.5 h-3.5" /> Para empresas
              </span>
              <h1 className="font-fraunces text-3xl sm:text-4xl mb-2">Cotización rápida por volumen</h1>
              <p className="text-sm text-[#4B4F54] max-w-lg mx-auto">
                Arma tu pedido corporativo, mira el precio por volumen en vivo y recibe tu presupuesto. Mientras más unidades, mejor precio.
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              {/* Columna izquierda: productos */}
              <div className="lg:col-span-3 space-y-5">
                <div className="bg-[#FBF8F2] border border-[#EBE3D6] rounded-3xl p-4 sm:p-5">
                  <h2 className="font-bold text-[#2A2420] mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#0F8B6C]" /> 1 · Agrega productos
                  </h2>
                  <QuoteProductPicker productos={productos} selectedSkus={selectedSkus} onAdd={addProducto} />
                </div>

                {items.length > 0 && (
                  <div className="space-y-2.5">
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
              </div>

              {/* Columna derecha: contacto + resumen */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-[#FBF8F2] border border-[#EBE3D6] rounded-3xl p-4 sm:p-5">
                  <h2 className="font-bold text-[#2A2420] mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0F8B6C]" /> 2 · Tus datos
                  </h2>
                  <QuoteContactForm form={form} setForm={setForm} />
                </div>

                <div className="bg-white border border-[#EBE3D6] rounded-3xl p-5 sticky top-20">
                  <div className="flex justify-between text-sm text-[#4B4F54] mb-1">
                    <span>Productos</span><span className="font-bold">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#4B4F54] mb-3">
                    <span>Unidades totales</span><span className="font-bold">{qtyTotal.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-[#EBE3D6] pt-3 mb-4">
                    <span className="text-sm font-bold text-[#2A2420]">Estimado neto</span>
                    <span className="font-fraunces text-2xl text-[#0F8B6C]">{fmtCLP(totalNeto)}</span>
                  </div>

                  {error && (
                    <p className="text-xs font-semibold text-[#D96B4D] bg-[#D96B4D]/10 border border-[#D96B4D]/30 rounded-xl p-2.5 mb-3">{error}</p>
                  )}

                  <button
                    onClick={enviar}
                    disabled={!puedeEnviar || enviando}
                    className="w-full h-12 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all active:scale-[0.99]"
                  >
                    {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <>Solicitar presupuesto <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <p className="text-[11px] text-[#A78B6F] text-center mt-2">Precio neto referencial (sin IVA). Sin compromiso.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-[#EBE3D6] py-8 text-center text-xs text-[#A78B6F] flex items-center justify-center gap-1.5">
        <Recycle className="w-3.5 h-3.5 text-[#0F8B6C]" /> PEYU Chile · Plástico reciclado · Hecho en Santiago 🇨🇱
      </footer>
    </div>
  );
}