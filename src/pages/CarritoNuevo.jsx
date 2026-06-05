import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Recycle, ArrowLeft, ShieldCheck } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import QtyStepperV2 from '@/components/shopv2/QtyStepperV2';
import {
  getCartV2, updateCartItemV2, removeFromCartV2, fmtCLP,
} from '@/lib/shop-v2-cart';
import { calcularCargoPersonalizacionCarrito, PERSONALIZACION_LABEL } from '@/lib/personalizacion-config';

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
  const total = subtotal + cargoPersonalizacion;

  // Navega al checkout v2 propio (mobile-first, BlueExpress inline). Aislado.
  const irACheckout = () => navigate('/CheckoutNuevo');

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420]">
        <ShopV2Header />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <div className="w-20 h-20 rounded-3xl bg-white border border-[#EBE3D6] flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-8 h-8 text-[#A78B6F]" />
          </div>
          <h1 className="font-fraunces text-2xl mb-2">Tu carrito está vacío</h1>
          <p className="text-sm text-[#4B4F54] mb-6">Descubre nuestros productos de plástico reciclado.</p>
          <Link to="/CatalogoNuevo">
            <button className="inline-flex items-center gap-2 bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg transition-all">
              Ir a la tienda <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420]">
      <ShopV2Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/CatalogoNuevo" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4B4F54] hover:text-[#0F8B6C] mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Seguir comprando
        </Link>

        <h1 className="font-fraunces text-3xl sm:text-4xl mb-6">Tu carrito</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Líneas */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const moq = item.moq_personalizacion || item.personalizacion_gratis_desde || 10;
              const gratis = item.personalizacion && (item.cantidad || 1) >= moq;
              const lineaProducto = (item.precio || 0) * (item.cantidad || 1);
              return (
                <div key={item.id} className="flex gap-3.5 bg-white rounded-2xl border border-[#EBE3D6] p-3.5">
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-[#EBE3D6] flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-[#2A2420] leading-snug line-clamp-2">{item.nombre}</h3>
                      <button onClick={() => remove(item.id)} className="text-[#A78B6F] hover:text-[#D96B4D] transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {item.color && (
                        <span className="text-[10px] font-semibold bg-[#FAF7F2] border border-[#EBE3D6] text-[#4B4F54] px-2 py-0.5 rounded-full">{item.color}</span>
                      )}
                      {item.tipo_personalizacion && (
                        <span className="text-[10px] font-semibold bg-[#D96B4D]/10 text-[#D96B4D] px-2 py-0.5 rounded-full">
                          {PERSONALIZACION_LABEL[item.tipo_personalizacion]}
                          {item.personalizacion && item.tipo_personalizacion === 'frase' ? `: "${item.personalizacion}"` : ''}
                        </span>
                      )}
                      {gratis && (
                        <span className="text-[10px] font-bold bg-[#0F8B6C]/10 text-[#0F8B6C] px-2 py-0.5 rounded-full">Grabado gratis</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <QtyStepperV2 value={item.cantidad || 1} onChange={(v) => setQty(item.id, v)} min={1} />
                      <span className="font-poppins font-bold text-[#2A2420]">{fmtCLP(lineaProducto)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl border border-[#EBE3D6] p-5 space-y-3">
              <h2 className="font-fraunces text-xl">Resumen</h2>
              <div className="flex justify-between text-sm text-[#4B4F54]">
                <span>Subtotal</span>
                <span className="font-semibold">{fmtCLP(subtotal)}</span>
              </div>
              {cargoPersonalizacion > 0 && (
                <div className="flex justify-between text-sm text-[#4B4F54]">
                  <span>Personalización</span>
                  <span className="font-semibold">+{fmtCLP(cargoPersonalizacion)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[#4B4F54]">
                <span>Envío</span>
                <span className="text-[#A78B6F]">Se calcula al pagar</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#EBE3D6]">
                <span className="font-bold text-[#2A2420]">Total</span>
                <span className="font-poppins font-bold text-xl text-[#0F8B6C]">{fmtCLP(total)}</span>
              </div>
              <p className="text-[10px] text-[#A78B6F]">IVA incluido · sin envío</p>

              <button
                onClick={irACheckout}
                className="w-full h-13 py-3.5 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all hover:scale-[1.01] mt-1"
              >
                Ir a pagar <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#A78B6F] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B6C]" /> Pago seguro · Garantía 10 años
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#EBE3D6] py-8 text-center text-xs text-[#A78B6F] mt-8 flex items-center justify-center gap-1.5">
        <Recycle className="w-3.5 h-3.5 text-[#0F8B6C]" /> PEYU Chile · Hecho con plástico reciclado 🇨🇱
      </footer>
    </div>
  );
}