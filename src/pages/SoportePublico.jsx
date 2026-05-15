import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, MessageCircle, Search, CheckCircle2, Send, Mail, MapPin } from 'lucide-react';
import SEO from '@/components/SEO';
import { combineSchemas, buildOrganizationSchema, buildBreadcrumbSchema } from '@/lib/schemas-peyu';
import PublicHero from '@/components/public/PublicHero';

const FAQS = [
  {
    categoria: '📦 Pedidos',
    items: [
      { q: '¿Cuánto demora un pedido corporativo?', a: 'Un pedido corporativo promedio demora 7 días hábiles desde la confirmación. Si usas tu propio plástico, suma hasta 3 días adicionales para la validación de la muestra.' },
      { q: '¿Cuándo llega mi pedido B2C?', a: 'Los pedidos de tienda online se despachan en 2–5 días hábiles. Envío gratis en compras sobre $40.000 CLP.' },
      { q: '¿Cómo hago seguimiento de mi pedido?', a: 'Una vez despachado, recibirás un número de seguimiento por email. También puedes escribirnos al WhatsApp +56 9 3504 0242 con tu número de pedido.' },
      { q: '¿Puedo cambiar o cancelar un pedido?', a: 'Puedes cancelar hasta 24 horas después de hacer el pedido. Escríbenos de inmediato a ventas@peyuchile.cl o WhatsApp.' },
    ]
  },
  {
    categoria: '✨ Personalización',
    items: [
      { q: '¿Cuánto cuesta la personalización con láser?', a: 'La personalización láser UV es GRATIS desde 10 unidades en pedidos corporativos. Para pedidos menores tiene un costo adicional según el tiempo de grabado.' },
      { q: '¿Qué formatos de logo aceptan?', a: 'Aceptamos PNG, SVG y PDF con fondo transparente. Tamaño máximo 10MB. Si el logo no es válido, te pediremos uno nuevo antes de producir.' },
      { q: '¿Puedo ver un preview de cómo quedará mi logo?', a: 'Sí. Para cotizaciones B2B generamos un mockup en menos de 30 minutos. Sube tu logo en el formulario corporativo y lo adjuntamos a la propuesta.' },
      { q: '¿Cuántos productos puedo personalizar por día?', a: 'Tenemos 2 láseres galvo UV en nuestras tiendas, con capacidad para hasta 3.000 productos diarios.' },
    ]
  },
  {
    categoria: '♻️ Materiales y Calidad',
    items: [
      { q: '¿De qué están hechos los productos?', a: 'Los productos de escritorio, cachos, maceteros y lámparas están fabricados con plástico 100% reciclado post-consumo (PET, HDPE) en nuestra fábrica en Santiago. Las carcasas de celular son de fibra de trigo compostable.' },
      { q: '¿Cuál es la garantía de los productos?', a: 'Garantía de 2 años en carcasas de celular. Garantía de 10 años en todos los productos de plástico reciclado.' },
      { q: '¿Puedo reciclar nuevamente los productos?', a: 'Sí. Los productos de plástico reciclado son 100% reciclables nuevamente. Te recomendamos depositarlos en tu punto limpio más cercano.' },
    ]
  },
  {
    categoria: '🏢 Corporativo B2B',
    items: [
      { q: '¿Cuál es el mínimo para pedidos corporativos?', a: 'No tenemos mínimo de unidades. La personalización láser es gratis desde 10 unidades. El packaging personalizado tiene un mínimo de 50 unidades.' },
      { q: '¿Pueden usar el plástico de nuestra empresa?', a: 'Sí. Procesamos PP, HDPE, LDPE y PS. El cliente debe enviar primero una muestra para validación (proceso de 24–72 horas).' },
      { q: '¿En cuánto tiempo envían una cotización?', a: 'Respondemos en menos de 24 horas con una propuesta que incluye precios, opciones y mockup con tu logo. Para urgencias, escríbenos al WhatsApp.' },
    ]
  },
  {
    categoria: '💳 Pagos y Devoluciones',
    items: [
      { q: '¿Qué medios de pago aceptan?', a: 'Aceptamos WebPay (tarjetas de crédito y débito), transferencia bancaria y efectivo en tienda.' },
      { q: '¿Cómo funciona la política de devoluciones?', a: 'Tienes 30 días desde la compra para devolver el producto en su embalaje original sin usar.' },
      { q: '¿Qué hago si recibí un producto defectuoso?', a: 'Escríbenos a ventas@peyuchile.cl o WhatsApp con fotos del producto y número de pedido. Resolvemos en 48 horas.' },
    ]
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ld-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 py-3.5 text-left active:scale-[0.99] transition px-3 rounded-xl hover:bg-ld-bg-soft"
      >
        <span className="font-medium text-sm text-ld-fg-soft">{item.q}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ld-action)' }} />
        ) : (
          <ChevronRight className="w-4 h-4 text-ld-fg-muted flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3.5">
          <p className="text-sm text-ld-fg-muted leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function SoportePublico() {
  const [search, setSearch] = useState('');
  const [ticketForm, setTicketForm] = useState({ nombre: '', email: '', mensaje: '', tipo: 'Pregunta General' });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const filteredFaqs = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(i => !search || i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  const enviarTicket = async () => {
    if (!ticketForm.nombre || !ticketForm.email || !ticketForm.mensaje) { alert('Completa todos los campos'); return; }
    setEnviando(true);
    await base44.entities.Consulta.create({ nombre: ticketForm.nombre, email: ticketForm.email, mensaje: ticketForm.mensaje, tipo: ticketForm.tipo, estado: 'Sin responder', canal: 'Web', telefono: '' });
    await base44.integrations.Core.SendEmail({ to: 'ventas@peyuchile.cl', from_name: 'Soporte Web Peyu', subject: `Nueva consulta web: ${ticketForm.tipo} — ${ticketForm.nombre}`, body: `Nombre: ${ticketForm.nombre}\nEmail: ${ticketForm.email}\nTipo: ${ticketForm.tipo}\n\nMensaje:\n${ticketForm.mensaje}` });
    setEnviado(true);
    setEnviando(false);
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.flatMap(c => c.items).map(it => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
  const soporteJsonLd = combineSchemas(
    buildOrganizationSchema(),
    buildBreadcrumbSchema([
      { name: 'Inicio', url: 'https://peyuchile.cl/' },
      { name: 'Soporte', url: 'https://peyuchile.cl/soporte' },
    ]),
    faqJsonLd,
  );

  const CHANNELS = [
    { icon: MessageCircle, title: 'WhatsApp', desc: 'Respuesta en menos de 2 horas', cta: 'Chatear ahora', href: 'https://wa.me/56935040242', accent: '#22c55e' },
    { icon: Mail, title: 'Email', desc: 'ventas@peyuchile.cl', cta: 'Enviar email', href: 'mailto:ventas@peyuchile.cl', accent: 'var(--ld-action)' },
    { icon: MapPin, title: 'Tiendas', desc: 'F. Bilbao 3775 · P. Valdivia 6603', cta: 'Ver horarios', href: '/contacto', accent: 'var(--ld-highlight)' },
  ];

  return (
    <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
      <SEO
        title="Centro de Ayuda PEYU · Soporte, FAQ y Contacto Directo"
        description="Resuelve dudas sobre pedidos, personalización láser, materiales y devoluciones. Atención por WhatsApp, email y tiendas físicas en Providencia y Macul."
        canonical="https://peyuchile.cl/soporte"
        jsonLd={soporteJsonLd}
      />

      <PublicHero
        eyebrow="Centro de Ayuda"
        align="center"
        title={<>¿En qué te <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>ayudamos?</span></>}
        subtitle="Respuestas a las preguntas más frecuentes sobre PEYU Chile."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 space-y-8">
        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-ld-fg-muted z-10" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en preguntas frecuentes..."
            className="ld-input pl-11 h-12 rounded-full text-sm bg-transparent border-ld-border text-ld-fg placeholder:text-ld-fg-subtle"
          />
        </div>

        {/* Canales rápidos */}
        <div className="grid md:grid-cols-3 gap-4">
          {CHANNELS.map((c, i) => {
            const Icon = c.icon;
            return (
              <a
                key={i}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : '_self'}
                rel="noreferrer"
                className="ld-card p-6 text-center hover:-translate-y-1 transition-all group"
              >
                <div
                  className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: `${c.accent}1f`, boxShadow: `inset 0 0 0 1px ${c.accent}` }}
                >
                  <Icon className="w-6 h-6" style={{ color: c.accent }} />
                </div>
                <h3 className="ld-display text-xl text-ld-fg">{c.title}</h3>
                <p className="text-xs text-ld-fg-muted mt-1 mb-3 leading-relaxed">{c.desc}</p>
                <span className="text-xs font-bold rounded-full px-3 py-1.5 inline-block" style={{ color: c.accent, background: `${c.accent}1f` }}>{c.cta} →</span>
              </a>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredFaqs.map((cat, i) => (
            <div key={i} className="ld-card p-5">
              <h3 className="ld-display text-xl text-ld-fg mb-3">{cat.categoria}</h3>
              <div>{cat.items.map((item, j) => <FAQItem key={j} item={item} />)}</div>
            </div>
          ))}
          {filteredFaqs.length === 0 && (
            <div className="col-span-2 text-center py-16 ld-card">
              <p className="font-semibold text-ld-fg">No encontramos resultados para "{search}"</p>
              <p className="text-sm text-ld-fg-muted mt-1">Intenta con otras palabras o contáctanos.</p>
            </div>
          )}
        </div>

        {/* Ticket Form */}
        <div className="ld-card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' }}
            >
              <Send className="w-5 h-5" style={{ color: 'var(--ld-action)' }} />
            </div>
            <div>
              <h3 className="ld-display text-xl text-ld-fg">¿No encontraste lo que buscas?</h3>
              <p className="text-sm text-ld-fg-muted">Te respondemos en menos de 24 horas.</p>
            </div>
          </div>

          {enviado ? (
            <div className="text-center py-10 space-y-4">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto"
                style={{ background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--ld-action)' }} />
              </div>
              <p className="ld-display text-2xl text-ld-fg">¡Mensaje enviado!</p>
              <p className="text-sm text-ld-fg-muted max-w-xs mx-auto">Te responderemos a la brevedad. También puedes escribirnos al WhatsApp para una respuesta más rápida.</p>
              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                <Button className="ld-btn-primary gap-2 rounded-full mt-2 text-white">
                  <MessageCircle className="w-4 h-4" /> Ir a WhatsApp
                </Button>
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Nombre *', key: 'nombre', placeholder: 'Tu nombre' },
                { label: 'Email *', key: 'email', placeholder: 'tu@email.com', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-ld-fg-muted uppercase tracking-[0.18em] block mb-1.5">{f.label}</label>
                  <Input
                    type={f.type || 'text'}
                    value={ticketForm[f.key]}
                    onChange={e => setTicketForm({ ...ticketForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="ld-input h-11 text-sm rounded-full bg-transparent text-ld-fg placeholder:text-ld-fg-subtle"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-ld-fg-muted uppercase tracking-[0.18em] block mb-1.5">Tipo de consulta</label>
                <select
                  value={ticketForm.tipo}
                  onChange={e => setTicketForm({ ...ticketForm, tipo: e.target.value })}
                  className="ld-input w-full h-11 px-4 text-sm bg-transparent text-ld-fg focus:outline-none rounded-full border border-ld-border"
                >
                  {['Pregunta General', 'Cotización Corporativa', 'Estado Pedido', 'Personalización Tienda', 'Compra Individual'].map(t => (
                    <option key={t} value={t} style={{ background: 'var(--ld-bg)', color: 'var(--ld-fg)' }}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-ld-fg-muted uppercase tracking-[0.18em] block mb-1.5">Mensaje *</label>
                <textarea
                  value={ticketForm.mensaje}
                  onChange={e => setTicketForm({ ...ticketForm, mensaje: e.target.value })}
                  placeholder="Cuéntanos en qué podemos ayudarte..."
                  className="w-full ld-input bg-transparent text-ld-fg placeholder:text-ld-fg-subtle px-4 py-3 text-sm resize-none h-24 rounded-2xl focus:outline-none border border-ld-border"
                />
              </div>
              <div className="md:col-span-2 flex gap-3 flex-wrap">
                <Button onClick={enviarTicket} disabled={enviando} className="ld-btn-primary gap-2 rounded-full font-semibold text-white">
                  {enviando ? 'Enviando...' : 'Enviar consulta'}
                </Button>
                <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                  <Button className="ld-btn-ghost gap-2 rounded-full text-ld-fg">
                    <MessageCircle className="w-4 h-4" /> WhatsApp (más rápido)
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}