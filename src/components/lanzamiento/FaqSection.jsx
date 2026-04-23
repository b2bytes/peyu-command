// FAQ con preguntas exactas que hacen los compradores B2B.
// Las mismas preguntas se exponen como FAQPage schema.org (rich snippet).
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const LAUNCH_FAQS = [
  { q: '¿Cuál es el MOQ (pedido mínimo)?', a: 'MOQ de 50 unidades para productos estándar y 100 para personalización láser. Bajo ciertas categorías podemos hacer 25 con fee adicional.' },
  { q: '¿En cuánto tiempo entregan?', a: 'Sin personalización: 7 días hábiles. Con personalización láser: 10-15 días hábiles desde aprobación del mockup. Contamos con proceso express (+12%) cuando el cliente lo necesita.' },
  { q: '¿Qué materiales usan?', a: 'Plástico 100% reciclado post-consumo (botellas PET, tapas HDPE) y fibra de trigo compostable. Contamos con certificación GRS (Global Recycled Standard).' },
  { q: '¿Hacen factura electrónica?', a: 'Sí, SII al día. Emitimos factura electrónica, aceptamos orden de compra y transferencia. Pago habitual: 50% anticipo, 50% contra entrega.' },
  { q: '¿Puedo ver un mockup antes de pagar?', a: 'Sí. Entregamos mockup 3D gratis dentro de 24h de recibido tu logo vectorizado. Recién aprobado el mockup iniciamos producción.' },
  { q: '¿Despachan a regiones?', a: 'Sí, todo Chile. Despacho base incluido en la cotización. Zonas extremas (Aysén, Magallanes, Rapa Nui) pueden tener fee adicional según transportista.' },
];

export default function FaqSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-poppins text-center">Preguntas frecuentes</h2>
        <p className="text-center text-slate-500 mt-2">Las dudas más comunes de nuestros clientes B2B.</p>

        <Accordion type="single" collapsible className="mt-10">
          {LAUNCH_FAQS.map((f, i) => (
            <AccordionItem key={i} value={`f${i}`} className="border-slate-200">
              <AccordionTrigger className="text-left font-semibold text-slate-800 hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}