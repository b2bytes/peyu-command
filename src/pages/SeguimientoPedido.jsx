import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Package, Truck, MessageCircle, AlertCircle,
  Sparkles, ExternalLink, Star, Receipt, MapPin, CreditCard,
} from 'lucide-react';
import TrackingTimeline from '@/components/seguimiento/TrackingTimeline';
import PedidoRatingForm from '@/components/seguimiento/PedidoRatingForm';
import PublicSEO from '@/components/PublicSEO';
import { track } from '@/lib/activity-tracker';
import PublicHero from '@/components/public/PublicHero';

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
  const [resena, setResena] = useState(null);
  const [mostrarRating, setMostrarRating] = useState(false);
  const [error, setError] = useState('');

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
      track.trackingView(p.numero_pedido);
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
    <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
      <PublicSEO pageKey="seguimiento" noindex />

      <PublicHero
        eyebrow="Seguimiento"
        title={<>Rastrea tu <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>pedido.</span></>}
        subtitle="Ingresa tu número de pedido para ver el estado en tiempo real."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-5 pb-10 space-y-5">
        {/* BUSCADOR */}
        <div className="ld-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' }}
            >
              <Search className="w-5 h-5" style={{ color: 'var(--ld-action)' }} />
            </div>
            <div>
              <h2 className="ld-display text-xl text-ld-fg">¿Dónde está mi pedido?</h2>
              <p className="text-xs text-ld-fg-muted">Búscalo con tu número de pedido</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-ld-fg-muted uppercase tracking-[0.18em] block mb-1.5">Número de pedido *</label>
              <Input
                value={numero}
                onChange={e => setNumero(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ej: WEB-1234567890"
                className="ld-input h-11 text-sm rounded-full bg-transparent text-ld-fg font-mono placeholder:text-ld-fg-subtle border border-ld-border"
              />
              <p className="text-xs text-ld-fg-muted mt-1">Encuéntralo en el email de confirmación</p>
            </div>
            <div>
              <label className="text-xs font-bold text-ld-fg-muted uppercase tracking-[0.18em] block mb-1.5">Email (opcional)</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="tu@email.com"
                className="ld-input h-11 text-sm rounded-full bg-transparent text-ld-fg placeholder:text-ld-fg-subtle border border-ld-border"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2.5 rounded-2xl p-3.5 text-sm" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)', border: '1px solid var(--ld-highlight)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <Button
              onClick={() => buscar()}
              disabled={buscando}
              className="ld-btn-primary w-full gap-2 rounded-full h-11 font-semibold text-white"
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
            {/* Banner Calificar */}
            {puedeCalificar && !mostrarRating && (
              <div className="ld-card p-6 relative overflow-hidden">
                <div
                  aria-hidden
                  className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-50"
                  style={{ background: 'var(--ld-highlight-soft)' }}
                />
                <div className="relative flex items-start gap-4">
                  <div className="text-4xl">⭐</div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: 'var(--ld-highlight)' }}>
                      Tu opinión cuenta
                    </p>
                    <h3 className="ld-display text-xl text-ld-fg">¿Cómo fue tu experiencia?</h3>
                    <p className="text-sm text-ld-fg-muted mt-1">Tu opinión nos ayuda a mejorar y a otros clientes a decidirse.</p>
                    <Button
                      onClick={() => setMostrarRating(true)}
                      className="mt-3 rounded-full text-white gap-2"
                      style={{ background: 'var(--ld-highlight)' }}
                    >
                      <Star className="w-4 h-4" /> Calificar pedido
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Reseña ya enviada */}
            {resena && (
              <div className="ld-card p-5 flex items-center gap-3" style={{ borderColor: 'var(--ld-action)', background: 'var(--ld-action-soft)' }}>
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
                  style={{ background: 'var(--ld-action)' }}
                >
                  <Star className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <p className="font-bold text-ld-fg text-sm">Ya calificaste este pedido</p>
                  <p className="text-xs text-ld-fg-soft mt-0.5">
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
            <div className="ld-card p-6">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
                <div>
                  <p className="font-mono text-xs text-ld-fg-muted mb-1">{pedido.numero_pedido}</p>
                  <h3 className="ld-display text-2xl text-ld-fg">{pedido.cliente_nombre}</h3>
                  <p className="text-sm text-ld-fg-muted">{pedido.fecha}</p>
                </div>
                <div className="text-right">
                  <p className="ld-display text-3xl text-ld-fg">${(pedido.total || 0).toLocaleString('es-CL')}</p>
                  <p className="text-xs text-ld-fg-muted flex items-center gap-1 justify-end">
                    <CreditCard className="w-3 h-3" /> {pedido.medio_pago}
                  </p>
                </div>
              </div>

              {pedido.descripcion_items && (
                <div className="ld-glass-soft rounded-2xl p-4 text-sm text-ld-fg-soft mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] mb-1.5 flex items-center gap-1" style={{ color: 'var(--ld-action)' }}>
                    <Receipt className="w-3 h-3" /> Productos
                  </p>
                  <p>{pedido.descripcion_items}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {pedido.ciudad && (
                  <div className="ld-glass-soft rounded-xl p-3">
                    <p className="text-ld-fg-muted mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Ciudad</p>
                    <p className="font-semibold text-ld-fg">{pedido.ciudad}</p>
                  </div>
                )}
                {pedido.courier && pedido.courier !== 'Pendiente' && (
                  <div className="ld-glass-soft rounded-xl p-3">
                    <p className="text-ld-fg-muted mb-0.5 flex items-center gap-1"><Truck className="w-3 h-3" /> Courier</p>
                    <p className="font-semibold text-ld-fg">{pedido.courier}</p>
                  </div>
                )}
                {pedido.costo_envio === 0 ? (
                  <div className="rounded-xl p-3" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)', border: '1px solid var(--ld-action)' }}>
                    <p className="font-bold">✓ Envío gratis</p>
                  </div>
                ) : pedido.costo_envio > 0 ? (
                  <div className="ld-glass-soft rounded-xl p-3">
                    <p className="text-ld-fg-muted mb-0.5">Envío</p>
                    <p className="font-semibold text-ld-fg">${pedido.costo_envio?.toLocaleString('es-CL')}</p>
                  </div>
                ) : null}
              </div>

              {/* Tracking */}
              {pedido.tracking && (
                <div className="mt-4 pt-4 border-t border-ld-border flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--ld-action-soft)' }}>
                      <Truck className="w-5 h-5" style={{ color: 'var(--ld-action)' }} />
                    </div>
                    <div>
                      <p className="text-xs text-ld-fg-muted">N° Tracking</p>
                      <p className="font-mono font-bold text-sm text-ld-fg">{pedido.tracking}</p>
                    </div>
                  </div>
                  {trackingUrl && (
                    <a href={trackingUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" className="ld-btn-primary rounded-full gap-2 text-white">
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
              <div className="ld-card p-5" style={{ borderColor: 'var(--ld-highlight)', background: 'var(--ld-highlight-soft)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--ld-highlight)' }} />
                  <p className="font-semibold text-ld-fg">Pedido con personalización láser</p>
                </div>
                {pedido.texto_personalizacion && (
                  <p className="text-sm text-ld-fg-soft">Grabado: "{pedido.texto_personalizacion}"</p>
                )}
                <p className="text-xs text-ld-fg-muted mt-2">
                  {pedido.logo_recibido ? '✓ Logo recibido y en proceso' : '⏳ Esperando logo — revisa tu email'}
                </p>
              </div>
            )}

            {/* Ayuda */}
            <div className="ld-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-ld-fg">¿Tienes alguna pregunta?</p>
                <p className="text-xs text-ld-fg-muted mt-0.5">Respondemos en &lt;2h por WhatsApp</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={`https://wa.me/56935040242?text=Hola, consulto por mi pedido ${pedido.numero_pedido}`} target="_blank" rel="noreferrer">
                  <Button className="ld-btn-primary gap-2 text-sm rounded-full text-white">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
                <Link to="/soporte">
                  <Button className="ld-btn-ghost rounded-full text-ld-fg" size="sm">Centro de ayuda</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Sin resultado */}
        {!pedido && !error && !buscando && (
          <div className="ld-card p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto" style={{ background: 'var(--ld-bg-soft)' }}>
              <Package className="w-8 h-8 text-ld-fg-muted" />
            </div>
            <div>
              <p className="font-semibold text-ld-fg">¿Perdiste el número de pedido?</p>
              <p className="text-sm text-ld-fg-muted mt-1">Escríbenos con tu nombre y email y te ayudamos de inmediato.</p>
            </div>
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button className="ld-btn-ghost gap-2 rounded-full text-ld-fg">
                <MessageCircle className="w-4 h-4" /> Contactar soporte
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}