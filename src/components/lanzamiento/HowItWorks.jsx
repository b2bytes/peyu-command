// Cómo funciona — 4 pasos claros para ejecutivos ocupados.
import { MessageSquare, Palette, Factory, Truck } from 'lucide-react';

const STEPS = [
  { icon: MessageSquare, title: 'Cotizas', desc: 'WhatsApp, email o formulario. Respuesta en 4h hábiles con propuesta PDF.' },
  { icon: Palette, title: 'Personalizas', desc: 'Envías tu logo. Mockup en 24h. Grabado láser UV en cada pieza.' },
  { icon: Factory, title: 'Fabricamos', desc: '7 a 15 días según volumen. Materia prima reciclada trazable.' },
  { icon: Truck, title: 'Entregamos', desc: 'Despacho a todo Chile. Packaging neutro o con marca según acuerdo.' },
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-poppins">Un proceso de 4 pasos, sin fricción</h2>
          <p className="mt-3 text-slate-500">Desde el primer mensaje hasta la entrega en tu oficina.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={i} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-7 left-1/2 w-full h-[2px] bg-gradient-to-r from-emerald-300 to-emerald-100" />
              )}
              <div className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                  <s.icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-emerald-600 mb-1">PASO {i + 1}</p>
                <h3 className="font-semibold text-slate-900 text-lg">{s.title}</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}