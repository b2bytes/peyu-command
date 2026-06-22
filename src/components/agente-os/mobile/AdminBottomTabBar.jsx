import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Package, GitBranch, Sparkles, LayoutGrid } from 'lucide-react';

// ── Bottom Tab Bar móvil (trend app 2027) ───────────────────────────────────
// Barra de navegación inferior flotante con glass, safe-area iOS y tab central
// destacado para el Agente. Es la navegación primaria de la PWA de fundadores en
// móvil. Solo visible en <md (en desktop manda el sidebar del Agente).
// Tabs fijos: Agente · Pedidos · Pipeline · Social · Más.
const TABS = [
  { to: '/admin/agente', label: 'Agente', icon: MessageCircle, center: true,
    match: (p) => p.includes('/agente') },
  { to: '/admin/procesar-pedidos', label: 'Pedidos', icon: Package,
    match: (p) => p.includes('/procesar-pedidos') || p.includes('/operaciones') },
  { to: '/admin/pipeline', label: 'Pipeline', icon: GitBranch,
    match: (p) => p.includes('/pipeline') },
  { to: '/admin/social-studio', label: 'Social', icon: Sparkles,
    match: (p) => p.includes('/social-studio') },
];

export default function AdminBottomTabBar({ onMore }) {
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-safe"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="ld-glass-strong rounded-3xl border border-ld-border shadow-2xl flex items-stretch justify-around px-1.5 py-1.5 mb-1.5">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          if (t.center) {
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-col items-center justify-center flex-1 -mt-5"
                aria-label={t.label}
              >
                <span
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    active ? 'ld-btn-primary scale-105' : 'ld-btn-primary'
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.2} />
                </span>
                <span className={`text-[10px] mt-1 font-semibold ${active ? 'text-ld-action' : 'text-ld-fg-muted'}`}>
                  {t.label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={t.to}
              to={t.to}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 py-1.5 rounded-2xl transition-colors active:bg-ld-bg-elevated"
              aria-label={t.label}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-ld-action' : 'text-ld-fg-muted'}`} strokeWidth={active ? 2.4 : 2} />
              <span className={`text-[10px] font-medium ${active ? 'text-ld-action' : 'text-ld-fg-muted'}`}>{t.label}</span>
            </Link>
          );
        })}
        {/* Tab "Más" → abre el drawer de todos los módulos */}
        <button
          onClick={onMore}
          className="flex flex-col items-center justify-center flex-1 gap-0.5 py-1.5 rounded-2xl transition-colors active:bg-ld-bg-elevated"
          aria-label="Más"
        >
          <LayoutGrid className="w-5 h-5 text-ld-fg-muted" strokeWidth={2} />
          <span className="text-[10px] font-medium text-ld-fg-muted">Más</span>
        </button>
      </div>
    </nav>
  );
}