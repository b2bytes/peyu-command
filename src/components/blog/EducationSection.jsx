import { Recycle, Droplets, Sprout, Trees } from 'lucide-react';

/**
 * Sección educativa estática sobre los materiales y procesos PEYU.
 * Aparece debajo del hero del blog para reforzar autoridad temática (SEO + UX).
 */
const FACTS = [
  {
    icon: Recycle,
    color: 'from-emerald-500 to-teal-600',
    title: 'Plástico 100% reciclado',
    desc: 'Recolectamos PET y polietileno post-consumo en Santiago. Lo lavamos, peletizamos e inyectamos sin aditivos vírgenes.',
    metric: '+2.400 kg',
    metricLabel: 'plástico recuperado / año',
  },
  {
    icon: Sprout,
    color: 'from-amber-500 to-yellow-600',
    title: 'Fibra de trigo compostable',
    desc: 'Subproducto agrícola chileno. Se transforma en bioplástico que se composta en casa en menos de 90 días.',
    metric: '90 días',
    metricLabel: 'compostaje doméstico',
  },
  {
    icon: Droplets,
    color: 'from-blue-500 to-cyan-600',
    title: 'Producción local',
    desc: 'Fábrica en Santiago. Cero importación de PT, menor huella logística y trazabilidad total del proceso.',
    metric: '−68%',
    metricLabel: 'CO₂ vs producto importado',
  },
  {
    icon: Trees,
    color: 'from-green-500 to-emerald-700',
    title: 'Garantía 10 años',
    desc: 'El plástico reciclado PEYU es más resistente que el virgen. Y si falla, lo reemplazamos sin costo.',
    metric: '10 años',
    metricLabel: 'garantía contra defectos',
  },
];

export default function EducationSection() {
  return (
    <section className="mb-12 sm:mb-16">
      <div className="text-center mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-teal-300 mb-2">Educación · Materiales</p>
        <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-white">Aprende sobre lo que fabricamos</h2>
        <p className="text-sm text-white/60 mt-2 max-w-xl mx-auto">
          Antes de comprar, entiende qué significa "reciclado" y "compostable". Aquí lo explicamos sin greenwashing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FACTS.map((f, i) => (
          <div
            key={i}
            className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/25 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-md`}>
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-poppins font-bold text-white text-sm mb-1.5">{f.title}</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-4">{f.desc}</p>
            <div className="pt-3 border-t border-white/10">
              <p className="text-lg font-poppins font-bold text-white">{f.metric}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{f.metricLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}