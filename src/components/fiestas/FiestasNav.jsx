import { Link, useLocation } from 'react-router-dom';

// Navegación de la campaña Fiestas Patrias: permite saltar entre la landing
// madre, los kits B2C y la página de empresas sin volver al home.
const TABS = [
  { to: '/fiestas-patrias', label: '🇨🇱 Campaña' },
  { to: '/fiestas-patrias/kits', label: 'Kits de regalo' },
  { to: '/fiestas-patrias/empresas', label: 'Empresas' },
];

export default function FiestasNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="flex items-center justify-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide"
      style={{ background: '#F8F3ED', borderBottom: '1px solid #EADFD2' }}
      aria-label="Navegación campaña Fiestas Patrias"
    >
      {TABS.map((t) => {
        const active = pathname === t.to;
        return (
          <Link
            key={t.to}
            to={t.to}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all peyu-tap-sm"
            style={{
              background: active ? '#A8443A' : 'white',
              color: active ? '#FFFFFF' : '#7A6050',
              border: `1.5px solid ${active ? '#A8443A' : '#D4C4B0'}`,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}