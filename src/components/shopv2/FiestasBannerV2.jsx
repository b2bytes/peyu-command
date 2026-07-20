import { Link } from 'react-router-dom';
import { ArrowRight, Flag } from 'lucide-react';

// Banner de campaña Fiestas Patrias 2026 en el home — enlaza a las landings
// ya construidas (/fiestas-patrias, canasta y empresas).
export default function FiestasBannerV2() {
  return (
    <section className="w-full px-3 sm:px-4 lg:px-6 mb-8 sm:mb-12">
      <div className="max-w-screen-xl mx-auto">
        <Link
          to="/fiestas-patrias"
          className="group block rounded-3xl overflow-hidden transition-transform active:scale-[0.99]"
          style={{ background: 'linear-gradient(120deg,#B03A2E 0%, #8E2A20 55%, #1F3A5F 100%)', border: '1.5px solid #D4C4B0' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 sm:px-8 py-5 sm:py-6">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'rgba(255,255,255,.15)' }}>
                🇨🇱
              </span>
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: '#F0C9A0' }}>
                  <Flag className="w-3 h-3 inline mr-1 -mt-0.5" />
                  Fiestas Patrias 2026
                </p>
                <p className="font-fraunces text-lg sm:text-2xl leading-tight mt-0.5" style={{ color: '#FFFFFF' }}>
                  Canastas dieciocheras y regalos con grabado láser
                </p>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'rgba(255,255,255,.75)' }}>
                  100% reciclado · Para tu casa o tu empresa · Pide con anticipación para septiembre
                </p>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl flex-shrink-0 transition-colors group-hover:bg-white/90"
              style={{ background: '#FFFFFF', color: '#8E2A20' }}
            >
              Ver campaña
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}