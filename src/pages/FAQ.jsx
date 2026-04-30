import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SEO from '@/components/SEO';

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
    <div className="bg-white text-slate-800 pb-20 lg:pb-0">
      <SEO
        title="Preguntas Frecuentes | PEYU Chile"
        description="Respuestas sobre productos reciclados, personalización láser UV, envíos, pagos, garantías y más."
        canonical="https://peyuchile.cl/faq"
        jsonLd={jsonLd}
      />
      <div className="max-w-3xl mx-auto px-5 py-14">
        <h1 className="font-poppins text-3xl font-black text-slate-900 mb-2">Preguntas Frecuentes</h1>
        <p className="text-slate-600 mb-8">Todo lo que necesitas saber antes de comprar</p>

        <div className="space-y-2">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  className="w-full flex items-center justify-between text-left px-4 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-sm sm:text-base">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}