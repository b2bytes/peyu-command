import { Recycle, Sprout, Droplets, RefreshCw, Heart } from 'lucide-react';

// Storytelling de impacto PEYU — relato real, Tema Warm Clay 2027.
// Tapitas de Santiago → piezas únicas → economía circular honesta.
export default function ImpactStoryV2() {
  const kpis = [
    { icon: Recycle, valor: '~30 g', label: 'de plástico rescatado', sub: '≈ 14 tapitas fuera del vertedero' },
    { icon: Sprout, valor: '2.1 kg', label: 'de CO₂ evitado', sub: 'vs. plástico virgen desde petróleo' },
    { icon: Droplets, valor: '~12 L', label: 'de agua ahorrada', sub: 'reciclar vs. producir nuevo' },
    { icon: Heart, valor: '12.000+', label: 'piezas vendidas', sub: '360 kg de plástico rescatado' },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-14">
      <div className="relative overflow-hidden rounded-[2rem] p-7 sm:p-10" style={{ background: 'linear-gradient(135deg,#C0785C 0%,#A86440 60%,#8B5A30 100%)' }}>
        {/* Glow ambiental */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,173,138,.15)' }} />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <RefreshCw className="w-3.5 h-3.5" /> Economía circular real · Santiago, Chile
          </span>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
            <div>
              <h2 className="font-fraunces text-3xl sm:text-4xl leading-[1.05] mb-4 text-white">
                De tapitas de plástico a<br /><em className="not-italic">objetos con propósito</em>
              </h2>
              <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-4">
                Recolectamos tapitas, botellas y envases plásticos en Santiago y los fundimos en moldes únicos. El resultado: piezas con textura marmolada irrepetible, 100% recicladas, sin tintas, sin petróleo nuevo.
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                Cada pieza que compras saca ~14 tapitas del vertedero. Tú compras diseño; el planeta gana un residuo menos. 🌍
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {kpis.map((k, i) => (
                <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)' }}>
                  <k.icon className="w-5 h-5 text-white mb-2.5" />
                  <p className="font-poppins font-bold text-2xl text-white">{k.valor}</p>
                  <p className="text-sm font-semibold text-white/90 leading-snug mt-0.5">{k.label}</p>
                  <p className="text-[11px] text-white/60 mt-1 leading-snug">{k.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}