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
import CartBundleToggle from '@/components/cart/CartBundleToggle';
import { saveOneClickProfile } from '@/lib/one-click-profile';
import { computeVolumeDiscount, getNextVolumeTeaser } from '@/lib/volume-discount';

const DESCUENTO_TRANSFERENCIA_PCT = 5;

export default function Carrito() {
  const navigate = useNavigate();
  const mpFailure = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mp') === 'failure';
  const [carrito, setCarrito] = useState(() => {
    // Lectura defensiva: localStorage corrupto NO debe crashear el checkout.
    try { return JSON.parse(localStorage.getItem('carrito') || '[]') || []; }
    catch { return []; }
  });
  const [cliente, setCliente] = useState({
    nombre: '', email: '', telefono: '',
    region: '', ciudad: '', direccion: '', referencia: '', codigo_postal: '',
  });
  const [errors, setErrors] = useState({});
  const [creando, setCreando] = useState(false);
  const [step, setStep] = useState(1); // 1=Carrito, 2=Datos+Pago
  const [giftCard, setGiftCard] = useState(null);
  const [cupon, setCupon] = useState(null); // { codigo, descuento_clp, libera_envio, ... }
  // Default: MercadoPago (es el único checkout online activo. WebPay no está integrado).
  const [medioPago, setMedioPago] = useState('MercadoPago');
  const [errorPago, setErrorPago] = useState(null);
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
  // 🆕 Descuento por volumen B2C (replica web anterior): 2u → 10% · 3+u → 15%
  // NO se acumula con cupones. Sí se acumula con transferencia y giftcard.
  const volumeDiscount = computeVolumeDiscount({ carrito, subtotal, hasCupon: !!cupon });
  const descuentoVolumen = volumeDiscount.clp;
  const volumeTeaser = getNextVolumeTeaser(volumeDiscount.unidades);
  // Descuento por método de pago (transferencia 5% sobre subtotal)
  const descuentoTransferencia = medioPago === 'Transferencia'
    ? Math.floor(subtotal * (DESCUENTO_TRANSFERENCIA_PCT / 100))
    : 0;

  const totalAntesGC = Math.max(0, subtotal + envio - descuentoCupon - descuentoVolumen - descuentoTransferencia);
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
    // 🛡️ Anti doble-click: si ya está procesando, ignoramos.
    if (creando) return;
    setErrorPago(null);

    // 🛡️ Validar carrito no vacío y con items válidos (precio > 0, cantidad > 0)
    if (!carrito.length) {
      setErrorPago('Tu carrito está vacío. Volvé al shop para agregar productos.');
      return;
    }
    const itemsInvalidos = carrito.filter(i => !i.precio || i.precio < 0 || !i.cantidad || i.cantidad < 1);
    if (itemsInvalidos.length > 0) {
      setErrorPago('Hay productos con precio o cantidad inválida. Removelos y agregalos de nuevo desde el shop.');
      return;
    }

    if (!validarYContinuar()) {
      // Scroll al primer error
      setTimeout(() => {
        document.querySelector('[class*="border-red-300"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    // 🛡️ Validar selección de envío (Bluex) — evita pedidos sin courier definido
    if (!envioBluex) {
      setErrorPago('Selecciona una forma de envío antes de continuar.');
      setTimeout(() => {
        document.querySelector('[data-shipping-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    // 🛡️ Validar método de pago soportado (WebPay no está integrado todavía)
    const mediosValidos = ['MercadoPago', 'Transferencia', 'GiftCard'];
    const medioPagoFinal = totalCubiertoConGC ? 'GiftCard' : medioPago;
    if (!mediosValidos.includes(medioPagoFinal)) {
      setErrorPago('Selecciona un método de pago válido (Mercado Pago o Transferencia).');
      return;
    }

    setCreando(true);
    // Reusamos número/pedido si el usuario está reintentando tras fallo de MP
    // (evita pedidos duplicados en la base por reintento).
    const reintentoNumero = typeof window !== 'undefined' ? sessionStorage.getItem('peyu_pending_order_numero') : null;
    const reintentoId = typeof window !== 'undefined' ? sessionStorage.getItem('peyu_pending_order_id') : null;
    const numero = reintentoNumero || `WEB-${Date.now()}`;
    // Detalle enriquecido por línea: nombre · color · pack · personalización · SKU · precio unitario
    const items = carrito.map(i => {
      const partes = [`${i.nombre} x${i.cantidad}`];
      if (i.color) partes.push(`Color: ${i.color}`);
      if (i.pack_resumen) partes.push(`Pack: ${i.pack_resumen}`);
      if (i.personalizacion) partes.push(`Grabado: "${i.personalizacion}"`);
      if (i.sku) partes.push(`SKU ${i.sku}`);
      partes.push(`$${(i.precio || 0).toLocaleString('es-CL')}/u`);
      return partes.join(' · ');
    }).join('\n');
    // 📍 Dirección de despacho COMPLETA — concatena calle + depto/referencia + comuna + región + CP
    // Producción/despacho necesitan TODO el detalle, especialmente el N° de depto (depto/oficina/casa).
    const referenciaTrim = (cliente.referencia || '').trim();
    const direccionCompleta = [
      cliente.direccion.trim(),
      referenciaTrim ? `Depto/Ref: ${referenciaTrim}` : null,
      cliente.ciudad,
      cliente.region,
      cliente.codigo_postal ? `CP ${cliente.codigo_postal}` : null,
    ].filter(Boolean).join(' · ');

    const notasExtras = [
      referenciaTrim ? `📍 Depto/Oficina/Ref: ${referenciaTrim}` : null,
      gcDescuento > 0 ? `GiftCard ${giftCard.codigo} -$${gcDescuento.toLocaleString('es-CL')}` : null,
      cupon ? `Cupón ${cupon.codigo} -$${(cupon.descuento_clp || 0).toLocaleString('es-CL')}` : null,
      descuentoVolumen > 0 ? `Dscto volumen ${volumeDiscount.pct}% (${volumeDiscount.unidades}u) -$${descuentoVolumen.toLocaleString('es-CL')}` : null,
      descuentoTransferencia > 0 ? `Dscto transferencia -$${descuentoTransferencia.toLocaleString('es-CL')}` : null,
      cliente.codigo_postal ? `CP ${cliente.codigo_postal}` : null,
      cliente.region ? `Región ${cliente.region}` : null,
      envioBluex ? `Bluex ${envioBluex.servicio} (${envioBluex.peso_kg}kg) → $${envioBluex.costo_real.toLocaleString('es-CL')}` : null,
    ].filter(Boolean).join(' | ');

    const descuentoTotal = descuentoCupon + descuentoVolumen + descuentoTransferencia + gcDescuento;

    let pedido;
    const datosPedido = {
      numero_pedido: numero,
      fecha: new Date().toISOString().split('T')[0],
      canal: 'Web Propia',
      cliente_nombre: cliente.nombre.trim(),
      cliente_email: cliente.email.trim().toLowerCase(),
      cliente_telefono: cliente.telefono,
      tipo_cliente: 'B2C Individual',
      sku: carrito[0]?.sku || carrito[0]?.productoId || null,
      descripcion_items: items,
      cantidad: carrito.reduce((s, i) => s + i.cantidad, 0),
      subtotal,
      costo_envio: envio,
      descuento: descuentoTotal,
      total,
      medio_pago: medioPagoFinal,
      estado: 'Nuevo',
      ciudad: cliente.ciudad,
      direccion_envio: direccionCompleta,
      requiere_personalizacion: carrito.some(i => i.personalizacion),
      texto_personalizacion: carrito.filter(i => i.personalizacion).map(i => i.personalizacion).join(', '),
      courier: envioBluex ? `BlueExpress ${envioBluex.servicio}` : 'Pendiente',
      notas: `Carrito: ${carrito.length} items${notasExtras ? ' | ' + notasExtras : ''}`,
    };
    try {
      if (reintentoId) {
        // Actualizamos el pedido pendiente en vez de crear uno nuevo
        await base44.entities.PedidoWeb.update(reintentoId, datosPedido);
        pedido = { id: reintentoId, ...datosPedido };
      } else {
        pedido = await base44.entities.PedidoWeb.create(datosPedido);
        // Guardamos referencia por si el pago falla → reintento
        try {
          sessionStorage.setItem('peyu_pending_order_numero', numero);
          sessionStorage.setItem('peyu_pending_order_id', pedido.id);
        } catch {}
      }
    } catch (e) {
      console.error('Error creando pedido:', e);
      setErrorPago('No pudimos crear tu pedido. Revisá tu conexión e intentá nuevamente. Si el problema persiste, escribínos por WhatsApp.');
      setCreando(false);
      return;
    }

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
          // Guardamos snapshot del carrito en localStorage *antes* de redirigir.
          // Si MP falla y el cliente vuelve con ?mp=failure, podemos restaurar.
          try { sessionStorage.setItem('peyu_mp_init_url', initUrl); } catch {}
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
        setErrorPago('No pudimos iniciar el pago con Mercado Pago. Intentá nuevamente o cambiá a transferencia bancaria.');
        setCreando(false);
        return;
      } catch (e) {
        console.error('Error MP:', e);
        // Mensaje más amigable: extraemos solo la parte útil del error
        const errorMsg = e?.message?.includes('NetworkError') || e?.message?.includes('Failed to fetch')
          ? 'Sin conexión a Mercado Pago. Revisá tu internet o probá con transferencia bancaria.'
          : `No pudimos iniciar Mercado Pago. Probá nuevamente o usá transferencia bancaria.`;
        setErrorPago(errorMsg);
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

    // Pago completado (transferencia / giftcard) → limpiamos refs de reintento
    try {
      sessionStorage.removeItem('peyu_pending_order_numero');
      sessionStorage.removeItem('peyu_pending_order_id');
    } catch {}

    // Redirigimos a /gracias — es la "thank you page" estándar para conversión.
    // Mejor que mostrar un estado inline porque permite indexación del funnel
    // y deja la URL única para retargeting / atribución.
    navigate(`/gracias?numero=${encodeURIComponent(numero)}&email=${encodeURIComponent(cliente.email)}&total=${total}&pago=${encodeURIComponent(medioPagoFinal)}`);
  };

  // ── VACÍO ──────────────────────────────────────────────────────────
  // Excepción: si el usuario vuelve con ?mp=failure (pago fallido) NO mostramos
  // "carrito vacío" — tiene un pedido pendiente al que puede reintentarle el
  // pago desde el panel de seguimiento o WhatsApp. Lo redirigimos a soporte.
  if (carrito.length === 0 && !mpFailure) {
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
          {/* Botón principal con gradiente verde-esmeralda (la firma PEYU del checkout).
              Antes era bg-gray-900 sólido — visualmente correcto pero menos legible en algunos
              dispositivos y rompía la identidad de la marca. */}
          <Button
            onClick={() => navigate('/shop')}
            className="gap-2 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-8 h-12 shadow-lg"
          >
            Explorar tienda <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── PAGO FALLIDO SIN CARRITO ──────────────────────────────────────
  // El usuario vuelve de MercadoPago tras una falla, pero ya borramos el carrito
  // al iniciar el checkout. Mostramos un mensaje claro con opciones para reintentar.
  if (carrito.length === 0 && mpFailure) {
    const pedidoNumero = typeof window !== 'undefined' ? sessionStorage.getItem('peyu_pending_order_numero') : null;
    return (
      <div className="min-h-full bg-[#FAFAF8] font-inter flex items-center justify-center p-4 py-16">
        <div className="text-center space-y-5 max-w-md">
          <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-red-100">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-poppins font-bold text-gray-900">El pago no se completó</p>
            <p className="text-sm text-gray-600 mt-2">
              Tu pedido {pedidoNumero ? <strong>{pedidoNumero}</strong> : 'sigue registrado'} pero no se confirmó el pago. Podés reintentarlo o cambiar de medio.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={() => navigate('/shop')}
              className="gap-2 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-6 h-12 shadow-lg"
            >
              Volver a la tienda <ChevronRight className="w-4 h-4" />
            </Button>
            <a
              href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, tuve un problema al pagar mi pedido ${pedidoNumero || ''} en peyuchile.cl`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-900 font-bold px-6 h-12 text-sm"
            >
              💬 Hablar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── PRINCIPAL ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter pb-20">
      <SEO
        title="Tu Carrito · Checkout Seguro | PEYU Chile"
        description="Revisá tu pedido y completá tu compra de forma segura con Mercado Pago o transferencia bancaria. Envío a todo Chile."
        canonical="https://peyuchile.cl/cart"
        noindex
      />
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200/70 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <button onClick={() => navigate('/shop')} className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors group">
            {/* Hover usa verde PEYU en vez de negro — coherente con el resto del checkout */}
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h1 className="font-poppins font-bold text-gray-900 text-base leading-none">Tu carrito</h1>
              <p className="text-xs text-gray-500 mt-1 font-medium">{carrito.length} producto{carrito.length !== 1 ? 's' : ''} · {carrito.reduce((s, i) => s + i.cantidad, 0)} unidades</p>
            </div>
          </button>

          <div className="hidden sm:flex items-center gap-2.5 text-xs">
            <div className={`flex items-center gap-2 transition-colors ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${step >= 1 ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-100' : 'bg-gray-100 text-gray-400'}`}>{step > 1 ? '✓' : '1'}</div>
              <span className="font-bold">Carrito</span>
            </div>
            <div className={`w-8 h-px transition-colors ${step >= 2 ? 'bg-teal-300' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 transition-colors ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${step >= 2 ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-100' : 'bg-gray-100 text-gray-400'}`}>2</div>
              <span className="font-bold">Envío y pago</span>
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
                  <div key={item.id} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 flex gap-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={e => {
                            // Si la imagen del carrito falla (URL legacy caída),
                            // mostramos un emoji en su lugar — no romper el checkout.
                            if (e.target.dataset.fallbackTried) return;
                            e.target.dataset.fallbackTried = '1';
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-poppins font-semibold text-gray-900 leading-snug line-clamp-2 text-[15px]">{item.nombre}</h3>
                        {item.personalizacion && (
                          <p className="text-xs text-purple-700 mt-1.5 font-semibold flex items-center gap-1 bg-purple-50 inline-flex px-2 py-0.5 rounded-md">✨ Grabado: "{item.personalizacion}"</p>
                        )}
                        {item.pack_resumen && (
                          <p className="text-xs text-teal-800 mt-1.5 font-semibold bg-teal-50 inline-flex px-2 py-0.5 rounded-md">🎨 Pack: {item.pack_resumen}</p>
                        )}
                        {item.color && !item.pack_resumen && (
                          <p className="text-xs text-gray-600 mt-1 capitalize font-medium">Color: <span className="text-gray-900">{item.color}</span></p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <button
                            onClick={() => actualizar(item.id, item.cantidad - 1)}
                            disabled={item.cantidad <= 1}
                            aria-label="Disminuir cantidad"
                            className="w-9 h-9 hover:bg-gray-100 font-bold text-gray-900 text-lg leading-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                          >−</button>
                          <span className="px-3 text-sm font-bold text-gray-900 min-w-[36px] text-center border-x border-gray-200 h-9 flex items-center justify-center bg-gray-50">{item.cantidad}</span>
                          <button
                            onClick={() => actualizar(item.id, item.cantidad + 1)}
                            aria-label="Aumentar cantidad"
                            className="w-9 h-9 hover:bg-gray-100 font-bold text-gray-900 text-lg leading-none transition-colors flex items-center justify-center"
                          >+</button>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-poppins font-bold text-gray-900 text-lg tabular-nums">${(item.precio * item.cantidad).toLocaleString('es-CL')}</span>
                          <button
                            onClick={() => eliminar(item.id)}
                            aria-label={`Eliminar ${item.nombre}`}
                            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all group"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                  {[
                    { icon: Shield, text: 'Garantía 10 años', sub: 'Plástico reciclado', color: 'text-teal-700', bg: 'bg-teal-50' },
                    { icon: Truck, text: 'Envío gratis', sub: 'Sobre $40.000', color: 'text-blue-700', bg: 'bg-blue-50' },
                    { icon: Recycle, text: '100% reciclado', sub: 'Hecho en Chile', color: 'text-emerald-700', bg: 'bg-emerald-50' },
                  ].map((b, i) => (
                    <div key={i} className="bg-white rounded-2xl p-3 sm:p-3.5 border border-gray-200 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className={`w-9 h-9 rounded-xl ${b.bg} flex items-center justify-center mx-auto mb-2`}>
                        <b.icon className={`w-4.5 h-4.5 ${b.color}`} />
                      </div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">{b.text}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{b.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Bundle IA: detecta combos en el carrito y permite alternar precio individual ↔ bundle con descuento */}
                <CartBundleToggle carrito={carrito} setCarrito={setCarrito} />

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
                    {/* Pill numerado con gradiente teal-emerald (firma del checkout PEYU) */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center font-poppins font-bold text-sm shadow-sm">1</div>
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
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center font-poppins font-bold text-sm shadow-sm">2</div>
                    <div>
                      <h3 className="font-poppins font-bold text-gray-900 text-base">Forma de envío</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Tarifa real BlueExpress según tu comuna</p>
                    </div>
                  </div>
                  <div data-shipping-selector>
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
                </div>

                {/* 3 · Método de pago */}
                <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 shadow-sm">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center font-poppins font-bold text-sm shadow-sm">3</div>
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
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-md">
              <h3 className="font-poppins font-bold text-gray-900 mb-4 text-base">Resumen del pedido</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Subtotal <span className="text-gray-400 font-normal">({carrito.reduce((s, i) => s + i.cantidad, 0)} ítems)</span></span>
                  <span className="font-semibold text-gray-900 tabular-nums">${subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Envío</span>
                  {envio === 0
                    ? <span className="text-teal-700 font-bold inline-flex items-center gap-1">✓ GRATIS</span>
                    : <span className="font-semibold text-gray-900 tabular-nums">${envio.toLocaleString('es-CL')}</span>
                  }
                </div>

                {descuentoCupon > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1">🎟️ Cupón {cupon.codigo}</span>
                    <span className="font-bold">−${descuentoCupon.toLocaleString('es-CL')}</span>
                  </div>
                )}

                {descuentoVolumen > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1">📦 Descuento por volumen ({volumeDiscount.pct}%)</span>
                    <span className="font-bold">−${descuentoVolumen.toLocaleString('es-CL')}</span>
                  </div>
                )}

                {/* Teaser motivador: invita a agregar 1 más para subir de escalón */}
                {!cupon && volumeTeaser.necesita > 0 && volumeDiscount.unidades >= 1 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mt-1">
                    <p className="text-xs text-emerald-900 font-medium">
                      ✨ Agrega <strong>{volumeTeaser.necesita} unidad{volumeTeaser.necesita > 1 ? 'es' : ''}</strong> más y obtén <strong>{volumeTeaser.pctSiguiente}% off</strong> automático
                    </p>
                  </div>
                )}

                {/* Aviso si el cupón está bloqueando el descuento por volumen */}
                {cupon && volumeDiscount.unidades >= 2 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-1">
                    <p className="text-xs text-amber-900 font-medium">
                      ℹ️ El cupón <strong>{cupon.codigo}</strong> reemplaza al descuento por volumen ({getNextVolumeTeaser(volumeDiscount.unidades - 1).pctSiguiente}%). Si quieres el descuento automático, remueve el cupón.
                    </p>
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
              <div className="border-t-2 border-dashed border-gray-200 pt-4 mt-4 flex justify-between items-baseline">
                <span className="font-poppins font-bold text-gray-900 text-base">Total</span>
                <span className="font-poppins font-extrabold text-3xl text-gray-900 tabular-nums tracking-tight">${total.toLocaleString('es-CL')}</span>
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

            {/* Error pago — mensaje inline, evita perder al cliente */}
            {errorPago && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-900 flex-1">
                  <p className="font-bold leading-snug">{errorPago}</p>
                  <a
                    href="https://wa.me/56935040242?text=Hola%2C%20tuve%20un%20problema%20al%20pagar%20en%20peyuchile.cl"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 font-bold text-red-700 hover:text-red-900 underline"
                  >
                    Pedir ayuda por WhatsApp →
                  </a>
                </div>
              </div>
            )}

            {/* CTA */}
            {step === 1 ? (
              <div className="space-y-2.5">
                {/* Compra en 1 Clic — solo aparece si hay perfil guardado válido */}
                <OneClickBuyButton items={carrito} variant="light" />
                <button
                  onClick={() => {
                    trackBeginCheckout(carrito, subtotal);
                    track.checkoutStart({ total: subtotal + envio, items: carrito });
                    setStep(2);
                  }}
                  className="w-full h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 font-poppins font-bold text-base tracking-tight"
                >
                  Continuar al pago <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={crearPedido}
                disabled={creando}
                className="w-full h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 font-poppins font-bold text-base tracking-tight"
              >
                {creando ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
                ) : total === 0 ? (
                  <><Gift className="w-5 h-5" /> Confirmar pedido</>
                ) : medioPago === 'Transferencia' ? (
                  <><Lock className="w-4 h-4" /> Confirmar · ${total.toLocaleString('es-CL')}</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pagar ${total.toLocaleString('es-CL')}</>
                )}
              </button>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-medium pt-1">
              <Lock className="w-3 h-3" />
              <span>Pago 100% seguro · {medioPago === 'Transferencia' ? 'Banco Santander' : 'Mercado Pago'}</span>
            </div>

            <div className="flex justify-center gap-5 text-xs font-medium text-gray-500 pt-1">
              <Link to="/seguimiento" className="hover:text-teal-700 transition-colors inline-flex items-center gap-1">🔍 Seguimiento</Link>
              <Link to="/soporte" className="hover:text-teal-700 transition-colors inline-flex items-center gap-1">❓ Ayuda</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}