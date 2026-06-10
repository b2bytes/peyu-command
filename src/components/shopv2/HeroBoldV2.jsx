import { ArrowRight, Leaf, Recycle, Sparkles, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CarouselHeroV2 from './CarouselHeroV2';

// Imágenes editoriales generadas A PARTIR de los productos reales del catálogo
// (los productos no cambian — solo su presentación). Cada slide cuenta una
// historia y lleva a su destino del viaje.
const HERO_SLIDES = [
  {
    img: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/69134ef4d_generated_image.png',
    kicker: 'Escritorio consciente',
    title: 'Hecho con tapitas recicladas de Santiago',
    to: '/CatalogoNuevo?cat=Escritorio',
  },
  {
    img: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/7fcca1287_generated_image.png',
    kicker: 'Entretención y juegos',
    title: 'Cachos 100% reciclados, todo terreno',
    to: '/CatalogoNuevo?cat=Entretenimiento',
  },
  {
    img: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/a4235e9c2_generated_image.png',
    kicker: 'Carcasas eco',
    title: 'Marmolado único e irrepetible',
    to: '/CatalogoNuevo?cat=Carcasas%20B2C',
  },
  {
    img: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/45c523d4b_generated_image.png',
    kicker: 'Regalos corporativos',
    title: 'Grabado láser gratis desde 10 unidades',
    to: '/EmpresasNuevo',
  },
];

// ── Pill estilo AI platform con dot animado ──────────────────────────────────
function LivePill({ children, color = '#0F8B6C' }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
      style={{ background: `${color}12`, color, border: `1px solid ${color}22` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
      {children}
    </span>
  );
}

// ── Stat item ────────────────────────────────────────────────────────────────
function Stat({ value, label }) {
  return (
    <div>
      <p className="font-fraunces font-bold text-xl sm:text-2xl leading-none" style={{ color: '#2C1810' }}>{value}</p>
      <p className="text-[11px] leading-tight mt-0.5 font-medium" style={{ color: '#A08070' }}>{label}</p>
    </div>
  );
}

export default function HeroBoldV2({ heroImg, onPersonaliza }) {
  const navigate = useNavigate();

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 pt-4 sm:pt-6 pb-4 sm:pb-6">
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Mobile: headline encima del carrusel — no se pierde en el scroll */}
        <div className="lg:hidden mb-3">
          <h1 className="font-fraunces leading-[0.93] tracking-tight"
            style={{ fontSize: 'clamp(1.5rem, 6.5vw, 2.2rem)', color: '#2C1810' }}>
            Objetos que{' '}
            <em className="not-italic" style={{ color: '#C0785C' }}>cuidan</em>{' '}
            el planeta.
          </h1>
          <p className="text-sm mt-2 leading-snug" style={{ color: '#7A6050' }}>
            Tapitas recicladas de Santiago · Grabado láser gratis desde 10u
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 xl:gap-12 items-center">

          {/* ── COPY (desktop only headline + CTAs) ─────────────────────── */}
          <div className="order-2 lg:order-1 flex flex-col justify-center">

            {/* Status pill — desktop */}
            <div className="hidden lg:block mb-6">
              <LivePill color="#0F8B6C">
                <Leaf className="w-3 h-3" strokeWidth={2} /> Fabricado con tapitas de Santiago · 100% reciclado
              </LivePill>
            </div>

            {/* Headline — desktop only (mobile ya se muestra arriba) */}
            <h1 className="hidden lg:block font-fraunces leading-[0.93] tracking-tight mb-5"
              style={{ fontSize: 'clamp(2.2rem, 3.2vw, 3.6rem)', color: '#2C1810' }}>
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

            {/* CTAs */}
            <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-8">
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => navigate('/personalizar')}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base px-5 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 8px 24px rgba(192,120,92,.28)' }}
                >
                  <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                  <span>Personalizar</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <Link
                  to="/CatalogoNuevo"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 font-bold text-sm sm:text-base px-5 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all hover:bg-[#F0E8DE]"
                  style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}
                >
                  Ver tienda
                </Link>
              </div>
              <Link
                to="/EmpresasNuevo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold text-sm sm:text-base px-5 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all hover:shadow-md"
                style={{ background: 'rgba(15,139,108,.09)', border: '1.5px solid rgba(15,139,108,.22)', color: '#0B6E55' }}
              >
                <Recycle className="w-4 h-4" strokeWidth={1.75} />
                Para empresas
              </Link>
            </div>

            {/* Stats row — desktop */}
            <div className="hidden sm:flex items-center gap-8 pt-4 sm:pt-5" style={{ borderTop: '1px solid #E8DDD0' }}>
              <Stat value="~30 g" label="plástico rescatado" />
              <div className="w-px h-8" style={{ background: '#E8DDD0' }} />
              <Stat value="Marmolado" label="único e irrepetible" />
              <div className="w-px h-8" style={{ background: '#E8DDD0' }} />
              <Stat value="10 años" label="de garantía" />
            </div>
          </div>

          {/* ── IMAGEN ───────────────────────────────────────────────────── */}
          <div className="order-1 lg:order-2 relative flex items-center justify-end gap-2 sm:gap-4">
            {/* Glow ambiental */}
            <div className="absolute -inset-10 rounded-[4rem] blur-3xl pointer-events-none opacity-35 sm:opacity-55"
              style={{ background: 'radial-gradient(ellipse at center, rgba(192,120,92,.18) 0%, rgba(139,173,138,.14) 60%, transparent 100%)' }} />

            <div className="relative flex-1 w-full" style={{ maxWidth: '520px' }}>
              <CarouselHeroV2
                slides={HERO_SLIDES}
                onSlideClick={(s) => navigate(s.to || '/CatalogoNuevo')}
              />

              {/* Badge inferior — glass morphism */}
              <div className="hidden sm:flex items-center gap-3 absolute bottom-5 left-5 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg z-10"
                style={{ background: 'rgba(255,255,255,.92)', border: '1px solid rgba(232,221,208,.7)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(15,139,108,.10)' }}>
                  <Recycle className="w-4 h-4" style={{ color: '#0F8B6C' }} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#A08070' }}>Cada pieza es única</p>
                  <p className="font-fraunces font-bold text-sm" style={{ color: '#C0785C' }}>Marmolado irrepetible</p>
                </div>
              </div>

              {/* Badge superior — status indicator */}
              <div className="hidden sm:flex items-center gap-2 absolute top-5 right-5 backdrop-blur-xl rounded-xl px-3 py-2 shadow-md z-10"
                style={{ background: 'rgba(255,255,255,.92)', border: '1px solid rgba(232,221,208,.7)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0F8B6C' }} />
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#0F8B6C' }} strokeWidth={1.75} />
                <span className="text-[10px] font-bold" style={{ color: '#2C1810' }}>10 años garantía</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}