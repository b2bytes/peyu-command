import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Lock, Trash2, ShoppingBag, Loader2, User, Mail, Phone } from 'lucide-react';
import { calcularCargoPersonalizacionCarrito, calcularCargoPersonalizacion, getTipoPersonalizacion, MOQ_PERSONALIZACION_GRATIS } from '@/lib/personalizacion-config';

/**
 * Tarjeta de checkout express DENTRO del chat — el cliente puede completar
 * la compra sin salir del flujo conversacional.
 *
 * Lee el carrito de localStorage ('carrito'), pide los 3 datos mínimos
 * (nombre, email, teléfono) y crea directamente un PedidoWeb.
 *
 * Variants: 'dark' (landing) y 'light' (widget flotante).
 */
export default function ChatCheckoutCard({ variant = 'dark' }) {
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState({ nombre: '', email: '', telefono: '' });
  const [step, setStep] = useState('cart'); // cart | form | done
  const [creando, setCreando] = useState(false);
  const [pedido, setPedido] = useState(null);

  // Lee carrito + escucha cambios globales
  useEffect(() => {
    const read = () => setCarrito(JSON.parse(localStorage.getItem('carrito') || '[]'));
    read();
    const handler = () => read();
    window.addEventListener('peyu:cart-added', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('peyu:cart-added', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const subtotal = carrito.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
  const envio = subtotal >= 40000 ? 0 : 5990;
  // Personalización láser: se cobra bajo 10u del mismo ítem, gratis ≥10u.
  const cargoPersonalizacion = calcularCargoPersonalizacionCarrito(carrito);
  const total = subtotal + envio + cargoPersonalizacion;

  const eliminar = (id) => {
    const nuevo = carrito.filter(i => i.id !== id);
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
  };

  const handleCheckout = async () => {
    if (!cliente.nombre || !cliente.email || !cliente.telefono) return;
    if (!/\S+@\S+\.\S+/.test(cliente.email)) return;
    setCreando(true);
    try {
      const numero = `CHAT-${Date.now()}`;
      const items = carrito.map(i => `${i.nombre} x${i.cantidad}${i.personalizacion ? ` [${i.personalizacion}]` : ''}`).join(' | ');
      // items_detalle estructurado: fuente de verdad de color/personalización/fee
      // para que el pedido quede COMPLETO igual que el checkout del carrito.
      const itemsDetalle = carrito.map(i => {
        const moq = i.moq_personalizacion || i.personalizacion_gratis_desde || MOQ_PERSONALIZACION_GRATIS;
        return {
          sku: i.sku || '',
          nombre: i.nombre || '',
          color: i.color || '',
          personalizacion: i.personalizacion || '',
          tipo_personalizacion: i.personalizacion ? getTipoPersonalizacion(i) : '',
          fee_personalizacion: i.personalizacion ? calcularCargoPersonalizacion(i, moq) : 0,
          logo_url: i.logoUrl || i.logo_url || '',
          mockup_url: i.mockupUrl || i.mockup_url || '',
          posicion_grabado: i.posicion_grabado || '',
          precio_unitario: i.precio || 0,
          cantidad: i.cantidad || 1,
        };
      });
      const pedido = await base44.entities.PedidoWeb.create({
        numero_pedido: numero,
        fecha: new Date().toISOString().split('T')[0],
        canal: 'Web Propia',
        cliente_nombre: cliente.nombre,
        cliente_email: cliente.email,
        cliente_telefono: cliente.telefono,
        tipo_cliente: 'B2C Individual',
        descripcion_items: items,
        items_detalle: itemsDetalle,
        cantidad: carrito.reduce((s, i) => s + i.cantidad, 0),
        subtotal,
        costo_envio: envio,
        fee_personalizacion: cargoPersonalizacion,
        total,
        medio_pago: 'Transferencia',
        estado: 'Nuevo',
        requiere_personalizacion: carrito.some(i => i.personalizacion),
        texto_personalizacion: carrito.filter(i => i.personalizacion).map(i => i.personalizacion).join(', '),
        courier: 'Pendiente',
        notas: 'Checkout desde chat Peyu',
      });
      // 📧 Correo de confirmación inmediato (con datos bancarios de transferencia).
      if (pedido?.id) {
        base44.functions.invoke('enviarConfirmacionPedido', { pedido_id: pedido.id }).catch(() => {});
      }
      localStorage.removeItem('carrito');
      window.dispatchEvent(new CustomEvent('peyu:cart-cleared'));
      setPedido({ numero, total });
      setStep('done');
    } catch (e) {
      console.error(e);
      alert('No pudimos procesar el pedido. Intenta nuevamente.');
    } finally {
      setCreando(false);
    }
  };

  const dark = variant === 'dark';
  const base = dark ? 'bg-white/5 border-white/20 text-white' : 'bg-white border-gray-200 text-gray-900';
  const subtle = dark ? 'text-white/60' : 'text-gray-500';
  const inputCls = dark
    ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/40'
    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400';
  const primary = dark
    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600'
    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700';

  // CARRITO VACÍO
  if (carrito.length === 0 && step !== 'done') {
    return (
      <div className={`my-2 ${base} border rounded-xl p-3 text-center space-y-1.5`}>
        <ShoppingBag className={`w-5 h-5 mx-auto ${subtle}`} />
        <p className="text-xs font-semibold">Tu carrito está vacío</p>
        <p className={`text-[10px] ${subtle}`}>Pídeme recomendaciones y agrega productos aquí mismo ✨</p>
      </div>
    );
  }

  // ÉXITO
  if (step === 'done' && pedido) {
    return (
      <div className={`my-2 ${base} border rounded-xl p-3 text-center space-y-2`}>
        <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${dark ? 'bg-green-500/20' : 'bg-green-100'}`}>
          <CheckCircle2 className={`w-5 h-5 ${dark ? 'text-green-300' : 'text-green-600'}`} />
        </div>
        <p className="font-bold text-sm">¡Pedido confirmado! 🎉</p>
        <p className={`text-[11px] ${subtle}`}>N° <span className="font-mono font-bold">{pedido.numero}</span></p>
        <p className="font-poppins font-bold text-lg">${pedido.total.toLocaleString('es-CL')}</p>
        <p className={`text-[10px] ${subtle}`}>Te enviamos un correo con los datos para transferir y coordinar tu despacho. 📧</p>
      </div>
    );
  }

  // PASO 1: RESUMEN DE CARRITO
  if (step === 'cart') {
    return (
      <div className={`my-2 ${base} border rounded-xl p-3 space-y-2`}>
        <div className="flex items-center gap-1.5 pb-1.5 border-b border-current/10">
          <ShoppingBag className="w-3.5 h-3.5" />
          <p className="text-xs font-bold">Tu carrito ({carrito.length})</p>
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {carrito.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-xs">
              {item.imagen && (
                <img src={item.imagen} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold line-clamp-1">{item.nombre}</p>
                <p className={`text-[10px] ${subtle}`}>
                  {item.cantidad}× ${item.precio.toLocaleString('es-CL')}
                </p>
              </div>
              <button onClick={() => eliminar(item.id)} className={`p-1 rounded hover:${dark ? 'bg-white/10' : 'bg-red-50'} transition`}>
                <Trash2 className="w-3 h-3 opacity-60" />
              </button>
            </div>
          ))}
        </div>

        <div className={`pt-1.5 border-t border-current/10 space-y-0.5 text-[11px] ${subtle}`}>
          <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toLocaleString('es-CL')}</span></div>
          <div className="flex justify-between">
            <span>Envío</span>
            <span>{envio === 0 ? <span className={dark ? 'text-teal-300 font-bold' : 'text-teal-600 font-bold'}>GRATIS</span> : `$${envio.toLocaleString('es-CL')}`}</span>
          </div>
          <div className={`flex justify-between pt-1 text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
            <span>Total</span><span>${total.toLocaleString('es-CL')}</span>
          </div>
        </div>

        <button onClick={() => setStep('form')} className={`w-full ${primary} text-white text-xs font-bold rounded-lg py-2 shadow-md flex items-center justify-center gap-1.5`}>
          <Lock className="w-3 h-3" /> Comprar aquí mismo
        </button>
      </div>
    );
  }

  // PASO 2: FORMULARIO EXPRESS
  return (
    <div className={`my-2 ${base} border rounded-xl p-3 space-y-2`}>
      <div className="flex items-center justify-between pb-1.5 border-b border-current/10">
        <p className="text-xs font-bold flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Datos de envío</p>
        <button onClick={() => setStep('cart')} className={`text-[10px] underline ${subtle}`}>← Volver</button>
      </div>

      <div className="space-y-1.5">
        {[
          { key: 'nombre',   icon: User,  ph: 'Nombre completo', type: 'text' },
          { key: 'email',    icon: Mail,  ph: 'tu@email.com',    type: 'email' },
          { key: 'telefono', icon: Phone, ph: '+56 9 xxxx xxxx', type: 'tel' },
        ].map(f => (
          <div key={f.key} className="relative">
            <f.icon className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${subtle}`} />
            <input
              type={f.type}
              value={cliente[f.key]}
              onChange={e => setCliente({ ...cliente, [f.key]: e.target.value })}
              placeholder={f.ph}
              className={`w-full h-8 text-xs rounded-lg pl-7 pr-2 ${inputCls} focus:outline-none focus:ring-1 focus:ring-teal-400/50`}
            />
          </div>
        ))}
      </div>

      <p className={`text-[9px] text-center ${subtle}`}>Te enviaremos por email los datos para transferir y confirmar tu pedido</p>

      <button
        onClick={handleCheckout}
        disabled={creando || !cliente.nombre || !cliente.email || !cliente.telefono}
        className={`w-full ${primary} text-white text-xs font-bold rounded-lg py-2 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {creando
          ? <><Loader2 className="w-3 h-3 animate-spin" /> Procesando...</>
          : <><Lock className="w-3 h-3" /> Confirmar ${total.toLocaleString('es-CL')}</>
        }
      </button>
    </div>
  );
}