import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Recycle, ArrowLeft, ShieldCheck } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import CheckoutStepperV2 from '@/components/shopv2/CheckoutStepperV2';
import StepNavV2 from '@/components/shopv2/StepNavV2';
import QtyStepperV2 from '@/components/shopv2/QtyStepperV2';
import CartItemThumbV2 from '@/components/shopv2/CartItemThumbV2';
import {
  getCartV2, updateCartItemV2, removeFromCartV2, fmtCLP,
} from '@/lib/shop-v2-cart';
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

  useEffect(() => { setItems(getCartV2()); }, []);

  const setQty = (id, cantidad) => setItems(updateCartItemV2(id, { cantidad }));
  const remove = (id) => setItems(removeFromCartV2(id));

  const subtotal = items.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
  const cargoPersonalizacion = calcularCargoPersonalizacionCarrito(items);
  // Descuento automático B2C por cantidad del mismo SKU (2u → 10% · 3+u → 15%).
  // Siempre se calcula y se muestra el detalle en el resumen.
  const { lineas: descLineas, ahorroTotal } = computeQtyDiscountBySku({ carrito: items });
  const total = subtotal + cargoPersonalizacion - ahorroTotal;

  // Navega al checkout v2 propio (mobile-first, BlueExpress inline). Aislado.
  const irACheckout = () => navigate('/CheckoutNuevo');

  if (items.length === 0) {
    return (
      <div className="min-h-screen font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
        <ShopV2Header />
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
    <div className="min-h-screen font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <ShopV2Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <CheckoutStepperV2 current="carrito" />
        <Link to="/CatalogoNuevo" className="inline-flex items-center gap-1.5 text-sm font-bold mb-5 transition-colors lg:hidden" style={{ color: '#7A6050' }}>
          <ArrowLeft className="w-4 h-4" /> Seguir comprando
        </Link>

        <h1 className="font-fraunces text-3xl sm:text-4xl mb-6">Tu carrito</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Líneas */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const moq = item.moq_personalizacion || item.personalizacion_gratis_desde || 10;
              const gratis = item.personalizacion && (item.cantidad || 1) >= moq;
              const cant = item.cantidad || 1;
              const lineaProducto = (item.precio || 0) * cant;
              const pctLinea = item.cyber ? 0 : getQtyDiscountPct(cant);
              const teaser = item.cyber ? null : getNextQtyTeaserForSku(cant);
              return (
                <div key={item.id} className="flex gap-3.5 bg-white rounded-3xl p-3.5" style={{ border: '1.5px solid #D4C4B0' }}>
                  <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                    <CartItemThumbV2
                      imagen={item.mockupUrl || item.imagen}
                      capas={item.capas_grabado || []}
                      alt={item.nombre}
                    />
                    {(item.capas_grabado?.length > 0 || item.logoUrl || item.personalizacion) && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#D96B4D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow z-10">
                        Diseño
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-[#2A2420] leading-snug line-clamp-2">{item.nombre}</h3>
                      <button onClick={() => remove(item.id)} className="transition-colors flex-shrink-0" style={{ color: '#A08070' }} onMouseOver={e=>e.currentTarget.style.color='#C0785C'} onMouseOut={e=>e.currentTarget.style.color='#A08070'}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.color && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F2EBE1', border: '1px solid #D4C4B0', color: '#7A6050' }}>{item.color}</span>
                      )}
                      {item.personalizacion && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(192,120,92,.1)', color: '#C0785C' }}>
                          {item.personalizacion}
                        </span>
                      )}
                      {gratis && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,173,138,.15)', color: '#5B7D5A' }}>Grabado gratis</span>
                      )}
                      {pctLinea > 0 && (
                        <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#8BAD8A' }}>−{pctLinea}% x cantidad</span>
                      )}
                    </div>
                    {teaser && (
                      <p className="text-[10px] text-[#D96B4D] font-bold mt-1.5">
                        ¡Agrega {teaser.necesita} más y obtén −{teaser.pctSiguiente}% en este producto!
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <QtyStepperV2 value={cant} onChange={(v) => setQty(item.id, v)} min={1} />
                      <span className="font-poppins font-bold" style={{ color: '#2C1810' }}>{fmtCLP(lineaProducto)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Navegación Atrás / Siguiente (desktop) */}
            <div className="hidden lg:block">
              <StepNavV2 backTo="/CatalogoNuevo" backLabel="Seguir comprando" onNext={irACheckout} nextLabel="Ir a pagar" />
            </div>
          </div>

          {/* Resumen */}
          <div className="lg:sticky lg:top-24 self-start">
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
                    <span>Descuento por cantidad</span>
                    <span>−{fmtCLP(ahorroTotal)}</span>
                  </div>
                  {descLineas.filter((l) => l.ahorro > 0).map((l) => (
                    <div key={l.sku || l.nombre} className="flex justify-between text-[11px]" style={{ color: '#7A6050' }}>
                      <span className="truncate pr-2">{l.nombre} ({l.unidades}u · −{l.pct}%)</span>
                      <span className="font-semibold flex-shrink-0">−{fmtCLP(l.ahorro)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between text-sm" style={{ color: '#7A6050' }}>
                <span>Envío</span>
                <span style={{ color: '#A08070' }}>Se calcula al pagar</span>
              </div>
              <div className="flex justify-between pt-3" style={{ borderTop: '1px solid #D4C4B0' }}>
                <span className="font-bold" style={{ color: '#2C1810' }}>Total</span>
                <span className="font-poppins font-bold text-xl" style={{ color: '#C0785C' }}>{fmtCLP(total)}</span>
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

      <footer className="py-8 text-center text-xs mt-8 flex items-center justify-center gap-1.5" style={{ borderTop: '1px solid #D4C4B0', color: '#A08070' }}>
        <Recycle className="w-3.5 h-3.5" style={{ color: '#8BAD8A' }} /> PEYU Chile · Hecho con plástico reciclado 🇨🇱
      </footer>
    </div>
  );
}