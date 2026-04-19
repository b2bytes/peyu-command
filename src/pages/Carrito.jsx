import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowLeft, ShoppingBag, CheckCircle2, Truck, Shield, ChevronRight, Lock, Package, Recycle } from 'lucide-react';

export default function Carrito() {
  const navigate = useNavigate();
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [cliente, setCliente] = useState({ nombre: '', email: '', telefono: '', ciudad: '', direccion: '' });
  const [creando, setCreando] = useState(false);
  const [pedidoOk, setPedidoOk] = useState(null);
  const [step, setStep] = useState(1); // 1=Carrito, 2=Datos

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

  const subtotal = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const envio = subtotal >= 40000 ? 0 : 5990;
  const total = subtotal + envio;

  const validarDatos = () => {
    if (!cliente.nombre || !cliente.email || !cliente.telefono) {
      alert('Por favor completa nombre, email y teléfono');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(cliente.email)) {
      alert('Email inválido');
      return false;
    }
    return true;
  };

  const crearPedido = async () => {
    if (!validarDatos()) return;
    setCreando(true);
    const numero = `WEB-${Date.now()}`;
    const items = carrito.map(i => `${i.nombre} x${i.cantidad}${i.personalizacion ? ` [${i.personalizacion}]` : ''}`).join(' | ');
    await base44.entities.PedidoWeb.create({
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
      total,
      medio_pago: 'WebPay',
      estado: 'Nuevo',
      ciudad: cliente.ciudad,
      direccion_envio: cliente.direccion,
      requiere_personalizacion: carrito.some(i => i.personalizacion),
      texto_personalizacion: carrito.filter(i => i.personalizacion).map(i => i.personalizacion).join(', '),
      courier: 'Pendiente',
      notas: `Carrito: ${carrito.length} items`,
    });
    localStorage.removeItem('carrito');
    setPedidoOk({ numero, total, email: cliente.email });
    setCreando(false);
  };

  // ── ÉXITO ──────────────────────────────────────────────────────────
  if (pedidoOk) {
    return (
      <div className="min-h-full bg-[#FAFAF8] font-inter flex items-center justify-center p-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-teal-500/20">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-poppins font-bold text-gray-900">¡Pedido confirmado!</h2>
            <p className="text-gray-500 mt-2">Pedido <strong className="font-mono text-gray-900">{pedidoOk.numero}</strong></p>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl p-6 text-left space-y-3 shadow-sm">
            {[
              { label: 'Total pagado', value: `$${pedidoOk.total.toLocaleString('es-CL')}`, accent: true },
              { label: 'Confirmación enviada a', value: pedidoOk.email },
              { label: 'Entrega estimada', value: '3–7 días hábiles' },
            ].map((r, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-400">{r.label}</span>
                <span className={`font-semibold ${r.accent ? 'text-teal-600 text-lg' : 'text-gray-900'}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-sm text-teal-700">
            📧 Revisa tu correo. ¿Dudas? WhatsApp <strong>+56 9 3504 0242</strong>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={() => navigate('/shop')}>Seguir comprando</Button>
            <Link to="/seguimiento" className="flex-1">
              <Button className="w-full rounded-2xl bg-gray-900 hover:bg-gray-800 h-12">Seguir pedido</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-full bg-[#FAFAF8] font-inter">

      {/* Navbar */}
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

          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>1</div>
              <span className="font-semibold">Carrito</span>
            </div>
            <div className="w-6 h-px bg-gray-200" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>2</div>
              <span className="font-semibold">Datos</span>
            </div>
            <div className="w-6 h-px bg-gray-200" />
            <div className="flex items-center gap-1.5 text-gray-400">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold">3</div>
              <span className="font-semibold">Pago</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-5 lg:gap-6">

          {/* ── LEFT: ITEMS / DATOS ───────── */}
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
                        {item.color && (
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

                {/* Trust */}
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
              <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="font-poppins font-bold text-gray-900 text-lg">Datos de envío</h3>
                  <p className="text-xs text-gray-400 mt-1">Completa tus datos para recibir tu pedido</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Nombre completo', key: 'nombre', placeholder: 'Tu nombre', req: true },
                    { label: 'Email', key: 'email', placeholder: 'tu@email.com', type: 'email', req: true },
                    { label: 'Teléfono / WhatsApp', key: 'telefono', placeholder: '+56 9 xxxx xxxx', req: true },
                    { label: 'Ciudad', key: 'ciudad', placeholder: 'Santiago' },
                    { label: 'Dirección de despacho', key: 'direccion', placeholder: 'Calle, número, depto' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                        {f.label} {f.req && <span className="text-red-500">*</span>}
                      </label>
                      <Input
                        type={f.type || 'text'}
                        value={cliente[f.key]}
                        onChange={e => setCliente({ ...cliente, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-gray-400"
                      />
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 font-medium inline-flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver al carrito
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ─────────────── */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Resumen */}
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
                {subtotal < 40000 && (
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
            </div>

            {/* CTA */}
            {step === 1 ? (
              <Button
                onClick={() => setStep(2)}
                size="lg"
                className="w-full font-semibold gap-2 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white shadow-lg h-13 py-4">
                Continuar <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={crearPedido}
                disabled={creando}
                size="lg"
                className="w-full font-semibold gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg h-13 py-4">
                {creando ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando...</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pagar ${total.toLocaleString('es-CL')}</>
                )}
              </Button>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <Lock className="w-3 h-3" />
              Pago 100% seguro · WebPay
            </div>

            {/* Footer links */}
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