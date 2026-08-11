import { Check, X } from 'lucide-react';

// Comparativa honesta contra la caja gourmet tradicional: responde la pregunta
// real del comprador ("¿por qué esto y no una canasta?") y le da a los
// buscadores con IA una tabla clara que citar.
const FILAS = [
  { criterio: 'Dura después del 18', peyu: 'Años de uso', otros: 'Se consume en un día' },
  { criterio: 'Tu logo a la vista', peyu: 'Grabado láser permanente', otros: 'Sticker o cinta que se bota' },
  { criterio: 'Impacto ambiental', peyu: 'Tapitas rescatadas, dato reportable', otros: 'Envases y plumavit desechables' },
  { criterio: 'Fabricación', peyu: 'Hecho en Chile', otros: 'Mayoría importada o reenvasada' },
  { criterio: 'Garantía', peyu: '10 años', otros: 'Sin garantía' },
];

export default function ComparativaFiestas() {
  return (
    <section className="max-w-4xl mx-auto px-5 py-14">
      <h2 className="font-fraunces text-2xl sm:text-3xl text-center mb-3">
        Kit PEYU vs. la caja gourmet de siempre
      </h2>
      <p className="text-sm text-center mb-8 max-w-xl mx-auto" style={{ color: '#7A6050' }}>
        Las dos son un lindo gesto. Solo una sigue existiendo el 19 de septiembre.
      </p>

      <div className="rounded-3xl overflow-hidden" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
        <div className="grid grid-cols-3 text-xs sm:text-sm font-bold" style={{ background: '#2C1810', color: 'white' }}>
          <div className="p-3 sm:p-4">Criterio</div>
          <div className="p-3 sm:p-4" style={{ color: '#E89B6C' }}>Kit PEYU</div>
          <div className="p-3 sm:p-4" style={{ color: '#D4C4B0' }}>Caja gourmet típica</div>
        </div>

        {FILAS.map((f, i) => (
          <div
            key={f.criterio}
            className="grid grid-cols-3 text-xs sm:text-sm items-start"
            style={{ borderTop: '1px solid #EADFD2', background: i % 2 ? '#FBF7F2' : 'white' }}
          >
            <div className="p-3 sm:p-4 font-semibold">{f.criterio}</div>
            <div className="p-3 sm:p-4 flex gap-1.5">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#3E8E6E' }} />
              <span>{f.peyu}</span>
            </div>
            <div className="p-3 sm:p-4 flex gap-1.5" style={{ color: '#7A6050' }}>
              <X className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C08A80' }} />
              <span>{f.otros}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}