import { useState } from 'react';
import { Eye, Sparkles, Check } from 'lucide-react';

/**
 * Card individual de un layout para la presentación a fundadores.
 * Click → abre fullscreen modal con imagen + detalles.
 */
export default function LayoutCard({ layout, index, selected, onToggleSelect, onPreview }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className={`group relative bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        selected
          ? 'border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
          : 'border-slate-200/60 hover:border-emerald-300'
      }`}
    >
      {/* Número */}
      <div className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Selected check */}
      {selected && (
        <div className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
          <Check className="w-5 h-5" />
        </div>
      )}

      {/* Imagen */}
      <button
        onClick={() => onPreview(layout)}
        className="block w-full aspect-[16/10] bg-slate-100 overflow-hidden relative"
      >
        {!imgLoaded && (
          <div className="absolute inset-0 peyu-shimmer" />
        )}
        <img
          src={layout.image}
          alt={layout.label}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <span className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 text-slate-900">
            <Eye className="w-3.5 h-3.5" /> Ver detalle
          </span>
        </div>
      </button>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-slate-900 leading-tight font-jakarta">{layout.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{layout.subtitle}</p>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 mb-3 font-medium">
          {layout.mechanism}
        </p>

        {/* Paleta */}
        <div className="flex items-center gap-1 mb-3">
          {layout.palette.map((c, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <span className="text-[10px] text-slate-500 ml-2 font-mono">{layout.palette.length} colors</span>
        </div>

        {/* CVR badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
            {layout.cvr}
          </span>
        </div>

        {/* Action */}
        <button
          onClick={() => onToggleSelect(layout.id)}
          className={`w-full text-xs font-semibold py-2 rounded-xl transition-all ${
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