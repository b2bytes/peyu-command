import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Lock, ShieldCheck, Recycle, AlertCircle, Gift } from 'lucide-react';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
import PublicNavBar from '@/components/PublicNavBar';
import CheckoutStepperV2 from '@/components/shopv2/CheckoutStepperV2';
import StepNavV2 from '@/components/shopv2/StepNavV2';
import CartItemThumbV2 from '@/components/shopv2/CartItemThumbV2';
import CollapsibleSectionV2 from '@/components/shopv2/CollapsibleSectionV2';
import ShippingAddressForm, { validarShippingForm } from '@/components/cart/ShippingAddressForm';
import BillingSection, { validarBilling } from '@/components/cart/BillingSection';
import ShippingSelector from '@/components/cart/ShippingSelector';
import PaymentMethodSelector from '@/components/cart/PaymentMethodSelector';
import { getCartV2, clearCartV2, fmtCLP } from '@/lib/shop-v2-cart';
import { readShopCheckout, mergeShopCheckout, clearShopCheckout } from '@/lib/shop-v2-checkout-store';
import { calcularCargoPersonalizacionCarrito, calcularCargoPersonalizacion, getTipoPersonalizacion, MOQ_PERSONALIZACION_GRATIS } from '@/lib/personalizacion-config';
import { computeQtyDiscountBySku } from '@/lib/volume-discount';
import { normalizarRut } from '@/lib/rut-chile';
import { trackPurchase } from '@/lib/analytics-peyu';

// ════════════════════════════════════════════════════════════════════════
// /CheckoutNuevo — Checkout 1 página mobile-first del Shop v2 (Tema 6).
// Lee carrito_v2, reutiliza los componentes reales de envío/pago/facturación y
// la misma lógica de creación de pedido + MercadoPago. AISLADO del legacy.
// ════════════════════════════════════════════════════════════════════════
export default function CheckoutNuevo() {
  const navigate = useNavigate();
  const [carrito] = useState(() => getCartV2());

  // Datos persistidos del checkout (sobreviven recargas / navegación atrás).
  const saved = useRef(readShopCheckout()).current;

  const [cliente, setCliente] = useState({
    nombre: saved.nombre, email: saved.email, telefono: saved.telefono,
    region: saved.region, ciudad: saved.ciudad, direccion: saved.direccion,
    referencia: saved.referencia, codigo_postal: saved.codigo_postal,
  });
  const [errors, setErrors] = useState({});
  const [billing, setBilling] = useState({
    tipo_documento: saved.tipo_documento, razon_social: saved.razon_social,
    rut_empresa: saved.rut_empresa, giro: saved.giro,
    direccion_facturacion: saved.direccion_facturacion, comuna_facturacion: saved.comuna_facturacion,
  });
  const [billingErrors, setBillingErrors] = useState({});
  const [medioPago, setMedioPago] = useState(saved.medio_pago || 'MercadoPago');
  const [envioBluex, setEnvioBluex] = useState(null);
  const [creando, setCreando] = useState(false);
  const [errorPago, setErrorPago] = useState(null);

  // ── CÁLCULOS ───────────────────────────────────────────────────────
  const subtotal = carrito.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
  const cargoPersonalizacion = calcularCargoPersonalizacionCarrito(carrito);
  // Descuento automático B2C por cantidad del mismo SKU (2u → 10% · 3+u → 15%).
  const { lineas: descLineas, ahorroTotal } = computeQtyDiscountBySku({ carrito });
  const envio = envioBluex ? envioBluex.costo : 0;
  const total = Math.max(0, subtotal + cargoPersonalizacion - ahorroTotal + envio);

  // Sección de envío "completa" → marca el check verde y muestra resumen al cerrarla.
  const envioCompleto = Object.keys(validarShippingForm(cliente)).length === 0;

  const feePersItem = (item) => {
    const moq = item.moq_personalizacion || item.personalizacion_gratis_desde || MOQ_PERSONALIZACION_GRATIS;
    return calcularCargoPersonalizacion(item, moq);
  };

  // ── Persistencia progresiva: guarda TODOS los datos del cliente en cada cambio
  // (envío + facturación + medio de pago) para que nada se pierda hasta pagar.
  useEffect(() => {
    mergeShopCheckout({ ...cliente, ...billing, medio_pago: medioPago });
  }, [cliente, billing, medioPago]);

  // ── Captura progresiva del carrito abandonado: en cuanto el cliente escribe un
  // email válido, registramos su carrito + datos en el backend (con debounce).
  // Si no completa el pago, dispara el recordatorio automático.
  const lastCapturaRef = useRef('');
  useEffect(() => {
    const email = (cliente.email || '').trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(email) || carrito.length === 0) return;
    const t = setTimeout(() => {
      const firma = `${email}|${cliente.nombre}|${cliente.telefono}|${carrito.length}|${total}`;
      if (firma === lastCapturaRef.current) return;
      lastCapturaRef.current = firma;
      base44.functions.invoke('capturarCarritoAbandonado', {
        email,
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        carrito_items: carrito.map((i) => ({
          nombre: i.nombre, cantidad: i.cantidad, precio: i.precio,
          imagen: i.mockupUrl || i.imagen, personalizacion: i.personalizacion || '',
        })),
        subtotal,
        total,
      }).catch(() => { /* best-effort, no romper checkout */ });
    }, 1500);
    return () => clearTimeout(t);
  }, [cliente.email, cliente.nombre, cliente.telefono, carrito, subtotal, total]);

  const crearPedido = async () => {
    if (creando) return;
    setErrorPago(null);

    if (!carrito.length) { setErrorPago('Tu carrito está vacío.'); return; }

    const errs = validarShippingForm(cliente);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setTimeout(() => document.querySelector('[class*="border-red-300"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      return;
    }

    const bErrs = validarBilling(billing);
    setBillingErrors(bErrs);
    if (Object.keys(bErrs).length > 0) {
      setErrorPago('Completa los datos de facturación para emitir la factura.');
      setTimeout(() => document.querySelector('[data-billing-section]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      return;
    }

    if (!envioBluex) {
      setErrorPago('Selecciona una forma de envío antes de continuar.');
      setTimeout(() => document.querySelector('[data-shipping-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      return;
    }

    setCreando(true);
    const numero = `WEB-${Date.now()}`;

    // Sube los dataURLs de mockup (capturados del canvas) a Base44 para obtener
    // URLs persistentes antes de guardar en el pedido. Sin esto, el mockup sería
    // un string base64 masivo que rompería la DB. Best-effort: si falla, cae al
    // imagen_base (foto del color) que siempre existe.
    const uploadedMockups = {};
    await Promise.all(carrito.map(async (item) => {
      const mu = item.mockupUrl || item.mockup_url || '';
      if (!mu.startsWith('data:')) return; // ya es URL, no necesita subir
      try {
        const res = await fetch(mu);
        const blob = await res.blob();
        const file = new File([blob], `mockup-${item.id || Date.now()}.jpg`, { type: 'image/jpeg' });
        const uploaded = await base44.integrations.Core.UploadFile({ file });
        if (uploaded?.file_url) uploadedMockups[item.id] = uploaded.file_url;
      } catch (e) {
        console.warn('No se pudo subir mockup dataURL para item:', item.nombre, e?.message);
      }
    }));

    const items = carrito.map(i => {
      const partes = [`${i.nombre} x${i.cantidad}`];
      if (i.color) partes.push(`Color: ${i.color}`);
      if (i.personalizacion) partes.push(`Grabado: "${i.personalizacion}"`);
      if (i.sku) partes.push(`SKU ${i.sku}`);
      partes.push(`$${(i.precio || 0).toLocaleString('es-CL')}/u`);
      return partes.join(' · ');
    }).join('\n');

    const referenciaTrim = (cliente.referencia || '').trim();
    const direccionCompleta = [
      cliente.direccion.trim(),
      referenciaTrim ? `Depto/Ref: ${referenciaTrim}` : null,
      cliente.ciudad, cliente.region,
      cliente.codigo_postal ? `CP ${cliente.codigo_postal}` : null,
    ].filter(Boolean).join(' · ');

    // Tipo combinado de una línea: 'mixto' si hay más de un tipo activo.
    const tipoLineaCombinado = (i) => {
      const t = Array.isArray(i.tipos_personalizacion) ? i.tipos_personalizacion : [];
      if (t.length > 1) return 'mixto';
      if (t.length === 1) return t[0];
      return i.personalizacion ? getTipoPersonalizacion(i) : '';
    };
    // Posición resumida de las capas combinadas para producción.
    const posicionLinea = (i) => {
      if (Array.isArray(i.capas_grabado) && i.capas_grabado.length) {
        return i.capas_grabado
          .map((c) => `${c.tipo}: size:${Math.round(c.size || 0)}% x:${Math.round(c.x || 0)}% y:${Math.round(c.y || 0)}%`)
          .join(' | ');
      }
      return i.posicion_grabado || '';
    };

    const itemsDetalle = carrito.map(i => {
      // Usa la URL subida si existe (mockup capturado del canvas), sino la original.
      const mockupFinal = uploadedMockups[i.id] || (!(i.mockupUrl || '').startsWith('data:') ? (i.mockupUrl || i.mockup_url || '') : '');
      const imagenBase = i.imagen_base || i.imagen || '';
      return {
        sku: i.sku || '',
        nombre: i.nombre || '',
        color: i.color || '',
        pack_resumen: i.pack_resumen || '',
        personalizacion: i.personalizacion || '',
        tipo_personalizacion: i.personalizacion ? tipoLineaCombinado(i) : '',
        fee_personalizacion: feePersItem(i),
        logo_url: i.logoUrl || i.logo_url || '',
        mockup_url: mockupFinal,
        posicion_grabado: posicionLinea(i),
        precio_unitario: i.precio || 0,
        cantidad: i.cantidad || 1,
        imagen_base: imagenBase,
        capas_grabado: Array.isArray(i.capas_grabado) ? i.capas_grabado : [],
      };
    });
    const colorTopLevel = carrito.length === 1 ? (carrito[0]?.color || '') : '';
    const itemConLogo = carrito.find(i => i.logoUrl || i.logo_url);
    const itemConMockup = carrito.find(i => uploadedMockups[i.id] || (i.mockupUrl && !i.mockupUrl.startsWith('data:')) || i.mockup_url);

    const datosPedido = {
      numero_pedido: numero,
      fecha: new Date().toISOString().split('T')[0],
      canal: 'Web Propia',
      cliente_nombre: cliente.nombre.trim(),
      cliente_email: cliente.email.trim().toLowerCase(),
      cliente_telefono: cliente.telefono,
      tipo_cliente: billing.tipo_documento === 'Factura' ? 'B2B Corporativo' : 'B2C Individual',
      tipo_documento: billing.tipo_documento,
      razon_social: billing.tipo_documento === 'Factura' ? billing.razon_social.trim() : '',
      rut_empresa: billing.tipo_documento === 'Factura' ? normalizarRut(billing.rut_empresa) : '',
      giro: billing.tipo_documento === 'Factura' ? billing.giro.trim() : '',
      direccion_facturacion: billing.tipo_documento === 'Factura' ? billing.direccion_facturacion.trim() : '',
      comuna_facturacion: billing.tipo_documento === 'Factura' ? billing.comuna_facturacion.trim() : '',
      sku: carrito[0]?.sku || carrito[0]?.productoId || null,
      descripcion_items: items,
      items_detalle: itemsDetalle,
      color: colorTopLevel,
      cantidad: carrito.reduce((s, i) => s + (i.cantidad || 1), 0),
      subtotal,
      costo_envio: envio,
      fee_personalizacion: cargoPersonalizacion,
      tipo_personalizacion: (() => {
        const tipos = Array.from(new Set(carrito.filter(i => i.personalizacion).map(i => getTipoPersonalizacion(i)).filter(Boolean)));
        return tipos.length === 1 ? tipos[0] : (tipos.length > 1 ? 'mixto' : '');
      })(),
      descuento: ahorroTotal,
      total,
      medio_pago: medioPago,
      estado: 'Nuevo',
      ciudad: cliente.ciudad,
      direccion_envio: direccionCompleta,
      requiere_personalizacion: carrito.some(i => i.personalizacion),
      texto_personalizacion: carrito.filter(i => i.personalizacion).map(i => i.personalizacion).join(', '),
      logo_url: itemConLogo ? (itemConLogo.logoUrl || itemConLogo.logo_url) : '',
      mockup_url: itemConMockup ? (uploadedMockups[itemConMockup.id] || (!(itemConMockup.mockupUrl || '').startsWith('data:') ? (itemConMockup.mockupUrl || itemConMockup.mockup_url || '') : '')) : '',
      logo_recibido: !!(itemConLogo || itemConMockup),
      courier: `BlueExpress ${envioBluex.servicio}`,
      // Nota en el formato que el admin (BluexManualDispatchCard) sabe parsear:
      // "Bluex EXPRESS (1.5kg) → $4.990" — así el despacho muestra servicio/peso/costo.
      notas: `Carrito v2: ${carrito.length} items${envioBluex ? ` | Bluex ${envioBluex.servicio} (${(envioBluex.peso_kg || 0)}kg) → $${(envioBluex.costo_real || envioBluex.costo).toLocaleString('es-CL')}` : ''}`,
    };

    let pedido;
    try {
      pedido = await base44.entities.PedidoWeb.create(datosPedido);
    } catch (e) {
      console.error('Error creando pedido:', e);
      setErrorPago('No pudimos crear tu pedido. Revisa tu conexión e intenta nuevamente.');
      setCreando(false);
      return;
    }

    try {
      localStorage.setItem('peyu_last_purchase', JSON.stringify(carrito));
      // Marca de compra reciente: si el cliente vuelve atrás al checkout tras
      // pagar, mostramos "compra completada" en vez de "carrito vacío".
      localStorage.setItem('peyu_v2_last_order', JSON.stringify({ numero, at: Date.now() }));
    } catch {}

    // MercadoPago: crear preferencia y redirigir
    if (medioPago === 'MercadoPago' && total > 0) {
      try {
        const mp = await base44.functions.invoke('mpCreatePreference', { pedido_id: pedido.id });
        const initUrl = mp?.data?.init_point || mp?.data?.sandbox_init_point;
        if (initUrl) {
          // NO limpiamos el carrito aún: si el cliente cancela en Mercado Pago y
          // vuelve atrás, conserva su carrito y datos para reintentar. El pedido
          // queda pendiente y se reconcilia/expira solo. Solo registramos la marca
          // de "intento de compra" para el mensaje post-pago.
          trackPurchase({ transactionId: numero, total, shipping: envio, cart: carrito });
          window.location.href = initUrl;
          return;
        }
        setErrorPago('No pudimos iniciar Mercado Pago. Intenta de nuevo o usa transferencia.');
        setCreando(false);
        return;
      } catch (e) {
        console.error('Error MP:', e);
        setErrorPago('No pudimos iniciar Mercado Pago. Intenta de nuevo o usa transferencia.');
        setCreando(false);
        return;
      }
    }

    // Transferencia → gracias.
    // NO limpiamos el carrito ni los datos del checkout: el pago aún no está
    // confirmado (queda "por confirmar transferencia"). Si el cliente vuelve
    // atrás conserva todo para reintentar. El carrito se vacía recién al
    // confirmar el pago en la página Gracias, igual que con Mercado Pago.
    trackPurchase({ transactionId: numero, total, shipping: envio, cart: carrito });
    setCreando(false);
    navigate(`/gracias?numero=${encodeURIComponent(numero)}&email=${encodeURIComponent(cliente.email)}&total=${total}&pago=${encodeURIComponent(medioPago)}`);
  };

  const itemsEnvio = useMemo(
    () => carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, nombre: i.nombre })),
    [carrito]
  );

  if (carrito.length === 0) {
    // ¿Volvió atrás tras una compra reciente (< 30 min)? Mostramos confirmación,
    // no un genérico "carrito vacío" que parece un error.
    let ultimaCompra = null;
    try {
      const raw = JSON.parse(localStorage.getItem('peyu_v2_last_order') || 'null');
      if (raw?.numero && Date.now() - (raw.at || 0) < 30 * 60 * 1000) ultimaCompra = raw;
    } catch { /* noop */ }

    return (
      <div className="min-h-screen font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
        <PublicNavBar />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          {ultimaCompra ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}>
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-fraunces text-2xl mb-2">¡Tu compra ya está hecha!</h1>
              <p className="text-sm mb-6" style={{ color: '#7A6050' }}>
                El pedido <span className="font-mono font-bold" style={{ color: '#C0785C' }}>{ultimaCompra.numero}</span> fue creado. No necesitas volver a pagar.
              </p>
              <div className="flex flex-col gap-2.5">
                <Link to={`/seguimiento?pedido=${encodeURIComponent(ultimaCompra.numero)}`}>
                  <button className="w-full text-white font-bold px-6 py-3.5 rounded-2xl transition-all" style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}>
                    Seguir mi pedido
                  </button>
                </Link>
                <Link to="/CatalogoNuevo">
                  <button className="w-full font-bold px-6 py-3.5 rounded-2xl transition-all" style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}>
                    Seguir comprando
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-fraunces text-2xl mb-3">Tu carrito está vacío</h1>
              <Link to="/CatalogoNuevo">
                <button className="text-white font-bold px-6 py-3.5 rounded-2xl transition-all" style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}>
                  Ir a la tienda
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-inter pb-36 lg:pb-12" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <PublicNavBar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-6">
        <CheckoutStepperV2 current="pago" />
        {/* Link solo desktop — mobile usa navbar inferior */}
        <Link to="/CarritoNuevo" className="hidden lg:inline-flex items-center gap-1.5 text-sm font-bold mb-5 transition-colors" style={{ color: '#7A6050' }}>
          <ArrowLeft className="w-4 h-4" /> Volver al carrito
        </Link>

        <h1 className="font-fraunces text-2xl sm:text-4xl mb-4 sm:mb-6">Finaliza tu compra</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* FORM — secciones colapsables para que el checkout no sea tan largo */}
          <div className="lg:col-span-2 space-y-3">
            {/* 1 · Envío */}
            <CollapsibleSectionV2
              step={1}
              title="Datos de envío"
              subtitle="¿A dónde enviamos tu pedido?"
              defaultOpen
              complete={envioCompleto}
              summary={envioCompleto ? `${cliente.nombre} · ${cliente.ciudad}, ${cliente.region}` : null}
            >
              <ShippingAddressForm
                cliente={cliente}
                setCliente={(c) => { setCliente(c); setErrors({}); }}
                errors={errors}
              />
            </CollapsibleSectionV2>

            {/* 2 · Forma de envío (BlueExpress inline) */}
            <div data-shipping-selector>
              <CollapsibleSectionV2
                step={2}
                title="Forma de envío"
                subtitle="Tarifa BlueExpress según tu comuna"
                defaultOpen
                complete={!!envioBluex}
                summary={envioBluex ? `BlueExpress ${envioBluex.servicio} · ${envio === 0 ? 'GRATIS' : fmtCLP(envio)}` : null}
              >
                <ShippingSelector
                  variant="light"
                  items={itemsEnvio}
                  comuna={cliente.ciudad}
                  region={cliente.region}
                  subtotal={subtotal}
                  umbralEnvioGratis={40000}
                  onSelect={setEnvioBluex}
                />
              </CollapsibleSectionV2>
            </div>

            {/* 3 · Pago */}
            <CollapsibleSectionV2
              step={3}
              title="Método de pago"
              subtitle="Elige cómo quieres pagar"
              defaultOpen
              complete={!!medioPago}
              summary={medioPago ? (medioPago === 'Transferencia' ? 'Transferencia bancaria' : 'Mercado Pago') : null}
            >
              <PaymentMethodSelector value={medioPago} onChange={setMedioPago} totalCubiertoConGC={false} />
            </CollapsibleSectionV2>

            {/* 4 · Facturación (full width, plegable interno) */}
            <div data-billing-section>
              <BillingSection
                billing={billing}
                setBilling={(b) => { setBilling(b); setBillingErrors({}); }}
                errors={billingErrors}
              />
            </div>

            {/* Navegación Atrás / Pagar (desktop) */}
            <div className="hidden lg:block">
              <StepNavV2
                backTo="/CarritoNuevo"
                backLabel="Volver al carrito"
                onNext={crearPedido}
                nextLabel={medioPago === 'Transferencia' ? `Confirmar · ${fmtCLP(total)}` : `Pagar ${fmtCLP(total)}`}
                nextLoading={creando}
              />
            </div>
          </div>

          {/* RESUMEN sticky */}
          <div className="lg:sticky lg:top-24 self-start space-y-3">
            <div className="bg-white rounded-3xl p-5" style={{ border: '1.5px solid #D4C4B0', boxShadow: '0 4px 24px rgba(44,24,16,.08)' }}>
              <h2 className="font-fraunces text-xl mb-4" style={{ color: '#2C1810' }}>Tu pedido</h2>

              <div className="space-y-2.5 max-h-52 overflow-y-auto peyu-scrollbar pr-1 mb-4">
                {carrito.map((item) => (
                  <div key={item.id} className="flex gap-2.5 items-center">
                    <div className="w-12 h-12 flex-shrink-0">
                      <CartItemThumbV2 imagen={item.mockupUrl || item.imagen} capas={item.capas_grabado || []} alt={item.nombre} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2A2420] truncate">{item.nombre}</p>
                      <p className="text-[10px] text-[#A78B6F]">x{item.cantidad}{item.color ? ` · ${item.color}` : ''}</p>
                      {item.personalizacion && (
                        <p className="text-[10px] font-semibold truncate" style={{ color: '#C0785C' }}>✦ {item.personalizacion}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#2A2420]">{fmtCLP((item.precio || 0) * (item.cantidad || 1))}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-3 text-sm" style={{ borderTop: '1px solid #D4C4B0' }}>
                <div className="flex justify-between" style={{ color: '#7A6050' }}>
                  <span>Subtotal</span><span className="font-semibold">{fmtCLP(subtotal)}</span>
                </div>
                {cargoPersonalizacion > 0 && (
                  <div className="flex justify-between" style={{ color: '#7A6050' }}>
                    <span>Personalización</span><span className="font-semibold">+{fmtCLP(cargoPersonalizacion)}</span>
                  </div>
                )}
                {ahorroTotal > 0 && (
                  <div className="rounded-xl p-2.5 space-y-1" style={{ background: 'rgba(139,173,138,.1)', border: '1px solid rgba(139,173,138,.3)' }}>
                    <div className="flex justify-between font-bold" style={{ color: '#5B7D5A' }}>
                      <span>Descuento por cantidad</span><span>−{fmtCLP(ahorroTotal)}</span>
                    </div>
                    {descLineas.filter((l) => l.ahorro > 0).map((l) => (
                      <div key={l.sku || l.nombre} className="flex justify-between text-[11px]" style={{ color: '#7A6050' }}>
                        <span className="truncate pr-2">{l.nombre} ({l.unidades}u · −{l.pct}%)</span>
                        <span className="font-semibold flex-shrink-0">−{fmtCLP(l.ahorro)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between" style={{ color: '#7A6050' }}>
                  <span>Envío</span>
                  {envioBluex
                    ? (envio === 0 ? <span className="font-bold" style={{ color: '#8BAD8A' }}>GRATIS</span> : <span className="font-semibold">{fmtCLP(envio)}</span>)
                    : <span className="text-xs" style={{ color: '#A08070' }}>Elige arriba</span>}
                </div>
                <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #D4C4B0' }}>
                  <span className="font-bold" style={{ color: '#2C1810' }}>Total</span>
                  <span className="font-poppins font-bold text-xl" style={{ color: '#C0785C' }}>{fmtCLP(total)}</span>
                </div>
                <p className="text-[10px]" style={{ color: '#A08070' }}>IVA incluido</p>
              </div>

              {errorPago && (
                <div className="mt-3 rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(192,120,92,.08)', border: '1px solid rgba(192,120,92,.3)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C0785C' }} />
                  <p className="text-xs font-semibold" style={{ color: '#C0785C' }}>{errorPago}</p>
                </div>
              )}

              {/* CTA desktop */}
              <button
                onClick={crearPedido}
                disabled={creando}
                className="hidden lg:flex w-full mt-4 h-13 py-3.5 rounded-2xl disabled:opacity-60 text-white font-bold items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 8px 24px rgba(192,120,92,.28)' }}
              >
                {creando ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
                ) : medioPago === 'Transferencia' ? (
                  <><Gift className="w-4 h-4" /> Confirmar · {fmtCLP(total)}</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pagar {fmtCLP(total)}</>
                )}
              </button>

              <div className="hidden lg:flex items-center justify-center gap-1.5 text-[11px] pt-3" style={{ color: '#A08070' }}>
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#8BAD8A' }} /> Pago seguro · {medioPago === 'Transferencia' ? 'Transferencia' : 'Mercado Pago'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior mobile */}
      <MobileNavBarV2
        backTo="/CarritoNuevo"
        backLabel="Carrito"
        ctaLabel={medioPago === 'Transferencia' ? 'Confirmar pedido' : 'Pagar ahora'}
        onCta={crearPedido}
        ctaLoading={creando}
        total={total}
      />

      <footer className="py-8 text-center text-xs hidden lg:flex items-center justify-center gap-1.5" style={{ borderTop: '1px solid #D4C4B0', color: '#A08070' }}>
        <Recycle className="w-3.5 h-3.5" style={{ color: '#8BAD8A' }} /> PEYU Chile · Pago seguro · Garantía 10 años
      </footer>
    </div>
  );
}