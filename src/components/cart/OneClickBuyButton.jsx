import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Zap, Check, MapPin, CreditCard, ChevronRight, X } from 'lucide-react';
import { trackPurchase } from '@/lib/analytics-peyu';
import { track } from '@/lib/activity-tracker';
import { getOneClickProfile, clearOneClickProfile } from '@/lib/one-click-profile';

/**
 * Botón "Compra en 1 Clic" — para clientes recurrentes.
 *
 * Solo se renderiza si existe un perfil guardado válido en localStorage.
 * Crea el pedido al instante usando los datos guardados (envío + medio de pago)
 * y redirige a /gracias (o al checkout MP si corresponde).
 *
 * Props:
 *   items: array de items del carrito (formato carrito estándar)
 *          Si no se pasa, lee `localStorage.carrito`.
 *   onConfirm: (opcional) callback antes de crear el pedido
 *   variant: 'dark' | 'light' — adapta colores al fondo
 */
export default function OneClickBuyButton({ items, variant = 'light', className = '' }) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [creando, setCreando] = useState(false);

  const profile = useMemo(() => getOneClickProfile(), []);
  if (!profile) return null;

  const carrito = items && items.length > 0
    ? items
    : JSON.parse(localStorage.getItem('carrito') || '[]');

  if (!carrito || carrito.length === 0) return null;

  const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const envio = subtotal >= 40000 ? 0 : 5990;
  const descuentoTransfer = profile.medio_pago === 'Transferencia'
    ? Math.floor(subtotal * 0.05)
    : 0;
  const total = Math.max(0, subtotal + envio - descuentoTransfer);

  const dark = variant === 'dark';

  const ejecutarCompra = async () => {
    setCreando(true);
    const numero = `WEB-${Date.now()}`;
    const itemsTxt = carrito.map(i =>
      `${i.nombre} x${i.cantidad}${i.personalizacion ? ` [${i.personalizacion}]` : ''}`
    ).join(' | ');

    const pedido = await base44.entities.PedidoWeb.create({
      numero_pedido: numero,
      fecha: new Date().toISOString().split('T')[0],
      canal: 'Web Propia',
      cliente_nombre: profile.nombre,
      cliente_email: profile.email,
      cliente_telefono: profile.telefono,
      tipo_cliente: 'B2C Individual',
      descripcion_items: itemsTxt,
      cantidad: carrito.reduce((s, i) => s + i.cantidad, 0),
      subtotal,
      costo_envio: envio,
      descuento: descuentoTransfer,
      total,
      medio_pago: profile.medio_pago,
      estado: 'Nuevo',
      ciudad: profile.ciudad,
      direccion_envio: profile.direccion,
      requiere_personalizacion: carrito.some(i => i.personalizacion),
      texto_personalizacion: carrito
        .filter(i => i.personalizacion)
        .map(i => i.personalizacion)
        .join(', '),
      courier: 'Pendiente',
      notas: `Pedido vía 1-Click · ${carrito.length} items · ${profile.region}${descuentoTransfer ? ` · Dscto transfer -$${descuentoTransfer.toLocaleString('es-CL')}` : ''}`,
    });

    // Snapshot para /gracias
    try { localStorage.setItem('peyu_last_purchase', JSON.stringify(carrito)); } catch {}

    // Mercado Pago: redirigir a checkout MP si corresponde
    if (profile.medio_pago === 'MercadoPago' && total > 0) {
      try {
        const mp = await base44.functions.invoke('mpCreatePreference', { pedido_id: pedido.id });
        const initUrl = mp?.data?.init_point || mp?.data?.sandbox_init_point;
        if (initUrl) {
          localStorage.removeItem('carrito');
          trackPurchase({ transactionId: numero, total, shipping: envio, cart: carrito });
          track.checkoutComplete({ pedidoId: pedido?.id, total, email: profile.email, name: profile.nombre });
          window.location.href = initUrl;
          return;
        }
      } catch (e) {
        console.error('1-Click MP error:', e);
        alert('No se pudo iniciar Mercado Pago. Intenta desde el checkout normal.');
        setCreando(false);
        return;
      }
    }

    // WebPay / Transferencia → directo a /gracias
    localStorage.removeItem('carrito');
    trackPurchase({ transactionId: numero, total, shipping: envio, cart: carrito });
    track.checkoutComplete({ pedidoId: pedido?.id, total, email: profile.email, name: profile.nombre });
    setCreando(false);
    navigate(`/gracias?numero=${encodeURIComponent(numero)}&email=${encodeURIComponent(profile.email)}&total=${total}&oneClick=1`);
  };

  // ── BOTÓN PRINCIPAL ─────────────────────────────────────────────────
  if (!showConfirm) {
    return (
      <Button
        onClick={() => setShowConfirm(true)}
        className={`w-full h-12 font-bold text-sm gap-2 rounded-xl shadow-xl border-0 transition-all hover:scale-[1.01] ${
          dark
            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-900 shadow-amber-500/30'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30'
        } ${className}`}
      >
        <Zap className="w-4 h-4 fill-current" />
        Comprar en 1 Clic · ${total.toLocaleString('es-CL')}
      </Button>
    );
  }

  // ── CONFIRMACIÓN INLINE (modal-like card) ──────────────────────────
  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${dark ? 'bg-white/8 backdrop-blur border-white/15' : 'bg-white border-amber-200 shadow-lg'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Confirmar compra 1-Click</p>
            <p className={`text-[10px] ${dark ? 'text-white/50' : 'text-gray-500'}`}>Hola {profile.nombre.split(' ')[0]} 👋</p>
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(false)}
          className={`w-7 h-7 rounded-full flex items-center justify-center ${dark ? 'bg-white/10 hover:bg-white/20 text-white/70' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Resumen datos guardados */}
      <div className={`rounded-xl p-2.5 space-y-1.5 ${dark ? 'bg-white/5' : 'bg-amber-50/60'}`}>
        <div className="flex items-start gap-2 text-xs">
          <MapPin className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${dark ? 'text-amber-300' : 'text-amber-600'}`} />
          <div className={`${dark ? 'text-white/80' : 'text-gray-700'} leading-tight`}>
            {profile.direccion}, {profile.ciudad}, {profile.region}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <CreditCard className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? 'text-amber-300' : 'text-amber-600'}`} />
          <span className={`${dark ? 'text-white/80' : 'text-gray-700'}`}>{profile.medio_pago}</span>
        </div>
      </div>

      {/* Totales */}
      <div className={`flex justify-between items-baseline pt-1 border-t ${dark ? 'border-white/10' : 'border-gray-100'}`}>
        <span className={`text-xs ${dark ? 'text-white/60' : 'text-gray-500'}`}>Total</span>
        <span className={`font-poppins font-bold text-xl ${dark ? 'text-white' : 'text-gray-900'}`}>
          ${total.toLocaleString('es-CL')}
        </span>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          onClick={ejecutarCompra}
          disabled={creando}
          className="h-11 font-bold text-sm gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg border-0"
        >
          {creando
            ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creando...</>
            : <><Check className="w-4 h-4" /> Confirmar y comprar <ChevronRight className="w-4 h-4" /></>}
        </Button>
        <button
          onClick={() => { clearOneClickProfile(); setShowConfirm(false); }}
          className={`px-3 rounded-xl text-[10px] font-semibold ${dark ? 'text-white/50 hover:text-white/80' : 'text-gray-400 hover:text-gray-700'}`}
          title="Olvidar mis datos guardados"
        >
          Olvidar
        </button>
      </div>

      <p className={`text-[10px] text-center ${dark ? 'text-white/40' : 'text-gray-400'}`}>
        🔒 Tus datos están guardados solo en este navegador
      </p>
    </div>
  );
}