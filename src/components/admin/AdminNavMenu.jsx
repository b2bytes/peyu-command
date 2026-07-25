import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

// Un menú del top nav: un área (Vender, Producir…) con sus destinos.
export default function AdminNavMenu({ area, onSearch }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isActive = area.links.some((l) => pathname === l.to);

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'text-teal-300 bg-teal-500/[0.12]' : 'text-white/60 hover:text-white/90 hover:bg-white/5'
        }`}
      >
        <span>{area.emoji}</span>
        {area.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50">
          {area.links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 text-sm transition-colors ${
                pathname === l.to ? 'text-teal-300 bg-teal-500/10' : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => { setOpen(false); onSearch?.(); }}
            className="w-full text-left px-3 py-2 text-xs text-white/45 hover:text-white/80 border-t border-white/10 mt-1"
          >
            Buscar otro módulo · ⌘K
          </button>
        </div>
      )}
    </div>
  );
}