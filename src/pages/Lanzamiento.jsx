// ============================================================================
// /lanzamiento — Landing de pure conversion para campañas Google Ads
// ----------------------------------------------------------------------------
// No toca el landing principal (/). Diseñada para tráfico pagado B2B.
// Incluye Schema.org Organization + FAQPage + BreadcrumbList para rich snippets.
// ============================================================================
import { useEffect, useRef } from 'react';
import SEO from '@/components/SEO';
import HeroBlitz from '@/components/lanzamiento/HeroBlitz';
import SocialProof from '@/components/lanzamiento/SocialProof';
import HowItWorks from '@/components/lanzamiento/HowItWorks';
import LeadForm from '@/components/lanzamiento/LeadForm';
import FaqSection, { LAUNCH_FAQS } from '@/components/lanzamiento/FaqSection';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  combineSchemas,
} from '@/lib/schemas-peyu';
import { base44 } from '@/api/base44Client';

export default function Lanzamiento() {
  const formRef = useRef(null);

  // Capturar UTM params para atribuir la conversión al canal correcto
  const utm = (() => {
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_term: p.get('utm_term') || '',
      utm_content: p.get('utm_content') || '',
    };
  })();

  // Track visita como analítica PEYU (para medir CVR real de la landing)
  useEffect(() => {
    try {
      base44.analytics.track({
        eventName: 'lanzamiento_landing_view',
        properties: {
          utm_source: utm.utm_source || 'direct',
          utm_campaign: utm.utm_campaign || 'none',
        },
      });
    } catch {}
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const jsonLd = combineSchemas(
    buildOrganizationSchema(),
    buildWebSiteSchema(),
    buildBreadcrumbSchema([
      { name: 'Inicio', url: 'https://peyuchile.cl/' },
      { name: 'Cotización B2B', url: 'https://peyuchile.cl/lanzamiento' },
    ]),
    buildFaqSchema(LAUNCH_FAQS),
  );

  return (
    <>
      <SEO
        title="Regalos Corporativos 100% Reciclados · Cotiza en 4h · PEYU Chile"
        description="Fabricante chileno de regalos corporativos sostenibles. Grabado láser con tu logo, materia prima 100% reciclada, entregas 7-15 días. Cotización B2B en 4 horas hábiles."
        canonical="https://peyuchile.cl/lanzamiento"
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-white">
        <HeroBlitz onCta={scrollToForm} />
        <SocialProof />
        <HowItWorks />

        {/* Form section */}
        <section ref={formRef} className="py-20 bg-gradient-to-b from-emerald-50/50 to-white">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-poppins">
                Pide tu cotización ahora
              </h2>
              <p className="mt-3 text-slate-500">Respuesta en <strong className="text-emerald-700">4 horas hábiles</strong>. Sin costo ni compromiso.</p>
            </div>
            <LeadForm utm={utm} />
          </div>
        </section>

        <FaqSection />

        {/* Footer minimal de la landing (sin distraer) */}
        <footer className="py-10 bg-slate-900 text-slate-400 text-center text-sm">
          <div className="max-w-6xl mx-auto px-6 space-y-2">
            <p className="font-semibold text-white">PEYU Chile · Fábrica de impacto</p>
            <p>ti@peyuchile.cl · Santiago, Chile</p>
            <div className="flex gap-4 justify-center text-xs pt-2">
              <a href="/privacidad" className="hover:text-white">Privacidad</a>
              <a href="/terminos" className="hover:text-white">Términos</a>
              <a href="/" className="hover:text-white">Sitio principal</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}