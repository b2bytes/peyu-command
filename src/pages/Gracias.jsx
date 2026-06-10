import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, MessageCircle, Package, Sparkles, Heart, Copy, Check } from 'lucide-react';
import SEO from '@/components/SEO';
import { trackPurchase } from '@/lib/analytics-peyu';
import { clearCartV2 } from '@/lib/shop-v2-cart';
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
  const [copiado, setCopiado] = useState(false);

  const copiarNumero = async () => {
    try {
      await navigator.clipboard.writeText(numero);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* noop */ }
  };

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
    // Llegamos a la confirmación → la compra se concretó. Vaciamos el carrito v2,
    // pero CONSERVAMOS los datos del checkout (nombre, email, dirección): el
    // perfil del cliente es persistente y su próxima compra llega pre-llenada.
    try {
      clearCartV2();
      localStorage.setItem('peyu_v2_last_order', JSON.stringify({ numero, at: Date.now() }));
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
      <div className="min-h-screen font-inter pb-20 lg:pb-0" style={{ background: '#F8F3ED', color: '#2C1810' }}>
        <div className="max-w-2xl mx-auto px-5 py-14 sm:py-20">

          {/* Banner Mercado Pago */}
          {mpStatus === 'pending' && (
            <div className="mb-4 rounded-2xl p-4 text-center text-sm" style={{ borderColor: '#C0785C', background: 'rgba(192,120,92,.08)', border: '1.5px solid rgba(192,120,92,.25)' }}>
              ⏳ <strong style={{ color: '#2C1810' }}>Pago en proceso.</strong> <span style={{ color: '#7A6050' }}>Mercado Pago está procesando tu transacción. Te notificaremos por email apenas se confirme.</span>
            </div>
          )}
          {mpStatus === 'success' && (
            <div className="mb-4 rounded-2xl p-4 text-center text-sm" style={{ background: 'rgba(15,139,108,.08)', border: '1.5px solid rgba(15,139,108,.2)' }}>
              ✅ <strong style={{ color: '#2C1810' }}>Pago aprobado por Mercado Pago.</strong> <span style={{ color: '#7A6050' }}>Tu pedido entró en preparación.</span>
            </div>
          )}

          {/* Hero confirmación */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 text-center space-y-5 relative overflow-hidden" style={{ border: '1.5px solid #E8DDD0', boxShadow: '0 4px 32px rgba(44,24,16,.07)' }}>
            <div
              aria-hidden
              className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(15,139,108,.08)', opacity: 0.7 }}
            />
            <div className="relative">
              <div
                className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-2xl mb-5"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 16px 40px -12px rgba(15,139,108,0.45)' }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <p
                className="text-[11px] font-bold tracking-[0.22em] uppercase mb-2"
                style={{ color: '#0F8B6C' }}
              >
                Confirmación
              </p>
              <h1 className="font-fraunces text-3xl sm:text-4xl leading-tight" style={{ color: '#2C1810' }}>
                {isTransferencia ? (
                  <>¡Falta solo <em className="not-italic" style={{ color: '#C0785C' }}>un paso!</em></>
                ) : (
                  <>¡Gracias por <em className="not-italic" style={{ color: '#C0785C' }}>tu compra!</em></>
                )}
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: '#7A6050' }}>
                {isTransferencia ? (
                  <>Tu pedido está reservado. Completa la transferencia para iniciar la producción.<br />Te enviamos los datos a <span className="font-semibold" style={{ color: '#0F8B6C' }}>{email || 'tu email'}</span>.</>
                ) : (
                  <>Tu pedido fue recibido con éxito.<br />Te enviamos la confirmación a <span className="font-semibold" style={{ color: '#0F8B6C' }}>{email || 'tu email'}</span>.</>
                )}
              </p>
              {numero && (
                <button
                  onClick={copiarNumero}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mt-4 transition-all active:scale-95"
                  style={{ background: '#F5EDE3', border: '1px solid #D4C4B0' }}
                  aria-label="Copiar número de pedido"
                >
                  <Package className="w-4 h-4" style={{ color: '#0F8B6C' }} />
                  <span className="text-sm font-mono" style={{ color: '#2C1810' }}>N° pedido: <strong style={{ color: '#0F8B6C' }}>{numero}</strong></span>
                  {copiado ? (
                    <Check className="w-3.5 h-3.5" style={{ color: '#0F8B6C' }} />
                  ) : (
                    <Copy className="w-3.5 h-3.5" style={{ color: '#A08070' }} />
                  )}
                </button>
              )}
              {copiado && <p className="text-[11px] mt-1.5 font-semibold" style={{ color: '#0F8B6C' }}>✓ Número copiado</p>}
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
          <div className="mt-6 bg-white rounded-3xl p-6 sm:p-8" style={{ border: '1.5px solid #E8DDD0' }}>
            <h2 className="font-fraunces text-xl mb-4 flex items-center gap-2" style={{ color: '#2C1810' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#C0785C' }} />
              ¿Qué sigue?
            </h2>
            <ol className="space-y-3 text-sm" style={{ color: '#7A6050' }}>
              {[
                ['1', 'Revisa tu email', 'Recibirás el detalle del pedido y la factura electrónica.'],
                ['2', 'Producción y despacho', 'Te avisamos cuando salga de fábrica con el código de tracking.'],
                ['3', 'Recibe tu PEYU', 'Tu regalo sostenible llegará en los plazos indicados al checkout.'],
              ].map(([n, t, d]) => (
                <li key={n} className="flex gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ background: 'rgba(15,139,108,.1)', color: '#0F8B6C', boxShadow: 'inset 0 0 0 1px #0F8B6C' }}
                  >
                    {n}
                  </span>
                  <div>
                    <p className="font-semibold" style={{ color: '#2C1810' }}>{t}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* CTAs */}
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Link to={numero ? `/seguimiento?pedido=${encodeURIComponent(numero)}` : '/seguimiento'} className="block">
              <button className="w-full h-12 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 8px 24px rgba(15,139,108,.25)' }}>
                <Package className="w-4 h-4" /> Seguir mi pedido
              </button>
            </Link>
            <a
              href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, mi pedido es ${numero}`)}`}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <button className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-[#F0E8DE]"
                style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}>
                <MessageCircle className="w-4 h-4" /> Consultar WhatsApp
              </button>
            </a>
          </div>

          {/* Newsletter */}
          <div className="mt-6">
            <NewsletterCTA variant="gracias" defaultEmail={email} />
          </div>

          {/* Compartir */}
          <div className="mt-8 bg-white rounded-3xl p-6 text-center relative overflow-hidden" style={{ border: '1.5px solid #E8DDD0' }}>
            <div aria-hidden className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-40" style={{ background: 'rgba(192,120,92,.15)' }} />
            <div className="relative">
              <Heart className="w-7 h-7 mx-auto mb-2" style={{ color: '#C0785C' }} />
              <p className="font-fraunces text-2xl" style={{ color: '#2C1810' }}>¿Te gustó la experiencia?</p>
              <p className="text-xs mt-1.5 mb-4" style={{ color: '#A08070' }}>Cuéntale a tu equipo o tu empresa. Cada pedido nos ayuda a sacar más plástico del vertedero.</p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Link to="/CatalogoNuevo">
                  <button className="px-5 py-2.5 rounded-2xl text-sm font-bold transition-all hover:bg-[#F0E8DE]"
                    style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}>
                    Seguir explorando
                  </button>
                </Link>
                <a href="mailto:?subject=Mira%20PEYU%20Chile&body=Acabo%20de%20comprar%20regalos%20sostenibles%20en%20peyuchile.cl%20%F0%9F%90%A2">
                  <button className="px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-1.5 transition-all hover:bg-[#F0E8DE]"
                    style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}>
                    <Mail className="w-3.5 h-3.5" /> Compartir
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}