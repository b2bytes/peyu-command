import { Recycle, ArrowRight, Sparkles, Leaf } from 'lucide-react';

// Hero BOLD del Shop v2 — Tema Warm Clay 2027.
// Relato real PEYU: tapitas recicladas de Santiago, marmolado único, grabado láser.
export default function HeroBoldV2({ heroImg, onPersonaliza }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">

        {/* COPY */}
        <div className="order-2 lg:order-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-5" style={{ background: 'rgba(139,173,138,.15)', color: '#5B7D5A' }}>
            <Leaf className="w-3.5 h-3.5" /> Fabricado con tapitas de Santiago · 100% reciclado
          </span>

          <h1 className="font-fraunces leading-[0.97] tracking-tight mb-5" style={{ fontSize: 'clamp(2.4rem,6vw,4rem)', color: '#2C1810' }}>
            Objetos que<br />
            <em className="not-italic" style={{ color: '#C0785C' }}>cuidan</em>{' '}
            el planeta.
          </h1>

          <p className="text-base sm:text-lg leading-relaxed mb-4 max-w-md" style={{ color: '#7A6050' }}>
            Cada PEYU nace de tapitas plásticas recolectadas en Santiago. Las fundimos, las moldeamos y las convertimos en piezas únicas con textura marmolada irrepetible.
          </p>

          <p className="text-sm leading-relaxed mb-7 max-w-sm" style={{ color: '#A08070' }}>
            Personalizables con grabado láser permanente — tu frase, logo o diseño para siempre. Gratis desde 10 unidades.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onPersonaliza}
              className="inline-flex items-center justify-center gap-2 text-white font-bold text-base px-7 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 8px 28px rgba(192,120,92,.3)' }}
            >
              <Sparkles className="w-4 h-4" /> Personaliza ahora <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="/CatalogoNuevo"
              className="inline-flex items-center justify-center gap-2 font-bold text-base px-7 py-4 rounded-2xl transition-all hover:bg-[#EDE3D6]"
              style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}
            >
              Ver tienda
            </a>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-8 pt-6" style={{ borderTop: '1px solid #D4C4B0' }}>
            {[['~30 g', 'plástico rescatado por pieza'], ['Marmolado', 'único e irrepetible'], ['10 años', 'de garantía']].map(([n, l]) => (
              <div key={n}>
                <p className="font-poppins font-bold text-base" style={{ color: '#2C1810' }}>{n}</p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: '#A08070' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* IMAGEN */}
        {heroImg && (
          <div className="relative order-1 lg:order-2">
            <div className="absolute -inset-5 rounded-[3rem] blur-3xl" style={{ background: 'linear-gradient(135deg,rgba(192,120,92,.12),rgba(139,173,138,.1))' }} />
            <div className="relative aspect-square rounded-[2.25rem] overflow-hidden" style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 28px 70px -20px rgba(44,24,16,.3)' }}>
              <img src={heroImg} alt="Producto PEYU de plástico reciclado marmolado" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            {/* Glass badge */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg" style={{ border: '1px solid rgba(212,196,176,.6)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#A08070' }}>Cada pieza es única</p>
              <p className="font-poppins font-bold text-sm" style={{ color: '#C0785C' }}>Marmolado irrepetible ♻️</p>
            </div>
            {/* Eco badge */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xl rounded-xl px-3 py-2 shadow-md" style={{ border: '1px solid rgba(212,196,176,.6)' }}>
              <div className="flex items-center gap-1.5">
                <Recycle className="w-3.5 h-3.5" style={{ color: '#8BAD8A' }} />
                <span className="text-[10px] font-bold" style={{ color: '#5B7D5A' }}>Tapitas recicladas</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}