import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, MessageCircle, Package, Sparkles, Heart } from 'lucide-react';
import SEO from '@/components/SEO';
import { trackPurchase } from '@/lib/analytics-peyu';
import NewsletterCTA from '@/components/newsletter/NewsletterCTA';
import TransferenciaInstrucciones from '@/components/gracias/TransferenciaInstrucciones';

/**
 * Página post-checkout Liquid Dual.
 * - Dispara `purchase` en GA4
 * - Invita al cliente a seguir su pedido + recomendar
 */
export default function Gracias() {
  const [params] = useSearchParams();
  const numero = params.get('numero') || '';
  const email = params.get('email') || '';
  const total = parseInt(params.get('total') || '0', 10);
  const mpStatus = params.get('mp') || '';
  const pago = params.get('pago') || '';
  const isTransferencia = pago === 'Transferencia';
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (tracked || !numero) return;
    try {
      const carritoBackup = JSON.parse(localStorage.getItem('peyu_last_purchase') || '[]');
      trackPurchase({
        transactionId: numero,
        total,
        shipping: 0,
        cart: Array.isArray(carritoBackup) ? carritoBackup : [],
      });
    } catch { /* noop */ }
    setTracked(true);
  }, [numero, total, tracked]);

  return (
    <>
      <SEO
        title="¡Gracias por tu compra! · PEYU Chile"
        description="Tu pedido fue confirmado. Te enviamos los detalles por email."
        canonical="https://peyuchile.cl/gracias"
        noindex={true}
      />
      <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
        <div className="max-w-2xl mx-auto px-5 py-14 sm:py-20">

          {/* Banner Mercado Pago */}
          {mpStatus === 'pending' && (
            <div className="mb-4 ld-card p-4 text-center text-sm" style={{ borderColor: 'var(--ld-highlight)', background: 'var(--ld-highlight-soft)' }}>
              ⏳ <strong className="text-ld-fg">Pago en proceso.</strong> Mercado Pago está procesando tu transacción. Te notificaremos por email apenas se confirme (puede tardar unos minutos).
            </div>
          )}
          {mpStatus === 'success' && (
            <div className="mb-4 ld-card p-4 text-center text-sm" style={{ borderColor: 'var(--ld-action)', background: 'var(--ld-action-soft)' }}>
              ✅ <strong className="text-ld-fg">Pago aprobado por Mercado Pago.</strong> Tu pedido entró en preparación.
            </div>
          )}

          {/* Hero confirmación */}
          <div className="ld-card p-8 sm:p-10 text-center space-y-5 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'var(--ld-action-soft)', opacity: 0.7 }}
            />
            <div className="relative">
              <div
                className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-2xl mb-5"
                style={{ background: 'var(--ld-grad-action)', boxShadow: '0 16px 40px -12px rgba(15,139,108,0.45)' }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <p
                className="text-[11px] font-bold tracking-[0.22em] uppercase mb-2"
                style={{ color: 'var(--ld-action)' }}
              >
                Confirmación
              </p>
              <h1 className="ld-display text-3xl sm:text-4xl text-ld-fg leading-tight">
                {isTransferencia ? (
                  <>¡Falta solo <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>un paso!</span></>
                ) : (
                  <>¡Gracias por <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>tu compra!</span></>
                )}
              </h1>
              <p className="text-ld-fg-soft mt-3 text-sm sm:text-base leading-relaxed">
                {isTransferencia ? (
                  <>Tu pedido está reservado. Completa la transferencia para iniciar la producción.<br />Te enviamos los datos a <span className="font-semibold" style={{ color: 'var(--ld-action)' }}>{email || 'tu email'}</span>.</>
                ) : (
                  <>Tu pedido fue recibido con éxito.<br />Te enviamos la confirmación a <span className="font-semibold" style={{ color: 'var(--ld-action)' }}>{email || 'tu email'}</span>.</>
                )}
              </p>
              {numero && (
                <div className="ld-glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 mt-4">
                  <Package className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
                  <span className="text-sm font-mono text-ld-fg">N° pedido: <strong style={{ color: 'var(--ld-action)' }}>{numero}</strong></span>
                </div>
              )}
              {total > 0 && (
                <p className="text-ld-fg-soft text-sm mt-3">
                  {isTransferencia ? 'Total a transferir' : 'Total pagado'}:{' '}
                  <span className="ld-display text-2xl text-ld-fg">${total.toLocaleString('es-CL')}</span>
                </p>
              )}
            </div>
          </div>

          {/* Instrucciones de transferencia */}
          {isTransferencia && (
            <div className="mt-6">
              <TransferenciaInstrucciones numero={numero} total={total} />
            </div>
          )}

          {/* Próximos pasos */}
          <div className="mt-6 ld-card p-6 sm:p-8">
            <h2 className="ld-display text-xl text-ld-fg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: 'var(--ld-highlight)' }} />
              ¿Qué sigue?
            </h2>
            <ol className="space-y-3 text-sm text-ld-fg-soft">
              {[
                ['1', 'Revisa tu email', 'Recibirás el detalle del pedido y la factura electrónica.'],
                ['2', 'Producción y despacho', 'Te avisamos cuando salga de fábrica con el código de tracking.'],
                ['3', 'Recibe tu PEYU', 'Tu regalo sostenible llegará en los plazos indicados al checkout.'],
              ].map(([n, t, d]) => (
                <li key={n} className="flex gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="font-semibold text-ld-fg">{t}</p>
                    <p className="text-xs text-ld-fg-muted mt-0.5">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* CTAs */}
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Link to="/seguimiento" className="block">
              <Button className="ld-btn-primary w-full h-12 rounded-full text-white font-bold gap-2">
                <Package className="w-4 h-4" /> Seguir mi pedido
              </Button>
            </Link>
            <a
              href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, mi pedido es ${numero}`)}`}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Button className="ld-btn-ghost w-full h-12 rounded-full text-ld-fg font-bold gap-2">
                <MessageCircle className="w-4 h-4" /> Consultar por WhatsApp
              </Button>
            </a>
          </div>

          {/* Newsletter */}
          <div className="mt-6">
            <NewsletterCTA variant="gracias" defaultEmail={email} />
          </div>

          {/* Compartir */}
          <div className="mt-8 ld-card p-6 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-50"
              style={{ background: 'var(--ld-highlight-soft)' }}
            />
            <div className="relative">
              <Heart className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--ld-highlight)' }} />
              <p className="ld-display text-2xl text-ld-fg">¿Te gustó la experiencia?</p>
              <p className="text-xs text-ld-fg-muted mt-1.5 mb-4">Cuéntale a tu equipo o tu empresa. Cada pedido nos ayuda a sacar más plástico del vertedero.</p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Link to="/shop">
                  <Button className="ld-btn-ghost rounded-full text-ld-fg" size="sm">
                    Seguir explorando
                  </Button>
                </Link>
                <a href="mailto:?subject=Mira%20PEYU%20Chile&body=Acabo%20de%20comprar%20regalos%20sostenibles%20en%20peyuchile.cl%20%F0%9F%90%A2">
                  <Button className="ld-btn-ghost rounded-full text-ld-fg gap-1.5" size="sm">
                    <Mail className="w-3.5 h-3.5" /> Compartir
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}