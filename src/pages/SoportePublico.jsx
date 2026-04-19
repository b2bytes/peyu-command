import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, MessageCircle, Search, CheckCircle2, ArrowLeft, HelpCircle, Send } from 'lucide-react';
import MobileMenu from '@/components/MobileMenu';

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
    <div className="border-b border-white/10 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 py-4 text-left hover:bg-white/5 px-3 rounded-xl transition-colors">
        <span className="font-medium text-sm text-white/80">{item.q}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-teal-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-3 pb-4">
          <p className="text-sm text-white/55 leading-relaxed">{item.a}</p>
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
    await base44.entities.Consulta.create({ nombre: ticketForm.nombre, mensaje: ticketForm.mensaje, tipo: ticketForm.tipo, estado: 'Sin responder', canal: 'Web', telefono: '' });
    await base44.integrations.Core.SendEmail({ to: 'ventas@peyuchile.cl', from_name: 'Soporte Web Peyu', subject: `Nueva consulta web: ${ticketForm.tipo} — ${ticketForm.nombre}`, body: `Nombre: ${ticketForm.nombre}\nEmail: ${ticketForm.email}\nTipo: ${ticketForm.tipo}\n\nMensaje:\n${ticketForm.mensaje}` });
    setEnviado(true);
    setEnviando(false);
  };

  return (
    <div className="flex-1 overflow-auto font-inter">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border-b border-white/20 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-40 backdrop-blur-md">
          <MobileMenu items={MENU_ITEMS} />
          <Link to="/" className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div>
            <p className="font-poppins font-bold text-white text-sm leading-none">Centro de Ayuda</p>
            <p className="text-[10px] text-white/60 leading-none mt-0.5">Peyu Chile · Soporte</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

          {/* Hero + Search */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/40 text-teal-300 px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
              <HelpCircle className="w-4 h-4" /> Centro de Ayuda
            </div>
            <h1 className="text-3xl md:text-5xl font-poppins font-black text-white drop-shadow-lg">¿En qué te <span className="text-cyan-400">ayudamos?</span></h1>
            <p className="text-white/60 text-sm">Respuestas a las preguntas más frecuentes sobre Peyu Chile</p>
            <div className="relative max-w-lg mx-auto">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar en preguntas frecuentes..."
                className="pl-11 h-12 rounded-2xl text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-teal-400/60 focus:ring-teal-400/30" />
            </div>
          </div>

          {/* Canales rápidos */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '💬', title: 'WhatsApp', desc: 'Respuesta en menos de 2 horas', cta: 'Chatear ahora', href: 'https://wa.me/56935040242', color: '#22c55e' },
              { icon: '📧', title: 'Email', desc: 'ventas@peyuchile.cl', cta: 'Enviar email', href: 'mailto:ventas@peyuchile.cl', color: '#2dd4bf' },
              { icon: '📍', title: 'Tiendas', desc: 'F. Bilbao 3775 · P. Valdivia 6603', cta: 'Ver horarios', href: '/shop', color: '#f97316' },
            ].map((c, i) => (
              <a key={i} href={c.href} target={c.href.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
                className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-3xl p-6 hover:bg-white/10 hover:-translate-y-1 transition-all text-center block group shadow-lg">
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="font-poppins font-bold text-white">{c.title}</h3>
                <p className="text-xs text-white/50 mt-1 mb-4 leading-relaxed">{c.desc}</p>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ color: c.color, background: c.color + '20' }}>{c.cta} →</span>
              </a>
            ))}
          </div>

          {/* FAQs */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredFaqs.map((cat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-5 shadow-lg hover:bg-white/8 transition-all">
                <h3 className="font-poppins font-bold text-white mb-3">{cat.categoria}</h3>
                <div>{cat.items.map((item, j) => <FAQItem key={j} item={item} />)}</div>
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="col-span-2 text-center py-16 text-white/50 bg-white/5 border border-white/15 rounded-3xl backdrop-blur-sm">
                <p className="font-medium text-white">No encontramos resultados para "{search}"</p>
                <p className="text-sm mt-1">Intenta con otras palabras o contáctanos.</p>
              </div>
            )}
          </div>

          {/* Ticket Form */}
          <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                <Send className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="font-poppins font-bold text-white text-lg">¿No encontraste lo que buscas?</h3>
                <p className="text-sm text-white/50">Te respondemos en menos de 24 horas.</p>
              </div>
            </div>

            {enviado ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-teal-500/20 border border-teal-400/30 rounded-3xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-teal-400" />
                </div>
                <p className="font-poppins font-bold text-white text-lg">¡Mensaje enviado!</p>
                <p className="text-sm text-white/50 max-w-xs mx-auto">Te responderemos a la brevedad. También puedes escribirnos al WhatsApp para una respuesta más rápida.</p>
                <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                  <Button className="gap-2 rounded-xl mt-2 bg-green-500 hover:bg-green-600 text-white border-0">
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
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block mb-1.5">{f.label}</label>
                    <Input type={f.type || 'text'} value={ticketForm[f.key]}
                      onChange={e => setTicketForm({ ...ticketForm, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="h-11 text-sm rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:bg-white/15 focus:border-teal-400/60" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block mb-1.5">Tipo de consulta</label>
                  <select value={ticketForm.tipo} onChange={e => setTicketForm({ ...ticketForm, tipo: e.target.value })}
                    className="w-full h-11 border border-white/20 rounded-xl px-3 text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/60">
                    {['Pregunta General', 'Cotización Corporativa', 'Estado Pedido', 'Personalización Tienda', 'Compra Individual'].map(t => (
                      <option key={t} value={t} className="bg-slate-900">{t}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wide block mb-1.5">Mensaje *</label>
                  <textarea value={ticketForm.mensaje} onChange={e => setTicketForm({ ...ticketForm, mensaje: e.target.value })}
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                    className="w-full border border-white/20 bg-white/10 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/60 transition" />
                </div>
                <div className="md:col-span-2 flex gap-3 flex-wrap">
                  <Button onClick={enviarTicket} disabled={enviando}
                    className="gap-2 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-teal-500/20">
                    {enviando ? 'Enviando...' : 'Enviar consulta'}
                  </Button>
                  <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                    <Button className="gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30">
                      <MessageCircle className="w-4 h-4" /> WhatsApp (más rápido)
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="pb-8" />
        </div>
    </div>
  );
}