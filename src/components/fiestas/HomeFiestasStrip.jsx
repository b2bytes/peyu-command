import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Guiño sutil de Fiestas Patrias en el home: franja tricolor + acceso a la
// landing de campaña. No altera el diseño Warm Dusk del resto de la página.
export default function HomeFiestasStrip() {
  return (
    <section className="w-full px-3 sm:px-4 lg:px-6 mb-6 sm:mb-10">
      <div className="max-w-screen-xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0' }}>
        <div className="flex h-1.5">
          <div className="flex-1" style={{ background: '#0F3D91' }} />
          <div className="flex-1" style={{ background: '#FFFFFF' }} />
          <div className="flex-1" style={{ background: '#D52B1E' }} />
        </div>
        <Link
          to="/fiestas-patrias"
          className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 group"
          style={{ background: 'linear-gradient(135deg,#FBF5EE 0%,#F6E7DB 100%)' }}
        >
          <div className="min-w-0">
            <p className="font-fraunces text-base sm:text-xl leading-tight" style={{ color: '#2C1810' }}>
              Este 18, regala lo chileno de verdad 🇨🇱
            </p>
            <p className="text-[11px] sm:text-sm truncate" style={{ color: '#7A6050' }}>
              Kits de Fiestas Patrias · entrega garantizada antes del 18
            </p>
          </div>
          <span
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 sm:h-10 rounded-xl text-white font-bold text-xs sm:text-sm transition-transform group-hover:translate-x-0.5"
            style={{ background: 'linear-gradient(135deg,#A8443A,#7A2E26)' }}
          >
            Ver kits <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </section>
  );
}