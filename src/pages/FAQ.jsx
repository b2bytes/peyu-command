import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import PublicHero from '@/components/public/PublicHero';
import PublicCTA from '@/components/public/PublicCTA';

const FAQS = [
  { q: '¿Los productos son realmente 100% reciclados?', a: 'Sí. Todos nuestros productos se fabrican con plástico 100% post-consumo reciclado en Chile. Puedes traer tu propio plástico a nuestras tiendas y te lo transformamos.' },
  { q: '¿Desde cuántas unidades personalizan con láser?', a: 'Personalización láser UV gratis desde 10 unidades. Para menores cantidades consulta el fee en /personalizar.' },
  { q: '¿Qué formato necesitan para el logo?', a: 'Archivos vectoriales: SVG, AI, EPS o PDF. Si solo tienes PNG/JPG podemos vectorizarlo (fee adicional).' },
  { q: '¿Cuánto tarda un pedido corporativo?', a: '10 a 15 días hábiles desde la aprobación del mockup y el pago del 50% de anticipo. Para pedidos urgentes hay modalidad Express (+12%).' },
  { q: '¿Hacen facturación electrónica?', a: 'Sí, emitimos factura electrónica SII con crédito fiscal. Se envía al correo del contacto registrado en el pedido.' },
  { q: '¿Puedo ver los productos antes de comprar?', a: 'Sí. Te invitamos a nuestras tiendas físicas en F. Bilbao 3775 (Providencia) y P. de Valdivia 6603 (Macul).' },
  { q: '¿Tienen garantía?', a: '10 años contra defectos de fábrica. No cubre mal uso ni desgaste por uso normal.' },
  { q: '¿Envían a regiones?', a: 'Sí, a todo Chile con Starken, Chilexpress, Blue Express y Correos. Plazos y tarifas en /envios.' },
  { q: '¿Qué medios de pago aceptan?', a: 'WebPay (Transbank), MercadoPago, transferencia, débito y crédito. B2B: transferencia con 50% anticipo y 50% contra entrega.' },
  { q: '¿Puedo devolver un producto personalizado?', a: 'No, salvo defecto de fábrica o error de grabado no imputable al cliente. Los productos sin personalizar tienen 10 días de retracto (Ley 19.496).' },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
      <SEO
        title="Preguntas Frecuentes | PEYU Chile"
        description="Respuestas sobre productos reciclados, personalización láser UV, envíos, pagos, garantías y más."
        canonical="https://peyuchile.cl/faq"
        jsonLd={jsonLd}
      />

      <PublicHero
        eyebrow="Soporte"
        title={<>Preguntas <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>frecuentes.</span></>}
        subtitle="Todo lo que necesitas saber antes de comprar."
      />

      <section className="px-4 sm:px-8 pb-10">
        <div className="max-w-3xl mx-auto space-y-2">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div
                key={i}
                className="ld-card overflow-hidden transition-all"
                style={open ? { borderColor: 'var(--ld-action)', boxShadow: 'var(--ld-shadow-md)' } : undefined}
              >
                <button
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  className="w-full flex items-center justify-between text-left px-5 py-4 active:scale-[0.99] transition"
                >
                  <span className="font-semibold text-sm sm:text-base text-ld-fg pr-4">{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--ld-action)' }}
                  />
                </button>
                {open && (
                  <div className="px-5 pb-5 text-sm text-ld-fg-soft leading-relaxed border-t border-ld-border pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA secundario inline: ¿No encontraste lo que buscas? */}
        <div className="max-w-3xl mx-auto mt-8">
          <div className="ld-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: 'var(--ld-action)' }}>
                ¿Algo más?
              </p>
              <p className="text-ld-fg font-semibold">¿No encontraste tu respuesta?</p>
              <p className="text-sm text-ld-fg-muted">Escríbenos por WhatsApp o al soporte.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a
                href="https://wa.me/56935040242?text=Hola%20PEYU"
                target="_blank"
                rel="noreferrer"
                className="ld-btn-primary inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm font-semibold text-white"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <Link to="/soporte" className="ld-btn-ghost inline-flex items-center rounded-full px-5 h-11 text-sm font-semibold text-ld-fg">
                Ir a soporte
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicCTA
        eyebrow="¿Listo?"
        title="Da el siguiente paso con propósito."
        highlight="con propósito."
        subtitle="Explora la tienda o cotiza un pedido B2B. Estamos para ayudarte."
      />
    </div>
  );
}