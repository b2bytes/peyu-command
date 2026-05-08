import { Link } from 'react-router-dom';
import { Home, Briefcase, Building2, Gift } from 'lucide-react';

/**
 * Grid 2x2 de categorías visuales para mobile.
 * Cada tile lleva al shop filtrado o al hub correspondiente.
 */
const CATEGORIES = [
  {
    label: 'Hogar',
    desc: 'Para tu casa',
    icon: Home,
    to: '/shop?categoria=Hogar',
    gradient: 'from-orange-500/90 to-rose-500/90',
    emoji: '🏡',
  },
  {
    label: 'Oficina',
    desc: 'Escritorio · Trabajo',
    icon: Briefcase,
    to: '/shop?categoria=Escritorio',
    gradient: 'from-cyan-500/90 to-blue-500/90',
    emoji: '💼',
  },
  {
    label: 'Empresas',
    desc: 'Regalos B2B',
    icon: Building2,
    to: '/b2b/catalogo',
    gradient: 'from-emerald-500/90 to-teal-500/90',
    emoji: '🏢',
  },
  {
    label: 'Gift Card',
    desc: 'Regalo perfecto',
    icon: Gift,
    to: '/regalar-giftcard',
    gradient: 'from-violet-500/90 to-fuchsia-500/90',
    emoji: '🎁',
  },
];

export default function MobileCategoryTiles() {
  return (
    <section className="px-4 pb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-poppins font-bold text-base">¿Qué buscas hoy?</h2>
        <Link to="/shop" className="text-teal-300 text-[11px] font-semibold flex items-center gap-1 hover:text-teal-200">
          Ver todo →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            to={cat.to}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.gradient} aspect-[1.15/1] p-3.5 flex flex-col justify-between shadow-lg active:scale-95 transition-transform`}
          >
            <span className="text-2xl leading-none">{cat.emoji}</span>
            <div>
              <p className="text-white font-poppins font-bold text-sm leading-tight">{cat.label}</p>
              <p className="text-white/75 text-[10px] font-medium leading-tight">{cat.desc}</p>
            </div>
            {/* Glow */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full blur-2xl" />
          </Link>
        ))}
      </div>
    </section>
  );
}