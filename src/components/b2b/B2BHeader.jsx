// Header del canal B2B — estética Warm Clay empresarial
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

export default function B2BHeader({ backTo, backLabel }) {
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl border-b"
      style={{ background: 'rgba(248,243,237,.94)', borderColor: '#D4C4B0', boxShadow: '0 1px 20px rgba(44,24,16,.06)' }}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#EDE3D6] active:bg-[#D4C4B0]"
              style={{ border: '1.5px solid #D4C4B0' }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: '#7A6050' }} />
            </button>
          )}
          <Link to="/EmpresasNuevo" className="flex items-center gap-2 group">
            <img
              src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU"
              className="h-7 w-auto object-contain group-hover:scale-105 transition-transform select-none"
              draggable={false}
              loading="eager"
            />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#F0EAE1', color: '#8B5E42', border: '1px solid #D4C4B0' }}>
              <Building2 className="w-3 h-3" /> Empresas
            </span>
          </Link>
        </div>

        <nav className="hidden sm:flex items-center gap-0.5">
          <Link to="/EmpresasNuevo" className="px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Catálogo</Link>
          <Link to="/CotizacionRapida" className="px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Cotizar</Link>
        </nav>

        <Link
          to="/CotizacionRapida"
          className="flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-2xl transition-all hover:shadow-md"
          style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', color: 'white', boxShadow: '0 4px 16px rgba(15,139,108,.25)' }}
        >
          <Building2 className="w-4 h-4" />
          <span className="hidden sm:inline">Solicitar cotización</span>
          <span className="sm:hidden">Cotizar</span>
        </Link>
      </div>
    </header>
  );
}