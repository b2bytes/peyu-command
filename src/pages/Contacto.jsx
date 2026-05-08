import SEO from '@/components/SEO';
import { MessageCircle, Mail, MapPin, Phone, Clock } from 'lucide-react';
import PublicHero from '@/components/public/PublicHero';
import PublicCTA from '@/components/public/PublicCTA';

export default function Contacto() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'PEYU Chile',
    image: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
    telephone: '+56935040242',
    email: 'ventas@peyuchile.cl',
    address: [
      { '@type': 'PostalAddress', streetAddress: 'F. Bilbao 3775', addressLocality: 'Providencia', addressRegion: 'RM', addressCountry: 'CL' },
      { '@type': 'PostalAddress', streetAddress: 'P. de Valdivia 6603', addressLocality: 'Macul', addressRegion: 'RM', addressCountry: 'CL' },
    ],
    openingHours: 'Mo-Fr 10:00-19:00 Sa 11:00-14:00',
    url: 'https://peyuchile.cl',
  };

  return (
    <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
      <SEO
        title="Contacto | PEYU Chile - Regalos Corporativos Sostenibles"
        description="Contáctanos por WhatsApp, email o visítanos en Providencia y Macul. Respuesta en menos de 24 horas."
        canonical="https://peyuchile.cl/contacto"
        jsonLd={jsonLd}
      />

      <PublicHero
        eyebrow="Contacto"
        title={<>Hablemos. <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>De verdad.</span></>}
        subtitle="Estamos aquí para ayudarte. Respondemos en menos de 24 horas hábiles."
      />

      {/* Canales primarios */}
      <section className="px-4 sm:px-8 pb-10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4">
          <a
            href="https://wa.me/56935040242?text=Hola%20Peyu"
            target="_blank"
            rel="noreferrer"
            className="ld-card group p-7 hover:-translate-y-1 transition-all relative overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-50"
              style={{ background: 'rgba(34,197,94,0.25)' }}
            />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.18)' }}>
                <MessageCircle className="w-6 h-6" style={{ color: '#22c55e' }} />
              </div>
              <h3 className="ld-display text-2xl text-ld-fg">WhatsApp</h3>
              <p className="text-ld-fg-soft text-sm mt-1">+56 9 3504 0242</p>
              <p className="text-xs text-ld-fg-muted mt-3">La vía más rápida · Chat directo</p>
            </div>
          </a>

          <a
            href="mailto:ventas@peyuchile.cl"
            className="ld-card group p-7 hover:-translate-y-1 transition-all relative overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-60"
              style={{ background: 'var(--ld-action-soft)' }}
            />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--ld-action-soft)' }}>
                <Mail className="w-6 h-6" style={{ color: 'var(--ld-action)' }} />
              </div>
              <h3 className="ld-display text-2xl text-ld-fg">Email comercial</h3>
              <p className="text-ld-fg-soft text-sm mt-1">ventas@peyuchile.cl</p>
              <p className="text-xs text-ld-fg-muted mt-3">Cotizaciones B2B · Facturación</p>
            </div>
          </a>
        </div>
      </section>

      {/* Tiendas físicas */}
      <section className="px-4 sm:px-8 pb-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-3" style={{ color: 'var(--ld-action)' }}>
            Tiendas físicas
          </p>
          <h2 className="ld-display text-3xl text-ld-fg mb-6">Visítanos en Santiago</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'Tienda Providencia', addr: 'F. Bilbao 3775, Providencia, Santiago' },
              { name: 'Tienda Macul', addr: 'P. de Valdivia 6603, Macul, Santiago' },
            ].map((s, i) => (
              <div key={i} className="ld-card p-6">
                <MapPin className="w-6 h-6 mb-2" style={{ color: 'var(--ld-highlight)' }} />
                <h4 className="font-bold text-ld-fg mb-1">{s.name}</h4>
                <p className="text-sm text-ld-fg-soft">{s.addr}</p>
                <p className="text-xs text-ld-fg-muted mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Lun–Vie 10:00–19:00 · Sáb 11:00–14:00
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Llamada telefónica info */}
      <section className="px-4 sm:px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="ld-glass p-5 rounded-2xl flex items-center gap-3 text-sm text-ld-fg-soft">
            <Phone className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--ld-action)' }} />
            <span>¿Prefieres que te llamemos? Déjanos tu número por WhatsApp o email y agendamos.</span>
          </div>
        </div>
      </section>

      <PublicCTA
        eyebrow="Próximo paso"
        title="¿Listo para regalar con propósito?"
        highlight="con propósito?"
      />
    </div>
  );
}