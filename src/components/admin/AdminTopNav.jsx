import { Link, useLocation } from 'react-router-dom';
import { Turtle, ShoppingCart, Building2, ChevronDown, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminQuickLauncher from './AdminQuickLauncher';

const MAIN_SECTIONS = [
  { label: 'Dashboard', path: '/admin', icon: '📊' },
  { label: 'Pedidos', path: '/admin/operaciones', icon: '📦' },
  { label: 'Pipeline B2B', path: '/admin/pipeline', icon: '🎯' },
  { label: 'Catálogo', path: '/admin/catalogo', icon: '🛍️' },
  { label: 'Clientes', path: '/admin/clientes', icon: '👥' },
  { label: 'Reportes', path: '/admin/reportes', icon: '📈' },
];

const PUBLIC_LINKS = [
  { label: 'Tienda B2C', href: '/', icon: ShoppingCart, color: 'text-teal-400' },
  { label: 'Catálogo B2B', href: '/EmpresasNuevo', icon: Building2, color: 'text-green-400' },
];

export default function AdminTopNav() {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);

  // Atajo global Ctrl/Cmd + K → buscador rápido de módulos
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setLauncherOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const currentSection = MAIN_SECTIONS.find(s => location.pathname.startsWith(s.path));

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/10">
      <div className="px-4 h-16 flex items-center justify-between gap-6">
        {/* Logo + Marca */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600">
            <Turtle className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-jakarta font-bold text-white text-sm">PEYU</div>
            <div className="text-[10px] text-teal-300/70 font-medium">Comando</div>
          </div>
        </div>

        {/* Menú principal */}
        <div className="hidden lg:flex items-center gap-1">
          {MAIN_SECTIONS.map((section) => {
            const isActive = location.pathname.startsWith(section.path);
            return (
              <Link
                key={section.path}
                to={section.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-teal-300 bg-teal-500/[0.12]'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                }`}
              >
                <span className="mr-1">{section.icon}</span>
                {section.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile dropdown */}
        <div className="lg:hidden flex-1 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 text-white/80 hover:bg-white/10 transition-colors"
          >
            <span className="text-sm font-medium">{currentSection?.icon} {currentSection?.label || 'Menú'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-white/10 rounded-lg shadow-lg overflow-hidden">
              {MAIN_SECTIONS.map((section) => (
                <Link
                  key={section.path}
                  to={section.path}
                  className="block px-3 py-2 text-sm text-white/80 hover:bg-teal-500/20 border-b border-white/5 last:border-0"
                  onClick={() => setDropdownOpen(false)}
                >
                  {section.icon} {section.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Buscador rápido + links públicos a la derecha */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setLauncherOpen(true)}
            title="Buscar módulo (Ctrl+K)"
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium">Buscar</span>
            <kbd className="hidden md:inline text-[9px] font-bold bg-white/10 rounded px-1.5 py-0.5 text-white/50">⌘K</kbd>
          </button>
          {PUBLIC_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                title={link.label}
                className="p-2 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
              >
                <Icon className={`w-4 h-4 ${link.color}`} />
              </a>
            );
          })}
        </div>
      </div>

      <AdminQuickLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)} />
    </nav>
  );
}