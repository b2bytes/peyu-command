import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Recycle, Sparkles } from 'lucide-react';

// CTAs del hero del home — reestructurados jul-2026.
// Antes el botón "Personalizar" usaba transition-all + hover:scale + hover:shadow-xl
// sobre un gradiente inline, lo que producía un recuadro fantasma del mismo color
// al pasar el mouse. Ahora el hover es solo brillo (filter) — sin repaints raros.
export default function HeroCTAsV2({ compact = false }) {
  const navigate = useNavigate();
  const pad = compact ? 'px-4 py-3.5 text-sm' : 'px-8 py-4 text-base';

  return (
    <div className={compact ? 'flex flex-col gap-2.5 mt-4' : 'flex flex-col gap-3 mb-8'}>
      <div className={compact ? 'flex gap-2.5' : 'flex gap-3'}>
        <button
          onClick={() => navigate('/personalizar')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.97] ${pad}`}
          style={{
            background: 'linear-gradient(135deg,#C0785C,#A86440)',
            color: '#FFFFFF',
            boxShadow: 'none',
          }}
        >
          <Sparkles className="w-4 h-4" strokeWidth={1.75} />
          <span style={{ color: '#FFFFFF' }}>Personalizar</span>
          {!compact && <ArrowRight className="w-4 h-4" strokeWidth={2.5} />}
        </button>
        <Link
          to="/CatalogoNuevo"
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-colors duration-200 hover:bg-[#F0E8DE] active:scale-[0.97] ${pad}`}
          style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}
        >
          Ver tienda
          {compact && <ArrowRight className="w-4 h-4" strokeWidth={2.5} />}
        </Link>
      </div>
      <Link
        to="/EmpresasNuevo"
        className={`inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-colors duration-200 hover:bg-[rgba(15,139,108,.15)] active:scale-[0.97] ${compact ? 'w-full px-4 py-3 text-[13px]' : 'w-auto px-8 py-4 text-base'}`}
        style={{ background: 'rgba(15,139,108,.09)', border: '1.5px solid rgba(15,139,108,.22)', color: '#0B6E55' }}
      >
        <Recycle className="w-4 h-4" strokeWidth={1.75} />
        Para empresas
      </Link>
    </div>
  );
}