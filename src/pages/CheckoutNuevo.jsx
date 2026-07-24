import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Lock, ShieldCheck, Recycle, AlertCircle, Gift } from 'lucide-react';
import NoIndex from '@/components/NoIndex';
import useFeatureFlag from '@/hooks/useFeatureFlag';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
import CheckoutStepperV2 from '@/components/shopv2/CheckoutStepperV2';
import CheckoutSummaryCardV2 from '@/components/shopv2/CheckoutSummaryCardV2';
import CollapsibleSectionV2 from '@/components/shopv2/CollapsibleSectionV2';
import ShippingAddressForm, { validarShippingForm } from '@/components/cart/ShippingAddressForm';
import BillingSection, { validarBilling } from '@/components/cart/BillingSection';
import ShippingSelector from '@/components/cart/ShippingSelector';
import PaymentMethodSelector from '@/components/cart/PaymentMethodSelector';
import { getCartV2, clearCartV2, fmtCLP } from '@/lib/shop-v2-cart';
import { readShopCheckout, mergeShopCheckout, clearShopCheckout } from '@/lib/shop-v2-checkout-store';
import { uploadImagePublic } from '@/lib/public-upload';
import { calcularCargoPersonalizacionCarrito, calcularCargoPersonalizacion, getTipoPersonalizacion, MOQ_PERSONALIZACION_GRATIS } from '@/lib/personalizacion-config';
import { computeQtyDiscountBySku } from '@/lib/volume-discount';
import { normalizarRut } from '@/lib/rut-chile';
import { trackPurchase } from '@/lib/analytics-peyu';
import { trackInitiateCheckout } from '@/lib/meta-pixel';
import { trackBeginCheckout } from '@/lib/analytics-peyu';

// ════════════════════════════════════════════════════════════════════════
// /CheckoutNuevo — Checkout 1 página mobile-first del Shop v2 (Tema 6).
// Lee carrito_v2, reutiliza los componentes reales de envío/pago/facturación y
// la misma lógica de creación de pedido + MercadoPago. AISLADO del legacy.
// ════════════════════════════════════════════════════════════════════════
export default function CheckoutNuevo() {
  const navigate = useNavigate();
  // Plantilla nueva "Verde PEYU": solo se aplica si el módulo está activado
  // desde /admin/fidelizacion (flag checkout_tema_verde). Apagado = tema actual.
  const temaVerde = useFeatureFlag('checkout_tema_verde');
  const temaClass = temaVerde ? 'ck-theme-verde' : '';
  const [carrito] = useState(() => getCartV2());
  const [productosBySku, setProductosBySku] = useState({});

  // Carga los productos del carrito para aplicar el PRECIO MAYORISTA B2B (≥10u).
  // Mismo criterio que el carrito: si falla, queda el flujo B2C de siempre.
  useEffect(() => {
    const skus = [...new Set(carrito.map((i) => i.sku).filter(Boolean))];
    if (skus.length === 0) return;
    // Solo los productos del carrito (antes se bajaba el catálogo completo de
    // 300 registros en cada carga del checkout → payload enorme, causa del 509).
    base44.entities.Producto.filter({ sku: { $in: skus } }, '-updated_date', skus.length)
      .then((rows) => {
        const map = {};
        for (const p of rows || []) {
          if (p.sku) map[p.sku] = p;
        }
        setProductosBySku(map);
      })
      .catch(() => {});
  }, [carrito]);

  // Datos persistidos del checkout (sobreviven recargas / navegación atrás).
  const saved = useRef(readShopCheckout()).current;

  const [cliente, setCliente] = useState({
    nombre: saved.nombre, email: saved.email, telefono: saved.telefono,
    region: saved.region, ciudad: saved.ciudad, direccion: saved.direccion,
    referencia: saved.referencia, codigo_postal: saved.codigo_postal,
  });
  const [errors, setErrors] = useState({});
  // Compra directa B2B (desde EmpresaProducto): la Factura empresa es el
  // default natural del flujo — el cliente puede cambiarla a Boleta si quiere.
  const tieneLineaB2B = carrito.some((i) => i.es_b2b);
  const [billing, setBilling] = useState({
    tipo_documento: tieneLineaB2B ? 'Factura' : saved.tipo_documento, razon_social: saved.razon_social,
    rut_empresa: saved.rut_empresa, giro: saved.giro,
    direccion_facturacion: saved.direccion_facturacion, comuna_facturacion: saved.comuna_facturacion,
  });
  const [billingErrors, setBillingErrors] = useState({});
  // WebPay oculto temporalmente (credenciales de integración): si el cliente
  // tenía WebPay guardado de una sesión anterior, cae a Mercado Pago.
  const [medioPago, setMedioPago] = useState(
    saved.medio_pago && saved.medio_pago !== 'WebPay' ? saved.medio_pago : 'MercadoPago'
  );
  const [envioBluex, setEnvioBluex] = useState(null);
  // Gift Card: se canjea en el CARRITO (paso anterior). Aquí solo se LEE la
  // tarjeta ya aplicada para descontarla del total — sin input duplicado.
  const [giftcard] = useState(() => {
    try { return JSON.parse(localStorage.getItem('peyu_giftcard_active') || 'null'); }
    catch { return null; }
  });
  const [creando, setCreando] = useState(false);
  // Si Mercado Pago devolvió al cliente con pago fallido (?mp=failure), se lo
  // decimos de entrada: su carrito y datos siguen intactos para reintentar.
  const [errorPago, setErrorPago] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('mp') === 'failure'
      ? 'El pago en Mercado Pago no se completó. No se realizó ningún cargo — tus datos siguen aquí, puedes reintentar cuando quieras.'
      : null;
  });
  // Guard SÍNCRONO contra doble pedido: `creando` (estado) tarda un tick en
  // propagarse, así que dos taps rápidos en móvil podían crear 2 pedidos antes
  // de que el guard de estado actuara. Este ref bloquea en el mismo instante.
  const enviandoRef = useRef(false);

  // ── CÁLCULOS ───────────────────────────────────────────────────────
  const subtotal = carrito.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
  const cargoPersonalizacion = calcularCargoPersonalizacionCarrito(carrito);
  // Ahorro por volumen: ≥10u del mismo SKU → PRECIO MAYORISTA B2B real (+IVA);
  // bajo 10u → descuento B2C de siempre (2u −10% · 3+u −15%). Misma fuente que
  // ficha y carrito, ahora con los productos para que el mayorista persista.
  const { lineas: descLineas, ahorroTotal } = computeQtyDiscountBySku({ carrito, productosBySku });
  // 🚚 Envío gratis ≥$40.000 SOLO B2C: pedidos B2B (líneas B2B del catálogo
  // corporativo o compra con Factura empresa) pagan siempre su envío real.
  const esB2B = tieneLineaB2B || billing.tipo_documento === 'Factura';
  const envio = envioBluex ? envioBluex.costo : 0;
  const total = Math.max(0, subtotal + cargoPersonalizacion - ahorroTotal + envio);
  // Descuento por Gift Card canjeada en el checkout.
  const descuentoGift = giftcard ? Math.min(giftcard.saldo_clp, total) : 0;
  const totalFinal = Math.max(0, total - descuentoGift);

  // Precio unitario efectivo por SKU (mayorista si aplica) para persistir en el
  // pedido el precio realmente cobrado, no el B2C tachado.
  const precioUnitEfectivo = useMemo(() => {
    const m = {};
    for (const l of descLineas) {
      if (l.beneficioAplicado === 'mayorista' && l.precioMayoristaUnit) {
        m[l.sku || l.nombre] = l.precioMayoristaUnit;
      }
    }
    return m;
  }, [descLineas]);

  // 📊 Meta Pixel — InitiateCheckout al entrar al checkout (faltaba: Meta solo
  // veía PageView aquí). Una sola vez por carga, con value + contents reales.
  const icSentRef = useRef(false);
  useEffect(() => {
    if (icSentRef.current || carrito.length === 0) return;
    icSentRef.current = true;
    trackInitiateCheckout({
      value: totalFinal,
      num_items: carrito.reduce((s, i) => s + (Number(i.cantidad) || 1), 0),
      contents: carrito
        .filter((i) => i.sku)
        .map((i) => ({ id: String(i.sku), quantity: Number(i.cantidad) || 1, item_price: Number(i.precio) || 0 })),
    });
    // 📊 GA4 — begin_checkout en espejo (Google Analytics + Ads).
    trackBeginCheckout(carrito, totalFinal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito.length]);

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
    // Bloqueo síncrono inmediato: evita doble pedido por doble tap en móvil.
    if (enviandoRef.current || creando) return;
    enviandoRef.current = true;
    setErrorPago(null);

    if (!carrito.length) { setErrorPago('Tu carrito está vacío.'); enviandoRef.current = false; return; }

    // La validación de dirección se hace más abajo (después de detectar retiro en tienda)

    const bErrs = validarBilling(billing);
    setBillingErrors(bErrs);
    if (Object.keys(bErrs).length > 0) {
      setErrorPago('Completa los datos de facturación para emitir la factura.');
      setTimeout(() => document.querySelector('[data-billing-section]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      enviandoRef.current = false;
      return;
    }

    // Retiro en tienda: saltamos validación de dirección y selector de envío
    const esRetiro = envioBluex?.es_retiro === true;

    if (!esRetiro) {
      const errs = validarShippingForm(cliente);
      setErrors(errs);
      if (Object.keys(errs).length > 0) {
        setErrorPago('Revisa los campos de envío marcados en rojo.');
        setTimeout(() => document.querySelector('[class*="border-red-300"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        enviandoRef.current = false;
        return;
      }
    }

    if (!envioBluex) {
      setErrorPago('Elige una forma de envío para continuar (o selecciona "Retiro en Tienda", siempre disponible).');
      setTimeout(() => document.querySelector('[data-shipping-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      enviandoRef.current = false;
      return;
    }

    setCreando(true);

    // ── Reintento de pago SIN duplicar pedidos ─────────────────────────────
    // Si este mismo carrito (misma firma: email+total+items) ya creó un pedido
    // pendiente (ej: el pago WebPay/MP falló y el cliente vuelve a intentar),
    // REUTILIZAMOS ese pedido en vez de crear uno nuevo. Antes cada reintento
    // generaba un pedido + correo + descuento de stock duplicados.
    const emailNorm = cliente.email.trim().toLowerCase();
    const firmaPedido = `${emailNorm}|${totalFinal}|${carrito.map((i) => `${i.sku || i.nombre}x${i.cantidad || 1}`).join(',')}`;
    let pedido = null;
    let numero = `WEB-${Date.now()}`;
    try {
      const pend = JSON.parse(localStorage.getItem('peyu_v2_pending_order') || 'null');
      if (pend?.id && pend.firma === firmaPedido && Date.now() - (pend.at || 0) < 2 * 60 * 60 * 1000) {
        const r = await base44.functions.invoke('retomarPedidoPendiente', {
          pedido_id: pend.id,
          email: emailNorm,
          medio_pago: totalFinal === 0 ? 'GiftCard' : medioPago,
          total: totalFinal,
        });
        if (r?.data?.ok) {
          pedido = { id: pend.id };
          numero = pend.numero;
        }
      }
    } catch { /* si falla la verificación, se crea un pedido nuevo como siempre */ }

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
        const uploaded = await uploadImagePublic(file);
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
    const esRetiroPedido = envioBluex?.es_retiro === true;
    const direccionCompleta = esRetiroPedido
      ? 'Retiro en tienda · Pedro de Valdivia 6603, Macul'
      : [
          (cliente.direccion || '').trim(),
          referenciaTrim ? `Depto/Ref: ${referenciaTrim}` : null,
          cliente.ciudad, cliente.region,
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
      // Capas del grabado (diseño PEYU / logo / frase) SIEMPRE persistidas: son la
      // fuente de verdad del arte del cliente aunque falle la captura del mockup.
      // Se excluyen urls data: (base64 gigante rompería el registro).
      const capasLimpias = (Array.isArray(i.capas_grabado) ? i.capas_grabado : [])
        .map((c) => ({
          tipo: c.tipo || '',
          nombre: c.nombre || '',
          texto: c.texto || '',
          url: (c.url && !String(c.url).startsWith('data:')) ? c.url : '',
          size: Number(c.size) || 0,
          x: Number(c.x) || 0,
          y: Number(c.y) || 0,
        }));
      // Arte original para producción: logo subido o, si no, la imagen del diseño
      // PEYU elegido (antes se perdía y el admin no podía ver el diseño).
      const arteCapa = capasLimpias.find((c) => (c.tipo === 'archivo' || c.tipo === 'peyu') && c.url);
      const logoFinal = i.logoUrl || i.logo_url || arteCapa?.url || '';
      const imagenBase = [i.imagen_base, i.imagenBase, i.imagen]
        .find((u) => u && !String(u).startsWith('data:')) || '';
      return {
        sku: i.sku || '',
        nombre: i.nombre || '',
        color: i.color || '',
        pack_resumen: i.pack_resumen || '',
        personalizacion: i.personalizacion || '',
        tipo_personalizacion: i.personalizacion ? tipoLineaCombinado(i) : '',
        fee_personalizacion: Number(feePersItem(i)) || 0,
        logo_url: logoFinal,
        mockup_url: mockupFinal || '',
        capas_grabado: capasLimpias,
        imagen_base: imagenBase,
        posicion_grabado: posicionLinea(i),
        precio_unitario: Number(precioUnitEfectivo[i.sku || i.nombre] ?? i.precio) || 0,
        cantidad: Number(i.cantidad) || 1,
      };
    });
    const colorTopLevel = carrito.length === 1 ? (carrito[0]?.color || '') : '';
    const itemConLogo = carrito.find(i => i.logoUrl || i.logo_url) ||
      // Fallback: diseño PEYU elegido en capas (para que el arte quede accesible top-level)
      carrito.find(i => (i.capas_grabado || []).some(c => (c.tipo === 'archivo' || c.tipo === 'peyu') && c.url && !String(c.url).startsWith('data:')));
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
      sku: carrito[0]?.sku || carrito[0]?.productoId || '',
      descripcion_items: items,
      items_detalle: itemsDetalle,
      color: colorTopLevel,
      cantidad: carrito.reduce((s, i) => s + (Number(i.cantidad) || 1), 0),
      subtotal: Number(subtotal) || 0,
      costo_envio: Number(envio) || 0,
      fee_personalizacion: Number(cargoPersonalizacion) || 0,
      tipo_personalizacion: (() => {
        const tipos = Array.from(new Set(carrito.filter(i => i.personalizacion).map(i => getTipoPersonalizacion(i)).filter(Boolean)));
        return tipos.length === 1 ? tipos[0] : (tipos.length > 1 ? 'mixto' : '');
      })(),
      descuento: Number(ahorroTotal) + Number(descuentoGift) || 0,
      total: Number(totalFinal) || 0,
      medio_pago: totalFinal === 0 ? 'GiftCard' : medioPago,
      // Estado fino del pago correcto según el medio elegido (antes todos
      // nacían "pending_mp" y las transferencias/WebPay contaminaban la
      // reconciliación de MercadoPago).
      payment_status: totalFinal === 0 ? 'paid'
        : medioPago === 'Transferencia' ? 'pending_transfer'
        : medioPago === 'WebPay' ? 'pending_webpay'
        : 'pending_mp',
      estado: 'Nuevo',
      direccion_envio: direccionCompleta,
      requiere_personalizacion: carrito.some(i => i.personalizacion),
      texto_personalizacion: carrito.filter(i => i.personalizacion).map(i => i.personalizacion).join(', '),
      logo_url: itemConLogo
        ? (itemConLogo.logoUrl || itemConLogo.logo_url ||
           ((itemConLogo.capas_grabado || []).find(c => (c.tipo === 'archivo' || c.tipo === 'peyu') && c.url && !String(c.url).startsWith('data:'))?.url) || '')
        : '',
      mockup_url: itemConMockup ? (uploadedMockups[itemConMockup.id] || (!(itemConMockup.mockupUrl || '').startsWith('data:') ? (itemConMockup.mockupUrl || itemConMockup.mockup_url || '') : '')) : '',
      logo_recibido: !!(itemConLogo || itemConMockup),
      courier: esRetiroPedido ? 'Retiro en Tienda' : 'BlueExpress',
      ciudad: esRetiroPedido ? 'Macul' : cliente.ciudad,
      notas: esRetiroPedido
        ? `Carrito v2: ${carrito.length} items | Retiro en tienda Pedro de Valdivia 6603, Macul`
        : `Carrito v2: ${carrito.length} items | Bluex ${envioBluex.servicio} (${(envioBluex.peso_kg || 0)}kg) → $${(envioBluex.costo_real || envioBluex.costo).toLocaleString('es-CL')}`,
    };

    // Reintento automático: hasta 2 intentos extra con espera creciente para
    // absorber fallos de red transitorios. El 1er intento falla rápido, pero los
    // siguientes tienen delay para esquivar microcortes.
    // (Se salta por completo si estamos REUTILIZANDO un pedido pendiente.)
    let ultimoError = null;
    const MAX_INTENTOS = 3;
    if (!pedido) {
      for (let intento = 0; intento < MAX_INTENTOS; intento++) {
        try {
          pedido = await base44.entities.PedidoWeb.create(datosPedido);
          ultimoError = null;
          break;
        } catch (e) {
          ultimoError = e;
          console.error(`Error creando pedido (intento ${intento + 1}/${MAX_INTENTOS}):`, e);
          if (intento < MAX_INTENTOS - 1) {
            await new Promise(r => setTimeout(r, 800 * (intento + 1)));
          }
        }
      }
      // Recuerda el pedido pendiente: si el pago falla y el cliente reintenta
      // con el mismo carrito, se reutiliza este pedido (sin duplicar).
      if (pedido?.id) {
        try {
          localStorage.setItem('peyu_v2_pending_order', JSON.stringify({ id: pedido.id, numero, firma: firmaPedido, at: Date.now() }));
        } catch {}
      }
    }
    if (ultimoError) {
      // Registrar el error para diagnóstico en producción
      try {
        await base44.entities.ErrorLog.create({
          source: 'frontend_window',
          severity: 'high',
          message: `CheckoutNuevo: PedidoWeb.create falló tras ${MAX_INTENTOS} intentos — ${ultimoError?.message || 'sin mensaje'}`,
          url: window.location.href,
          user_agent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          user_email: cliente.email || '',
          extra: { total, medioPago, canal: 'Web Propia', itemsCount: carrito.length, stack: (ultimoError?.stack || '').slice(0, 2000), intentos: MAX_INTENTOS },
        }).catch(() => {});
      } catch (_) {}
      setErrorPago('No pudimos crear tu pedido. Revisa tu conexión e intenta nuevamente.');
      setCreando(false);
      enviandoRef.current = false;
      return;
    }

    try {
      localStorage.setItem('peyu_last_purchase', JSON.stringify(carrito));
      // Marca de compra reciente: si el cliente vuelve atrás al checkout tras
      // pagar, mostramos "compra completada" en vez de "carrito vacío".
      localStorage.setItem('peyu_v2_last_order', JSON.stringify({ numero, at: Date.now() }));
    } catch {}

    // Gift Card canjeada: descontar saldo del backend SIEMPRE (incluso si también
    // paga con MP/transferencia el resto). Esto evita uso doble del mismo saldo.
    if (giftcard && descuentoGift > 0) {
      try {
        await base44.functions.invoke('canjearGiftCard', {
          action: 'redeem',
          codigo: giftcard.codigo,
          monto: descuentoGift,
          pedido_id: pedido.id,
        });
        localStorage.removeItem('peyu_giftcard_active');
      } catch (e) {
        console.warn('No se pudo canjear Gift Card:', e?.message);
      }
    }

    // Total cubierto 100% por Gift Card → no necesita pasar por Mercado Pago.
    if (totalFinal === 0) {
      // Marca el pedido como confirmado/pagado automáticamente.
      try {
        await base44.entities.PedidoWeb.update(pedido.id, {
          estado: 'Confirmado',
          payment_status: 'paid',
        });
      } catch (e) { /* best-effort, el pedido ya existe */ }
      clearCartV2();
      trackPurchase({ transactionId: numero, total: 0, shipping: envio, cart: carrito });
      setCreando(false);
      enviandoRef.current = false;
      navigate(`/gracias?numero=${encodeURIComponent(numero)}&email=${encodeURIComponent(cliente.email)}&total=0&pago=GiftCard`);
      return;
    }

    // MercadoPago: crear preferencia y redirigir
    if (medioPago === 'MercadoPago' && totalFinal > 0) {
      try {
        const mp = await base44.functions.invoke('mpCreatePreference', { pedido_id: pedido.id });
        const initUrl = mp?.data?.init_point || mp?.data?.sandbox_init_point;
        if (initUrl) {
          // NO limpiamos el carrito aún: si el cliente cancela en Mercado Pago y
          // vuelve atrás, conserva su carrito y datos para reintentar. El pedido
          // queda pendiente y se reconcilia/expira solo. Solo registramos la marca
          // de "intento de compra" para el mensaje post-pago.
          trackPurchase({ transactionId: numero, total: totalFinal, shipping: envio, cart: carrito });
          window.location.href = initUrl;
          return;
        }
        setErrorPago(mp?.data?.error || 'No pudimos iniciar Mercado Pago. Intenta de nuevo o usa transferencia.');
        setCreando(false);
        enviandoRef.current = false;
        return;
      } catch (e) {
        console.error('Error MP:', e);
        // Pedido ya pagado (guard anti doble cobro del backend) u otro error:
        // mostramos el mensaje real si viene del servidor.
        setErrorPago(e?.response?.data?.error || 'No pudimos iniciar Mercado Pago. Intenta de nuevo o usa transferencia.');
        setCreando(false);
        enviandoRef.current = false;
        return;
      }
    }

    // WebPay Plus (Transbank): crear transacción y redirigir al formulario oficial
    if (medioPago === 'WebPay' && totalFinal > 0) {
      try {
        const tbk = await base44.functions.invoke('tbkCreateTransaction', { pedido_id: pedido.id });
        const redirectUrl = tbk?.data?.redirect_url;
        if (redirectUrl) {
          // Igual que MP: NO limpiamos el carrito — si anula en Transbank y
          // vuelve, conserva todo para reintentar. Se vacía en /gracias.
          trackPurchase({ transactionId: numero, total: totalFinal, shipping: envio, cart: carrito });
          window.location.href = redirectUrl;
          return;
        }
        setErrorPago('No pudimos iniciar WebPay. Intenta de nuevo o usa otro medio de pago.');
        setCreando(false);
        enviandoRef.current = false;
        return;
      } catch (e) {
        console.error('Error WebPay:', e);
        setErrorPago('No pudimos iniciar WebPay. Intenta de nuevo o usa otro medio de pago.');
        setCreando(false);
        enviandoRef.current = false;
        return;
      }
    }

    // Transferencia → gracias.
    // NO limpiamos el carrito ni los datos del checkout: el pago aún no está
    // confirmado (queda "por confirmar transferencia"). Si el cliente vuelve
    // atrás conserva todo para reintentar. El carrito se vacía recién al
    // confirmar el pago en la página Gracias, igual que con Mercado Pago.
    trackPurchase({ transactionId: numero, total: totalFinal, shipping: envio, cart: carrito });
    setCreando(false);
    navigate(`/gracias?numero=${encodeURIComponent(numero)}&email=${encodeURIComponent(cliente.email)}&total=${totalFinal}&pago=${encodeURIComponent(medioPago)}`);
  };

  const itemsEnvio = useMemo(
    () => carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, nombre: i.nombre })),
    [carrito]
  );

  // ── Acordeón móvil: una sección abierta a la vez + auto-avance ─────────
  // En móvil abrir TODAS las secciones de golpe genera un muro largo y lento.
  // Aquí controlamos cuál está abierta (envío → forma → pago → facturación) y
  // saltamos a la siguiente al completar cada paso. En desktop (lg) todo abierto.
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Sección abierta en móvil: 'envio' | 'forma' | 'pago' | 'facturacion' | null
  const [openSection, setOpenSection] = useState('envio');
  // ⚠️ NO auto-cerramos la sección de envío al validar: el cliente seguía
  // escribiendo (depto, referencia) y la sección se colapsaba sola, sacándolo
  // del formulario. Ahora avanza SOLO con el botón "Continuar".
  const prevEnvioElegido = useRef(false);
  useEffect(() => {
    if (!isMobile) return;
    if (envioBluex && !prevEnvioElegido.current && openSection === 'forma') setOpenSection('pago');
    prevEnvioElegido.current = !!envioBluex;
  }, [envioBluex, isMobile, openSection]);

  // Props del acordeón: en móvil controlado (1 abierta), en desktop siempre abierto.
  const sectionProps = (id) => isMobile
    ? { open: openSection === id, onToggle: (next) => setOpenSection(next ? id : null) }
    : { defaultOpen: true };

  if (carrito.length === 0) {
    // ¿Volvió atrás tras una compra reciente (< 30 min)? Mostramos confirmación,
    // no un genérico "carrito vacío" que parece un error.
    let ultimaCompra = null;
    try {
      const raw = JSON.parse(localStorage.getItem('peyu_v2_last_order') || 'null');
      if (raw?.numero && Date.now() - (raw.at || 0) < 30 * 60 * 1000) ultimaCompra = raw;
    } catch { /* noop */ }

    return (
      <div className={`min-h-screen font-inter ${temaClass}`} style={{ background: 'var(--ck-bg, #F8F3ED)', color: 'var(--ck-fg, #2C1810)' }}>
        <NoIndex />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          {ultimaCompra ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg,var(--ck-action, #C0785C),var(--ck-action-dark, #A86440))' }}>
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-fraunces text-2xl mb-2">¡Tu compra ya está hecha!</h1>
              <p className="text-sm mb-6" style={{ color: 'var(--ck-fg-soft, #7A6050)' }}>
                El pedido <span className="font-mono font-bold" style={{ color: 'var(--ck-action, #C0785C)' }}>{ultimaCompra.numero}</span> fue creado. No necesitas volver a pagar.
              </p>
              <div className="flex flex-col gap-2.5">
                <Link to={`/seguimiento?pedido=${encodeURIComponent(ultimaCompra.numero)}`}>
                  <button className="w-full text-white font-bold px-6 py-3.5 rounded-2xl transition-all" style={{ background: 'linear-gradient(135deg,var(--ck-action, #C0785C),var(--ck-action-dark, #A86440))' }}>
                    Seguir mi pedido
                  </button>
                </Link>
                <Link to="/CatalogoNuevo">
                  <button className="w-full font-bold px-6 py-3.5 rounded-2xl transition-all" style={{ background: 'white', border: '1.5px solid var(--ck-border, #D4C4B0)', color: 'var(--ck-fg, #2C1810)' }}>
                    Seguir comprando
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-fraunces text-2xl mb-3">Tu carrito está vacío</h1>
              <Link to="/CatalogoNuevo">
                <button className="text-white font-bold px-6 py-3.5 rounded-2xl transition-all" style={{ background: 'linear-gradient(135deg,var(--ck-action, #C0785C),var(--ck-action-dark, #A86440))' }}>
                  Ir a la tienda
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── LAYOUT cockpit 1 pantalla (mismo formato /personalizar y /CotizacionRapida):
  // header wizard propio con el viaje completo + CTA siempre visible, resumen
  // "Tu pedido" vivo a la izquierda y el formulario al centro con scroll propio.
  // Mobile conserva el flujo vertical completo con barra de pago sticky.
  const ctaPagar = totalFinal === 0
    ? 'Confirmar pedido'
    : medioPago === 'Transferencia' ? `Confirmar · ${fmtCLP(totalFinal)}` : `Pagar ${fmtCLP(totalFinal)}`;

  const formSections = (
    <>
      {/* 1 · Envío */}
      <CollapsibleSectionV2
        step={1}
        title="Datos de envío"
        subtitle="¿A dónde enviamos tu pedido?"
        {...sectionProps('envio')}
        complete={envioCompleto}
        summary={envioCompleto ? `${cliente.nombre} · ${cliente.ciudad}, ${cliente.region}` : null}
      >
        <ShippingAddressForm
          cliente={cliente}
          setCliente={(c) => { setCliente(c); setErrors({}); }}
          errors={errors}
        />
        {/* Avance explícito: el cliente decide cuándo terminó de escribir */}
        {isMobile && (
          <button
            type="button"
            onClick={() => {
              const errs = validarShippingForm(cliente);
              setErrors(errs);
              if (Object.keys(errs).length === 0) setOpenSection('forma');
            }}
            className="w-full mt-4 h-12 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,var(--ck-action, #C0785C),var(--ck-action-dark, #A86440))' }}
          >
            Continuar a forma de envío
          </button>
        )}
      </CollapsibleSectionV2>

      {/* 2 · Forma de envío (BlueExpress inline) */}
      <div data-shipping-selector>
        <CollapsibleSectionV2
          step={2}
          title="Forma de envío"
          subtitle="Tarifa BlueExpress según tu comuna"
          {...sectionProps('forma')}
          complete={!!envioBluex}
          summary={envioBluex ? `BlueExpress ${envioBluex.servicio} · ${envio === 0 ? 'GRATIS' : fmtCLP(envio)}` : null}
        >
          <ShippingSelector
            variant="light"
            items={itemsEnvio}
            comuna={cliente.ciudad}
            region={cliente.region}
            subtotal={subtotal}
            umbralEnvioGratis={esB2B ? Infinity : 40000}
            onSelect={setEnvioBluex}
          />
        </CollapsibleSectionV2>
      </div>

      {/* Gift Card: el canje vive en el carrito (paso anterior). Si viene una
          aplicada, el resumen ya muestra su descuento. */}

      {/* 3 · Pago */}
      <CollapsibleSectionV2
        step={3}
        title="Método de pago"
        subtitle="Elige cómo quieres pagar"
        {...sectionProps('pago')}
        complete={!!medioPago}
        summary={medioPago ? ({ Transferencia: 'Transferencia bancaria', WebPay: 'WebPay Plus (Transbank)' }[medioPago] || 'Mercado Pago') : null}
      >
        <PaymentMethodSelector value={medioPago} onChange={setMedioPago} totalCubiertoConGC={totalFinal === 0} />
      </CollapsibleSectionV2>

      {/* 4 · Facturación */}
      <div data-billing-section>
        <BillingSection
          billing={billing}
          setBilling={(b) => { setBilling(b); setBillingErrors({}); }}
          errors={billingErrors}
        />
      </div>
    </>
  );

  return (
    <div className={`min-h-screen lg:h-screen lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden font-inter pb-36 lg:pb-0 ${temaClass}`} style={{ background: 'var(--ck-bg, #F8F3ED)', color: 'var(--ck-fg, #2C1810)' }}>
      <NoIndex />

      {/* ── TOP NAV cockpit: viaje completo + CTA siempre visible ─────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'var(--ck-header-bg, rgba(248,243,237,.97))', borderBottom: '1px solid var(--ck-border, #D4C4B0)', boxShadow: '0 1px 10px rgba(var(--ck-fg-rgb, 44,24,16),.07)' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex items-center gap-3">
          <Link to="/CarritoNuevo"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white flex-shrink-0"
            style={{ border: '1.5px solid var(--ck-border, #D4C4B0)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--ck-fg-soft, #7A6050)' }} />
          </Link>

          {/* Logo (solo desktop) */}
          <Link to="/" className="hidden lg:block flex-shrink-0 group mr-4">
            <img src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU" className="h-8 w-auto group-hover:scale-105 transition-transform" draggable={false} />
          </Link>

          {/* Brand mobile */}
          <div className="flex items-center gap-2 lg:hidden flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,var(--ck-action, #C0785C),var(--ck-action-dark, #A86440))' }}>
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-poppins font-bold text-sm leading-tight truncate">Finaliza tu compra</p>
              <p className="text-[10px] leading-tight font-semibold" style={{ color: 'var(--ck-action, #C0785C)' }}>Pago seguro · WebPay, Mercado Pago o transferencia</p>
            </div>
          </div>

          {/* Desktop: viaje completo Tienda → Producto → Carrito → Pago */}
          <div className="hidden lg:flex flex-1 justify-center">
            <CheckoutStepperV2 current="pago" className="mb-0" />
          </div>

          {/* CTA desktop en header */}
          <button
            onClick={crearPedido}
            disabled={creando}
            className="hidden lg:flex items-center gap-2 px-5 h-10 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-60 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,var(--ck-action, #C0785C),var(--ck-action-dark, #A86440))', boxShadow: '0 6px 20px rgba(var(--ck-action-rgb, 192,120,92),.28)' }}
          >
            {creando ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>{ctaPagar}</span>
          </button>
        </div>

        {/* Viaje compacto en mobile */}
        <div className="lg:hidden pb-2">
          <CheckoutStepperV2 current="pago" className="mb-0" />
        </div>
      </header>

      {/* ── BODY cockpit: resumen vivo izquierda · formulario centro ─────── */}
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 lg:px-6 py-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <div className="flex gap-8 lg:gap-5 items-start lg:items-stretch lg:h-full">

          {/* Panel izquierdo desktop: Tu pedido SIEMPRE visible + sellos */}
          <aside className="hidden lg:flex flex-col gap-3 w-72 xl:w-80 flex-shrink-0 lg:h-full lg:min-h-0 lg:overflow-y-auto peyu-scrollbar pr-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(var(--ck-action-rgb, 192,120,92),.12)', color: 'var(--ck-action, #C0785C)' }}>
                Pago seguro
              </span>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--ck-fg-muted, #A08070)' }}>Último paso de tu viaje</span>
            </div>

            <CheckoutSummaryCardV2
              carrito={carrito} subtotal={subtotal} cargoPersonalizacion={cargoPersonalizacion}
              ahorroTotal={ahorroTotal} descLineas={descLineas}
              envioBluex={envioBluex} envio={envio} total={totalFinal}
              descuentoGift={descuentoGift} giftcardCodigo={giftcard?.codigo || ''}
              errorPago={errorPago} medioPago={medioPago}
            />

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { icon: Lock, label: 'Pago', sub: 'seguro' },
                { icon: ShieldCheck, label: '10 años', sub: 'garantía' },
                { icon: Recycle, label: '100%', sub: 'reciclado' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl text-center bg-white"
                  style={{ border: '1px solid var(--ck-border, #D4C4B0)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--ck-action, #C0785C)' }} />
                  <span className="text-[10px] font-bold leading-tight" style={{ color: 'var(--ck-fg, #2C1810)' }}>{label}</span>
                  <span className="text-[9px]" style={{ color: 'var(--ck-fg-muted, #A08070)' }}>{sub}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Centro: formulario con scroll propio + CTA fijo (sin scroll de página) */}
          <div className="flex-1 min-w-0 lg:h-full lg:min-h-0 lg:flex lg:flex-col">
            <div className="space-y-3 lg:flex-1 lg:min-h-0 lg:overflow-y-auto peyu-scrollbar lg:pr-1">
              <h1 className="font-fraunces text-2xl sm:text-3xl lg:hidden">Finaliza tu compra</h1>

              {formSections}

              {/* Error de pago visible en mobile (el banner del CTA es desktop-only) */}
              {errorPago && (
                <div className="lg:hidden rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(var(--ck-action-rgb, 192,120,92),.08)', border: '1px solid rgba(var(--ck-action-rgb, 192,120,92),.3)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ck-action, #C0785C)' }} />
                  <p className="text-xs font-semibold" style={{ color: 'var(--ck-action, #C0785C)' }}>{errorPago}</p>
                </div>
              )}

              {/* Resumen en mobile (mismos datos en vivo) */}
              <div className="lg:hidden">
                <CheckoutSummaryCardV2
                  carrito={carrito} subtotal={subtotal} cargoPersonalizacion={cargoPersonalizacion}
                  ahorroTotal={ahorroTotal} descLineas={descLineas}
                  envioBluex={envioBluex} envio={envio} total={totalFinal}
                  descuentoGift={descuentoGift} giftcardCodigo={giftcard?.codigo || ''}
                  errorPago={errorPago} medioPago={medioPago}
                />
              </div>
            </div>

            {/* CTA desktop fijo bajo la columna (siempre visible) */}
            <div className="hidden lg:block mt-3 lg:flex-shrink-0">
              {errorPago && (
                <div className="mb-2 rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(var(--ck-action-rgb, 192,120,92),.08)', border: '1px solid rgba(var(--ck-action-rgb, 192,120,92),.3)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ck-action, #C0785C)' }} />
                  <p className="text-xs font-semibold" style={{ color: 'var(--ck-action, #C0785C)' }}>{errorPago}</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <Link to="/CarritoNuevo"
                  className="h-12 px-5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all hover:bg-white"
                  style={{ border: '1.5px solid var(--ck-border, #D4C4B0)', color: 'var(--ck-fg-soft, #7A6050)' }}>
                  <ArrowLeft className="w-4 h-4" /> Carrito
                </Link>
                <button
                  onClick={crearPedido}
                  disabled={creando}
                  className="flex-1 h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg,var(--ck-action, #C0785C),var(--ck-action-dark, #A86440))', boxShadow: '0 8px 24px rgba(var(--ck-action-rgb, 192,120,92),.28)' }}
                >
                  {creando ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
                  ) : medioPago === 'Transferencia' ? (
                    <><Gift className="w-5 h-5" /> {ctaPagar}</>
                  ) : (
                    <><Lock className="w-5 h-5" /> {ctaPagar}</>
                  )}
                </button>
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
        total={totalFinal}
      />
    </div>
  );
}