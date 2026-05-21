// Capítulo del viaje pedagógico — encabezado consistente con número + título.
import { motion } from 'framer-motion';

export default function JourneyChapter({ num, kicker, title, subtitle, children, dark = true }) {
  return (
    <section className={`py-16 md:py-24 px-4 md:px-8 ${dark ? 'bg-slate-950 text-slate-50' : 'bg-stone-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-10 md:mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-[11px] uppercase tracking-[0.2em] font-bold font-jakarta ${dark ? 'text-teal-400' : 'text-teal-700'}`}>
              Capítulo {num}
            </span>
            <span className={`h-px flex-1 ${dark ? 'bg-slate-800' : 'bg-stone-300'}`} />
            <span className={`text-[11px] uppercase tracking-[0.2em] font-bold font-jakarta ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              {kicker}
            </span>
          </div>
          <h2 className={`font-fraunces text-3xl md:text-5xl font-medium leading-[1.05] tracking-tight ${dark ? 'text-slate-50' : 'text-slate-900'}`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`mt-4 text-base md:text-lg max-w-2xl font-inter leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              {subtitle}
            </p>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  );
}