import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BackgroundSwitcher from './BackgroundSwitcher';

export default function MobileMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-12 h-12 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-all active:bg-white/30 flex-shrink-0"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div 
        className={`fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-md border-r border-white/20 transform transition-transform duration-300 ease-out z-40 lg:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="border-b border-white/20 px-4 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold text-lg">Menú</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-all active:bg-white/30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/20 transition-colors active:bg-white/30 text-base font-medium touch-target"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Background switcher */}
        <div className="border-t border-white/20 px-3 py-2 flex-shrink-0">
          <BackgroundSwitcher expanded />
        </div>

        {/* Menu Footer */}
        <div className="border-t border-white/20 px-4 py-3 flex-shrink-0 text-white/60 text-xs text-center">
          <p>PEYU © 2026</p>
        </div>
      </div>
    </>
  );
}