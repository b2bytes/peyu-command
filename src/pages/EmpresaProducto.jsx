// ════════════════════════════════════════════════════════════════════════
// /EmpresaProducto?id= — Ficha de producto B2B con mockup de logo en vivo.
// Galería · tabla de precios por volumen · calculadora de qty · mockup IA
// · botón "Agregar a cotización" persistente en mobile.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Recycle, ShieldCheck, Truck, Check, Loader2, ShoppingBag,
  Sparkles, Package, TrendingDown, Plus, Minus, ArrowRight,
} from 'lucide-react';
import B2BHeader from '@/components/b2b/B2BHeader';
import B2BPriceTable from '@/components/b2b/B2BPriceTable';
import B2BLogoMockup from '@/components/b2b/B2BLogoMockup';
import { getProductImage } from '@/utils/productImages';
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
  const [logoUrl, setLogoUrl] = useState(null); // logo subido en esta ficha → viaja al cotizador

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    base44.entities.Producto.filter({ id })
      .then(rows => setProducto(rows?.[0] || null))
      .finally(() => setLoading(false));
  }, [id]);

  const images = useMemo(() => {
    if (!producto) return [];
    const main = getProductImage(producto);
    const extra = Array.isArray(producto.galeria_urls)
      ? producto.galeria_urls.filter(u => u?.startsWith('http') && u !== main)
      : [];
    return [main, ...extra].slice(0, 5);
  }, [producto]);

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

  const goToCotizar = () => {
    // FLUJO CONTINUO: el logo cargado en esta ficha viaja al cotizador por URL
    // (CotizacionRapida lo lee con ?logo=) — nunca se pide una segunda vez.
    const logoParam = logoUrl ? `&logo=${encodeURIComponent(logoUrl)}` : '';
    navigate(`/CotizacionRapida?sku=${producto?.sku}&qty=${qty}${logoParam}`);
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
    <div className="min-h-screen font-inter pb-24 lg:pb-8" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <B2BHeader backTo="/EmpresasNuevo" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-6">
        {/* Breadcrumb desktop */}
        <div className="hidden lg:flex items-center gap-2 text-xs mb-5" style={{ color: '#A08070' }}>
          <Link to="/EmpresasNuevo" className="hover:underline font-semibold" style={{ color: '#7A6050' }}>Catálogo empresarial</Link>
          <span>/</span>
          <span style={{ color: '#2C1810' }}>{producto.nombre}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 lg:items-start">

          {/* ── GALERÍA ── */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-3">
            {/* Imagen principal */}
            <div className="relative aspect-square rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(145deg,#F7F2EC,#EDE3D6)', border: '1.5px solid #D4C4B0' }}>
              <img
                src={images[activeImg] || getProductImage(producto)}
                alt={producto.nombre}
                className="w-full h-full"
                style={{ objectFit: 'contain', objectPosition: 'center', padding: '12px' }}
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
                    onClick={() => setActiveImg(i)}
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
          <div className="space-y-6 lg:pb-8">
            {/* Encabezado */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A08070' }}>
                {producto.categoria?.replace(' B2C', '')}
              </p>
              <h1 className="font-fraunces text-2xl sm:text-4xl leading-[1.05] mb-2" style={{ color: '#2C1810' }}>
                {producto.nombre}
              </h1>
              {producto.descripcion && (
                <p className="text-sm leading-relaxed" style={{ color: '#7A6050' }}>{producto.descripcion}</p>
              )}
            </div>

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

            {/* Mockup con logo — el logo subido aquí viaja al cotizador */}
            <B2BLogoMockup producto={producto} onLogoChange={setLogoUrl} />

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

            {/* Trust badges desktop */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Recycle, t: '100% reciclado' },
                { icon: Truck, t: 'Envío a Chile' },
                { icon: ShieldCheck, t: '3 años garantía' },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-2 rounded-2xl p-3.5 text-center" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,173,138,.12)' }}>
                    <b.icon className="w-5 h-5" style={{ color: '#8BAD8A' }} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold leading-tight" style={{ color: '#7A6050' }}>{b.t}</span>
                </div>
              ))}
            </div>

            {/* CTA desktop */}
            <div className="hidden lg:flex gap-3">
              <button
                onClick={goToCotizar}
                className="flex-1 h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 8px 28px rgba(15,139,108,.28)' }}
              >
                <ShoppingBag className="w-5 h-5" />
                Agregar a cotización · {fmtCLP(neto)} neto
              </button>
            </div>

            <p className="text-[11px] text-center hidden lg:block" style={{ color: '#A08070' }}>
              Precio neto referencial sin IVA. Sin compromiso. Recibirás tu presupuesto formal en 24h.
            </p>
          </div>
        </div>
      </div>

      {/* ── NAVBAR FIJA MOBILE ── */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe px-4 py-3"
        style={{ background: 'rgba(248,243,237,.97)', borderTop: '1.5px solid #D4C4B0', backdropFilter: 'blur(20px)', boxShadow: '0 -4px 24px rgba(44,24,16,.1)' }}
      >
        <div className="flex gap-2.5 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/EmpresasNuevo')}
            className="flex-shrink-0 h-12 px-4 rounded-2xl flex items-center gap-1.5 font-bold text-sm transition-all"
            style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#7A6050' }}
          >
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm">Atrás</span>
          </button>
          <button
            onClick={goToCotizar}
            className="flex-1 h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 4px 16px rgba(15,139,108,.3)' }}
          >
            <ShoppingBag className="w-4 h-4" />
            Cotizar · {fmtCLP(neto)} neto
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}