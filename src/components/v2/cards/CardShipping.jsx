import { useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import { Truck, MapPin, ArrowRight, User, Mail, Phone } from 'lucide-react';
import { REGIONES_CHILE, getComunasByRegion } from '@/lib/chile-regiones';
import { readCart } from '@/lib/v2-cart';
import { readCheckout, writeCheckout } from '@/lib/v2-checkout-store';
import ShippingSelector from '@/components/cart/ShippingSelector';

// Card conversacional de datos de envío. Cálido, NO formulario frío.
// Estado controlado vía useReducer: CADA acción mergea sobre el estado previo,
// por lo que es IMPOSIBLE que un patch parcial (p.ej. {region, ciudad}) pise
// nombre/email/dirección. Persiste en localStorage (peyu_v2_checkout) y
// prefill desde la conversación. Reusa ShippingSelector → cotización Bluex real.

const EMPTY = { nombre: '', email: '', telefono: '', region: '', ciudad: '', direccion: '', referencia: '' };

// Reducer: SIEMPRE { ...state, ...patch }. Imposible perder campos.
function clienteReducer(state, patch) {
  return { ...state, ...patch };
}

export default function CardShipping({ data, onContinue }) {
  // prefill se lee SOLO en el primer montaje vía ref.
  const prefillRef = useRef(data?.prefill || {});

  // Init lazy: localStorage manda, prefill rellena vacíos.
  const [cliente, patchCliente] = useReducer(clienteReducer, undefined, () => {
    const saved = readCheckout();
    const pf = prefillRef.current;
    return {
      nombre: saved.nombre || pf.nombre || '',
      email: saved.email || pf.email || '',
      telefono: saved.telefono || pf.telefono || '',
      region: saved.region || pf.region || '',
      ciudad: saved.ciudad || pf.ciudad || '',
      direccion: saved.direccion || pf.direccion || '',
      referencia: saved.referencia || pf.referencia || '',
    };
  });
  const [envioBluex, patchEnvio] = useReducer((_, v) => v, null);
  const [error, patchError] = useReducer((_, v) => v, null);

  // Persistencia como EFECTO. Cambiar región/comuna NO borra los textos.
  useEffect(() => { writeCheckout(cliente); }, [cliente]);

  // Carro snapshot al montar. Memoizado para identidad estable.
  const carrito = useMemo(() => readCart(), []);
  const subtotal = useMemo(() => carrito.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0), [carrito]);
  const shippingItems = useMemo(
    () => carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, nombre: i.nombre })),
    [carrito],
  );
  const comunas = useMemo(() => getComunasByRegion(cliente.region), [cliente.region]);

  // set: mergea patch sobre el estado previo (vía reducer) y limpia error.
  const set = useCallback((patch) => { patchCliente(patch); patchError(null); }, []);

  // La cotización Bluex va a un estado SEPARADO. NUNCA toca `cliente`.
  const handleSelectEnvio = useCallback((sel) => patchEnvio(sel), []);

  const handleContinue = () => {
    if (!cliente.nombre.trim()) return patchError('¿Cómo te llamas?');
    if (!/\S+@\S+\.\S+/.test(cliente.email)) return patchError('Necesito un email válido para enviarte la confirmación.');
    if (!cliente.telefono.trim()) return patchError('¿Me dejas un teléfono de contacto?');
    if (!cliente.region) return patchError('Elige tu región.');
    if (!cliente.ciudad) return patchError('Elige tu comuna.');
    if (cliente.direccion.trim().length < 5) return patchError('Necesito tu dirección completa.');
    if (!envioBluex) return patchError('Selecciona una forma de envío.');
    writeCheckout(cliente);
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
          <input type="text" autoComplete="name" value={cliente.nombre ?? ''} onChange={(e) => set({ nombre: e.target.value })} placeholder="Tu nombre" className={inputCls} style={{ color: 'var(--v2-fg)' }} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}><Mail className="w-3 h-3" /> Email</p>
            <input type="email" autoComplete="email" value={cliente.email ?? ''} onChange={(e) => set({ email: e.target.value })} placeholder="tu@email.cl" className={inputCls} style={{ color: 'var(--v2-fg)' }} />
          </div>
          <div>
            <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}><Phone className="w-3 h-3" /> Teléfono</p>
            <input type="tel" autoComplete="tel" value={cliente.telefono ?? ''} onChange={(e) => set({ telefono: e.target.value })} placeholder="+56 9 ..." className={inputCls} style={{ color: 'var(--v2-fg)' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}><MapPin className="w-3 h-3" /> Región</p>
            <select value={cliente.region ?? ''} onChange={(e) => set({ region: e.target.value, ciudad: '' })} className={inputCls} style={{ color: 'var(--v2-fg)' }}>
              <option value="">Elige…</option>
              {REGIONES_CHILE.map((r) => <option key={r.codigo} value={r.nombre}>{r.nombre}</option>)}
            </select>
          </div>
          <div>
            <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}>Comuna</p>
            <select value={cliente.ciudad ?? ''} onChange={(e) => set({ ciudad: e.target.value })} disabled={!cliente.region} className={inputCls} style={{ color: 'var(--v2-fg)' }}>
              <option value="">Elige…</option>
              {comunas.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}>Dirección</p>
          <input type="text" autoComplete="street-address" value={cliente.direccion ?? ''} onChange={(e) => set({ direccion: e.target.value })} placeholder="Calle y número" className={inputCls} style={{ color: 'var(--v2-fg)' }} />
        </div>
        <div>
          <p className={labelCls} style={{ color: 'var(--v2-fg-subtle)' }}>Depto / oficina / referencia (opcional)</p>
          <input type="text" value={cliente.referencia ?? ''} onChange={(e) => set({ referencia: e.target.value })} placeholder="Depto 42, timbre azul…" className={inputCls} style={{ color: 'var(--v2-fg)' }} />
        </div>
      </div>

      {/* Cotización Bluex REAL. El wrapper NUNCA se desmonta (display:none). */}
      <div
        className="mt-3.5 pt-3.5"
        style={{
          borderTop: '1px solid var(--v2-border)',
          display: cliente.ciudad ? 'block' : 'none',
        }}
      >
        <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--v2-fg-soft)' }}>Forma de envío · BlueExpress</p>
        {cliente.ciudad && (
          <ShippingSelector
            variant="dark"
            items={shippingItems}
            comuna={cliente.ciudad}
            region={cliente.region}
            subtotal={subtotal}
            umbralEnvioGratis={40000}
            onSelect={handleSelectEnvio}
          />
        )}
      </div>

      {error && <p className="text-[11px] mt-2.5" style={{ color: '#e0584f' }}>{error}</p>}

      <button onClick={handleContinue} className="v2-btn-primary w-full h-11 flex items-center justify-center gap-2 text-[13px] mt-3.5">
        Continuar al pago <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}