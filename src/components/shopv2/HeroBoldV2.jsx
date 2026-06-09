import { ArrowRight, Sparkles, Leaf, Recycle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CarouselHeroV2 from './CarouselHeroV2';

// Imágenes siempre disponibles en CDN base44 — úsalas aunque WordPress esté caído
const HERO_IMGS = [
  'https://media.base44.com/images/public/69d99b9d61f699701129c103/7b59fad60_generated_image.png',
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/4-mixto-1024x1024-1.webp?fit=600%2C600&ssl=1',
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/potfinal_porta-Photoroom-1.jpg?fit=600%2C600&ssl=1',
  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/09/greencel-1.jpg?fit=600%2C600&ssl=1',
];

// Hero BOLD del Shop v2 — carrusel automático hermoso e inteligente.
export default function HeroBoldV2({ heroImg, onPersonaliza }) {
  const navigate = useNavigate();

  return (
    <section className="w-full px-3 sm:px-8 lg:px-16 xl:px-20 pt-3 sm:pt-8 pb-3 sm:pb-6">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-10 xl:gap-20 items-center" style={{ minHeight: 'auto' }}>

          {/* ── COPY ── */}
          <div className="order-2 lg:order-1 flex flex-col justify-center">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4 sm:mb-6 self-start" style={{ background: 'rgba(139,173,138,.18)', color: '#5B7D5A' }}>
              <Leaf className="w-3.5 h-3.5" /> Fabricado con tapitas de Santiago · 100% reciclado
            </span>

            <h1 className="font-fraunces leading-[0.93] tracking-tight mb-2 sm:mb-5" style={{ fontSize: 'clamp(1.5rem,4vw,5rem)', color: '#2C1810' }}>
              Objetos que<br />
              <em className="not-italic" style={{ color: '#C0785C' }}>cuidan</em>{' '}
              el planeta.
            </h1>

            <p className="hidden sm:block text-base lg:text-lg leading-relaxed mb-2 sm:mb-3" style={{ color: '#7A6050', maxWidth: '500px' }}>
              Cada PEYU nace de tapitas plásticas recolectadas en Santiago. Las fundimos, las moldeamos y las convertimos en piezas únicas con textura marmolada irrepetible.
            </p>

            <p className="hidden sm:block text-sm leading-relaxed mb-6 sm:mb-8" style={{ color: '#A08070', maxWidth: '420px' }}>
              Personalizables con grabado láser permanente — tu frase, logo o diseño. Gratis desde 10 unidades.
            </p>

            <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-8">
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => navigate('/personalizar')}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base px-4 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 8px 28px rgba(192,120,92,.3)' }}
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Personaliza</span> <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <a
                  href="/CatalogoNuevo"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 font-bold text-sm sm:text-base px-4 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all hover:bg-[#EDE3D6]"
                  style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}
                >
                  Ver tienda
                </a>
              </div>
              <a
                href="/EmpresasNuevo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold text-sm sm:text-base px-4 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all hover:shadow-md"
                style={{ background: 'rgba(139,173,138,.15)', border: '1.5px solid #8BAD8A', color: '#5B7D5A' }}
              >
                Para empresas
              </a>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-8 pt-4 sm:pt-5" style={{ borderTop: '1px solid #D4C4B0' }}>
              {[['~30 g', 'plástico rescatado'], ['Marmolado', 'único e irrepetible'], ['10 años', 'de garantía']].map(([n, l]) => (
                <div key={n}>
                  <p className="font-poppins font-bold text-xl" style={{ color: '#2C1810' }}>{n}</p>
                  <p className="text-[11px] leading-tight mt-0.5" style={{ color: '#A08070' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── IMAGEN principal + collage lateral ── */}
          <div className="order-1 lg:order-2 relative flex items-center justify-end gap-2 sm:gap-4">
            {/* Glow ambiental */}
            <div className="absolute -inset-10 rounded-[4rem] blur-3xl pointer-events-none opacity-40 sm:opacity-60"
              style={{ background: 'linear-gradient(135deg,rgba(192,120,92,.18),rgba(139,173,138,.14))' }} />

            {/* Carrusel automático hermoso e inteligente */}
            <div className="relative flex-1" style={{ maxWidth: '500px' }}>
              <CarouselHeroV2 
                images={HERO_IMGS}
                onImageClick={(img) => {
                  // Clickeable — navega a catálogo
                  navigate('/CatalogoNuevo');
                }}
              />

              {/* Badge inferior */}
              <div className="hidden sm:block absolute bottom-5 left-5 bg-white/93 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg z-10"
                style={{ border: '1px solid rgba(212,196,176,.7)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#A08070' }}>Cada pieza es única</p>
                <p className="font-poppins font-bold text-sm" style={{ color: '#C0785C' }}>Marmolado irrepetible ♻️</p>
              </div>

              {/* Badge superior */}
              <div className="hidden sm:block absolute top-5 right-5 bg-white/93 backdrop-blur-xl rounded-xl px-3 py-2 shadow-md z-10"
                style={{ border: '1px solid rgba(212,196,176,.7)' }}>
                <div className="flex items-center gap-1.5">
                  <Recycle className="w-3.5 h-3.5" style={{ color: '#8BAD8A' }} />
                  <span className="text-[10px] font-bold" style={{ color: '#5B7D5A' }}>Tapitas recicladas</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}