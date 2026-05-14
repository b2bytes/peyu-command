import { Image as ImageIcon, Star, ArrowRight, GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Card resumen de un grupo de duplicados.
 * Muestra: primary (a conservar) + N duplicados (a fusionar + desactivar).
 * Botón abre el modal de preview con detalle de qué se va a fusionar.
 */
const CONF_STYLES = {
  very_high: { label: 'Muy alta', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' },
  high:      { label: 'Alta',     color: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' },
  medium:    { label: 'Media',    color: 'bg-amber-500/20 text-amber-300 border-amber-400/40' },
  low:       { label: 'Baja',     color: 'bg-rose-500/20 text-rose-300 border-rose-400/40' },
};

const MATCH_LABELS = {
  sku_exact: 'SKU idéntico',
  sku_root: 'SKU raíz',
  name_exact: 'Nombre exacto',
  name_near_exact: 'Nombre casi exacto',
  name_fuzzy: 'Nombre similar',
  name_loose: 'Nombre vagamente similar',
};

export default function DuplicateGroupCard({ group, onMerge }) {
  const conf = CONF_STYLES[group.best_match_confidence] || CONF_STYLES.low;
  const matchLabel = MATCH_LABELS[group.best_match_type] || group.best_match_type;

  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-3 hover:border-cyan-400/30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.color}`}>
            {conf.label}
          </span>
          <span className="text-[10px] text-white/50 font-mono">{matchLabel}</span>
          <span className="text-[10px] text-white/40">
            {group.duplicates.length} duplicado{group.duplicates.length > 1 ? 's' : ''}
          </span>
        </div>
        <Button
          size="sm"
          onClick={onMerge}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] h-7 px-3 gap-1.5"
        >
          <GitMerge className="w-3 h-3" /> Fusionar
        </Button>
      </div>

      {/* Visual: primary → duplicates */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
        {/* PRIMARY */}
        <div className="bg-emerald-500/5 border border-emerald-400/20 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1.5">
            <Star className="w-3 h-3 text-emerald-300 fill-emerald-300" />
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">A conservar</span>
            <span className="text-[10px] text-white/40 ml-auto">score {group.primary.quality_score}</span>
          </div>
          <ProductRow producto={group.primary} />
        </div>

        {/* Arrow */}
        <div className="hidden md:flex items-center justify-center px-1">
          <ArrowRight className="w-4 h-4 text-cyan-400/60" />
        </div>

        {/* DUPLICATES */}
        <div className="bg-rose-500/5 border border-rose-400/20 rounded-lg p-2 space-y-1.5">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">A fusionar y desactivar</span>
          </div>
          {group.duplicates.map(d => (
            <div key={d.id} className="flex items-start gap-2">
              <ProductRow producto={d} compact />
              <span className="text-[9px] font-mono text-white/40 flex-shrink-0 mt-1">
                {(d.similarity * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductRow({ producto, compact }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      {producto.imagen_url ? (
        <img
          src={producto.imagen_url}
          alt=""
          className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-md object-cover flex-shrink-0 bg-white/5`}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-md bg-white/5 flex items-center justify-center flex-shrink-0`}>
          <ImageIcon className="w-3 h-3 text-white/30" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-white font-medium truncate leading-tight`}>
          {producto.nombre}
        </p>
        <div className="text-[9px] text-white/40 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span>{producto.sku}</span>
          {producto.precio_b2c > 0 && <span>${producto.precio_b2c.toLocaleString('es-CL')}</span>}
          {producto.galeria_count > 0 && <span>{producto.galeria_count}🖼️</span>}
          {producto.descripcion_length > 0 && <span>{producto.descripcion_length}c</span>}
          {!producto.activo && <span className="text-rose-300/70">inactivo</span>}
        </div>
      </div>
    </div>
  );
}