import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Building2 } from 'lucide-react';

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [personalizacion, setPersonalizacion] = useState('');
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const data = await base44.entities.Producto.list();
      const prod = data.find(p => p.id === id);
      setProducto(prod);
    };
    cargar();
  }, [id]);

  const agregarAlCarrito = () => {
    const item = {
      id: Math.random(),
      productoId: producto.id,
      nombre: producto.nombre,
      precio: Math.floor(producto.precio_b2c * 0.85),
      cantidad,
      personalizacion: personalizacion || null,
    };
    const nuevoCarrito = [...carrito, item];
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  if (!producto) return <div className="p-6 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Imagen */}
          <div className="bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-white font-semibold">{producto.nombre}</p>
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
              <p className="text-muted-foreground mb-4">{producto.descripcion}</p>
              <div className="flex gap-2 mb-4">
                <span className="bg-[#0F8B6C] text-white px-3 py-1 rounded-full text-sm">
                  {producto.material?.includes('100%') ? '♻️ 100% Reciclado' : '🌾 Compostable'}
                </span>
                <span className="bg-gray-100 text-foreground px-3 py-1 rounded-full text-sm">
                  {producto.categoria}
                </span>
              </div>
            </div>

            {/* Precio */}
            <div className="border-t border-b border-border py-4">
              <div className="text-sm text-muted-foreground line-through mb-2">
                ${producto.precio_b2c?.toLocaleString('es-CL')}
              </div>
              <div className="text-4xl font-bold" style={{ color: '#0F8B6C' }}>
                ${Math.floor(producto.precio_b2c * 0.85)?.toLocaleString('es-CL')}
              </div>
              <p className="text-xs text-green-600 mt-2">15% descuento en tienda online</p>
            </div>

            {/* Cantidad */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Cantidad</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-10 h-10 rounded-lg border border-border hover:bg-muted">−</button>
                <span className="text-lg font-semibold w-8 text-center">{cantidad}</span>
                <button onClick={() => setCantidad(cantidad + 1)} className="w-10 h-10 rounded-lg border border-border hover:bg-muted">+</button>
              </div>
            </div>

            {/* Personalización */}
            {producto.moq_personalizacion && (
              <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <label className="text-sm font-semibold flex items-center gap-2">
                  ✨ Personalización
                </label>
                <Input
                  placeholder="Ej: Mi Nombre, Logo, Mensaje..."
                  value={personalizacion}
                  onChange={(e) => setPersonalizacion(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  MOQ: {producto.moq_personalizacion} unidades
                </p>
              </div>
            )}

            {/* Botón agregar */}
            <Button
              onClick={agregarAlCarrito}
              size="lg"
              className="w-full font-semibold gap-2"
              style={agregado ? { backgroundColor: '#0F8B6C' } : { backgroundColor: '#0F8B6C' }}
            >
              {agregado ? (
                <>
                  <Check className="w-4 h-4" /> Agregado al carrito
                </>
              ) : (
                <>Agregar al carrito</>
              )}
            </Button>

            {/* B2B CTA */}
            <Link to={`/b2b/contacto?productoId=${producto.id}&nombre=${encodeURIComponent(producto.nombre || '')}`}>
              <Button
                size="lg"
                variant="outline"
                className="w-full font-semibold gap-2"
                style={{ borderColor: '#006D5B', color: '#006D5B' }}
              >
                <Building2 className="w-4 h-4" />
                Cotización corporativa (B2B)
              </Button>
            </Link>

            {/* Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Envío a todo Chile</p>
              <p>✓ Garantía {producto.garantia_anios || 1} año(s)</p>
              <p>✓ Lead time: {producto.lead_time_sin_personal} días hábiles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}