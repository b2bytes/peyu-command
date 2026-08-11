import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

// Preguntas frecuentes visibles de la campaña. El mismo contenido se inyecta
// como FAQPage en el <head>, así que lo que ve el cliente es exactamente lo
// que leen Google y los buscadores con IA.
export default function FiestasFAQ({ faqs, titulo = 'Preguntas frecuentes del 18' }) {
  const [open, setOpen] = useState(0);

  return (
    <section className="max-w-3xl mx-auto px-5 py-14">
      <h2 className="font-fraunces text-2xl sm:text-3xl text-center mb-8 flex items-center justify-center gap-2">
        <HelpCircle className="w-6 h-6" style={{ color: '#C0785C' }} /> {titulo}
      </h2>

      <div className="space-y-2.5">
        {faqs.map(({ q, a }, i) => {
          const abierto = open === i;
          return (
            <div key={q} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
              <button
                onClick={() => setOpen(abierto ? -1 : i)}
                className="w-full flex items-center gap-3 text-left px-5 py-4"
              >
                <h3 className="flex-1 font-bold text-sm sm:text-base">{q}</h3>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}
                  style={{ color: '#A8443A' }}
                />
              </button>
              {abierto && (
                <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: '#7A6050' }}>{a}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}