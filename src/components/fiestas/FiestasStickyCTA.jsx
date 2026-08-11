import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Barra fija inferior en móvil: la acción principal siempre visible mientras
// el cliente recorre la landing.
export default function FiestasStickyCTA({ to, onClick, label, nota }) {
  const cls =
    'w-full h-13 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform';
  const style = { background: 'linear-gradient(135deg,#C0785C,#A86440)' };

  return (
    <div
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-4 pt-3 pb-safe"
      style={{ background: 'rgba(248,243,237,.95)', borderTop: '1px solid #D4C4B0', backdropFilter: 'blur(12px)' }}
    >
      {nota && (
        <p className="text-[11px] font-semibold text-center mb-2" style={{ color: '#A8443A' }}>{nota}</p>
      )}
      {to ? (
        <Link to={to} onClick={onClick} className={cls} style={style}>{label} <ArrowRight className="w-5 h-5" /></Link>
      ) : (
        <button onClick={onClick} className={cls} style={style}>{label} <ArrowRight className="w-5 h-5" /></button>
      )}
    </div>
  );
}