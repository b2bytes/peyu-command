import { X, Sparkles, Type, Palette, TrendingUp, Award } from 'lucide-react';

/**
 * Modal full-screen para ver un layout con todos sus detalles.
 */
export default function LayoutPreviewModal({ layout, onClose, onToggleSelect, selected }) {
  if (!layout) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen grande */}
        <div className="aspect-[16/10] bg-slate-100 rounded-t-3xl overflow-hidden">
          <img src={layout.image} alt={layout.label} className="w-full h-full object-cover" />
        </div>

        {/* Detalles */}
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-mono text-emerald-700 mb-1">RONDA {layout.round}</p>
              <h2 className="text-3xl font-bold font-jakarta text-slate-900">{layout.label}</h2>
              <p className="text-slate-600 mt-1">{layout.subtitle}</p>
            </div>
            <button
              onClick={() => onToggleSelect(layout.id)}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition ${
                selected
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {selected ? '✓ En shortlist' : '+ Añadir a shortlist'}
            </button>
          </div>

          {/* Mecanismo */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs uppercase tracking-wider font-bold text-emerald-800">Mecanismo de conversión</h3>
            </div>
            <p className="text-slate-800 font-medium">{layout.mechanism}</p>
          </div>

          {/* Grid detalles */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700">Tipografía</h3>
              </div>
              <p className="text-sm text-slate-900">{layout.typography}</p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700">Paleta</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {layout.palette.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: c }} />
                    <span className="text-[11px] font-mono text-slate-600">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700">Conversión esperada</h3>
              </div>
              <p className="text-sm text-slate-900 font-medium">{layout.cvr}</p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700">Estética</h3>
              </div>
              <p className="text-sm text-slate-900">{layout.aesthetic}</p>
            </div>
          </div>

          {/* Ideal para */}
          <div className="mt-6 bg-slate-50 rounded-2xl p-5">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700 mb-2">Ideal para</h3>
            <p className="text-slate-800">{layout.bestFor}</p>
          </div>
        </div>
      </div>
    </div>
  );
}