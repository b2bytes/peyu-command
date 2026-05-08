import { Link } from 'react-router-dom';

/**
 * Sección categorías desktop — grid 4 columnas con tiles grandes.
 * Reusa la idea visual de mobile pero con más respiración y hover effects.
 */
const CATEGORIES = [
  {
    label: 'Hogar',
    desc: 'Para tu casa',
    to: '/shop?categoria=Hogar',
    gradient: 'from-orange-500 to-rose-500',
    emoji: '🏡',
    items: '12+ productos',
  },
  {
    label: 'Oficina',
    desc: 'Escritorio · Trabajo',
    to: '/shop?categoria=Escritorio',
    gradient: 'from-cyan-500 to-blue-500',
    emoji: '💼',
    items: '15+ productos',
  },
  {
    label: 'Empresas',
    desc: 'Regalos B2B',
    to: '/b2b/catalogo',
    gradient: 'from-emerald-500 to-teal-500',
    emoji: '🏢',
    items: 'Catálogo corporativo',
  },
  {
    label: 'Gift Card',
    desc: 'El regalo perfecto',
    to: '/regalar-giftcard',
    gradient: 'from-violet-500 to-fuchsia-500',
    emoji: '🎁',
    items: 'Desde $10.000',
  },
];

export default function DesktopCategorySection() {
  return (
    <section className="px-6 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-emerald-300 text-[11px] font-bold tracking-[0.2em] uppercase mb-1">Categorías</p>
          <h2 className="text-white font-poppins font-black text-3xl">¿Qué buscas hoy?</h2>
        </div>
        <Link to="/shop" className="text-teal-300 text-sm font-semibold hover:text-teal-200 flex items-center gap-1 transition">
          Ver todo →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            to={cat.to}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${cat.gradient} aspect-[1.1/1] p-6 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
          >
            <span className="text-5xl leading-none drop-shadow-lg">{cat.emoji}</span>
            <div className="relative z-10">
              <p className="text-white font-poppins font-black text-2xl leading-tight">{cat.label}</p>
              <p className="text-white/85 text-sm font-medium mt-0.5">{cat.desc}</p>
              <p className="text-white/60 text-[11px] font-semibold mt-2">{cat.items}</p>
            </div>
            {/* Glow effect */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/30 rounded-full blur-3xl group-hover:bg-white/40 transition" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/20 rounded-full blur-3xl" />
          </Link>
        ))}
      </div>
    </section>
  );
}