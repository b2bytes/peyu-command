import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import SEOHead from '@/components/SEOHead';
import {
  Building2, Loader2, ArrowRight, ArrowLeft, Recycle, Package,
  ShoppingCart, Sparkles, TrendingDown, Check, ChevronRight, CheckCircle,
} from 'lucide-react';
import LogoMockupPreview from '@/components/cotizacion/LogoMockupPreview';
import MockupGalleryB2B from '@/components/cotizacion/MockupGalleryB2B';
import QuoteProductPicker from '@/components/cotizacion/QuoteProductPicker';
import QuoteItemRow from '@/components/cotizacion/QuoteItemRow';
import QuoteContactForm from '@/components/cotizacion/QuoteContactForm';
import QuoteResultCard from '@/components/cotizacion/QuoteResultCard';
import QuoteProductModal from '@/components/cotizacion/QuoteProductModal';
import QuoteTotalsLive from '@/components/cotizacion/QuoteTotalsLive';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { getProductImage } from '@/utils/productImages';
import { fmtCLP, getCartV2, addToCartV2, updateCartItemV2, removeFromCartV2, clearCartV2 } from '@/lib/shop-v2-cart';
import { saveQuoteJourney, loadQuoteJourney, clearQuoteJourney, saveB2BProfile, loadB2BProfile } from '@/lib/cotizacion-journey';

// ════════════════════════════════════════════════════════════════════════
// /CotizacionRapida — Cockpit B2B en 1 pantalla (mismo formato /personalizar):
// stepper + resumen a la izquierda, mockup GIGANTE en vivo al centro y los
// controles del paso a la derecha con scroll propio y CTA siempre visible.
// Lógica intacta: CARRO ÚNICO (carrito_v2), viaje persistente, quickB2BQuoteV2.
// ════════════════════════════════════════════════════════════════════════
const C = {
  bg: '#F8F3ED',
  bgSoft: '#F2EBE0',
  surface: '#FFFFFF',
  border: '#D4C4B0',
  fg: '#2C1810',
  fgSoft: '#7A6050',
  fgMuted: '#A08070',
  action: '#0F8B6C',
  actionGrad: 'linear-gradient(135deg,#0F8B6C,#0B6E55)',
  actionShadow: '0 6px 20px rgba(15,139,108,.28)',
  terra: '#D96B4D',
};

const STEPS = [
  { label: 'Productos', Icon: Package, hint: 'Elige y ajusta cantidades' },
  { label: 'Datos', Icon: Building2, hint: 'Tu empresa y contacto' },
  { label: 'Revisar', Icon: ShoppingCart, hint: 'Confirma y solicita' },
];

const FORM_INICIAL = {
  company_name: '', rut: '', giro: '',
  contact_name: '', cargo: '', email: '', phone: '',
  direccion: '', comuna: '', delivery_date: '',
  urgency: 'Normal', personalization_needs: false, notes: '',
};

const trans = { duration: 0.3, ease: [0.22, 1, 0.36, 1] };

// ── Mobile Progress Bar (mismo patrón /personalizar) ───────────────────────
function MobileProgressBar({ step }) {
  return (
    <div className="lg:hidden px-4 pt-1 pb-2">
      <div className="relative h-1 rounded-full" style={{ background: C.border }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: C.actionGrad }}
        />
      </div>
      <div className="flex justify-between mt-1">
        {STEPS.map((s, i) => (
          <span key={i} className="text-[8px] font-bold uppercase tracking-wide"
            style={{ color: i === step ? C.action : i < step ? C.fgSoft : C.fgMuted }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Panel lateral izquierdo (solo desktop) ──────────────────────────────────
function DesktopLeftPanel({ step, onGoTo, items, qtyTotal, totalNeto, ahorroTotal, logoUrl, form, onRemoveLogo }) {
  return (
    <aside className="hidden lg:flex flex-col gap-3 w-60 xl:w-72 flex-shrink-0 lg:h-full lg:min-h-0 lg:overflow-y-auto peyu-scrollbar pr-1">
      {/* Logo + brand */}
      <div className="flex items-center gap-2 mb-2">
        <Link to="/" className="flex items-center group">
          <img src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
            alt="PEYU" className="h-7 w-auto group-hover:scale-105 transition-transform" draggable={false} />
        </Link>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(15,139,108,.12)', color: C.action }}>
          Cotización B2B
        </span>
      </div>

      {/* Stepper lateral */}
      <div className="flex flex-col gap-1 mb-2">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={i}
              onClick={() => done && onGoTo(i)}
              disabled={!done}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all group"
              style={{
                background: active ? 'rgba(15,139,108,.10)' : 'transparent',
                border: active ? `1.5px solid ${C.action}` : '1.5px solid transparent',
                cursor: done ? 'pointer' : 'default',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: done ? C.action : active ? C.actionGrad : C.border,
                  boxShadow: active ? C.actionShadow : 'none',
                }}
              >
                {done
                  ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  : <s.Icon className="w-3.5 h-3.5" style={{ color: active ? 'white' : C.fgMuted }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight" style={{ color: active ? C.action : done ? C.fgSoft : C.fgMuted }}>
                  {i + 1}. {s.label}
                </p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: active ? C.action : C.fgMuted, opacity: active ? 1 : 0.7 }}>
                  {s.hint}
                </p>
              </div>
              {done && <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: C.action }} />}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] font-bold text-center -mt-1 flex items-center justify-center gap-1" style={{ color: '#5B7D5A' }}>
        <CheckCircle className="w-3 h-3" /> Tu avance se guarda automáticamente
      </p>

      {/* Resumen de la cotización */}
      {items.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, background: C.surface }}>
          <div className="p-3 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.fgMuted }}>
              Tu cotización · {qtyTotal.toLocaleString('es-CL')} u
            </p>
            {items.map((it) => {
              const b2b = getB2BPriceForQty(it.producto, it.qty);
              const unit = b2b?.precio ?? getUnitBasePrice(it.producto);
              return (
                <div key={it.producto.sku} className="flex justify-between text-[11px] gap-2">
                  <span className="truncate" style={{ color: C.fgSoft }}>{it.qty}× {it.producto.nombre}</span>
                  <span className="font-bold flex-shrink-0" style={{ color: C.fg }}>{fmtCLP(unit * it.qty)}</span>
                </div>
              );
            })}
            <div className="flex justify-between pt-1.5" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="text-[11px] font-bold" style={{ color: C.fg }}>Neto</span>
              <span className="text-[11px] font-bold" style={{ color: C.action }}>{fmtCLP(totalNeto)}</span>
            </div>
            {ahorroTotal > 0 && (
              <p className="text-[10px] font-bold text-center" style={{ color: C.terra }}>
                Ahorras {fmtCLP(ahorroTotal)} por volumen
              </p>
            )}
            {logoUrl && (
              <div className="flex items-center justify-center gap-1.5">
                <img src={logoUrl} alt="logo" className="w-5 h-5 object-contain rounded flex-shrink-0" style={{ border: `1px solid ${C.border}`, background: C.bgSoft }} />
                <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: C.action }}>
                  <Check className="w-3 h-3" /> Logo para grabado
                </p>
                {onRemoveLogo && (
                  <button onClick={onRemoveLogo} className="text-[10px] font-bold underline" style={{ color: C.terra }}>
                    Quitar
                  </button>
                )}
              </div>
            )}
            {form.company_name && (
              <p className="text-[10px] text-center truncate" style={{ color: C.fgMuted }}>{form.company_name}</p>
            )}
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { icon: TrendingDown, label: '−54%', sub: 'volumen' },
          { icon: Building2, label: 'Factura', sub: 'formal' },
          { icon: Recycle, label: '100%', sub: 'reciclado' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl text-center"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <Icon className="w-4 h-4" style={{ color: C.action }} />
            <span className="text-[10px] font-bold leading-tight" style={{ color: C.fg }}>{label}</span>
            <span className="text-[9px]" style={{ color: C.fgMuted }}>{sub}</span>
          </div>
        ))}
      </div>
    </aside>
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

  // Fondo crema fijo (Warm Dusk): forzamos modo día mientras está abierta,
  // igual que /personalizar, para que el modo noche no borre los textos.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-liquid-mode');
    html.setAttribute('data-liquid-mode', 'day');
    return () => { if (prev) html.setAttribute('data-liquid-mode', prev); };
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const urlSku = urlParams.get('sku');
  const urlQty = parseInt(urlParams.get('qty'), 10) || 50;
  const urlLogo = urlParams.get('logo'); // logo/diseño que viene del personalizador

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 200)
      .then((data) => {
        const cotizables = (data || []).filter(
          (p) => p.sku && p.canal !== 'B2C Exclusivo' && p.categoria !== 'Gift Card'
        );
        setProductos(cotizables);
        if (prefilledRef.current) return;
        prefilledRef.current = true;

        // Restaura datos de empresa: viaje en curso > perfil B2B guardado
        // (la ficha del cliente queda recordada incluso tras enviar).
        const saved = loadQuoteJourney();
        if (saved?.form && (saved.form.company_name || saved.form.email)) {
          setForm(f => ({ ...f, ...saved.form }));
        } else {
          const perfil = loadB2BProfile();
          if (perfil) setForm(f => ({ ...f, ...perfil }));
        }

        // Entrada por URL (links externos): agrega el producto al CARRO ÚNICO
        // si aún no está, en vez de mantener una lista paralela.
        if (urlSku) {
          const match = cotizables.find(p => p.sku === urlSku);
          if (match) {
            const linea = getCartV2().find(l => l.sku === urlSku);
            if (!linea) {
              addToCartV2({
                productoId: match.id, sku: match.sku, nombre: match.nombre,
                precio: match.precio_b2c || getUnitBasePrice(match), cantidad: urlQty,
                imagen: getProductImage(match),
                ...(urlLogo && urlLogo.startsWith('http') ? { logoUrl: urlLogo, personalizacion: '[Logo personalizado]' } : {}),
              });
            } else {
              // Ya estaba en el carro: sincroniza la cantidad elegida en la
              // ficha y adjunta el logo que viene de allá (no se pide de nuevo).
              const patch = { cantidad: urlQty };
              if (urlLogo && urlLogo.startsWith('http') && !linea.logoUrl) {
                patch.logoUrl = urlLogo;
                patch.personalizacion = linea.personalizacion || '[Logo personalizado]';
              }
              updateCartItemV2(linea.id, patch);
            }
          }
        }

        // CARRO ÚNICO (carrito_v2) = fuente de verdad de los items a cotizar.
        // La selección hecha en /personalizar o la tienda llega intacta.
        const cart = getCartV2();
        const porSku = {};
        for (const l of cart) {
          if (!l.sku) continue;
          porSku[l.sku] = (porSku[l.sku] || 0) + (l.cantidad || 1);
        }
        const hidratados = Object.entries(porSku)
          .map(([sku, qty]) => ({ producto: cotizables.find(p => p.sku === sku), qty }))
          .filter(it => it.producto);

        // Logo: URL > guardado > el que viaja en el carro desde /personalizar.
        const lineaConLogo = cart.find(l => l.logoUrl || l.disenoPeyuUrl);
        if (urlLogo && urlLogo.startsWith('http')) setLogoUrl(urlLogo);
        else if (saved?.logoUrl) setLogoUrl(saved.logoUrl);
        else if (lineaConLogo) setLogoUrl(lineaConLogo.logoUrl || lineaConLogo.disenoPeyuUrl);

        if (hidratados.length) {
          setItems(hidratados);
          // Paso redundante eliminado: productos ya elegidos → directo a Datos.
          setStep(typeof saved?.step === 'number' && saved.step > 0 ? Math.min(saved.step, 2) : 1);
        } else if (saved?.items?.length) {
          const restored = saved.items
            .map(si => ({ producto: cotizables.find(p => p.sku === si.sku), qty: si.qty || 50 }))
            .filter(it => it.producto);
          if (restored.length) {
            setItems(restored);
            if (typeof saved.step === 'number' && saved.step >= 0 && saved.step <= 2) setStep(saved.step);
          }
        }
      });
  }, []); // eslint-disable-line

  // Auto-guardado del viaje B2B: cada decisión queda persistida.
  useEffect(() => {
    if (result || productos.length === 0 || !prefilledRef.current) return;
    if (items.length === 0 && !form.company_name && !logoUrl) return;
    saveQuoteJourney({
      items: items.map(it => ({ sku: it.producto.sku, qty: it.qty })),
      form, step, logoUrl,
    });
  }, [items, form, step, logoUrl, result, productos.length]);

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

  // CARRO ÚNICO: toda mutación de la cotización se refleja en carrito_v2,
  // así el cliente puede alternar entre cotizar y comprar sin perder nada.
  const addProducto = (p) => {
    setItems((prev) => [...prev, { producto: p, qty: 50 }]);
    if (!getCartV2().some((l) => l.sku === p.sku)) {
      addToCartV2({
        productoId: p.id, sku: p.sku, nombre: p.nombre,
        precio: p.precio_b2c || getUnitBasePrice(p), cantidad: 50,
        imagen: getProductImage(p),
      });
    }
  };
  const setQty = (sku, qty) => {
    setItems((prev) => prev.map((it) => it.producto.sku === sku ? { ...it, qty } : it));
    const lineas = getCartV2().filter((l) => l.sku === sku);
    if (lineas.length === 1) updateCartItemV2(lineas[0].id, { cantidad: qty });
  };
  const removeItem = (sku) => {
    setItems((prev) => prev.filter((it) => it.producto.sku !== sku));
    getCartV2().filter((l) => l.sku === sku).forEach((l) => removeFromCartV2(l.id));
  };

  // Quitar el logo DE VERDAD: limpia el estado, el viaje guardado (vía auto-save)
  // y las líneas del carro único que lo traían de sesiones anteriores. Sin esto,
  // un logo viejo re-hidrataba la cotización al recargar y "perseguía" al cliente.
  const removeLogo = () => {
    setLogoUrl(null);
    getCartV2().forEach((l) => {
      if (l.logoUrl || l.disenoPeyuUrl) {
        updateCartItemV2(l.id, {
          logoUrl: null,
          disenoPeyuUrl: null,
          mockupUrl: null,
          personalizacion: ['[Logo personalizado]', '[Diseño PEYU]'].includes(l.personalizacion) ? null : l.personalizacion,
        });
      }
    });
  };

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
        saveB2BProfile(form); // la ficha del cliente queda recordada para la próxima
        clearQuoteJourney(); // viaje completado
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

  // "Otra cotización" = partir LIMPIO de verdad: también vacía el carro único.
  // Sin esto, los productos viejos re-hidrataban la cotización al recargar.
  const reset = () => { setResult(null); setItems([]); setForm(FORM_INICIAL); setStep(0); setLogoUrl(null); clearQuoteJourney(); clearCartV2(); };

  const canAdvance = step === 0 ? items.length > 0 : step === 1 ? !!datosOk : true;
  const ctaLabel = step === 0
    ? (items.length > 0 ? `Continuar · ${fmtCLP(totalConIVA)}` : 'Continuar')
    : step === 1
      ? 'Revisar cotización'
      : enviando ? 'Enviando...' : `Solicitar presupuesto · ${fmtCLP(totalConIVA)}`;
  const handleCTA = () => { if (step < 2) next(); else enviar(); };

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10 font-inter" style={{ background: C.bg }}>
        <div className="w-full max-w-2xl">
          <QuoteResultCard result={result} empresa={form.company_name} email={form.email} onReset={reset} logoUrl={logoUrl} />
        </div>
      </div>
    );
  }

  // ── PASO 0 — Productos ─────────────────────────────────────────────────────
  const StepProductos = (
    <div className="space-y-4">
      <div>
        <p className="hidden lg:block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.action }}>Paso 1 de 3</p>
        <h2 className="text-lg lg:text-2xl font-poppins font-bold" style={{ color: C.fg }}>Elige tus productos</h2>
        <p className="text-xs lg:text-sm mt-0.5" style={{ color: C.fgMuted }}>Precios por volumen en vivo · grabado láser de tu logo incluido</p>
      </div>

      {/* Mobile: catálogo aquí. Desktop: el catálogo vive GIGANTE en el panel central */}
      <div className="lg:hidden">
        <QuoteProductPicker
          productos={productos}
          selectedSkus={selectedSkus}
          onAdd={addProducto}
          onView={setPreview}
        />
      </div>

      {items.length === 0 && (
        <div className="hidden lg:flex flex-col items-center gap-2 py-10 text-center rounded-2xl" style={{ background: C.bgSoft, border: `1.5px dashed ${C.border}` }}>
          <Package className="w-7 h-7" style={{ color: C.fgMuted }} />
          <p className="text-sm font-bold" style={{ color: C.fg }}>Elige productos del catálogo</p>
          <p className="text-xs px-6" style={{ color: C.fgMuted }}>Haz clic en + en el catálogo de la izquierda. Aquí verás cantidades y totales en vivo.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: C.fg }}>
            <ShoppingCart className="w-3.5 h-3.5" style={{ color: C.action }} />
            Tu cotización: {items.length} {items.length === 1 ? 'producto' : 'productos'} · {qtyTotal} unidades
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
          <QuoteTotalsLive
            qtyTotal={qtyTotal} totalSinDesc={totalSinDesc} ahorroTotal={ahorroTotal}
            totalNeto={totalNeto} totalConIVA={totalConIVA}
          />
        </div>
      )}

      {/* Mockup + uploader en mobile: solo visible cuando ya hay productos seleccionados.
          Antes de agregar productos, el catálogo ocupa todo el espacio sin distraer. */}
      {items.length > 0 && (
        <div className="lg:hidden">
          <MockupGalleryB2B
            items={items}
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            showUploader={true}
          />
        </div>
      )}
    </div>
  );

  // ── PASO 1 — Datos de empresa ──────────────────────────────────────────────
  const StepDatos = (
    <div className="space-y-4">
      <div>
        <p className="hidden lg:block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.action }}>Paso 2 de 3</p>
        <h2 className="text-lg lg:text-2xl font-poppins font-bold" style={{ color: C.fg }}>Datos de tu empresa</h2>
        <p className="text-xs lg:text-sm mt-0.5" style={{ color: C.fgMuted }}>Un ejecutivo PEYU te contacta en 24h hábiles con tu propuesta formal</p>
      </div>

      <QuoteContactForm form={form} setForm={setForm} />

      {/* Mockup + uploader en mobile */}
      <div className="lg:hidden">
        <MockupGalleryB2B items={items} logoUrl={logoUrl} onLogoChange={setLogoUrl} showUploader={true} />
      </div>
    </div>
  );

  // ── PASO 2 — Revisar y solicitar ───────────────────────────────────────────
  const StepRevisar = (
    <div className="space-y-4">
      <div>
        <p className="hidden lg:block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.action }}>Paso 3 de 3</p>
        <h2 className="text-lg lg:text-2xl font-poppins font-bold" style={{ color: C.fg }}>Revisa y solicita</h2>
        <p className="text-xs lg:text-sm mt-0.5" style={{ color: C.fgMuted }}>Confirma tu cotización antes de enviarla</p>
      </div>

      {/* Líneas con mockup de logo */}
      <div className="space-y-2.5">
        {items.map((it) => {
          const b2b = getB2BPriceForQty(it.producto, it.qty);
          const unit = b2b?.precio ?? getUnitBasePrice(it.producto);
          const baseUnit = b2b?.baseUnit ?? getUnitBasePrice(it.producto);
          const ahorro = b2b?.ahorroPct ?? 0;
          const productImg = getProductImage(it.producto);
          return (
            <div key={it.producto.sku} className="rounded-xl p-3" style={{ background: C.bgSoft, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: '52px', height: '52px', border: `1px solid ${C.border}`, background: '#F2ECE2' }}>
                  <LogoMockupPreview
                    logoUrl={logoUrl}
                    productImg={productImg}
                    size="sm"
                    className="!w-full !h-full !aspect-auto"
                    showBadge={false}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: C.fg }}>{it.qty}× {it.producto.nombre}</p>
                  <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                    <span className="text-[12px] font-bold" style={{ color: C.action }}>{fmtCLP(unit)}/u</span>
                    {ahorro > 0 && baseUnit !== unit && (
                      <span className="text-[10px] line-through" style={{ color: C.fgMuted }}>{fmtCLP(baseUnit)}</span>
                    )}
                    {ahorro > 0 && (
                      <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: C.terra }}>−{ahorro}%</span>
                    )}
                    {b2b?.label && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: C.fgMuted, background: '#EBE3D6' }}>{b2b.label}</span>
                    )}
                  </div>
                </div>
                <span className="font-bold flex-shrink-0 text-sm" style={{ color: C.fg }}>{fmtCLP(unit * it.qty)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <QuoteTotalsLive
        qtyTotal={qtyTotal} totalSinDesc={totalSinDesc} ahorroTotal={ahorroTotal}
        totalNeto={totalNeto} totalConIVA={totalConIVA}
      />

      {/* Empresa */}
      <div className="flex items-center gap-2 text-[11px] rounded-xl px-3 py-2" style={{ color: C.fgMuted, background: 'rgba(15,139,108,.05)' }}>
        <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.action }} />
        <span>
          <strong style={{ color: C.fg }}>{form.company_name}</strong>
          {form.rut && <span> · RUT {form.rut}</span>}
          {' · '}{form.contact_name} · {form.email}
        </span>
      </div>

      {/* Logo confirmado */}
      {logoUrl && (
        <div className="flex items-center gap-2 text-[11px] rounded-xl px-3 py-2" style={{ color: C.action, background: 'rgba(15,139,108,.05)' }}>
          <Check className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Logo incluido para mockup y grabado láser</span>
          <img src={logoUrl} alt="logo" className="w-6 h-6 object-contain ml-auto rounded" style={{ border: `1px solid ${C.border}` }} />
        </div>
      )}

      {form.personalization_needs && (
        <div className="flex items-center gap-2 text-[11px] px-1" style={{ color: C.terra }}>
          <Sparkles className="w-3.5 h-3.5" /> Con personalización láser de tu logo
        </div>
      )}

      {/* Mockup en mobile */}
      <div className="lg:hidden">
        <MockupGalleryB2B items={items} logoUrl={logoUrl} onLogoChange={setLogoUrl} showUploader={true} />
      </div>
    </div>
  );

  const stepsContent = [StepProductos, StepDatos, StepRevisar];

  // ── LAYOUT PRINCIPAL (cockpit 1 pantalla en desktop) ──────────────────────
  return (
    <div className="min-h-screen lg:h-screen lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden font-inter max-w-[100vw] overflow-x-hidden" style={{ background: C.bg }}>
      <SEOHead
        title="Cotización Rápida B2B — PEYU | Precios Corporativos"
        description="Cotiza tu pedido corporativo en 3 pasos. Precios por volumen, personalización láser, facturación y despacho a Chile."
        url="https://peyuchile.cl/CotizacionRapida"
        type="website"
      />

      {/* ── TOP NAV sticky (mismo patrón /personalizar) ─────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(248,243,237,.97)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 10px rgba(44,24,16,.07)' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex items-center gap-3">
          {/* Volver */}
          {step > 0 ? (
            <button onClick={back}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white"
              style={{ border: `1.5px solid ${C.border}` }}>
              <ArrowLeft className="w-4 h-4" style={{ color: C.fgSoft }} />
            </button>
          ) : (
            <Link to="/EmpresasNuevo"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white"
              style={{ border: `1.5px solid ${C.border}` }}>
              <ArrowLeft className="w-4 h-4" style={{ color: C.fgSoft }} />
            </Link>
          )}

          {/* Logo (solo desktop) */}
          <Link to="/" className="hidden lg:block flex-shrink-0 group mr-4">
            <img src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU" className="h-8 w-auto group-hover:scale-105 transition-transform" draggable={false} />
          </Link>

          {/* Brand mobile */}
          <div className="flex items-center gap-2 lg:hidden flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.actionGrad }}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-poppins font-bold text-sm leading-tight" style={{ color: C.fg }}>Cotización B2B</p>
              <p className="text-[10px] leading-tight font-semibold" style={{ color: C.action }}>Hasta −54% por volumen · Factura</p>
            </div>
          </div>

          {/* Desktop: steps inline en header */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <button key={i}
                  onClick={() => done && goTo(i)}
                  disabled={!done && !active}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    background: active ? 'rgba(15,139,108,.10)' : 'transparent',
                    border: active ? `1.5px solid ${C.action}` : '1.5px solid transparent',
                    cursor: done ? 'pointer' : 'default',
                    opacity: !done && !active ? 0.5 : 1,
                  }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: done ? C.action : active ? C.actionGrad : C.border }}>
                    {done ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      : <s.Icon className="w-2.5 h-2.5" style={{ color: active ? 'white' : C.fgMuted }} />}
                  </div>
                  <span className="text-xs font-bold" style={{ color: active ? C.action : done ? C.fgSoft : C.fgMuted }}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 ml-1" style={{ color: C.border }} />}
                </button>
              );
            })}
          </div>

          {/* Step counter mobile */}
          <span className="lg:hidden text-xs font-bold" style={{ color: C.fgMuted }}>{step + 1}/3</span>

          {/* Desktop: CTA en header */}
          {canAdvance && (
            <button
              onClick={handleCTA}
              disabled={enviando}
              className="hidden lg:flex items-center gap-2 px-5 h-10 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: C.actionGrad, boxShadow: C.actionShadow, flexShrink: 0 }}
            >
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 2 ? <Building2 className="w-4 h-4" /> : null}
              <span>{step === 2 ? `Solicitar · ${fmtCLP(totalConIVA)}` : 'Continuar'}</span>
              {step < 2 && !enviando && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        <MobileProgressBar step={step} />
      </header>

      {/* ── BODY: cockpit 3 cols desktop (1 pantalla) · 1 col mobile ─────── */}
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 lg:px-6 py-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <div className="flex gap-8 lg:gap-5 items-start lg:items-stretch lg:h-full">

          {/* Panel izquierdo desktop */}
          <DesktopLeftPanel
            step={step}
            onGoTo={goTo}
            items={items}
            qtyTotal={qtyTotal}
            totalNeto={totalNeto}
            ahorroTotal={ahorroTotal}
            logoUrl={logoUrl}
            form={form}
            onRemoveLogo={removeLogo}
          />

          {/* Centro desktop: paso 1 = catálogo GIGANTE · pasos 2-3 = mockup en vivo */}
          <main className="hidden lg:flex flex-col flex-1 min-w-0 lg:h-full lg:min-h-0 gap-3">
            <div
              className="relative flex-1 min-h-0 rounded-3xl overflow-y-auto peyu-scrollbar p-4"
              style={{ background: C.surface, border: `1.5px solid ${C.border}` }}
            >
              {step === 0 ? (
                <QuoteProductPicker
                  productos={productos}
                  selectedSkus={selectedSkus}
                  onAdd={addProducto}
                  onView={setPreview}
                  fillHeight
                />
              ) : items.length > 0 ? (
                <MockupGalleryB2B
                  frameless
                  items={items}
                  logoUrl={logoUrl}
                  onLogoChange={setLogoUrl}
                  showUploader={true}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                  <Package className="w-10 h-10" style={{ color: C.fgMuted }} />
                  <p className="text-sm font-bold" style={{ color: C.fg }}>Agrega productos para ver el mockup</p>
                </div>
              )}
            </div>

            {/* Barra info inferior */}
            {items.length > 0 && (
              <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,.94)', border: `1px solid ${C.border}` }}>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: C.fg }}>
                    {items.length} {items.length === 1 ? 'producto' : 'productos'} · {qtyTotal.toLocaleString('es-CL')} unidades
                  </p>
                  <p className="text-[11px] truncate" style={{ color: C.fgMuted }}>
                    Neto {fmtCLP(totalNeto)}{ahorroTotal > 0 ? ` · ahorras ${fmtCLP(ahorroTotal)}` : ''}{logoUrl ? ' · logo incluido' : ''}
                  </p>
                </div>
                <span className="font-fraunces font-bold text-lg flex-shrink-0" style={{ color: C.action }}>{fmtCLP(totalConIVA)} <span className="text-[10px] font-inter font-semibold" style={{ color: C.fgMuted }}>c/IVA</span></span>
              </div>
            )}
          </main>

          {/* Columna derecha: contenido del paso con scroll propio + CTA fijo */}
          <div className="flex-1 min-w-0 pb-44 lg:pb-0 lg:flex-none lg:w-[400px] xl:w-[440px] lg:h-full lg:min-h-0 lg:flex lg:flex-col">
            <div className="rounded-3xl p-4 lg:p-5 shadow-sm lg:flex-1 lg:min-h-0 lg:overflow-y-auto peyu-scrollbar" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={trans}>
                  {stepsContent[step]}
                </motion.div>
              </AnimatePresence>
              {error && (
                <p className="text-xs font-semibold rounded-xl p-3 mt-4" style={{ color: C.terra, background: 'rgba(217,107,77,.10)', border: '1px solid rgba(217,107,77,.30)' }}>{error}</p>
              )}
            </div>

            {/* CTA desktop fijo bajo la columna */}
            <div className="hidden lg:block mt-3 lg:flex-shrink-0">
              <div className="flex items-center gap-4">
                {step > 0 && (
                  <button onClick={back}
                    className="h-12 px-5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all hover:bg-white"
                    style={{ border: `1.5px solid ${C.border}`, color: C.fgSoft }}>
                    <ArrowLeft className="w-4 h-4" /> Volver
                  </button>
                )}
                <button
                  onClick={handleCTA}
                  disabled={!canAdvance || enviando}
                  className="flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 hover:-translate-y-0.5"
                  style={{ background: canAdvance ? C.actionGrad : '#E9DFD0', color: canAdvance ? 'white' : '#A08070', border: canAdvance ? 'none' : `1.5px solid ${C.border}`, boxShadow: canAdvance ? C.actionShadow : 'none' }}
                >
                  {enviando ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                    : <>{step === 2 && <Building2 className="w-5 h-5" />}<span>{ctaLabel}</span>{step < 2 && <ArrowRight className="w-5 h-5" />}</>}
                </button>
              </div>
              {!canAdvance && step === 0 && <p className="text-center text-xs mt-2 font-semibold" style={{ color: C.fgMuted }}>Agrega al menos un producto para continuar</p>}
              {!canAdvance && step === 1 && <p className="text-center text-xs mt-2 font-semibold" style={{ color: C.fgMuted }}>Completa: empresa, RUT, nombre, email y teléfono</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA MOBILE STICKY ──────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 max-w-[100vw]"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          paddingTop: '8px',
          background: 'rgba(248,243,237,.97)',
          borderTop: `1.5px solid ${C.border}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 -4px 20px rgba(44,24,16,.10)',
        }}>
        {items.length > 0 && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate" style={{ color: C.fg }}>
                {items.length} {items.length === 1 ? 'producto' : 'productos'} · {qtyTotal.toLocaleString('es-CL')} u
              </p>
              <p className="text-[9px]" style={{ color: C.fgMuted }}>Neto {fmtCLP(totalNeto)}{ahorroTotal > 0 ? ` · ahorras ${fmtCLP(ahorroTotal)}` : ''}</p>
            </div>
            <span className="text-sm font-fraunces font-bold flex-shrink-0" style={{ color: C.action }}>{fmtCLP(totalConIVA)}</span>
          </div>
        )}
        {step > 0 && (
          <button
            onClick={back}
            className="w-full h-10 mb-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            style={{ border: `1.5px solid ${C.border}`, color: C.fgSoft, background: 'white' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver
          </button>
        )}
        <button
          onClick={handleCTA}
          disabled={!canAdvance || enviando}
          className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: canAdvance ? C.actionGrad : '#E9DFD0', color: canAdvance ? 'white' : '#A08070', border: canAdvance ? 'none' : `1.5px solid ${C.border}`, boxShadow: canAdvance ? C.actionShadow : 'none' }}
        >
          {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
            : <>{step === 2 && <Building2 className="w-4 h-4" />}<span>{ctaLabel}</span>{step < 2 && <ArrowRight className="w-4 h-4" />}</>}
        </button>
        {!canAdvance && step === 0 && <p className="text-center text-[10px] mt-1 font-semibold" style={{ color: C.fgMuted }}>Agrega al menos un producto para continuar</p>}
        {!canAdvance && step === 1 && <p className="text-center text-[10px] mt-1 font-semibold" style={{ color: C.fgMuted }}>Completa: empresa, RUT, nombre, email y teléfono</p>}
      </div>

      <QuoteProductModal
        producto={preview}
        onClose={() => setPreview(null)}
        onAdd={addProducto}
        yaAgregado={preview ? selectedSkus.includes(preview.sku) : false}
        logoUrl={logoUrl}
        onRemoveLogo={removeLogo}
      />
    </div>
  );
}