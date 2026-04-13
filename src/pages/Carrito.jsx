import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowLeft, ShoppingBag, CheckCircle2, Truck, Shield, ChevronRight } from 'lucide-react';

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
    try {
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
        sku: carrito[0]?.sku || '',
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
    } catch (e) {
      alert('Error al crear el pedido. Intenta de nuevo.');
    } finally {
      setCreando(false);
    }
  };

  // ── ESTADO ÉXITO ──────────────────────────────────────────────────
  if (pedidoOk) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-poppins font-bold text-foreground">¡Pedido recibido!</h2>
            <p className="text-muted-foreground mt-2">Tu pedido <strong>{pedidoOk.numero}</strong> fue procesado exitosamente.</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total pagado:</span><span className="font-bold text-green-600">${pedidoOk.total.toLocaleString('es-CL')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Confirmación enviada a:</span><span className="font-medium">{pedidoOk.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tiempo de entrega:</span><span>3–7 días hábiles</span></div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            📧 Revisa tu correo para ver la confirmación. ¿Preguntas? WhatsApp: <strong>+56 9 3504 0242</strong>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/shop')}>
              Seguir comprando
            </Button>
            <Link to="/b2b/catalogo" className="flex-1">
              <Button className="w-full" style={{ backgroundColor: '#0F8B6C' }}>
                Catálogo B2B
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── CARRITO VACÍO ─────────────────────────────────────────────────
  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" /> Volver a tienda
          </button>
          <div className="text-center py-16 space-y-4">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30" />
            <p className="text-xl font-semibold text-muted-foreground">Tu carrito está vacío</p>
            <p className="text-sm text-muted-foreground">¿Probamos con nuestros bestsellers?</p>
            <Button onClick={() => navigate('/shop')} className="mt-2" style={{ backgroundColor: '#0F8B6C' }}>
              Ver productos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── CARRITO PRINCIPAL ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Seguir comprando
          </button>
          <span className="text-muted-foreground">|</span>
          <h1 className="font-poppins font-bold text-foreground">Tu carrito · {carrito.length} item{carrito.length !== 1 ? 's' : ''}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {carrito.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-border p-4 flex gap-4 shadow-sm">
                {/* Imagen placeholder */}
                <div className="w-20 h-20 bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">
                  📦
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{item.nombre}</h3>
                  {item.personalizacion && (
                    <p className="text-xs text-blue-600 mt-0.5">✨ {item.personalizacion}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.material?.includes('100%') ? '♻️ Plástico reciclado' : '🌾 Compostable'}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    {/* Qty */}
                    <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
                      <button onClick={() => actualizar(item.id, item.cantidad - 1)} className="px-3 py-1.5 hover:bg-muted text-sm font-bold">−</button>
                      <span className="px-3 py-1.5 text-sm font-semibold min-w-8 text-center">{item.cantidad}</span>
                      <button onClick={() => actualizar(item.id, item.cantidad + 1)} className="px-3 py-1.5 hover:bg-muted text-sm font-bold">+</button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-poppins font-bold" style={{ color: '#0F8B6C' }}>
                        ${(item.precio * item.cantidad).toLocaleString('es-CL')}
                      </span>
                      <button onClick={() => eliminar(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Shield, text: 'Garantía 10 años en plástico reciclado' },
                { icon: Truck, text: 'Envío gratis sobre $40.000' },
                { icon: CheckCircle2, text: 'Fabricado en Chile' },
              ].map((b, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-border text-center shadow-sm">
                  <b.icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground leading-tight">{b.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: Resumen + Datos */}
          <div className="space-y-4">
            {/* Resumen de precios */}
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-3">
              <h3 className="font-poppins font-bold">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  {envio === 0
                    ? <span className="text-green-600 font-semibold">GRATIS</span>
                    : <span>${envio.toLocaleString('es-CL')}</span>
                  }
                </div>
                {subtotal < 40000 && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                    Agrega ${(40000 - subtotal).toLocaleString('es-CL')} más para envío gratis
                  </p>
                )}
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="font-poppins font-bold text-xl" style={{ color: '#0F8B6C' }}>
                  ${total.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
              <h3 className="font-poppins font-bold">Tus datos</h3>
              <div className="space-y-3">
                {[
                  { label: 'Nombre completo *', key: 'nombre', placeholder: 'Tu nombre' },
                  { label: 'Email *', key: 'email', placeholder: 'tu@email.com', type: 'email' },
                  { label: 'Teléfono / WhatsApp *', key: 'telefono', placeholder: '+56 9 xxxx xxxx' },
                  { label: 'Ciudad', key: 'ciudad', placeholder: 'Santiago' },
                  { label: 'Dirección de despacho', key: 'direccion', placeholder: 'Calle, número, depto' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">{f.label}</label>
                    <Input
                      type={f.type || 'text'}
                      value={cliente[f.key]}
                      onChange={e => setCliente({ ...cliente, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Botón checkout */}
            <Button
              onClick={crearPedido}
              disabled={creando}
              size="lg"
              className="w-full font-semibold gap-2"
              style={{ backgroundColor: '#0F8B6C' }}
            >
              {creando ? 'Procesando...' : (
                <>Finalizar compra <ChevronRight className="w-4 h-4" /></>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              🔒 Pago seguro · WebPay · Tarjetas de crédito y débito
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}