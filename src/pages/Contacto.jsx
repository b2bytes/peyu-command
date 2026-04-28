import SEO from '@/components/SEO';
import { MessageCircle, Mail, MapPin, Phone, Clock } from 'lucide-react';

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
    <div className="bg-white text-slate-800">
      <SEO
        title="Contacto | PEYU Chile - Regalos Corporativos Sostenibles"
        description="Contáctanos por WhatsApp, email o visítanos en Providencia y Macul. Respuesta en menos de 24 horas."
        canonical="https://peyuchile.cl/contacto"
        jsonLd={jsonLd}
      />
      <div className="max-w-5xl mx-auto px-5 py-14">
        <h1 className="font-poppins text-3xl font-black text-slate-900 mb-2">Contacto</h1>
        <p className="text-slate-600 mb-10">Estamos aquí para ayudarte. Respondemos en menos de 24 horas hábiles.</p>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          <a href="https://wa.me/56935040242?text=Hola%20Peyu" target="_blank" rel="noreferrer"
            className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 hover:scale-[1.02] transition-transform">
            <MessageCircle className="w-8 h-8 mb-3" />
            <h3 className="font-poppins font-bold text-lg">WhatsApp</h3>
            <p className="text-sm opacity-90 mt-1">+56 9 3504 0242</p>
            <p className="text-xs opacity-75 mt-2">La vía más rápida · Chat directo</p>
          </a>
          <a href="mailto:ventas@peyuchile.cl"
            className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white rounded-2xl p-6 hover:scale-[1.02] transition-transform">
            <Mail className="w-8 h-8 mb-3" />
            <h3 className="font-poppins font-bold text-lg">Email comercial</h3>
            <p className="text-sm opacity-90 mt-1">ventas@peyuchile.cl</p>
            <p className="text-xs opacity-75 mt-2">Cotizaciones B2B · Facturación</p>
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="border border-slate-200 rounded-2xl p-6">
            <MapPin className="w-6 h-6 text-teal-700 mb-2" />
            <h4 className="font-bold mb-1">Tienda Providencia</h4>
            <p className="text-sm text-slate-600">F. Bilbao 3775, Providencia, Santiago</p>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Lun–Vie 10:00–19:00 · Sáb 11:00–14:00</p>
          </div>
          <div className="border border-slate-200 rounded-2xl p-6">
            <MapPin className="w-6 h-6 text-teal-700 mb-2" />
            <h4 className="font-bold mb-1">Tienda Macul</h4>
            <p className="text-sm text-slate-600">P. de Valdivia 6603, Macul, Santiago</p>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Lun–Vie 10:00–19:00 · Sáb 11:00–14:00</p>
          </div>
        </div>

        <div className="mt-10 p-5 bg-slate-50 rounded-2xl text-sm text-slate-600 flex items-center gap-3">
          <Phone className="w-5 h-5 text-teal-700 flex-shrink-0" />
          <span>¿Prefieres que te llamemos? Déjanos tu número por WhatsApp o email y agendamos.</span>
        </div>
      </div>
    </div>
  );
}