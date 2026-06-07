import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Lock, ShieldCheck, Recycle, AlertCircle, Gift } from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import CartItemThumbV2 from '@/components/shopv2/CartItemThumbV2';
import ShippingAddressForm, { validarShippingForm } from '@/components/cart/ShippingAddressForm';
import BillingSection, { validarBilling } from '@/components/cart/BillingSection';
import ShippingSelector from '@/components/cart/ShippingSelector';
import PaymentMethodSelector from '@/components/cart/PaymentMethodSelector';
import { getCartV2, clearCartV2, fmtCLP } from '@/lib/shop-v2-cart';
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

  const [cliente, setCliente] = useState({
    nombre: '', email: '', telefono: '',
    region: '', ciudad: '', direccion: '', referencia: '', codigo_postal: '',
  });
  const [errors, setErrors] = useState({});
  const [billing, setBilling] = useState({
    tipo_documento: 'Boleta', razon_social: '', rut_empresa: '', giro: '',
    direccion_facturacion: '', comuna_facturacion: '',
  });
  const [billingErrors, setBillingErrors] = useState({});
  const [medioPago, setMedioPago] = useState('MercadoPago');
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

  const feePersItem = (item) => {
    const moq = item.moq_personalizacion || item.personalizacion_gratis_desde || MOQ_PERSONALIZACION_GRATIS;
    return calcularCargoPersonalizacion(item, moq);
  };

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

    const itemsDetalle = carrito.map(i => ({
      sku: i.sku || '',
      nombre: i.nombre || '',
      color: i.color || '',
      pack_resumen: i.pack_resumen || '',
      personalizacion: i.personalizacion || '',
      tipo_personalizacion: i.personalizacion ? tipoLineaCombinado(i) : '',
      fee_personalizacion: feePersItem(i),
      logo_url: i.logoUrl || i.logo_url || '',
      mockup_url: i.mockupUrl || i.mockup_url || '',
      posicion_grabado: posicionLinea(i),
      precio_unitario: i.precio || 0,
      cantidad: i.cantidad || 1,
    }));
    const colorTopLevel = carrito.length === 1 ? (carrito[0]?.color || '') : '';
    const itemConLogo = carrito.find(i => i.logoUrl || i.logo_url);
    const itemConMockup = carrito.find(i => i.mockupUrl || i.mockup_url);

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
      mockup_url: itemConMockup ? (itemConMockup.mockupUrl || itemConMockup.mockup_url) : '',
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

    try { localStorage.setItem('peyu_last_purchase', JSON.stringify(carrito)); } catch {}

    // MercadoPago: crear preferencia y redirigir
    if (medioPago === 'MercadoPago' && total > 0) {
      try {
        const mp = await base44.functions.invoke('mpCreatePreference', { pedido_id: pedido.id });
        const initUrl = mp?.data?.init_point || mp?.data?.sandbox_init_point;
        if (initUrl) {
          clearCartV2();
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

    // Transferencia → gracias
    clearCartV2();
    trackPurchase({ transactionId: numero, total, shipping: envio, cart: carrito });
    setCreando(false);
    navigate(`/gracias?numero=${encodeURIComponent(numero)}&email=${encodeURIComponent(cliente.email)}&total=${total}&pago=${encodeURIComponent(medioPago)}`);
  };

  const itemsEnvio = useMemo(
    () => carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, nombre: i.nombre })),
    [carrito]
  );

  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420]">
        <ShopV2Header />
        <div className="max-w-md mx-auto text-center py-24 px-4">
          <h1 className="font-fraunces text-2xl mb-3">Tu carrito está vacío</h1>
          <Link to="/CatalogoNuevo">
            <button className="bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold px-6 py-3.5 rounded-2xl transition-all">
              Ir a la tienda
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420] pb-32 lg:pb-12">
      <ShopV2Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/CarritoNuevo" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4B4F54] hover:text-[#0F8B6C] mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al carrito
        </Link>

        <h1 className="font-fraunces text-3xl sm:text-4xl mb-6">Finaliza tu compra</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* FORM — 1 sola página */}
          <div className="lg:col-span-2 space-y-4">
            {/* 1 · Envío */}
            <section className="bg-white rounded-2xl border border-[#EBE3D6] p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-xl bg-[#0F8B6C] text-white flex items-center justify-center font-bold text-sm">1</span>
                <h2 className="font-fraunces text-xl">Datos de envío</h2>
              </div>
              <ShippingAddressForm
                cliente={cliente}
                setCliente={(c) => { setCliente(c); setErrors({}); }}
                errors={errors}
              />
            </section>

            {/* 2 · Facturación */}
            <div data-billing-section>
              <BillingSection
                billing={billing}
                setBilling={(b) => { setBilling(b); setBillingErrors({}); }}
                errors={billingErrors}
              />
            </div>

            {/* 3 · Forma de envío (BlueExpress inline) */}
            <section className="bg-white rounded-2xl border border-[#EBE3D6] p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-xl bg-[#0F8B6C] text-white flex items-center justify-center font-bold text-sm">2</span>
                <div>
                  <h2 className="font-fraunces text-xl">Forma de envío</h2>
                  <p className="text-xs text-[#A78B6F]">Tarifa real BlueExpress según tu comuna</p>
                </div>
              </div>
              <div data-shipping-selector>
                <ShippingSelector
                  variant="light"
                  items={itemsEnvio}
                  comuna={cliente.ciudad}
                  region={cliente.region}
                  subtotal={subtotal}
                  umbralEnvioGratis={40000}
                  onSelect={setEnvioBluex}
                />
              </div>
            </section>

            {/* 4 · Pago */}
            <section className="bg-white rounded-2xl border border-[#EBE3D6] p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-xl bg-[#0F8B6C] text-white flex items-center justify-center font-bold text-sm">3</span>
                <h2 className="font-fraunces text-xl">Método de pago</h2>
              </div>
              <PaymentMethodSelector value={medioPago} onChange={setMedioPago} totalCubiertoConGC={false} />
            </section>
          </div>

          {/* RESUMEN sticky */}
          <div className="lg:sticky lg:top-24 self-start space-y-3">
            <div className="bg-white rounded-2xl border border-[#EBE3D6] p-5">
              <h2 className="font-fraunces text-xl mb-4">Tu pedido</h2>

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
                        <p className="text-[10px] text-[#D96B4D] font-semibold truncate">✦ {item.personalizacion}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#2A2420]">{fmtCLP((item.precio || 0) * (item.cantidad || 1))}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-3 border-t border-[#EBE3D6] text-sm">
                <div className="flex justify-between text-[#4B4F54]">
                  <span>Subtotal</span><span className="font-semibold">{fmtCLP(subtotal)}</span>
                </div>
                {cargoPersonalizacion > 0 && (
                  <div className="flex justify-between text-[#4B4F54]">
                    <span>Personalización</span><span className="font-semibold">+{fmtCLP(cargoPersonalizacion)}</span>
                  </div>
                )}
                {ahorroTotal > 0 && (
                  <div className="bg-[#0F8B6C]/5 border border-[#0F8B6C]/20 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between font-bold text-[#0F8B6C]">
                      <span>Descuento por cantidad</span><span>−{fmtCLP(ahorroTotal)}</span>
                    </div>
                    {descLineas.filter((l) => l.ahorro > 0).map((l) => (
                      <div key={l.sku || l.nombre} className="flex justify-between text-[11px] text-[#4B4F54]">
                        <span className="truncate pr-2">{l.nombre} ({l.unidades}u · −{l.pct}%)</span>
                        <span className="font-semibold flex-shrink-0">−{fmtCLP(l.ahorro)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-[#4B4F54]">
                  <span>Envío</span>
                  {envioBluex
                    ? (envio === 0 ? <span className="text-[#0F8B6C] font-bold">GRATIS</span> : <span className="font-semibold">{fmtCLP(envio)}</span>)
                    : <span className="text-[#A78B6F] text-xs">Elige arriba</span>}
                </div>
                <div className="flex justify-between pt-2 border-t border-[#EBE3D6]">
                  <span className="font-bold text-[#2A2420]">Total</span>
                  <span className="font-poppins font-bold text-xl text-[#0F8B6C]">{fmtCLP(total)}</span>
                </div>
                <p className="text-[10px] text-[#A78B6F]">IVA incluido</p>
              </div>

              {errorPago && (
                <div className="mt-3 bg-[#D96B4D]/10 border border-[#D96B4D]/30 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#D96B4D] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#D96B4D] font-semibold">{errorPago}</p>
                </div>
              )}

              {/* CTA desktop */}
              <button
                onClick={crearPedido}
                disabled={creando}
                className="hidden lg:flex w-full mt-4 h-13 py-3.5 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] disabled:opacity-60 text-white font-bold items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all hover:scale-[1.01]"
              >
                {creando ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
                ) : medioPago === 'Transferencia' ? (
                  <><Gift className="w-4 h-4" /> Confirmar · {fmtCLP(total)}</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pagar {fmtCLP(total)}</>
                )}
              </button>

              <div className="hidden lg:flex items-center justify-center gap-1.5 text-[11px] text-[#A78B6F] pt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B6C]" /> Pago seguro · {medioPago === 'Transferencia' ? 'Transferencia' : 'Mercado Pago'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA sticky mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#EBE3D6] px-4 py-3 pb-safe">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#A78B6F] font-semibold">Total {envioBluex ? '' : '(sin envío)'}</span>
          <span className="font-poppins font-bold text-lg text-[#0F8B6C]">{fmtCLP(total)}</span>
        </div>
        <button
          onClick={crearPedido}
          disabled={creando}
          className="w-full h-13 py-3.5 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          {creando ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
          ) : (
            <><Lock className="w-4 h-4" /> {medioPago === 'Transferencia' ? 'Confirmar' : 'Pagar'} {fmtCLP(total)}</>
          )}
        </button>
      </div>

      <footer className="border-t border-[#EBE3D6] py-8 text-center text-xs text-[#A78B6F] hidden lg:flex items-center justify-center gap-1.5">
        <Recycle className="w-3.5 h-3.5 text-[#0F8B6C]" /> PEYU Chile · Pago seguro · Garantía 10 años
      </footer>
    </div>
  );
}