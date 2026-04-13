import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, MessageCircle, Search, CheckCircle2, ArrowLeft } from 'lucide-react';

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
      { q: '¿Cuál es la garantía de los productos?', a: 'Garantía de 2 años en carcasas de celular. Garantía de 10 años en todos los productos de plástico reciclado (cachos, maceteros, posavasos, lámparas, soportes).' },
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
      { q: '¿Cómo funciona la política de devoluciones?', a: 'Tienes 30 días desde la compra para devolver el producto en su embalaje original sin usar. El costo de envío de la devolución corre por cuenta del cliente.' },
      { q: '¿Qué hago si recibí un producto defectuoso?', a: 'Escríbenos a ventas@peyuchile.cl o WhatsApp con fotos del producto y número de pedido. Resolvemos en 48 horas.' },
    ]
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 py-4 text-left hover:bg-gray-50 px-3 rounded-xl transition-colors">
        <span className="font-medium text-sm text-gray-800">{item.q}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-3 pb-4">
          <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
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
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-4">
          <Link to="/" className="group">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </Link>
          <div>
            <h1 className="font-poppins font-bold text-gray-900">Centro de Ayuda</h1>
            <p className="text-xs text-gray-400">Peyu Chile · Soporte</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-gray-900">¿En qué te ayudamos?</h2>
          <p className="text-gray-400 text-sm">Respuestas a las preguntas más frecuentes sobre Peyu Chile</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar en preguntas frecuentes..."
              className="pl-11 h-12 rounded-2xl text-sm bg-white shadow-sm border-gray-200 focus:ring-2 focus:ring-[#0F8B6C]/20" />
          </div>
        </div>

        {/* FAQs */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredFaqs.map((cat, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-poppins font-bold text-gray-900 mb-3">{cat.categoria}</h3>
              <div>{cat.items.map((item, j) => <FAQItem key={j} item={item} />)}</div>
            </div>
          ))}
          {filteredFaqs.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-400 bg-white rounded-3xl border border-gray-100">
              <p className="font-medium">No encontramos resultados para "{search}"</p>
              <p className="text-sm mt-1">Intenta con otras palabras o contáctanos.</p>
            </div>
          )}
        </div>

        {/* Contacto directo */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '💬', title: 'WhatsApp', desc: 'Respuesta en menos de 2 horas', cta: 'Chatear ahora', href: 'https://wa.me/56935040242', color: '#25D366' },
            { icon: '📧', title: 'Email', desc: 'ventas@peyuchile.cl', cta: 'Enviar email', href: 'mailto:ventas@peyuchile.cl', color: '#0F8B6C' },
            { icon: '📍', title: 'Tiendas', desc: 'F. Bilbao 3775 · P. Valdivia 6603', cta: 'Ver horarios', href: '/shop', color: '#D96B4D' },
          ].map((c, i) => (
            <a key={i} href={c.href} target={c.href.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 text-center block group">
              <div className="text-4xl mb-3">{c.icon}</div>
              <h3 className="font-poppins font-bold text-gray-900">{c.title}</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4 leading-relaxed">{c.desc}</p>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ color: c.color, background: c.color + '15' }}>{c.cta} →</span>
            </a>
          ))}
        </div>

        {/* Formulario de ticket */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="font-poppins font-bold text-xl text-gray-900 mb-1">¿No encontraste lo que buscas?</h3>
          <p className="text-sm text-gray-400 mb-6">Envíanos un mensaje y te respondemos en menos de 24 horas.</p>

          {enviado ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-poppins font-bold text-gray-900 text-lg">¡Mensaje enviado!</p>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">Te responderemos a la brevedad. También puedes escribirnos al WhatsApp para una respuesta más rápida.</p>
              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                <Button className="gap-2 rounded-xl mt-2" style={{ backgroundColor: '#25D366' }}>
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
                  <label className="text-xs font-semibold text-gray-400 block mb-1.5">{f.label}</label>
                  <Input type={f.type || 'text'} value={ticketForm[f.key]}
                    onChange={e => setTicketForm({ ...ticketForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Tipo de consulta</label>
                <select value={ticketForm.tipo} onChange={e => setTicketForm({ ...ticketForm, tipo: e.target.value })}
                  className="w-full h-11 border border-gray-200 rounded-xl px-3 text-sm bg-gray-50">
                  {['Pregunta General', 'Cotización Corporativa', 'Estado Pedido', 'Personalización Tienda', 'Compra Individual'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Mensaje *</label>
                <textarea value={ticketForm.mensaje} onChange={e => setTicketForm({ ...ticketForm, mensaje: e.target.value })}
                  placeholder="Cuéntanos en qué podemos ayudarte..."
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-[#0F8B6C]/20 focus:bg-white transition" />
              </div>
              <div className="md:col-span-2 flex gap-3 flex-wrap">
                <Button onClick={enviarTicket} disabled={enviando}
                  className="gap-2 rounded-xl font-semibold" style={{ backgroundColor: '#0F8B6C' }}>
                  {enviando ? 'Enviando...' : 'Enviar consulta'}
                </Button>
                <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                  <Button variant="outline" className="gap-2 rounded-xl">
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