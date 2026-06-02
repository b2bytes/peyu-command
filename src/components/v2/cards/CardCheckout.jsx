import { useState } from 'react';
import { ShoppingCart, Lock, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCLP } from '@/lib/v2-catalog';
import { readCart, computeCartTotals, clearCart } from '@/lib/v2-cart';

// Card de checkout final del río /v2. Crea el PedidoWeb (misma estructura que
// la tienda viva), invoca assessOrderRisk + mpCreatePreference EXISTENTES y
// abre el init_point de Mercado Pago. NO reimplementa pagos: solo los conecta.
export default function CardCheckout({ data }) {
  const cliente = data?.cliente || {};
  const envio = data?.envioBluex || null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const items = readCart();
  const t = computeCartTotals(items);
  const costoEnvio = envio ? envio.costo : 0;
  const total = Math.max(0, t.totalSinEnvio + costoEnvio);

  const handlePay = async () => {
    if (loading) return;
    setError(null);
    if (!items.length) return setError('Tu carro está vacío.');
    setLoading(true);

    // Reusar pedido pendiente si el cliente reintenta (idempotencia por sesión).
    let numero = sessionStorage.getItem('peyu_v2_order_numero');
    let pedidoId = sessionStorage.getItem('peyu_v2_order_id');
    if (!numero) numero = `WEB-${Date.now()}`;

    const descripcion = items.map((i) => {
      const partes = [`${i.nombre} x${i.cantidad}`];
      if (i.color) partes.push(`Color: ${i.color}`);
      if (i.sku) partes.push(`SKU ${i.sku}`);
      partes.push(`$${(i.precio || 0).toLocaleString('es-CL')}/u`);
      return partes.join(' · ');
    }).join('\n');

    const direccionCompleta = [
      cliente.direccion?.trim(),
      cliente.referencia?.trim() ? `Depto/Ref: ${cliente.referencia.trim()}` : null,
      cliente.ciudad, cliente.region,
    ].filter(Boolean).join(' · ');

    const datosPedido = {
      numero_pedido: numero,
      fecha: new Date().toISOString().split('T')[0],
      canal: 'Web Propia',
      cliente_nombre: (cliente.nombre || '').trim(),
      cliente_email: (cliente.email || '').trim().toLowerCase(),
      cliente_telefono: cliente.telefono || '',
      tipo_cliente: 'B2C Individual',
      sku: items[0]?.sku || items[0]?.productoId || null,
      descripcion_items: descripcion,
      cantidad: t.unidades,
      subtotal: t.subtotal,
      costo_envio: costoEnvio,
      descuento: t.descuentoVolumen,
      total,
      medio_pago: 'MercadoPago',
      estado: 'Nuevo',
      payment_status: 'pending_mp',
      ciudad: cliente.ciudad || '',
      direccion_envio: direccionCompleta,
      requiere_personalizacion: false,
      courier: envio ? `BlueExpress ${envio.servicio}` : 'Pendiente',
      notas: `Chat v2 · ${items.length} items${t.descuentoVolumen > 0 ? ` | Dscto volumen ${t.pctVolumen}% −$${t.descuentoVolumen.toLocaleString('es-CL')}` : ''}${envio ? ` | Bluex ${envio.servicio} (${envio.peso_kg}kg) → $${(envio.costo_real || 0).toLocaleString('es-CL')}` : ''}`,
    };

    try {
      let pedido;
      if (pedidoId) {
        await base44.entities.PedidoWeb.update(pedidoId, datosPedido);
        pedido = { id: pedidoId, ...datosPedido };
      } else {
        pedido = await base44.entities.PedidoWeb.create(datosPedido);
        pedidoId = pedido.id;
        try {
          sessionStorage.setItem('peyu_v2_order_numero', numero);
          sessionStorage.setItem('peyu_v2_order_id', pedido.id);
        } catch { /* noop */ }
      }

      // Evaluar riesgo de la orden (misma función que la tienda viva). Best-effort.
      try { await base44.functions.invoke('assessOrderRisk', { pedido_id: pedido.id }); } catch { /* noop */ }

      // Crear preferencia Checkout Pro con la función existente.
      const mp = await base44.functions.invoke('mpCreatePreference', { pedido_id: pedido.id });
      const initUrl = mp?.data?.init_point || mp?.data?.sandbox_init_point;
      if (!initUrl) throw new Error('MP sin init_point');

      // Marca pedido v2 pendiente para detectar el retorno desde MP.
      try { sessionStorage.setItem('peyu_v2_pending_pay', numero); } catch { /* noop */ }
      clearCart();
      window.location.href = initUrl;
    } catch (e) {
      console.error('Checkout v2 error:', e);
      setError('No pudimos iniciar el pago. Intenta de nuevo o escríbenos por WhatsApp.');
      setLoading(false);
    }
  };

  return (
    <div className="v2-card v2-fade-up p-4 w-full max-w-[340px]">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart className="w-4 h-4" style={{ color: 'var(--v2-gold)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>Resumen final</p>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {items.slice(0, 4).map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            {it.imagen && <img src={it.imagen} alt="" className="w-8 h-8 rounded object-cover" />}
            <span className="text-[11px] flex-1 line-clamp-1" style={{ color: 'var(--v2-fg-soft)' }}>{it.nombre} ×{it.cantidad}</span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--v2-gold)' }}>{formatCLP((it.precio || 0) * (it.cantidad || 1))}</span>
          </div>
        ))}
        {items.length > 4 && <p className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>+{items.length - 4} más</p>}
      </div>

      <div className="space-y-1 pt-2.5" style={{ borderTop: '1px solid var(--v2-border)' }}>
        <div className="flex justify-between text-[11px]" style={{ color: 'var(--v2-fg-muted)' }}>
          <span>Subtotal</span><span>{formatCLP(t.subtotal)}</span>
        </div>
        {t.descuentoVolumen > 0 && (
          <div className="flex justify-between text-[11px]" style={{ color: 'var(--v2-teal)' }}>
            <span>Descuento volumen ({t.pctVolumen}%)</span><span>−{formatCLP(t.descuentoVolumen)}</span>
          </div>
        )}
        <div className="flex justify-between text-[11px]" style={{ color: 'var(--v2-fg-muted)' }}>
          <span>Envío {envio ? `(${envio.servicio})` : ''}</span>
          <span>{costoEnvio === 0 ? 'GRATIS' : formatCLP(costoEnvio)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-1.5 mt-1.5" style={{ borderTop: '1px solid var(--v2-border)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--v2-fg)' }}>Total</span>
          <span className="text-lg font-bold" style={{ color: 'var(--v2-gold)' }}>{formatCLP(total)}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-1.5 mt-2.5 text-[11px]" style={{ color: '#e0584f' }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      <button onClick={handlePay} disabled={loading} className="v2-btn-primary w-full h-11 flex items-center justify-center gap-2 text-[13px] mt-3.5 disabled:opacity-60">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Conectando…</> : <><Lock className="w-4 h-4" /> Pagar con Mercado Pago</>}
      </button>
      <p className="text-[10px] text-center mt-2" style={{ color: 'var(--v2-fg-subtle)' }}>Pago 100% seguro · Mercado Pago</p>
    </div>
  );
}