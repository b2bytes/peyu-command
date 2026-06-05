import { Recycle, Sprout, Droplets, RefreshCw } from 'lucide-react';

// Storytelling de impacto del Shop v2 (Tema 6). Mensaje cálido de economía
// circular + 3 KPIs por unidad. Datos reales de lib/impacto-ambiental.
export default function ImpactStoryV2() {
  const kpis = [
    { icon: Recycle, valor: '30 g', label: 'de plástico rescatado por pieza', sub: '≈ 1.5 botellas PET fuera del vertedero' },
    { icon: Sprout, valor: '2.1 kg', label: 'de CO₂ evitado', sub: 'vs. plástico virgen desde petróleo' },
    { icon: Droplets, valor: '~12 L', label: 'de agua ahorrada', sub: 'reciclar en vez de producir nuevo' },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-14">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#0F8B6C] text-white p-7 sm:p-10">
        {/* Glow ambiental sutil */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-[#A7D9C9]/15 rounded-full blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <RefreshCw className="w-3.5 h-3.5" /> Economía circular real
          </span>
          <h2 className="font-fraunces text-3xl sm:text-4xl leading-tight mb-3 max-w-xl">
            Cada PEYU salva <span className="italic">30 g de plástico</span> del vertedero
          </h2>
          <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-lg mb-8">
            Recolectamos botellas, tapas y envases en Santiago y los convertimos en
            piezas únicas. Tú compras diseño; el planeta gana un residuo menos. 🌍
          </p>

          <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
            {kpis.map((k, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
                <k.icon className="w-6 h-6 text-white mb-2.5" />
                <p className="font-poppins font-bold text-2xl">{k.valor}</p>
                <p className="text-sm font-semibold text-white/90 leading-snug mt-0.5">{k.label}</p>
                <p className="text-[11px] text-white/65 mt-1.5">{k.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}