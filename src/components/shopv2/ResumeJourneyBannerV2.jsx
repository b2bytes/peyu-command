import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Building2, ArrowRight, X } from 'lucide-react';
import { loadJourney } from '@/lib/personalizar-journey';
import { loadQuoteJourney } from '@/lib/cotizacion-journey';

// ════════════════════════════════════════════════════════════════════════
// ResumeJourneyBannerV2 — Continuidad orgánica del viaje del cliente.
// Si dejó una personalización o cotización a medias (auto-guardadas),
// le ofrece retomarla en 1 clic en vez de empezar de cero.
// ════════════════════════════════════════════════════════════════════════
export default function ResumeJourneyBannerV2() {
  const [hidden, setHidden] = useState(false);

  const pj = loadJourney();
  const qj = loadQuoteJourney();
  const pOk = !!(pj?.productoId && (pj.step > 0 || pj.opcion || pj.logoUrlSubido || pj.texto));
  const qOk = !!(qj?.items?.length || qj?.form?.company_name);
  if (hidden || (!pOk && !qOk)) return null;

  // El viaje más reciente manda
  const usarQuote = qOk && (!pOk || (qj._savedAt || 0) > (pj._savedAt || 0));
  const to = usarQuote ? '/CotizacionRapida' : '/personalizar';
  const Icon = usarQuote ? Building2 : Sparkles;
  const titulo = usarQuote ? 'Tienes una cotización en curso' : 'Tienes una personalización a medias';
  const sub = usarQuote
    ? 'Tus productos y datos quedaron guardados — retómala donde quedaste'
    : 'Tu diseño quedó guardado automáticamente — continúa donde quedaste';
  const accent = usarQuote ? '#0F8B6C' : '#C0785C';

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 pt-3 mb-3 sm:mb-4">
      <div className="max-w-screen-xl mx-auto">
        <div
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ background: `${accent}0D`, border: `1.5px solid ${accent}40` }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}1A` }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold leading-snug" style={{ color: accent }}>{titulo}</p>
            <p className="text-[11px] leading-snug line-clamp-2 sm:line-clamp-1" style={{ color: '#7A6050' }}>{sub}</p>
          </div>
          <Link
            to={to}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all hover:-translate-y-0.5"
            style={{ background: accent }}
          >
            Continuar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setHidden(true)}
            className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
            style={{ color: '#A08070' }}
            aria-label="Ocultar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}