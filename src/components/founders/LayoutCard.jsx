import { useState } from 'react';
import { Eye, Check, Maximize2 } from 'lucide-react';

/**
 * Card individual de un layout para la presentación a fundadores.
 * Muestra el layout COMPLETO sin recortes (object-contain) y la info al lado.
 * Click en imagen → abre modal fullscreen.
 */
export default function LayoutCard({ layout, index, selected, onToggleSelect, onPreview, viewMode = 'wide' }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  // Background gradient sutil derivado de la paleta del layout
  const bgGradient = layout.palette[0];

  return (
    <div
      className={`group relative bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl ${
        selected
          ? 'border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
          : 'border-slate-200/60 hover:border-emerald-300'
      }`}
    >
      {/* Header bar con número, título y check */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
            {String(index + 1).padStart(2, '0')}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight font-jakarta text-base">{layout.label}</h3>
            <p className="text-[11px] text-slate-500 leading-tight">{layout.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">R{layout.round}</span>
          {selected && (
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Imagen del layout — COMPLETA sin recortar */}
      <button
        onClick={() => onPreview(layout)}
        className="block w-full relative overflow-hidden cursor-zoom-in"
        style={{
          background: `linear-gradient(135deg, ${bgGradient}15, ${bgGradient}05)`,
          aspectRatio: viewMode === 'cinema' ? '16/9' : '4/3',
        }}
      >
        {!imgLoaded && <div className="absolute inset-0 peyu-shimmer" />}
        <img
          src={layout.image}
          alt={layout.label}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-contain transition-all duration-500 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-[1.02]`}
        />
        {/* Overlay hover con CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-5">
          <span className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 text-slate-900 shadow-lg">
            <Maximize2 className="w-4 h-4" /> Ver en grande
          </span>
        </div>
      </button>

      {/* Info compacta */}
      <div className="p-5">
        {/* Mecanismo */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 mb-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mb-1">Mecanismo</p>
          <p className="text-sm text-slate-800 leading-snug font-medium">{layout.mechanism}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-50 rounded-lg p-2.5">
            <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">CVR</p>
            <p className="text-xs text-slate-900 font-semibold leading-tight">{layout.cvr}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5">
            <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Estética</p>
            <p className="text-xs text-slate-900 font-semibold leading-tight line-clamp-2">{layout.aesthetic}</p>
          </div>
        </div>

        {/* Paleta + tipografía */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1">
            {layout.palette.map((c, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[60%] text-right">
            {layout.typography.split('+')[0].trim()}
          </span>
        </div>

        {/* Action */}
        <button
          onClick={() => onToggleSelect(layout.id)}
          className={`w-full text-sm font-semibold py-2.5 rounded-xl transition-all ${
            selected
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {selected ? '✓ En shortlist' : '+ Añadir a shortlist'}
        </button>
      </div>
    </div>
  );
}