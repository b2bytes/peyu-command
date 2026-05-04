import { Recycle, Droplets, Sprout, Trees } from 'lucide-react';

/**
 * Sección educativa estática sobre los materiales y procesos PEYU.
 * Tema CLARO — combina con el blog editorial (fondo creme).
 */
const FACTS = [
  {
    icon: Recycle,
    color: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
    title: 'Plástico 100% reciclado',
    desc: 'Recolectamos PET y polietileno post-consumo en Santiago. Lo lavamos, peletizamos e inyectamos sin aditivos vírgenes.',
    metric: '+2.400 kg',
    metricLabel: 'plástico recuperado / año',
  },
  {
    icon: Sprout,
    color: 'from-amber-500 to-yellow-600',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
    title: 'Fibra de trigo compostable',
    desc: 'Subproducto agrícola chileno. Se transforma en bioplástico que se composta en casa en menos de 90 días.',
    metric: '90 días',
    metricLabel: 'compostaje doméstico',
  },
  {
    icon: Droplets,
    color: 'from-blue-500 to-cyan-600',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-700',
    title: 'Producción local',
    desc: 'Fábrica en Santiago. Cero importación de PT, menor huella logística y trazabilidad total del proceso.',
    metric: '−68%',
    metricLabel: 'CO₂ vs producto importado',
  },
  {
    icon: Trees,
    color: 'from-green-500 to-emerald-700',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-700',
    title: 'Garantía 10 años',
    desc: 'El plástico reciclado PEYU es más resistente que el virgen. Y si falla, lo reemplazamos sin costo.',
    metric: '10 años',
    metricLabel: 'garantía contra defectos',
  },
];

export default function EducationSection() {
  return (
    <section className="mb-10 sm:mb-16">
      <div className="text-center mb-8 sm:mb-10">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700 mb-2">Educación · Materiales</p>
        <h2 className="text-2xl sm:text-4xl font-poppins font-extrabold text-slate-900 tracking-tight">
          Aprende sobre lo que fabricamos
        </h2>
        <p className="text-[14px] sm:text-[15px] text-slate-600 mt-2 sm:mt-3 max-w-xl mx-auto leading-relaxed px-2">
          Antes de comprar, entiende qué significa <strong className="text-slate-900">"reciclado"</strong> y <strong className="text-slate-900">"compostable"</strong>. Sin greenwashing.
        </p>
      </div>

      {/* Mobile: carrusel horizontal scrolleable. Desktop: grid 4-col */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory sm:snap-none">
        {FACTS.map((f, i) => (
          <article
            key={i}
            className="group flex-shrink-0 w-[78%] sm:w-auto snap-start bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 hover:border-teal-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-900/5 transition-all"
          >
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${f.iconBg} flex items-center justify-center mb-4 sm:mb-5`}>
              <f.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${f.iconColor}`} />
            </div>
            <h3 className="font-poppins font-extrabold text-slate-900 text-[15px] mb-1.5 sm:mb-2 leading-tight">{f.title}</h3>
            <p className="text-[13px] text-slate-600 leading-relaxed mb-4 sm:mb-5">{f.desc}</p>
            <div className="pt-3 sm:pt-4 border-t border-stone-100">
              <p className="text-xl sm:text-2xl font-poppins font-extrabold text-slate-900 tracking-tight">{f.metric}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold mt-0.5">{f.metricLabel}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}