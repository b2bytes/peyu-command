import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowLeft, ShoppingBag, CheckCircle2, Truck, Shield, ChevronRight, Lock, Package } from 'lucide-react';

export default function Carrito() {
  const navigate = useNavigate();
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [cliente, setCliente] = useState({ nombre: '', email: '', telefono: '', ciudad: '', direccion: '' });
  const [creando, setCreando] = useState(false);
  const [pedidoOk, setPedidoOk] = useState(null);

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

  const crearPedido = async () => {
    if (!cliente.nombre || !cliente.email || !cliente.telefono) {
      alert('Por favor completa nombre, email y teléfono');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(cliente.email)) {
      alert('Email inválido');
      return;
    }
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
      <div className="min-h-screen bg-[#FAFAF8] font-inter flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] flex items-center justify-center mx-auto shadow-lg shadow-[#0F8B6C]/20">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-poppins font-bold text-gray-900">¡Pedido recibido!</h2>
            <p className="text-gray-500 mt-2">Tu pedido <strong className="font-mono text-gray-700">{pedidoOk.numero}</strong> fue procesado exitosamente.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-left space-y-3 shadow-sm">
            {[
              { label: 'Total pagado', value: `$${pedidoOk.total.toLocaleString('es-CL')}`, bold: true, green: true },
              { label: 'Confirmación enviada a', value: pedidoOk.email },
              { label: 'Tiempo de entrega estimado', value: '3–7 días hábiles' },
            ].map((r, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-400">{r.label}</span>
                <span className={`font-semibold ${r.green ? 'text-[#0F8B6C]' : 'text-gray-900'}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm text-green-700">
            📧 Revisa tu correo para la confirmación. ¿Preguntas? WhatsApp: <strong>+56 9 3504 0242</strong>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => navigate('/shop')}>Seguir comprando</Button>
            <Link to="/seguimiento" className="flex-1">
              <Button className="w-full rounded-2xl bg-gray-900 hover:bg-gray-800">Ver mi pedido</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── VACÍO ──────────────────────────────────────────────────────────
  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-inter flex items-center justify-center p-4">
        <div className="text-center space-y-5">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <div>
            <p className="text-xl font-poppins font-bold text-gray-900">Tu carrito está vacío</p>
            <p className="text-sm text-gray-400 mt-1">¿Probamos con nuestros bestsellers?</p>
          </div>
          <Button onClick={() => navigate('/shop')} className="gap-2 rounded-2xl bg-gray-900 hover:bg-gray-800 px-8">
            Ver productos →
          </Button>
        </div>
      </div>
    );
  }

  // ── PRINCIPAL ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-4">
          <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
          </button>
          <div>
            <h1 className="font-poppins font-bold text-gray-900">Tu carrito</h1>
            <p className="text-xs text-gray-400">{carrito.length} item{carrito.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── ITEMS ──────────────────────── */}
          <div className="lg:col-span-2 space-y-3">
            {carrito.map(item => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-3xl p-5 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-gradient-to-br from-[#0F8B6C]/15 via-[#A7D9C9]/25 to-[#E7D8C6]/30 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{item.nombre}</h3>
                  {item.personalizacion && (
                    <p className="text-xs text-purple-600 mt-0.5 font-medium">✨ {item.personalizacion}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    {/* Qty */}
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => actualizar(item.id, item.cantidad - 1)} className="w-9 h-9 hover:bg-gray-50 font-bold text-gray-600 transition-colors">−</button>
                      <span className="px-3 text-sm font-bold text-gray-900">{item.cantidad}</span>
                      <button onClick={() => actualizar(item.id, item.cantidad + 1)} className="w-9 h-9 hover:bg-gray-50 font-bold text-gray-600 transition-colors">+</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-poppins font-bold text-gray-900">${(item.precio * item.cantidad).toLocaleString('es-CL')}</span>
                      <button onClick={() => eliminar(item.id)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors group">
                        <Trash2 className="w-3.5 h-3.5 text-red-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Trust */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Shield, text: 'Garantía 10 años', sub: 'En plástico reciclado', color: '#0F8B6C' },
                { icon: Truck, text: 'Envío gratis', sub: 'Sobre $40.000', color: '#4B4F54' },
                { icon: Package, text: 'Hecho en Chile', sub: 'Fábrica Santiago', color: '#D96B4D' },
              ].map((b, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 text-center shadow-sm">
                  <b.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: b.color }} />
                  <p className="text-xs font-semibold text-gray-700">{b.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── SIDEBAR ────────────────────── */}
          <div className="space-y-4">
            {/* Resumen */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="font-poppins font-bold text-gray-900">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({carrito.reduce((s, i) => s + i.cantidad, 0)} items)</span>
                  <span>${subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  {envio === 0
                    ? <span className="text-[#0F8B6C] font-bold">GRATIS</span>
                    : <span>${envio.toLocaleString('es-CL')}</span>
                  }
                </div>
                {subtotal < 40000 && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-2.5">
                    🎯 Agrega ${(40000 - subtotal).toLocaleString('es-CL')} más para envío gratis
                  </p>
                )}
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-poppins font-bold text-2xl text-gray-900">${total.toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
              <h3 className="font-poppins font-bold text-gray-900">Tus datos</h3>
              <div className="space-y-3">
                {[
                  { label: 'Nombre completo *', key: 'nombre', placeholder: 'Tu nombre' },
                  { label: 'Email *', key: 'email', placeholder: 'tu@email.com', type: 'email' },
                  { label: 'Teléfono / WhatsApp *', key: 'telefono', placeholder: '+56 9 xxxx xxxx' },
                  { label: 'Ciudad', key: 'ciudad', placeholder: 'Santiago' },
                  { label: 'Dirección de despacho', key: 'direccion', placeholder: 'Calle, número, depto' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">{f.label}</label>
                    <Input
                      type={f.type || 'text'}
                      value={cliente[f.key]}
                      onChange={e => setCliente({ ...cliente, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="h-10 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Checkout */}
            <Button
              onClick={crearPedido}
              disabled={creando}
              size="lg"
              className="w-full font-semibold gap-2 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white shadow-lg h-13"
            >
              {creando ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando...</>
              ) : (
                <>Finalizar compra · ${total.toLocaleString('es-CL')} <ChevronRight className="w-4 h-4" /></>
              )}
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
              <Lock className="w-3 h-3" />
              Pago seguro · WebPay · Crédito y débito
            </div>
            <div className="flex justify-center gap-5 text-xs text-gray-400 pt-1">
              <Link to="/seguimiento" className="hover:text-gray-700">🔍 Seguimiento</Link>
              <Link to="/soporte" className="hover:text-gray-700">❓ Ayuda</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}