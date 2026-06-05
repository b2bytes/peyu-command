import { Recycle, ArrowRight, Sparkles } from 'lucide-react';

// Hero BOLD del Shop v2 (Tema 6). Titular serif grande + CTA verde sólido que
// baja al configurador en vivo. Foto marmolada de impacto con glass sutil.
export default function HeroBoldV2({ heroImg, onPersonaliza }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-8">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-[#0F8B6C]/10 text-[#0F8B6C] text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            <Recycle className="w-3.5 h-3.5" /> Plástico 100% reciclado · Hecho en Chile
          </span>
          <h1 className="font-fraunces text-[2.75rem] sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight mb-5">
            Tu carcasa,<br /><span className="text-[#0F8B6C] italic">tu historia</span>
          </h1>
          <p className="text-[#4B4F54] text-base sm:text-lg leading-relaxed mb-7 max-w-md">
            Diseña la tuya con plástico reciclado y grabado láser permanente.
            Única, tuya, sustentable.
          </p>
          <button
            onClick={onPersonaliza}
            className="inline-flex items-center gap-2 bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold text-base px-8 py-4 rounded-2xl shadow-lg shadow-[#0F8B6C]/25 transition-all hover:scale-[1.02] active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" /> Personaliza ahora <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {heroImg && (
          <div className="relative order-first lg:order-last">
            <div className="absolute -inset-5 bg-gradient-to-br from-[#0F8B6C]/12 to-[#D96B4D]/10 rounded-[3rem] blur-3xl" />
            <div className="relative aspect-square rounded-[2.25rem] overflow-hidden bg-white border border-[#EBE3D6] shadow-[0_28px_70px_-26px_rgba(74,63,51,0.45)]">
              <img src={heroImg} alt="Carcasa PEYU de plástico reciclado marmolado" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 border border-[#EBE3D6] shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#A78B6F]">Cada pieza es única</p>
              <p className="font-poppins font-bold text-[#0F8B6C] text-sm">Marmolado irrepetible ♻️</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}