// ════════════════════════════════════════════════════════════════════════
// /EmpresaProducto?id= — Ficha de producto B2B con mockup de logo en vivo.
// Galería · tabla de precios por volumen · calculadora de qty · mockup IA
// · botón "Agregar a cotización" persistente en mobile.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Recycle, ShieldCheck, Truck, Check, Loader2,
  Sparkles, Package, TrendingDown, Plus, Minus, ArrowRight,
  Building2, Send, ShoppingCart,
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { trackGenerateLead } from '@/lib/analytics-peyu';
import B2BHeader from '@/components/b2b/B2BHeader';
import B2BPriceTable from '@/components/b2b/B2BPriceTable';
import B2BLogoMockup from '@/components/b2b/B2BLogoMockup';
import ColorSwatchesV2 from '@/components/shopv2/ColorSwatchesV2';
import { getColoresProducto } from '@/lib/color-parser';
import { getColorTintFilter } from '@/lib/color-tint';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';
import { findColorImageMatch } from '@/lib/color-image-matcher';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';

const IVA = 0.19;

export default function EmpresaProducto() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = new URLSearchParams(location.search).get('id');

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(50);
  const [activeImg, setActiveImg] = useState(0);
  const [manualPick, setManualPick] = useState(false); // click del cliente en la galería gana sobre el color
  const [logoUrl, setLogoUrl] = useState(null); // logo subido en esta ficha → viaja al cotizador
  const [colorId, setColorId] = useState(null); // color oficial elegido (norma catálogo PDF)

  // ── Captura de lead B2B inline (reemplaza el paso CotizacionRapida) ──
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    base44.entities.Producto.filter({ id })
      .then(rows => setProducto(rows?.[0] || null))
      .finally(() => setLoading(false));
  }, [id]);

  const images = useMemo(() => {
    if (!producto) return [];
    const main = getProductImage(producto);
    // Fotos por color asignadas manualmente por el founder (imagenes_por_color).
    // Se incluyen como thumbnails de galería para que el cliente vea cada color.
    const mapa = producto.imagenes_por_color;
    const colorFotos = (mapa && typeof mapa === 'object')
      ? Object.values(mapa).filter((u) => typeof u === 'string' && u.startsWith('http') && u !== main)
      : [];
    const extra = Array.isArray(producto.galeria_urls)
      ? producto.galeria_urls.filter(u => u?.startsWith('http') && u !== main && !colorFotos.includes(u))
      : [];
    return [main, ...colorFotos, ...extra].slice(0, 8);
  }, [producto]);

  // Colores oficiales (Azul/Negro/Rojo/Verde · norma catálogo B2B PDF).
  // Al elegir uno, la imagen cambia INSTANTÁNEO: foto real del color si existe,
  // o tinte CSS al tono oficial si no. No aplica a carcasas.
  const colores = useMemo(
    () => (producto && producto.categoria !== 'Carcasas B2C' ? getColoresProducto(producto) : []),
    [producto],
  );
  const color = useMemo(() => colores.find((c) => c.id === colorId), [colores, colorId]);

  // Imagen que se muestra: al elegir un color, busca la foto real de ese color
  // (imagenes_por_color → match por nombre en galería → tinte CSS como último recurso).
  const displayImg = useMemo(() => {
    if (!producto) return null;
    const base = getProductImage(producto);
    // El click explícito del cliente en un thumbnail SIEMPRE gana.
    if (manualPick) return images[activeImg] || base;
    if (!color) return images[activeImg] || base;
    // ① Foto real del color (imagenes_por_color)
    const colorPhoto = getProductImageForColor(producto, color);
    if (colorPhoto && colorPhoto !== base) return colorPhoto;
    // ② Match por nombre de color en la galería
    const match = findColorImageMatch(images, color);
    if (match) return images[match.index];
    // ③ Sin foto real → imagen activa de la galería
    return images[activeImg] || base;
  }, [producto, color, images, activeImg, manualPick]);

  // Tinte CSS solo si NO encontramos foto real del color.
  const colorFilter = useMemo(() => {
    if (!producto || !color || manualPick) return '';
    const base = getProductImage(producto);
    const colorPhoto = getProductImageForColor(producto, color);
    if (colorPhoto !== base) return ''; // hay foto real, no se tinta
    const match = findColorImageMatch(images, color);
    if (match) return ''; // hay match en galería, no se tinta
    return getColorTintFilter(producto, color);
  }, [producto, color, images, manualPick]);

  const b2b = useMemo(() => getB2BPriceForQty(producto, qty), [producto, qty]);
  const unitPrice = b2b?.precio ?? getUnitBasePrice(producto);
  const neto = unitPrice * qty;
  const iva = Math.round(neto * IVA);
  const total = neto + iva;
  const moq = producto?.personalizacion_gratis_desde || producto?.moq_personalizacion || 10;
  const logoGratis = qty >= moq;

  const incluye = Array.isArray(producto?.incluye_items_v2) && producto.incluye_items_v2.length
    ? producto.incluye_items_v2
    : (producto?.incluye ? [producto.incluye] : []);

  const goToCotizar = () => setShowForm(true);

  // Compra B2B: ancla el producto (con qty + color + logo) al embudo
  // self-service B2B y envía directo al paso de datos de empresa. El flujo
  // B2B genera una propuesta formal con PDF → aceptación → factura.
  // NUNCA deriva al carrito B2C.
  const goToComprar = () => {
    try {
      sessionStorage.setItem('peyu_b2b_anchor', JSON.stringify({
        sku: producto.sku,
        cantidad: qty,
        personalizar: true,
        logoUrl: logoUrl || undefined,
      }));
    } catch { /* ignore */ }
    navigate(`/b2b/self-service?sku=${encodeURIComponent(producto.sku)}`);
  };

  const submitLead = async () => {
    if (!form.company.trim() || !form.name.trim() || !form.email.trim()) {
      setSendError('Completa empresa, nombre y email.');
      return;
    }
    setSendError('');
    setSending(true);
    try {
      await base44.functions.invoke('captureB2BLeadV2', {
        contact_name: form.name.trim(),
        company_name: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        qty_estimate: qty,
        product_interest: `${producto?.sku} — ${producto?.nombre || ''} · ${qty}u`,
        logo_url: logoUrl || undefined,
      });
      // 📊 GA4 — generate_lead (lead corporativo B2B).
      trackGenerateLead({ value: neto, content_name: `${producto?.sku} · ${qty}u` });
      setSent(true);
    } catch {
      setSendError('Error al enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen" style={{ background: '#F8F3ED' }}>
      <B2BHeader backTo="/EmpresasNuevo" />
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0F8B6C' }} />
      </div>
    </div>
  );

  if (!producto) return (
    <div className="min-h-screen font-inter" style={{ background: '#F8F3ED' }}>
      <B2BHeader backTo="/EmpresasNuevo" />
      <div className="text-center py-32 px-4">
        <p className="font-bold mb-2" style={{ color: '#2C1810' }}>Producto no encontrado</p>
        <Link to="/EmpresasNuevo" className="font-bold text-sm" style={{ color: '#0F8B6C' }}>← Volver al catálogo</Link>
      </div>
    </div>
  );

  const esCompostable = producto.material?.includes('Trigo');

  return (
    <div className={`min-h-screen font-inter ${showForm ? 'pb-[11rem]' : 'pb-[5.5rem]'} lg:pb-8 transition-[padding]`} style={{ background: '#F8F3ED', color: '#2C1810', maxWidth: '100vw', overflowX: 'hidden' }}>
      <SEOHead
        title={`${producto.nombre} · Regalo Corporativo Reciclado | PEYU`}
        description={`${producto.nombre} para empresas en plástico 100% reciclado. Personalización láser con tu logo, precios por volumen y factura empresa. Cotización en 24h.`}
        url={`https://peyuchile.cl/EmpresaProducto?id=${producto.id}`}
        image={getProductImage(producto)}
        type="product"
      />
      <B2BHeader backTo="/EmpresasNuevo" />

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-6" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        {/* Breadcrumb desktop */}
        <div className="hidden lg:flex items-center gap-2 text-xs mb-5" style={{ color: '#A08070' }}>
          <Link to="/EmpresasNuevo" className="hover:underline font-semibold" style={{ color: '#7A6050' }}>Catálogo empresarial</Link>
          <span>/</span>
          <span style={{ color: '#2C1810' }}>{producto.nombre}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-12 lg:items-start">

          {/* ── GALERÍA ── */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-3">
            {/* Imagen principal */}
            <div className="relative aspect-square rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(145deg,#F7F2EC,#EDE3D6)', border: '1.5px solid #D4C4B0' }}>
              <img
                src={displayImg}
                alt={producto.nombre}
                className="w-full h-full"
                style={{ objectFit: 'contain', objectPosition: 'center', padding: '12px', filter: colorFilter || undefined, transition: 'filter .25s ease' }}
                onError={(e) => { e.target.style.opacity = '0.3'; }}
              />
              <span className="absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(248,243,237,.92)', color: '#7A6050', border: '1px solid #D4C4B0' }}>
                {esCompostable ? 'Compostable' : '100% Reciclado'}
              </span>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveImg(i); setManualPick(true); }}
                    className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all"
                    style={{ border: activeImg === i ? '2px solid #0F8B6C' : '1.5px solid #D4C4B0', opacity: activeImg === i ? 1 : 0.7 }}
                  >
                    <img src={img} alt="" className="w-full h-full" style={{ objectFit: 'contain', padding: '4px' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── CONFIGURADOR ── */}
          <div className="space-y-4 sm:space-y-6 lg:pb-8">
            {/* Encabezado */}
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#A08070' }}>
                {producto.categoria?.replace(' B2C', '')}
              </p>
              <h1 className="font-fraunces text-xl sm:text-3xl lg:text-4xl leading-[1.08] mb-1.5" style={{ color: '#2C1810', wordBreak: 'break-word' }}>
                {producto.nombre}
              </h1>
              {producto.descripcion && (
                <p className="text-[13px] sm:text-sm leading-relaxed" style={{ color: '#7A6050' }}>{producto.descripcion}</p>
              )}
            </div>

            {/* Color oficial (norma catálogo B2B): actualiza la imagen al tiro */}
            {colores.length > 1 && (
              <ColorSwatchesV2 colores={colores} value={colorId} onSelect={(v) => { setColorId(v); setManualPick(false); }} producto={producto} />
            )}

            {/* Precio en vivo */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: '#7A6050' }}>Precio unitario</span>
                <div className="flex items-center gap-2">
                  <span className="font-poppins font-bold text-xl" style={{ color: '#0F8B6C' }}>{fmtCLP(unitPrice)}/u</span>
                  {b2b?.ahorroPct > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#D96B4D15', color: '#D96B4D' }}>
                      -{b2b.ahorroPct}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-px" style={{ background: '#EDE3D6' }} />
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#7A6050' }}>Neto ({qty}u)</span>
                <span className="font-bold" style={{ color: '#2C1810' }}>{fmtCLP(neto)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#A08070' }}>IVA (19%)</span>
                <span style={{ color: '#A08070' }}>{fmtCLP(iva)}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span style={{ color: '#2C1810' }}>Total estimado</span>
                <span className="font-fraunces text-2xl" style={{ color: '#0F8B6C' }}>{fmtCLP(total)}</span>
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold" style={{ color: '#2C1810' }}>Cantidad</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: logoGratis ? '#0F8B6C15' : '#F2ECE2', color: logoGratis ? '#0F8B6C' : '#A08070', border: logoGratis ? '1px solid #0F8B6C30' : '1px solid #D4C4B0' }}>
                  {logoGratis ? `✓ Logo gratis (≥${moq}u)` : `Logo gratis desde ${moq}u`}
                </span>
              </div>

              <div className="space-y-3">
                {/* Stepper */}
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center rounded-xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0', background: 'white' }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 10))} className="w-12 h-12 flex items-center justify-center transition-colors hover:bg-[#F2ECE2] active:bg-[#EDE3D6]">
                      <Minus className="w-4 h-4" style={{ color: '#7A6050' }} />
                    </button>
                    <input
                      type="number"
                      value={qty}
                      onChange={e => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 h-12 text-center text-base font-bold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ color: '#2C1810' }}
                    />
                    <button onClick={() => setQty(q => q + 10)} className="w-12 h-12 flex items-center justify-center transition-colors hover:bg-[#F2ECE2] active:bg-[#EDE3D6]">
                      <Plus className="w-4 h-4" style={{ color: '#7A6050' }} />
                    </button>
                  </div>
                  <span className="text-xs text-[#A08070]">unidades</span>
                </div>

                {/* Chips rápidos — scroll horizontal en mobile */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                  {[10, 50, 100, 250, 500, 1000].map(n => (
                    <button
                      key={n}
                      onClick={() => setQty(n)}
                      className="flex-shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.96]"
                      style={{
                        background: qty === n ? '#0F8B6C' : 'white',
                        color: qty === n ? 'white' : '#7A6050',
                        border: `1.5px solid ${qty === n ? '#0F8B6C' : '#D4C4B0'}`,
                        boxShadow: qty === n ? '0 2px 8px rgba(15,139,108,.2)' : 'none',
                      }}
                    >
                      {n}u
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabla de precios */}
            <B2BPriceTable producto={producto} qtyActual={qty} />

            {/* Mockup con logo — usa la MISMA imagen que la galería (color elegido).
                El mockup CSS es instantáneo y definitivo, sin botón de generar. */}
            <B2BLogoMockup
              producto={producto}
              onLogoChange={setLogoUrl}
              productImgOverride={displayImg}
              colorFilterOverride={colorFilter}
            />

            {/* Qué incluye */}
            {incluye.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5" style={{ color: '#7A6050' }}>
                  <Package className="w-3.5 h-3.5" style={{ color: '#0F8B6C' }} /> Qué incluye
                </p>
                <ul className="space-y-2">
                  {incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#4B4F54' }}>
                      <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#0F8B6C' }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { icon: Recycle, t: '100% reciclado' },
                { icon: Truck, t: 'Envío a Chile' },
                { icon: ShieldCheck, t: '10 años garantía' },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl p-2 sm:p-3.5 text-center" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,173,138,.12)' }}>
                    <b.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#8BAD8A' }} />
                  </div>
                  <span className="text-[9px] sm:text-xs font-bold leading-tight" style={{ color: '#7A6050' }}>{b.t}</span>
                </div>
              ))}
            </div>

            {/* CTA desktop — captura lead inline */}
            {sent ? (
              <div className="hidden lg:flex flex-col items-center gap-2 p-5 rounded-2xl" style={{ background: '#0F8B6C08', border: '1.5px solid #0F8B6C30' }}>
                <Check className="w-8 h-8" style={{ color: '#0F8B6C' }} />
                <p className="font-bold text-base" style={{ color: '#0F8B6C' }}>¡Cotización enviada!</p>
                <p className="text-xs text-center" style={{ color: '#7A6050' }}>Te responderemos en 24h hábiles.</p>
                <Link to="/EmpresasNuevo" className="text-xs font-bold mt-1 underline" style={{ color: '#0F8B6C' }}>Seguir explorando el catálogo →</Link>
              </div>
            ) : showForm ? (
              <div className="hidden lg:flex flex-col gap-3 p-4 rounded-2xl" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
                <p className="font-bold text-sm" style={{ color: '#2C1810' }}>
                  <Building2 className="w-4 h-4 inline mr-1.5" style={{ color: '#0F8B6C' }} />
                  Datos para tu cotización
                </p>
                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Empresa *" className="h-11 px-4 rounded-xl text-sm focus:outline-none" style={{ border: '1.5px solid #D4C4B0', background: '#F8F3ED' }} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre *" className="h-11 px-4 rounded-xl text-sm focus:outline-none" style={{ border: '1.5px solid #D4C4B0', background: '#F8F3ED' }} />
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Teléfono" className="h-11 px-4 rounded-xl text-sm focus:outline-none" style={{ border: '1.5px solid #D4C4B0', background: '#F8F3ED' }} />
                </div>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Email *" type="email" className="h-11 px-4 rounded-xl text-sm focus:outline-none" style={{ border: '1.5px solid #D4C4B0', background: '#F8F3ED' }} />
                {sendError && <p className="text-xs font-bold" style={{ color: '#D96B4D' }}>{sendError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setShowForm(false)}
                    className="h-11 px-4 rounded-xl font-bold text-sm transition-all active:scale-95"
                    style={{ border: '1.5px solid #D4C4B0', color: '#7A6050', background: 'white' }}>
                    Cancelar
                  </button>
                  <button onClick={submitLead} disabled={sending}
                    className="flex-1 h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 4px 16px rgba(15,139,108,.3)' }}>
                    {sending ? 'Enviando…' : <>{fmtCLP(neto)} neto · Enviar <Send className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={goToComprar}
                    className="flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#C0785C' }}
                    title="Generar propuesta de compra B2B"
                  >
                    <ShoppingCart className="w-5 h-5" /> Comprar
                  </button>
                  <button
                    onClick={goToCotizar}
                    className="flex-1 h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 8px 28px rgba(15,139,108,.28)' }}
                  >
                    Solicitar cotización <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[11px] text-center px-1" style={{ color: '#A08070' }}>
                  {fmtCLP(neto)} neto + IVA · Propuesta formal con PDF en 60 seg
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── NAVBAR FIJA MOBILE ── */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-[90] pb-safe"
        style={{ background: 'rgba(248,243,237,.98)', borderTop: '1.5px solid #D4C4B0', backdropFilter: 'blur(20px) saturate(170%)', WebkitBackdropFilter: 'blur(20px) saturate(170%)', boxShadow: '0 -6px 30px rgba(44,24,16,.12)', maxWidth: '100vw', overflowX: 'hidden', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
      >
        {sent ? (
          <div className="flex flex-col items-center px-3 py-3 gap-1">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" style={{ color: '#0F8B6C' }} />
              <span className="font-bold text-sm" style={{ color: '#0F8B6C' }}>¡Cotización enviada!</span>
            </div>
            <Link to="/EmpresasNuevo" className="text-[10px] font-bold underline" style={{ color: '#0F8B6C' }}>
              Seguir explorando el catálogo →
            </Link>
          </div>
        ) : showForm ? (
          <div className="px-3 py-2.5 space-y-2" style={{ maxWidth: '100%' }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: '#0F8B6C' }} />
              <span className="text-xs font-bold" style={{ color: '#2C1810' }}>Datos de cotización</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="Empresa *" className="h-10 px-3 rounded-xl text-xs focus:outline-none" style={{ border: '1.5px solid #D4C4B0', background: 'white' }} />
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nombre *" className="h-10 px-3 rounded-xl text-xs focus:outline-none" style={{ border: '1.5px solid #D4C4B0', background: 'white' }} />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email *" type="email" className="h-10 px-3 rounded-xl text-xs focus:outline-none" style={{ border: '1.5px solid #D4C4B0', background: 'white' }} />
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Teléfono" className="h-10 px-3 rounded-xl text-xs focus:outline-none" style={{ border: '1.5px solid #D4C4B0', background: 'white' }} />
            </div>
            {sendError && <p className="text-[10px] font-bold" style={{ color: '#D96B4D' }}>{sendError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)}
                className="flex-shrink-0 h-10 px-4 rounded-xl font-bold text-xs transition-all active:scale-95"
                style={{ border: '1.5px solid #D4C4B0', color: '#7A6050', background: 'white' }}>
                Cancelar
              </button>
              <button onClick={submitLead} disabled={sending}
                className="flex-1 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 4px 16px rgba(15,139,108,.3)' }}>
                {sending ? 'Enviando…' : <>{fmtCLP(neto)} · Enviar <Send className="w-3.5 h-3.5" /></>}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-stretch gap-2 px-3 py-2.5" style={{ maxWidth: '100%' }}>
            <button
              onClick={() => navigate('/EmpresasNuevo')}
              className="flex-shrink-0 h-12 px-3.5 rounded-2xl flex items-center gap-1 font-bold text-xs transition-all active:scale-[0.97]"
              style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#7A6050' }}
            >
              <ArrowLeft className="w-4 h-4" /> Atrás
            </button>
            <button
              onClick={goToComprar}
              className="flex-shrink-0 h-12 px-3.5 rounded-2xl flex items-center justify-center font-bold text-xs transition-all active:scale-[0.97]"
              style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#C0785C' }}
              title="Generar propuesta de compra B2B"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <button
                onClick={goToCotizar}
                className="w-full h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 4px 16px rgba(15,139,108,.3)' }}
              >
                Solicitar cotización <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center mt-0.5 font-semibold" style={{ color: '#A08070' }}>
                {fmtCLP(neto)} neto + IVA
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}