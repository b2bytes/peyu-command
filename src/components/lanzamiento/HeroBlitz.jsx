// Hero de alta conversión para /lanzamiento — matches intent de ads B2B.
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Leaf, Factory } from 'lucide-react';

export default function HeroBlitz({ onCta }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-white">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Fábrica operativa · Santiago de Chile · Entregas 7-15 días
          </div>

          <h1 className="text-4xl md:text-6xl font-bold font-poppins tracking-tight leading-[1.05]">
            Regalos corporativos<br />
            <span className="text-emerald-300">100% reciclados</span>,<br />
            hechos en Chile.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-emerald-50/90 max-w-2xl leading-relaxed">
            Kits personalizados con tu logo grabado en láser, packaging eco y lead time garantizado.
            <span className="text-white font-medium"> Cotización en 4h hábiles.</span>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={onCta}
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-semibold text-base h-14 px-8 shadow-lg shadow-emerald-900/50"
            >
              Solicitar cotización B2B
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <a
              href="https://wa.me/56900000000?text=Hola%20PEYU%2C%20quiero%20cotizar%20regalos%20corporativos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-md border border-white/20 hover:bg-white/5 text-base font-medium transition"
            >
              WhatsApp directo
            </a>
          </div>

          {/* Trust row */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl">
            {[
              { icon: Factory, label: 'Fabricación local', sub: '6 inyectoras propias' },
              { icon: Leaf, label: '100% reciclado', sub: 'Certificado GRS' },
              { icon: ShieldCheck, label: 'Garantía 2 años', sub: 'Producto + grabado' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <t.icon className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">{t.label}</p>
                  <p className="text-xs text-emerald-100/70">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}