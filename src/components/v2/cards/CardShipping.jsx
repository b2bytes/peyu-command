import { useState, useMemo } from 'react';
import { Truck, MapPin, ArrowRight, User, Mail, Phone } from 'lucide-react';
import { REGIONES_CHILE, getComunasByRegion } from '@/lib/chile-regiones';
import { readCart } from '@/lib/v2-cart';
import ShippingSelector from '@/components/cart/ShippingSelector';

// Card conversacional de datos de envío. Cálido, NO formulario frío.
// Pre-llena con datos ya capturados en la conversación (prefill).
// Reusa ShippingSelector → cotización Bluex REAL por comuna y peso del carrito.
export default function CardShipping({ data, onContinue }) {
  const prefill = data?.prefill || {};
  const [cliente, setCliente] = useState({
    nombre: prefill.nombre || '',
    email: prefill.email || '',
    telefono: prefill.telefono || '',
    region: prefill.region || '',
    ciudad: prefill.ciudad || '',
    direccion: prefill.direccion || '',
    referencia: prefill.referencia || '',
  });
  const [envioBluex, setEnvioBluex] = useState(null);
  const [error, setError] = useState(null);

  const carrito = readCart();
  const subtotal = carrito.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
  const comunas = useMemo(() => getComunasByRegion(cliente.region), [cliente.region]);

  const set = (k, v) => { setCliente((c) => ({ ...c, [k]: v })); setError(null); };

  const handleContinue = () => {
    if (!cliente.nombre.trim()) return setError('¿Cómo te llamas?');
    if (!/\S+@\S+\.\S+/.test(cliente.email)) return setError('Necesito un email válido para enviarte la confirmación.');
    if (!cliente.telefono.trim()) return setError('¿Me dejas un teléfono de contacto?');
    if (!cliente.region) return setError('Elige tu región.');
    if (!cliente.ciudad) return setError('Elige tu comuna.');
    if (cliente.direccion.trim().length < 5) return setError('Necesito tu dirección completa.');
    if (!envioBluex) return setError('Selecciona una forma de envío.');
    onContinue?.({ cliente, envioBluex });
  };

  const inputCls = 'v2-input w-full h-10 px-3 text-[13px]';
  const labelCls = 'text-[10px] font-semibold uppercase tracking-wide mb-1 flex items-center gap-1';

  return (
    <div className="v2-card v2-fade-up p-4 w-full max-w-[420px]">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-4 h-4" style={{ color: 'var(--v2-gold)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>Datos de envío</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        <div>
          <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}><User className="w-3 h-3" /> Nombre</p>
          <input value={cliente.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Tu nombre" className={inputCls} style={{ color: 'var(--v2-fg)' }} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}><Mail className="w-3 h-3" /> Email</p>
            <input value={cliente.email} onChange={(e) => set('email', e.target.value)} placeholder="tu@email.cl" className={inputCls} style={{ color: 'var(--v2-fg)' }} />
          </div>
          <div>
            <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}><Phone className="w-3 h-3" /> Teléfono</p>
            <input value={cliente.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+56 9 ..." className={inputCls} style={{ color: 'var(--v2-fg)' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}><MapPin className="w-3 h-3" /> Región</p>
            <select value={cliente.region} onChange={(e) => { set('region', e.target.value); set('ciudad', ''); }} className={inputCls} style={{ color: 'var(--v2-fg)' }}>
              <option value="">Elige…</option>
              {REGIONES_CHILE.map((r) => <option key={r.codigo} value={r.nombre}>{r.nombre}</option>)}
            </select>
          </div>
          <div>
            <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}>Comuna</p>
            <select value={cliente.ciudad} onChange={(e) => set('ciudad', e.target.value)} disabled={!cliente.region} className={inputCls} style={{ color: 'var(--v2-fg)' }}>
              <option value="">Elige…</option>
              {comunas.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}>Dirección</p>
          <input value={cliente.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Calle y número" className={inputCls} style={{ color: 'var(--v2-fg)' }} />
        </div>
        <div>
          <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}>Depto / oficina / referencia (opcional)</p>
          <input value={cliente.referencia} onChange={(e) => set('referencia', e.target.value)} placeholder="Depto 42, timbre azul…" className={inputCls} style={{ color: 'var(--v2-fg)' }} />
        </div>
      </div>

      {/* Cotización Bluex REAL (reusa el mismo selector de la tienda viva) */}
      {cliente.ciudad && (
        <div className="mt-3.5 pt-3.5" style={{ borderTop: '1px solid var(--v2-border)' }}>
          <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--v2-fg-soft)' }}>Forma de envío · BlueExpress</p>
          <ShippingSelector
            variant="dark"
            items={carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, nombre: i.nombre }))}
            comuna={cliente.ciudad}
            region={cliente.region}
            subtotal={subtotal}
            umbralEnvioGratis={40000}
            onSelect={setEnvioBluex}
          />
        </div>
      )}

      {error && <p className="text-[11px] mt-2.5" style={{ color: '#e0584f' }}>{error}</p>}

      <button onClick={handleContinue} className="v2-btn-primary w-full h-11 flex items-center justify-center gap-2 text-[13px] mt-3.5">
        Continuar al pago <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}