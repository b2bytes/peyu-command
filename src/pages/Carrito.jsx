import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowLeft } from 'lucide-react';

export default function Carrito() {
  const navigate = useNavigate();
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [cliente, setCliente] = useState({ nombre: '', email: '', telefono: '', ciudad: '' });
  const [creando, setCreando] = useState(false);

  const eliminar = (id) => {
    const nuevo = carrito.filter(i => i.id !== id);
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
  };

  const actualizar = (id, cantidad) => {
    const nuevo = carrito.map(i => i.id === id ? { ...i, cantidad } : i);
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
  };

  const subtotal = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const envio = subtotal > 50000 ? 0 : 5000;
  const total = subtotal + envio;

  const crearPedido = async () => {
    if (!cliente.nombre || !cliente.email || !cliente.telefono) {
      alert('Completa tus datos');
      return;
    }

    setCreando(true);
    try {
      const items = carrito.map(i => `${i.nombre} (${i.cantidad}u)${i.personalizacion ? ` - ${i.personalizacion}` : ''}`).join(' | ');
      
      await base44.entities.PedidoWeb.create({
        numero_pedido: `WEB-${Date.now()}`,
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
        requiere_personalizacion: carrito.some(i => i.personalizacion),
      });

      localStorage.removeItem('carrito');
      alert('Pedido creado exitosamente');
      navigate('/shop');
    } finally {
      setCreando(false);
    }
  };

  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" /> Volver a tienda
          </button>
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Tu carrito está vacío</p>
            <Button onClick={() => navigate('/shop')} className="mt-4" style={{ backgroundColor: '#0F8B6C' }}>
              Continuar comprando
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/shop')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Continuar comprando
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Tabla de items */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold">Carrito ({carrito.length} items)</h2>

            <div className="space-y-3 border-t border-border pt-4">
              {carrito.map(item => (
                <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.nombre}</h3>
                    {item.personalizacion && (
                      <p className="text-sm text-blue-600 mt-1">✨ {item.personalizacion}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      ${item.precio.toLocaleString('es-CL')} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => actualizar(item.id, Math.max(1, item.cantidad - 1))} className="w-8 h-8 rounded border border-border hover:bg-muted">−</button>
                    <span className="w-6 text-center font-semibold">{item.cantidad}</span>
                    <button onClick={() => actualizar(item.id, item.cantidad + 1)} className="w-8 h-8 rounded border border-border hover:bg-muted">+</button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold" style={{ color: '#0F8B6C' }}>
                      ${(item.precio * item.cantidad).toLocaleString('es-CL')}
                    </p>
                    <button onClick={() => eliminar(item.id)} className="text-red-500 hover:text-red-700 mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen y checkout */}
          <div className="space-y-6">
            {/* Resumen */}
            <div className="border border-border rounded-lg p-5 space-y-3">
              <h3 className="font-bold text-lg">Resumen</h3>
              <div className="space-y-2 text-sm border-b border-border pb-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Envío:</span>
                  <span>{envio === 0 ? 'GRATIS' : `$${envio.toLocaleString('es-CL')}`}</span>
                </div>
                {envio === 0 && <p className="text-xs text-green-600">Envío gratis en compras superiores a $50.000</p>}
              </div>
              <div className="flex justify-between font-bold text-lg" style={{ color: '#0F8B6C' }}>
                <span>Total:</span>
                <span>${total.toLocaleString('es-CL')}</span>
              </div>
            </div>

            {/* Datos cliente */}
            <div className="border border-border rounded-lg p-5 space-y-4">
              <h3 className="font-bold">Tus datos</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold block mb-1">Nombre</label>
                  <Input
                    value={cliente.nombre}
                    onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Email</label>
                  <Input
                    type="email"
                    value={cliente.email}
                    onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Teléfono / WhatsApp</label>
                  <Input
                    value={cliente.telefono}
                    onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                    placeholder="+56 9 xxxx xxxx"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Ciudad</label>
                  <Input
                    value={cliente.ciudad}
                    onChange={(e) => setCliente({ ...cliente, ciudad: e.target.value })}
                    placeholder="Ej: Santiago"
                  />
                </div>
              </div>
            </div>

            {/* Botón checkout */}
            <Button
              onClick={crearPedido}
              disabled={creando}
              size="lg"
              className="w-full font-semibold"
              style={{ backgroundColor: '#0F8B6C' }}
            >
              {creando ? 'Procesando...' : 'Finalizar compra'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Pronto: Pago con WebPay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}