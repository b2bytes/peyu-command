import { X, Sparkles, Type, Palette, TrendingUp, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Modal full-screen que muestra el layout COMPLETO sin recortes.
 * Soporta navegación con flechas (←/→ y teclado).
 */
export default function LayoutPreviewModal({ layout, onClose, onToggleSelect, selected, onPrev, onNext }) {
  useEffect(() => {
    if (!layout) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layout, onClose, onPrev, onNext]);

  if (!layout) return null;

  const bgGradient = layout.palette[0];

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 text-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/60">RONDA {layout.round}</span>
          <span className="text-white/30">·</span>
          <h2 className="text-xl font-bold font-jakarta">{layout.label}</h2>
          <span className="text-white/50 text-sm">{layout.subtitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(layout.id);
            }}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
              selected
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-white text-slate-900 hover:bg-white/90'
            }`}
          >
            {selected ? '✓ En shortlist' : '+ Añadir a shortlist'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content: Imagen GRANDE + sidebar info */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 px-6 pb-6 overflow-hidden min-h-0">
        {/* Imagen — ocupa todo el espacio disponible */}
        <div
          className="relative flex-1 rounded-3xl overflow-hidden flex items-center justify-center min-h-0"
          style={{
            background: `linear-gradient(135deg, ${bgGradient}30, ${bgGradient}10)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={layout.image}
            alt={layout.label}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />

          {/* Nav arrows */}
          {onPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Sidebar info */}
        <aside
          className="lg:w-80 xl:w-96 bg-white rounded-3xl p-5 overflow-y-auto shrink-0 max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mecanismo */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-emerald-800">Mecanismo</h3>
            </div>
            <p className="text-sm text-slate-800 font-medium leading-snug">{layout.mechanism}</p>
          </div>

          {/* Stats compactos */}
          <div className="space-y-3">
            <InfoBlock icon={Type} label="Tipografía" value={layout.typography} />
            <InfoBlock icon={TrendingUp} label="Conversión" value={layout.cvr} highlight />
            <InfoBlock icon={Award} label="Estética" value={layout.aesthetic} />

            {/* Paleta */}
            <div className="border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-3.5 h-3.5 text-slate-600" />
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Paleta</h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {layout.palette.map((c, i) => (
                  <div key={i} className="flex items-center gap-1 bg-slate-50 rounded-md pl-1 pr-2 py-0.5">
                    <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c }} />
                    <span className="text-[10px] font-mono text-slate-600">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ideal para */}
            <div className="bg-slate-50 rounded-xl p-3">
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-700 mb-1">Ideal para</h3>
              <p className="text-sm text-slate-800 leading-snug">{layout.bestFor}</p>
            </div>
          </div>

          {/* Hint teclado */}
          <p className="text-[10px] text-slate-400 font-mono text-center mt-4">
            ← → para navegar · ESC para cerrar
          </p>
        </aside>
      </div>
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-amber-50 border border-amber-100' : 'border border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-amber-700' : 'text-slate-600'}`} />
        <h3 className={`text-[10px] uppercase tracking-wider font-bold ${highlight ? 'text-amber-800' : 'text-slate-700'}`}>
          {label}
        </h3>
      </div>
      <p className="text-sm text-slate-900 leading-snug">{value}</p>
    </div>
  );
}