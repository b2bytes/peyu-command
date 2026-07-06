import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, Trash2, ArrowRight, Recycle, ArrowLeft, ShieldCheck } from 'lucide-react';
import NoIndex from '@/components/NoIndex';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
import CheckoutStepperV2 from '@/components/shopv2/CheckoutStepperV2';
import StepNavV2 from '@/components/shopv2/StepNavV2';
import QtyStepperV2 from '@/components/shopv2/QtyStepperV2';
import CartItemThumbV2 from '@/components/shopv2/CartItemThumbV2';
import CartQuoteBridgeV2 from '@/components/shopv2/CartQuoteBridgeV2';
import CuponBox from '@/components/cart/CuponBox';
import GiftCardRedeemBox from '@/components/cart/GiftCardRedeemBox';
import {
  getCartV2, updateCartItemV2, removeFromCartV2, fmtCLP,
} from '@/lib/shop-v2-cart';
import { trackInitiateCheckout } from '@/lib/meta-pixel';
import { calcularCargoPersonalizacionCarrito } from '@/lib/personalizacion-config';
import { computeQtyDiscountBySku, getNextQtyTeaserForSku, getQtyDiscountPct } from '@/lib/volume-discount';

// ════════════════════════════════════════════════════════════════════════
// /CarritoNuevo — Carrito del Shop v2 (carrito_v2 aislado). Edita cantidades,
// elimina líneas, calcula personalización con la regla real (gratis ≥ MOQ) y
// lleva al checkout legacy reutilizando localStorage `carrito`.
// ════════════════════════════════════════════════════════════════════════
export default function CarritoNuevo() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [productosBySku, setProductosBySku] = useState({});
  const [cupon, setCupon] = useState(null);
  const [giftcard, setGiftcard] = useState(null);

  useEffect(() => { setItems(getCartV2()); }, []);

  // Carga los productos del carrito para conocer sus tramos B2B (precio mayorista
  // ≥10u). Si falla, el carrito sigue funcionando con el flujo B2C de siempre.
  useEffect(() => {
    const skus = [...new Set(getCartV2().map((i) => i.sku).filter(Boolean))];
    if (skus.length === 0) return;
    base44.entities.Producto.list('-updated_date', 300)
      .then((all) => {
        const map = {};
        for (const p of all || []) {
          if (p.sku && skus.includes(p.sku)) map[p.sku] = p;
        }
        setProductosBySku(map);
      })
      .catch(() => {});
  }, [items.length]);

  const setQty = (id, cantidad) => setItems(updateCartItemV2(id, { cantidad }));
  const remove = (id) => setItems(removeFromCartV2(id));

  const subtotal = items.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
  const cargoPersonalizacion = calcularCargoPersonalizacionCarrito(items);
  // Descuento automático: ≥10u del mismo SKU → PRECIO MAYORISTA B2B real (+IVA);
  // bajo 10u → descuento B2C de siempre (2u −10% · 3+u −15%). Una sola fuente.
  const { lineas: descLineas, ahorroTotal } = useMemo(
    () => computeQtyDiscountBySku({ carrito: items, productosBySku }),
    [items, productosBySku]
  );
  const total = subtotal + cargoPersonalizacion - ahorroTotal;
  // Descuento por cupón (calculado por CuponBox internamente).
  const descuentoCupon = cupon?.descuento_clp || 0;
  // Saldo aplicado de gift card (descuenta del total tras cupón).
  const descuentoGift = giftcard ? Math.min(giftcard.saldo_clp, Math.max(0, total - descuentoCupon)) : 0;
  const totalFinal = Math.max(0, total - descuentoCupon - descuentoGift);

  // Mapa sku → línea de descuento, para badges por ítem (mayorista vs % cantidad).
  const descBySku = useMemo(() => {
    const m = {};
    for (const l of descLineas) m[l.sku || l.nombre] = l;
    return m;
  }, [descLineas]);

  // Navega al checkout v2 propio (mobile-first, BlueExpress inline). Aislado.
  const irACheckout = () => {
    // 📊 Meta Pixel — InitiateCheckout con el total y nº de items del carrito.
    trackInitiateCheckout({ value: total, num_items: items.length });
    navigate('/CheckoutNuevo');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
        <NoIndex />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
            <ShoppingBag className="w-8 h-8" style={{ color: '#A08070' }} />
          </div>
          <h1 className="font-fraunces text-2xl mb-2">Tu carrito está vacío</h1>
          <p className="text-sm mb-6" style={{ color: '#7A6050' }}>Descubre nuestros productos de plástico reciclado.</p>
          <Link to="/CatalogoNuevo">
            <button className="inline-flex items-center gap-2 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg transition-all" style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}>
              Ir a la tienda <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-inter pb-32 lg:pb-0" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <NoIndex />
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-5">
        <CheckoutStepperV2 current="carrito" />
        {/* Link solo desktop — mobile usa el navbar inferior */}
        <Link to="/CatalogoNuevo" className="hidden lg:inline-flex items-center gap-1.5 text-sm font-bold mb-5 transition-colors" style={{ color: '#7A6050' }}>
          <ArrowLeft className="w-4 h-4" /> Seguir comprando
        </Link>

        <h1 className="font-fraunces text-lg sm:text-4xl mb-3 sm:mb-5">Tu carrito</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Líneas */}
          <div className="lg:col-span-2 space-y-2">
             {items.map((item) => {
               const moq = item.moq_personalizacion || item.personalizacion_gratis_desde || 10;
               const gratis = item.personalizacion && (item.cantidad || 1) >= moq;
               const cant = item.cantidad || 1;
               // Línea de descuento agrupada por SKU (mayorista o % cantidad).
               const linea = descBySku[item.sku || item.nombre];
               const esMayorista = linea?.beneficioAplicado === 'mayorista';
               // Precio mostrado de la línea: si hay mayorista, usa el unitario mayorista.
               const precioMostrado = esMayorista ? linea.precioMayoristaUnit : (item.precio || 0);
               const lineaProducto = precioMostrado * cant;
               const pctLinea = item.cyber ? 0 : (linea?.pct || getQtyDiscountPct(cant));
               // El teaser para sumar más solo aplica bajo el escalón mayorista.
               const teaser = item.cyber || esMayorista ? null : getNextQtyTeaserForSku(cant);
               return (
                 <div key={item.id} className="flex gap-2 bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5" style={{ border: '1.5px solid #D4C4B0' }}>
                   <div className="relative flex-shrink-0 w-14 h-14 sm:w-24 sm:h-24">
                    <CartItemThumbV2
                      snapshotUrl={item.mockupUrl && item.mockupUrl.startsWith('data:') ? item.mockupUrl : null}
                      imagen={item.imagen_base || item.imagen}
                      capas={item.capas_grabado || []}
                      alt={item.nombre}
                      fallback={item.imagen}
                    />
                    {(item.capas_grabado?.length > 0 || item.logoUrl || item.personalizacion) && (
                      <span className="absolute -top-1 -right-1 bg-[#D96B4D] text-white text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full shadow z-10">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                       <h3 className="font-semibold text-[11px] sm:text-xs text-[#2A2420] leading-tight line-clamp-2">{item.nombre}</h3>
                       <button onClick={() => remove(item.id)} className="transition-colors flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg -mr-1" style={{ color: '#A08070' }} onMouseOver={e=>e.currentTarget.style.color='#C0785C'} onMouseOut={e=>e.currentTarget.style.color='#A08070'} aria-label="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                     <div className="flex flex-wrap gap-0.5 mt-1">
                       {item.color && (
                         <span className="text-[8px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.5 rounded-full" style={{ background: '#F2EBE1', border: '1px solid #D4C4B0', color: '#7A6050' }}>{item.color}</span>
                       )}
                       {item.personalizacion && (
                         <span className="text-[8px] sm:text-[9px] font-semibold px-1 sm:px-1.5 py-0.5 rounded-full line-clamp-1" style={{ background: 'rgba(192,120,92,.1)', color: '#C0785C' }}>
                           {item.personalizacion}
                         </span>
                       )}
                       {gratis && (
                         <span className="text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,173,138,.15)', color: '#5B7D5A' }}>✓</span>
                       )}
                       {esMayorista ? (
                         <span className="text-[8px] sm:text-[9px] font-bold text-white px-1 sm:px-1.5 py-0.5 rounded-full" style={{ background: '#5B7D5A' }}>🏭 Mayorista{pctLinea > 0 ? ` −${pctLinea}%` : ''}</span>
                       ) : pctLinea > 0 && (
                         <span className="text-[8px] sm:text-[9px] font-bold text-white px-1 sm:px-1.5 py-0.5 rounded-full" style={{ background: '#8BAD8A' }}>−{pctLinea}%</span>
                       )}
                     </div>
                     <div className="flex items-center justify-between mt-2 gap-2">
                      <QtyStepperV2
                        value={cant}
                        onChange={(v) => setQty(item.id, v)}
                        min={1}
                        max={typeof item.stockColor === 'number' ? Math.max(1, item.stockColor) : 9999}
                      />
                      <span className="font-poppins font-bold text-sm sm:text-base flex-shrink-0" style={{ color: '#2C1810' }}>{fmtCLP(lineaProducto)}</span>
                     </div>
                     {typeof item.stockColor === 'number' && cant >= item.stockColor && (
                       <p className="text-[9px] sm:text-[10px] font-semibold mt-1" style={{ color: '#C0785C' }}>
                         Stock máximo{item.color ? ` en ${item.color}` : ''}: {item.stockColor}u
                       </p>
                     )}
                     {teaser && (
                       <button
                         onClick={() => setQty(item.id, cant + teaser.necesita)}
                         className="mt-1.5 text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-full transition-all active:scale-95"
                         style={{ background: 'rgba(139,173,138,.12)', border: '1px dashed #8BAD8A', color: '#5B7D5A' }}
                       >
                         💡 Agrega {teaser.necesita} más y ahorra {teaser.pctSiguiente}%
                       </button>
                     )}
                  </div>
                </div>
              );
            })}

            {/* Cupón + Gift Card — accesibles desde el carrito, antes del checkout */}
            <div className="space-y-2">
              <CuponBox subtotal={subtotal + cargoPersonalizacion - ahorroTotal} envio={0} onChange={setCupon} />
              <GiftCardRedeemBox onChange={setGiftcard} />
            </div>

            {/* Puente B2B: el MISMO carrito se cotiza con factura y volumen */}
            <CartQuoteBridgeV2 />

            {/* Navegación Atrás / Siguiente (desktop) */}
            <div className="hidden lg:block">
              <StepNavV2 backTo="/CatalogoNuevo" backLabel="Seguir comprando" onNext={irACheckout} nextLabel="Ir a pagar" />
            </div>
          </div>

          {/* Resumen — solo visible en desktop */}
          <div className="hidden lg:block lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-3xl p-5 space-y-3" style={{ border: '1.5px solid #D4C4B0', boxShadow: '0 4px 24px rgba(44,24,16,.08)' }}>
              <h2 className="font-fraunces text-xl" style={{ color: '#2C1810' }}>Resumen</h2>
              <div className="flex justify-between text-sm" style={{ color: '#7A6050' }}>
                <span>Subtotal</span>
                <span className="font-semibold">{fmtCLP(subtotal)}</span>
              </div>
              {cargoPersonalizacion > 0 && (
                <div className="flex justify-between text-sm" style={{ color: '#7A6050' }}>
                  <span>Personalización</span>
                  <span className="font-semibold">+{fmtCLP(cargoPersonalizacion)}</span>
                </div>
              )}
              {ahorroTotal > 0 && (
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(139,173,138,.1)', border: '1px solid rgba(139,173,138,.3)' }}>
                  <div className="flex justify-between text-sm font-bold" style={{ color: '#5B7D5A' }}>
                    <span>Ahorro por volumen</span>
                    <span>−{fmtCLP(ahorroTotal)}</span>
                  </div>
                  {descLineas.filter((l) => l.ahorro > 0).map((l) => (
                    <div key={l.sku || l.nombre} className="flex justify-between text-[11px]" style={{ color: '#7A6050' }}>
                      <span className="truncate pr-2">
                        {l.beneficioAplicado === 'mayorista' ? '🏭 ' : ''}{l.nombre} ({l.unidades}u · {l.beneficioAplicado === 'mayorista' ? `mayorista −${l.pct}%` : `−${l.pct}%`})
                      </span>
                      <span className="font-semibold flex-shrink-0">−{fmtCLP(l.ahorro)}</span>
                    </div>
                  ))}
                </div>
              )}
              {descuentoCupon > 0 && (
                <div className="flex justify-between text-sm font-bold" style={{ color: '#5B7D5A' }}>
                  <span>Cupón {cupon?.codigo}</span>
                  <span>−{fmtCLP(descuentoCupon)}</span>
                </div>
              )}
              {descuentoGift > 0 && (
                <div className="flex justify-between text-sm font-bold" style={{ color: '#5B7D5A' }}>
                  <span>Gift Card</span>
                  <span>−{fmtCLP(descuentoGift)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm" style={{ color: '#7A6050' }}>
                <span>Envío</span>
                <span style={{ color: '#A08070' }}>Se calcula al pagar</span>
              </div>
              <div className="flex justify-between pt-3" style={{ borderTop: '1px solid #D4C4B0' }}>
                <span className="font-bold" style={{ color: '#2C1810' }}>Total</span>
                <span className="font-poppins font-bold text-xl" style={{ color: '#C0785C' }}>{fmtCLP(totalFinal)}</span>
              </div>
              <p className="text-[10px]" style={{ color: '#A08070' }}>IVA incluido · sin envío</p>

              <button
                onClick={irACheckout}
                className="w-full h-13 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] mt-1"
                style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 8px 24px rgba(192,120,92,.28)' }}
              >
                Ir a pagar <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] pt-1" style={{ color: '#A08070' }}>
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#8BAD8A' }} /> Pago seguro · Garantía 10 años
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen mobile inline (ANTES del footer — estaba invertido) */}
      <div className="lg:hidden max-w-4xl mx-auto px-4 sm:px-6 pb-4">
        <div className="bg-white rounded-3xl p-4 space-y-2.5" style={{ border: '1.5px solid #D4C4B0' }}>
          <div className="flex justify-between text-sm" style={{ color: '#7A6050' }}>
            <span>Subtotal</span><span className="font-semibold">{fmtCLP(subtotal)}</span>
          </div>
          {cargoPersonalizacion > 0 && (
            <div className="flex justify-between text-sm" style={{ color: '#7A6050' }}>
              <span>Personalización</span><span className="font-semibold">+{fmtCLP(cargoPersonalizacion)}</span>
            </div>
          )}
          {ahorroTotal > 0 && (
            <div className="flex justify-between text-sm font-bold rounded-xl px-3 py-2" style={{ color: '#5B7D5A', background: 'rgba(139,173,138,.1)', border: '1px solid rgba(139,173,138,.25)' }}>
              <span>Ahorro por volumen</span><span>−{fmtCLP(ahorroTotal)}</span>
            </div>
          )}
          {descuentoCupon > 0 && (
            <div className="flex justify-between text-sm font-bold" style={{ color: '#5B7D5A' }}>
              <span>Cupón {cupon?.codigo}</span><span>−{fmtCLP(descuentoCupon)}</span>
            </div>
          )}
          {descuentoGift > 0 && (
            <div className="flex justify-between text-sm font-bold" style={{ color: '#5B7D5A' }}>
              <span>Gift Card</span><span>−{fmtCLP(descuentoGift)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2.5" style={{ borderTop: '1px solid #D4C4B0' }}>
            <span className="font-bold text-base" style={{ color: '#2C1810' }}>Total</span>
            <span className="font-poppins font-bold text-xl" style={{ color: '#C0785C' }}>{fmtCLP(totalFinal)}</span>
          </div>
          <p className="text-[10px]" style={{ color: '#A08070' }}>IVA incluido · envío se calcula al pagar</p>
        </div>
      </div>

      <footer className="py-8 text-center text-xs flex items-center justify-center gap-1.5" style={{ borderTop: '1px solid #D4C4B0', color: '#A08070' }}>
        <Recycle className="w-3.5 h-3.5" style={{ color: '#8BAD8A' }} /> PEYU Chile · Hecho con plástico reciclado 🇨🇱
      </footer>

      <MobileNavBarV2
        backTo="/CatalogoNuevo"
        backLabel="Tienda"
        ctaLabel="Ir a pagar"
        onCta={irACheckout}
        total={totalFinal}
      />
    </div>
  );
}