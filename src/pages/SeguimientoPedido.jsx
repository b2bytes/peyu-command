import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Package, Truck, ArrowLeft, MessageCircle, AlertCircle,
  Sparkles, ExternalLink, Star, Receipt, MapPin, CreditCard,
} from 'lucide-react';
import TrackingTimeline from '@/components/seguimiento/TrackingTimeline';
import PedidoRatingForm from '@/components/seguimiento/PedidoRatingForm';
import PublicSEO from '@/components/PublicSEO';

const TRACKING_URLS = {
  'Starken':       (t) => `https://www.starken.cl/seguimiento?codigo=${t}`,
  'Chilexpress':   (t) => `https://www.chilexpress.cl/Seguimiento?numero=${t}`,
  'BlueExpress':   (t) => `https://www.blue.cl/seguimiento?n=${t}`,
  'Correos Chile': (t) => `https://www.correos.cl/seguimiento?n=${t}`,
};

export default function SeguimientoPedido() {
  const [numero, setNumero] = useState('');
  const [email, setEmail] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [resena, setResena] = useState(null); // si ya calificó
  const [mostrarRating, setMostrarRating] = useState(false);
  const [error, setError] = useState('');

  // Autocarga desde ?pedido= y ?review=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const num = params.get('pedido');
    if (num) {
      setNumero(num);
      buscar(num);
    }
    if (params.get('review') === '1') setMostrarRating(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscar = async (forzarNumero) => {
    const n = (forzarNumero || numero).trim();
    if (!n) { setError('Ingresa tu número de pedido'); return; }
    setBuscando(true);
    setError('');
    setPedido(null);
    setResena(null);
    try {
      const resultados = await base44.entities.PedidoWeb.filter({ numero_pedido: n });
      if (resultados.length === 0) {
        setError('No encontramos ese pedido. Verifica el número (ej: WEB-1234567890).');
        return;
      }
      const p = resultados[0];
      if (email && p.cliente_email && p.cliente_email.toLowerCase() !== email.toLowerCase()) {
        setError('El email no coincide con el pedido.');
        return;
      }
      setPedido(p);

      // Verificar si ya calificó
      try {
        const reviews = await base44.entities.ResenaPedido.filter({ pedido_id: p.id });
        if (reviews?.length > 0) setResena(reviews[0]);
      } catch {}
    } finally {
      setBuscando(false);
    }
  };

  const trackingUrl = pedido?.tracking && pedido?.courier && TRACKING_URLS[pedido.courier]
    ? TRACKING_URLS[pedido.courier](pedido.tracking)
    : null;

  const yaEntregado = pedido?.estado === 'Entregado';
  const puedeCalificar = yaEntregado && !resena;

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">
      <PublicSEO pageKey="seguimiento" noindex />
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
          </Link>
          <div>
            <h1 className="font-poppins font-bold text-gray-900">Seguimiento de Pedido</h1>
            <p className="text-xs text-gray-400">Rastrea tu pedido en tiempo real</p>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-10 space-y-5">

        {/* BUSCADOR */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-poppins font-bold text-gray-900">¿Dónde está mi pedido?</h2>
              <p className="text-xs text-gray-400">Ingresa tu número de pedido para ver el estado</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Número de pedido *</label>
              <Input
                value={numero}
                onChange={e => setNumero(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ej: WEB-1234567890"
                className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Encuéntralo en el email de confirmación</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Email (opcional)</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="tu@email.com"
                className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2.5 text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3.5 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <Button
              onClick={() => buscar()}
              disabled={buscando}
              className="w-full gap-2 rounded-2xl bg-gray-900 hover:bg-gray-800 h-11 font-semibold"
            >
              {buscando ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Buscando...</>
              ) : (
                <><Search className="w-4 h-4" /> Buscar pedido</>
              )}
            </Button>
          </div>
        </div>

        {/* RESULTADO */}
        {pedido && (
          <div className="space-y-4">

            {/* Banner Calificar (solo si entregado y sin reseña) */}
            {puedeCalificar && !mostrarRating && (
              <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⭐</div>
                  <div className="flex-1">
                    <h3 className="font-poppins font-bold text-amber-900">¿Cómo fue tu experiencia?</h3>
                    <p className="text-sm text-amber-700 mt-1">Tu opinión nos ayuda a mejorar y a otros clientes a decidirse.</p>
                    <Button
                      onClick={() => setMostrarRating(true)}
                      className="mt-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    >
                      <Star className="w-4 h-4" /> Calificar pedido
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Reseña ya enviada */}
            {resena && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                  <Star className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900 text-sm">Ya calificaste este pedido</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Producto: {resena.rating_producto}/5 · Servicio: {resena.rating_servicio}/5 — ¡Gracias!
                  </p>
                </div>
              </div>
            )}

            {/* Form de Rating */}
            {puedeCalificar && mostrarRating && (
              <PedidoRatingForm
                pedido={pedido}
                onSubmitted={(r) => { setResena(r); setMostrarRating(false); }}
              />
            )}

            {/* INFO PEDIDO */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div>
                  <p className="font-mono text-xs text-gray-400 mb-1">{pedido.numero_pedido}</p>
                  <h3 className="font-poppins font-bold text-xl text-gray-900">{pedido.cliente_nombre}</h3>
                  <p className="text-sm text-gray-400">{pedido.fecha}</p>
                </div>
                <div className="text-right">
                  <p className="font-poppins font-bold text-3xl text-gray-900">${(pedido.total || 0).toLocaleString('es-CL')}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                    <CreditCard className="w-3 h-3" /> {pedido.medio_pago}
                  </p>
                </div>
              </div>

              {pedido.descripcion_items && (
                <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Receipt className="w-3 h-3" /> Productos
                  </p>
                  <p>{pedido.descripcion_items}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {pedido.ciudad && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Ciudad</p>
                    <p className="font-semibold text-gray-900">{pedido.ciudad}</p>
                  </div>
                )}
                {pedido.courier && pedido.courier !== 'Pendiente' && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 mb-0.5 flex items-center gap-1"><Truck className="w-3 h-3" /> Courier</p>
                    <p className="font-semibold text-gray-900">{pedido.courier}</p>
                  </div>
                )}
                {pedido.costo_envio === 0 ? (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-emerald-700 font-bold">✓ Envío gratis</p>
                  </div>
                ) : pedido.costo_envio > 0 ? (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 mb-0.5">Envío</p>
                    <p className="font-semibold text-gray-900">${pedido.costo_envio?.toLocaleString('es-CL')}</p>
                  </div>
                ) : null}
              </div>

              {/* Tracking con link */}
              {pedido.tracking && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">N° Tracking</p>
                      <p className="font-mono font-bold text-sm text-gray-900">{pedido.tracking}</p>
                    </div>
                  </div>
                  {trackingUrl && (
                    <a href={trackingUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        Rastrear en {pedido.courier} <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Timeline */}
            <TrackingTimeline pedido={pedido} />

            {/* Personalización */}
            {pedido.requiere_personalizacion && (
              <div className="bg-purple-50 border border-purple-100 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <p className="font-semibold text-purple-700">Pedido con personalización láser</p>
                </div>
                {pedido.texto_personalizacion && (
                  <p className="text-sm text-purple-600">Grabado: "{pedido.texto_personalizacion}"</p>
                )}
                <p className="text-xs text-purple-400 mt-2">
                  {pedido.logo_recibido ? '✓ Logo recibido y en proceso' : '⏳ Esperando logo — revisa tu email'}
                </p>
              </div>
            )}

            {/* Ayuda */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <p className="font-semibold text-sm text-gray-900">¿Tienes alguna pregunta?</p>
                <p className="text-xs text-gray-400 mt-0.5">Respondemos en &lt;2h por WhatsApp</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={`https://wa.me/56935040242?text=Hola, consulto por mi pedido ${pedido.numero_pedido}`} target="_blank" rel="noreferrer">
                  <Button className="gap-2 text-sm rounded-xl" style={{ backgroundColor: '#25D366' }}>
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
                <Link to="/soporte">
                  <Button variant="outline" size="sm" className="rounded-xl">Centro de ayuda</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Sin resultado */}
        {!pedido && !error && !buscando && (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">¿Perdiste el número de pedido?</p>
              <p className="text-sm text-gray-400 mt-1">Escríbenos con tu nombre y email y te ayudamos de inmediato.</p>
            </div>
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2 rounded-xl">
                <MessageCircle className="w-4 h-4" /> Contactar soporte
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}