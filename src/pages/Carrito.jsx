import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft, ShoppingBag, Truck, Shield, ChevronRight, Lock, Recycle, Gift, AlertCircle } from 'lucide-react';
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics-peyu';
import { track } from '@/lib/activity-tracker';
import SEO from '@/components/SEO';
import PromoBox from '@/components/cart/PromoBox';
import PaymentMethodSelector from '@/components/cart/PaymentMethodSelector';
import ShippingAddressForm, { validarShippingForm } from '@/components/cart/ShippingAddressForm';
import ShippingSelector from '@/components/cart/ShippingSelector';
import ImpactoAmbiental from '@/components/cart/ImpactoAmbiental';
import OneClickBuyButton from '@/components/cart/OneClickBuyButton';
import { saveOneClickProfile } from '@/lib/one-click-profile';

const DESCUENTO_TRANSFERENCIA_PCT = 5;

export default function Carrito() {
  const navigate = useNavigate();
  const mpFailure = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mp') === 'failure';
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [cliente, setCliente] = useState({
    nombre: '', email: '', telefono: '',
    region: '', ciudad: '', direccion: '', codigo_postal: '',
  });
  const [errors, setErrors] = useState({});
  const [creando, setCreando] = useState(false);
  const [step, setStep] = useState(1); // 1=Carrito, 2=Datos+Pago
  const [giftCard, setGiftCard] = useState(null);
  const [cupon, setCupon] = useState(null); // { codigo, descuento_clp, libera_envio, ... }
  const [medioPago, setMedioPago] = useState('WebPay');
  // Envío Bluex: { servicio, costo, costo_real, lead_time_dias, comuna, peso_kg, envio_gratis_aplicado }
  const [envioBluex, setEnvioBluex] = useState(null);
  const captureTimerRef = useRef(null);

  // 📩 Captura el carrito abandonado en cuanto tenemos un email válido.
  const capturarCarrito = (clienteData) => {
    if (!clienteData.email || !/\S+@\S+\.\S+/.test(clienteData.email)) return;
    if (carrito.length === 0) return;
    clearTimeout(captureTimerRef.current);
    captureTimerRef.current = setTimeout(() => {
      base44.functions.invoke('capturarCarritoAbandonado', {
        email: clienteData.email,
        nombre: clienteData.nombre,
        telefono: clienteData.telefono,
        carrito_items: carrito.map(i => ({
          nombre: i.nombre, cantidad: i.cantidad, precio: i.precio,
          imagen: i.imagen, personalizacion: i.personalizacion,
        })),
        subtotal,
        total,
      }).catch(() => {});
    }, 500);
  };

  const eliminar = (id) => {
    const nuevo = carrito.filter(i => i.id !== id);
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
  };

  const actualizar = (id, cantidad) => {
    if (cantidad < 1) return;
    const nuevo = carrito.map(i => i.id === id ? { ...i, cantidad } : i);
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
  };

  // ── CÁLCULOS ───────────────────────────────────────────────────────
  const subtotal = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  // Envío: usa cotización Bluex real si está disponible, sino fallback a $5990 / gratis sobre $40k
  const envioBase = envioBluex
    ? envioBluex.costo
    : (subtotal >= 40000 ? 0 : 5990);
  // Cupón "envio_gratis" libera el envío
  const envio = cupon?.libera_envio ? 0 : envioBase;
  // Descuento por cupón (solo si NO es envio_gratis, ese ya redujo el envío)
  const descuentoCupon = cupon && !cupon.libera_envio ? (cupon.descuento_clp || 0) : 0;
  // Descuento por método de pago (transferencia 5% sobre subtotal)
  const descuentoTransferencia = medioPago === 'Transferencia'
    ? Math.floor(subtotal * (DESCUENTO_TRANSFERENCIA_PCT / 100))
    : 0;

  const totalAntesGC = Math.max(0, subtotal + envio - descuentoCupon - descuentoTransferencia);
  const carritoTieneGC = carrito.some(i =>
    String(i.sku || '').startsWith('GC-PEYU') ||
    String(i.nombre || '').toLowerCase().includes('gift card')
  );
  const gcDescuento = giftCard && !carritoTieneGC ? Math.min(giftCard.saldo_clp, totalAntesGC) : 0;
  const total = Math.max(0, totalAntesGC - gcDescuento);
  const totalCubiertoConGC = gcDescuento >= totalAntesGC && totalAntesGC > 0;

  // ── PEDIDO ─────────────────────────────────────────────────────────
  const validarYContinuar = () => {
    const errs = validarShippingForm(cliente);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const crearPedido = async () => {
    if (!validarYContinuar()) {
      // Scroll al primer error
      setTimeout(() => {
        document.querySelector('[class*="border-red-300"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    setCreando(true);
    const numero = `WEB-${Date.now()}`;
    const items = carrito.map(i => `${i.nombre} x${i.cantidad}${i.personalizacion ? ` [${i.personalizacion}]` : ''}`).join(' | ');
    const notasExtras = [
      gcDescuento > 0 ? `GiftCard ${giftCard.codigo} -$${gcDescuento.toLocaleString('es-CL')}` : null,
      cupon ? `Cupón ${cupon.codigo} -$${(cupon.descuento_clp || 0).toLocaleString('es-CL')}` : null,
      descuentoTransferencia > 0 ? `Dscto transferencia -$${descuentoTransferencia.toLocaleString('es-CL')}` : null,
      cliente.codigo_postal ? `CP ${cliente.codigo_postal}` : null,
      cliente.region ? `Región ${cliente.region}` : null,
      envioBluex ? `Bluex ${envioBluex.servicio} (${envioBluex.peso_kg}kg) → $${envioBluex.costo_real.toLocaleString('es-CL')}` : null,
    ].filter(Boolean).join(' | ');

    const descuentoTotal = descuentoCupon + descuentoTransferencia + gcDescuento;
    const medioPagoFinal = totalCubiertoConGC ? 'GiftCard' : medioPago;

    const pedido = await base44.entities.PedidoWeb.create({
      numero_pedido: numero,
      fecha: new Date().toISOString().split('T')[0],
      canal: 'Web Propia',
      cliente_nombre: cliente.nombre,
      cliente_email: cliente.email,
      cliente_telefono: cliente.telefono,
      tipo_cliente: 'B2C Individual',
      descripcion_items: items,
      cantidad: carrito.reduce((s, i) => s + i.cantidad, 0),
      subtotal,
      costo_envio: envio,
      descuento: descuentoTotal,
      total,
      medio_pago: medioPagoFinal,
      estado: medioPagoFinal === 'Transferencia' ? 'Nuevo' : 'Nuevo',
      ciudad: cliente.ciudad,
      direccion_envio: cliente.direccion,
      requiere_personalizacion: carrito.some(i => i.personalizacion),
      texto_personalizacion: carrito.filter(i => i.personalizacion).map(i => i.personalizacion).join(', '),
      courier: envioBluex ? `BlueExpress ${envioBluex.servicio}` : 'Pendiente',
      notas: `Carrito: ${carrito.length} items${notasExtras ? ' | ' + notasExtras : ''}`,
    });

    // Gift Card: descontar saldo
    if (gcDescuento > 0 && giftCard) {
      try {
        await base44.functions.invoke('canjearGiftCard', {
          action: 'redeem',
          codigo: giftCard.codigo,
          monto: gcDescuento,
          pedido_id: pedido?.id,
        });
      } catch (e) { console.warn('Error descontando GC:', e); }
      localStorage.removeItem('peyu_giftcard_active');
    }

    // Cupón: incrementar usos
    if (cupon?.id) {
      try {
        await base44.entities.Cupon.update(cupon.id, {
          usos_actuales: (cupon.usos_actuales || 0) + 1,
        });
      } catch (e) { console.warn('Error registrando uso de cupón:', e); }
      localStorage.removeItem('peyu_cupon_active');
    }

    // Guardamos snapshot del carrito antes de borrarlo, para que la página
    // /gracias pueda emitir el evento purchase de GA4 con los items reales.
    try { localStorage.setItem('peyu_last_purchase', JSON.stringify(carrito)); } catch {}

    // ── MERCADO PAGO: crear preferencia y redirigir al checkout MP ──
    if (medioPagoFinal === 'MercadoPago' && total > 0) {
      try {
        const mp = await base44.functions.invoke('mpCreatePreference', { pedido_id: pedido.id });
        const initUrl = mp?.data?.init_point || mp?.data?.sandbox_init_point;
        if (initUrl) {
          // Vaciamos el carrito local antes de salir (ya está persistido como pedido)
          localStorage.removeItem('carrito');
          trackPurchase({ transactionId: numero, total, shipping: envio, cart: carrito });
          // Trazabilidad 360°: checkout completo vía MercadoPago
          track.checkoutComplete({
            pedidoId: pedido?.id,
            total,
            email: cliente.email,
            name: cliente.nombre,
          });
          window.location.href = initUrl;
          return;
        }
        console.error('MP no devolvió init_point', mp);
        alert('No se pudo iniciar el pago con Mercado Pago. Inténtalo nuevamente o elige otro medio.');
        setCreando(false);
        return;
      } catch (e) {
        console.error('Error MP:', e);
        alert('Error iniciando Mercado Pago. Inténtalo nuevamente.');
        setCreando(false);
        return;
      }
    }

    // Guarda el perfil para "Compra en 1 Clic" en futuras visitas
    saveOneClickProfile(cliente, medioPagoFinal);

    localStorage.removeItem('carrito');
    trackPurchase({ transactionId: numero, total, shipping: envio, cart: carrito });
    // Trazabilidad 360°: checkout completo (vincula sesión anónima → email)
    track.checkoutComplete({
      pedidoId: pedido?.id,
      total,
      email: cliente.email,
      name: cliente.nombre,
    });
    setCreando(false);

    // Redirigimos a /gracias — es la "thank you page" estándar para conversión.
    // Mejor que mostrar un estado inline porque permite indexación del funnel
    // y deja la URL única para retargeting / atribución.
    navigate(`/gracias?numero=${encodeURIComponent(numero)}&email=${encodeURIComponent(cliente.email)}&total=${total}`);
  };

  // ── VACÍO ──────────────────────────────────────────────────────────
  if (carrito.length === 0) {
    return (
      <div className="min-h-full bg-[#FAFAF8] font-inter flex items-center justify-center p-4 py-16">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-gray-100">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <div>
            <p className="text-2xl font-poppins font-bold text-gray-900">Tu carrito está vacío</p>
            <p className="text-sm text-gray-500 mt-2">Descubre productos 100% sostenibles con personalización láser gratis.</p>
          </div>
          <Button onClick={() => navigate('/shop')} className="gap-2 rounded-2xl bg-gray-900 hover:bg-gray-800 px-8 h-12">
            Explorar tienda <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── PRINCIPAL ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter pb-20">
      <SEO
        title="Tu Carrito · Checkout Seguro | PEYU Chile"
        description="Revisa tu pedido y completa tu compra de forma segura con WebPay, Mercado Pago o transferencia. Envío a todo Chile."
        canonical="https://peyuchile.cl/cart"
        noindex
      />
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button onClick={() => navigate('/shop')} className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors group">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-poppins font-bold text-gray-900 text-base leading-none">Tu carrito</h1>
              <p className="text-xs text-gray-400 mt-0.5">{carrito.length} producto{carrito.length !== 1 ? 's' : ''}</p>
            </div>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>1</div>
              <span className="font-semibold">Carrito</span>
            </div>
            <div className="w-6 h-px bg-gray-200" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>2</div>
              <span className="font-semibold">Envío y pago</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {mpFailure && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-bold">El pago con Mercado Pago no se completó.</p>
              <p className="text-xs text-red-700 mt-1">Tu pedido sigue creado. Puedes reintentar el pago eligiendo nuevamente "Mercado Pago" o cambiar a otro medio.</p>
            </div>
          </div>
        )}
        <div className="grid lg:grid-cols-3 gap-5 lg:gap-6">

          {/* ── LEFT ──────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {step === 1 && (
              <>
                {carrito.map(item => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {item.imagen ? (
                        <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{item.nombre}</h3>
                        {item.personalizacion && (
                          <p className="text-xs text-purple-600 mt-1 font-medium flex items-center gap-1">✨ Grabado: "{item.personalizacion}"</p>
                        )}
                        {item.pack_resumen && (
                          <p className="text-xs text-teal-700 mt-1 font-medium">🎨 Pack: {item.pack_resumen}</p>
                        )}
                        {item.color && !item.pack_resumen && (
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">Color: {item.color}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                          <button onClick={() => actualizar(item.id, item.cantidad - 1)} className="w-9 h-9 hover:bg-white font-bold text-gray-600 transition-colors">−</button>
                          <span className="px-3 text-sm font-bold text-gray-900 min-w-[32px] text-center">{item.cantidad}</span>
                          <button onClick={() => actualizar(item.id, item.cantidad + 1)} className="w-9 h-9 hover:bg-white font-bold text-gray-600 transition-colors">+</button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-poppins font-bold text-gray-900 text-base">${(item.precio * item.cantidad).toLocaleString('es-CL')}</span>
                          <button onClick={() => eliminar(item.id)} className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-red-50 transition-colors group">
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                  {[
                    { icon: Shield, text: 'Garantía 10 años', sub: 'Plástico reciclado', color: 'text-teal-600' },
                    { icon: Truck, text: 'Envío gratis', sub: 'Sobre $40.000', color: 'text-blue-600' },
                    { icon: Recycle, text: '100% reciclado', sub: 'Hecho en Chile', color: 'text-emerald-600' },
                  ].map((b, i) => (
                    <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 text-center shadow-sm">
                      <b.icon className={`w-5 h-5 mx-auto mb-1.5 ${b.color}`} />
                      <p className="text-xs font-bold text-gray-900 leading-tight">{b.text}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{b.sub}</p>
                    </div>
                  ))}
                </div>

                <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 font-medium pt-2">
                  <ArrowLeft className="w-3.5 h-3.5" /> Seguir comprando
                </Link>
              </>
            )}

            {step === 2 && (
              <>
                {/* 1 · Datos de envío */}
                <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 shadow-sm">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-poppins font-bold text-sm">1</div>
                    <div>
                      <h3 className="font-poppins font-bold text-gray-900 text-base">Información de envío</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Validamos tu dirección para asegurar la entrega</p>
                    </div>
                  </div>
                  <ShippingAddressForm
                    cliente={cliente}
                    setCliente={(c) => { setCliente(c); setErrors({}); }}
                    errors={errors}
                    onEmailBlur={() => capturarCarrito(cliente)}
                  />
                </div>

                {/* 2 · Cotización envío Bluex en tiempo real (auto-cotiza con la comuna del form) */}
                <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 shadow-sm">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-poppins font-bold text-sm">2</div>
                    <div>
                      <h3 className="font-poppins font-bold text-gray-900 text-base">Forma de envío</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Tarifa real BlueExpress según tu comuna</p>
                    </div>
                  </div>
                  <ShippingSelector
                    variant="light"
                    items={carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, nombre: i.nombre }))}
                    comuna={cliente.ciudad}
                    region={cliente.region}
                    subtotal={subtotal}
                    umbralEnvioGratis={40000}
                    onSelect={setEnvioBluex}
                  />
                </div>

                {/* 3 · Método de pago */}
                <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 shadow-sm">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-poppins font-bold text-sm">3</div>
                    <div>
                      <h3 className="font-poppins font-bold text-gray-900 text-base">Método de pago</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Pago seguro · cifrado SSL</p>
                    </div>
                  </div>
                  <PaymentMethodSelector
                    value={medioPago}
                    onChange={setMedioPago}
                    totalCubiertoConGC={totalCubiertoConGC}
                  />
                </div>

                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 font-medium inline-flex items-center gap-1.5 px-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver al carrito
                </button>
              </>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ─────────────── */}
          <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">

            {/* Resumen — protagonista */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
              <h3 className="font-poppins font-bold text-gray-900 mb-4">Resumen</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({carrito.reduce((s, i) => s + i.cantidad, 0)} items)</span>
                  <span className="font-semibold text-gray-900">${subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  {envio === 0
                    ? <span className="text-teal-600 font-bold">GRATIS</span>
                    : <span className="font-semibold text-gray-900">${envio.toLocaleString('es-CL')}</span>
                  }
                </div>

                {descuentoCupon > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1">🎟️ Cupón {cupon.codigo}</span>
                    <span className="font-bold">−${descuentoCupon.toLocaleString('es-CL')}</span>
                  </div>
                )}

                {descuentoTransferencia > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1">🏦 Dscto transferencia (5%)</span>
                    <span className="font-bold">−${descuentoTransferencia.toLocaleString('es-CL')}</span>
                  </div>
                )}

                {gcDescuento > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Gift Card</span>
                    <span className="font-bold">−${gcDescuento.toLocaleString('es-CL')}</span>
                  </div>
                )}

                {subtotal < 40000 && !cupon?.libera_envio && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-3">
                    <p className="text-xs text-amber-800 font-medium">
                      🎯 Agrega <strong>${(40000 - subtotal).toLocaleString('es-CL')}</strong> más y el envío es gratis
                    </p>
                    <div className="w-full h-1.5 bg-amber-100 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, (subtotal / 40000) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 pt-3 mt-4 flex justify-between items-baseline">
                <span className="font-bold text-gray-900 text-sm">Total</span>
                <span className="font-poppins font-bold text-2xl text-gray-900">${total.toLocaleString('es-CL')}</span>
              </div>

              {/* Tu impacto real — integrado como footer del resumen, no flotando */}
              <ImpactoAmbiental carrito={carrito} variant="inline" />
            </div>

            {/* Promociones — un solo bloque colapsable (Cupón + Gift Card) */}
            <PromoBox
              subtotal={subtotal}
              envio={envioBase}
              email={cliente.email}
              onCuponChange={setCupon}
              onGiftCardChange={setGiftCard}
              showGiftCard={!carritoTieneGC}
            />

            {/* CTA */}
            {step === 1 ? (
              <div className="space-y-2">
                {/* Compra en 1 Clic — solo aparece si hay perfil guardado válido */}
                <OneClickBuyButton items={carrito} variant="light" />
                <Button
                  onClick={() => {
                    trackBeginCheckout(carrito, subtotal);
                    // Trazabilidad 360°: checkout start
                    track.checkoutStart({ total: subtotal + envio, items: carrito });
                    setStep(2);
                  }}
                  size="lg"
                  className="w-full font-semibold gap-2 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white shadow-lg h-13 py-4">
                  Continuar <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={crearPedido}
                disabled={creando}
                size="lg"
                className="w-full font-semibold gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg h-13 py-4">
                {creando ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando...</>
                ) : total === 0 ? (
                  <><Gift className="w-4 h-4" /> Confirmar pedido (cubierto por Gift Card)</>
                ) : medioPago === 'Transferencia' ? (
                  <><Lock className="w-4 h-4" /> Confirmar pedido · ${total.toLocaleString('es-CL')}</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pagar ${total.toLocaleString('es-CL')}</>
                )}
              </Button>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <Lock className="w-3 h-3" />
              Pago 100% seguro · {medioPago === 'Transferencia' ? 'Banco Santander' : medioPago === 'MercadoPago' ? 'Mercado Pago' : 'Webpay'}
            </div>

            <div className="flex justify-center gap-5 text-xs text-gray-400 pt-1">
              <Link to="/seguimiento" className="hover:text-gray-900">🔍 Seguimiento</Link>
              <Link to="/soporte" className="hover:text-gray-900">❓ Ayuda</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}