import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, MessageCircle, Package, Sparkles, Heart } from 'lucide-react';
import SEO from '@/components/SEO';
import { trackPurchase } from '@/lib/analytics-peyu';
import NewsletterCTA from '@/components/newsletter/NewsletterCTA';

/**
 * Página post-checkout: punto crítico para tracking de conversión y reviews.
 * Se llega aquí después de pagar (Carrito.jsx redirige tras crear PedidoWeb).
 * - Dispara `purchase` en GA4 con el detalle del pedido
 * - Invita al cliente a seguir su pedido + recomendar
 * - Próximo paso del funnel: producto → carrito → gracias → review
 */
export default function Gracias() {
  const [params] = useSearchParams();
  const numero = params.get('numero') || '';
  const email = params.get('email') || '';
  const total = parseInt(params.get('total') || '0', 10);
  const mpStatus = params.get('mp') || ''; // success | pending | (vacío = otros medios)
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (tracked || !numero) return;
    // GA4: evento purchase con valor real
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
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 pb-20 lg:pb-0">
        <div className="max-w-2xl mx-auto px-5 py-14 sm:py-20">
          {/* Banner Mercado Pago (solo si vuelve de MP) */}
          {mpStatus === 'pending' && (
            <div className="mb-4 bg-amber-500/15 border border-amber-400/40 rounded-2xl p-4 text-center text-amber-100 text-sm">
              ⏳ <strong>Pago en proceso.</strong> Mercado Pago está procesando tu transacción. Te notificaremos por email apenas se confirme (puede tardar unos minutos).
            </div>
          )}
          {mpStatus === 'success' && (
            <div className="mb-4 bg-emerald-500/15 border border-emerald-400/40 rounded-2xl p-4 text-center text-emerald-100 text-sm">
              ✅ <strong>Pago aprobado por Mercado Pago.</strong> Tu pedido entró en preparación.
            </div>
          )}

          {/* Hero confirmación */}
          <div className="bg-white/5 backdrop-blur-md border border-teal-400/30 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-teal-500/40">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-poppins font-black text-white">¡Gracias por tu compra! 🐢</h1>
              <p className="text-white/60 mt-2 text-sm sm:text-base leading-relaxed">
                Tu pedido fue recibido con éxito.<br />
                Te enviamos la confirmación a <span className="text-teal-300 font-semibold">{email || 'tu email'}</span>.
              </p>
            </div>
            {numero && (
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2.5">
                <Package className="w-4 h-4 text-teal-300" />
                <span className="text-sm font-mono text-white">N° pedido: <strong className="text-teal-300">{numero}</strong></span>
              </div>
            )}
            {total > 0 && (
              <p className="text-white/70 text-sm">
                Total pagado: <span className="font-poppins font-bold text-white text-lg">${total.toLocaleString('es-CL')}</span>
              </p>
            )}
          </div>

          {/* Próximos pasos */}
          <div className="mt-6 bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="font-poppins font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" /> ¿Qué sigue?
            </h2>
            <ol className="space-y-3 text-sm text-white/75">
              {[
                ['1', 'Revisa tu email', 'Recibirás el detalle del pedido y la factura electrónica.'],
                ['2', 'Producción y despacho', 'Te avisamos cuando salga de fábrica con el código de tracking.'],
                ['3', 'Recibe tu PEYU', 'Tu regalo sostenible llegará en los plazos indicados al checkout.'],
              ].map(([n, t, d]) => (
                <li key={n} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-500/30 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold text-xs flex-shrink-0">{n}</span>
                  <div>
                    <p className="font-semibold text-white">{t}</p>
                    <p className="text-xs text-white/50 mt-0.5">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* CTAs */}
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Link to="/seguimiento" className="block">
              <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold gap-2 shadow-lg">
                <Package className="w-4 h-4" /> Seguir mi pedido
              </Button>
            </Link>
            <a
              href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, mi pedido es ${numero}`)}`}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Button className="w-full h-12 rounded-xl bg-green-500/25 hover:bg-green-500/40 border border-green-400/40 text-green-100 font-bold gap-2">
                <MessageCircle className="w-4 h-4" /> Consultar por WhatsApp
              </Button>
            </a>
          </div>

          {/* Newsletter — momento pico de afinidad post-compra (B2C) */}
          <div className="mt-6">
            <NewsletterCTA variant="gracias" defaultEmail={email} />
          </div>

          {/* Compartir / referido suave */}
          <div className="mt-8 bg-gradient-to-br from-teal-500/15 to-cyan-500/10 border border-teal-400/25 rounded-3xl p-6 text-center">
            <Heart className="w-7 h-7 text-pink-300 mx-auto mb-2" />
            <p className="font-poppins font-bold text-white">¿Te gustó la experiencia?</p>
            <p className="text-xs text-white/60 mt-1.5 mb-4">Cuéntale a tu equipo o tu empresa. Cada pedido nos ayuda a sacar más plástico del vertedero.</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Link to="/shop">
                <Button size="sm" variant="outline" className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Seguir explorando
                </Button>
              </Link>
              <a href="mailto:?subject=Mira%20PEYU%20Chile&body=Acabo%20de%20comprar%20regalos%20sostenibles%20en%20peyuchile.cl%20%F0%9F%90%A2">
                <Button size="sm" variant="outline" className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Compartir
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}