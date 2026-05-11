// ============================================================================
// AuditRow — Fila de un producto con problema visual.
// Acciones rápidas: comparar con IA, ver Drive candidates, abrir Galería.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, AlertTriangle, Info, Sparkles, Loader2, ExternalLink, Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SEVERIDAD_STYLE = {
  alta: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    chip: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
    icon: AlertCircle,
    label: 'Crítico',
  },
  media: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    chip: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    icon: AlertTriangle,
    label: 'Medio',
  },
  baja: {
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/5',
    chip: 'bg-sky-500/15 text-sky-200 border-sky-500/30',
    icon: Info,
    label: 'Bajo',
  },
};

export default function AuditRow({ row }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const style = SEVERIDAD_STYLE[row.severidad] || SEVERIDAD_STYLE.baja;
  const Icon = style.icon;
  const { inspection } = row;

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('compareImageWithMockup', {
        producto_id: row.producto_id,
      });
      setAnalysis(res?.data || null);
    } catch (e) {
      setError(e.message);
    }
    setAnalyzing(false);
  };

  return (
    <div className={`rounded-xl border p-3 ${style.border} ${style.bg}`}>
      <div className="flex items-start gap-3">
        {/* Thumb */}
        <div className="w-20 h-20 rounded-lg bg-black/30 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {row.imagen_url ? (
            <img
              src={row.imagen_url}
              alt={row.nombre}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <Package className="w-7 h-7 text-white/30" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${style.chip}`}>
              <Icon className="w-3 h-3" /> {style.label}
            </span>
            <span className="text-[11px] text-white/50 font-mono">{row.sku}</span>
            <span className="text-[11px] text-white/40">· {row.categoria}</span>
          </div>
          <p className="text-sm font-medium text-white mt-1 truncate">{row.nombre}</p>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {row.tags.map((t, i) => (
              <span key={i} className="text-[10px] bg-white/8 border border-white/10 rounded-full px-2 py-0.5 text-white/80">
                {t}
              </span>
            ))}
          </div>

          {/* Metadata técnica */}
          {inspection?.ok && (
            <div className="text-[11px] text-white/50 mt-1.5 flex gap-3 flex-wrap">
              {inspection.width > 0 && (
                <span>📐 {inspection.width}×{inspection.height}</span>
              )}
              {inspection.size_bytes > 0 && (
                <span>💾 {Math.round(inspection.size_bytes / 1024)}KB</span>
              )}
              {inspection.format && inspection.format !== 'unknown' && (
                <span>🖼 {inspection.format}</span>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Button
            size="sm"
            onClick={runAIAnalysis}
            disabled={analyzing || !row.imagen_url}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5"
          >
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Análisis IA
          </Button>
          <Link to={`/admin/imagenes?sku=${encodeURIComponent(row.sku)}`}>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/5 border-white/15 text-white hover:bg-white/10 text-xs h-8 w-full gap-1.5"
            >
              <ExternalLink className="w-3 h-3" /> Galería
            </Button>
          </Link>
        </div>
      </div>

      {/* Resultado IA */}
      {analysis && (
        <div className="mt-3 p-3 rounded-lg border border-indigo-400/30 bg-indigo-500/10">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-xs font-semibold text-indigo-100">Veredicto IA:</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
              analysis.veredicto === 'buena' ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200' :
              analysis.veredicto === 'aceptable' ? 'bg-amber-500/15 border-amber-400/40 text-amber-200' :
              analysis.veredicto === 'reemplazar' ? 'bg-rose-500/15 border-rose-400/40 text-rose-200' :
              'bg-white/10 border-white/15 text-white/80'
            }`}>
              {analysis.veredicto?.toUpperCase()}
              {analysis.score_actual != null && ` · ${analysis.score_actual}/100`}
            </span>
          </div>
          <p className="text-xs text-white/85 leading-relaxed">{analysis.razon}</p>
          {Array.isArray(analysis.recomendaciones) && analysis.recomendaciones.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {analysis.recomendaciones.slice(0, 4).map((r, i) => (
                <li key={i} className="text-[11px] text-white/70 flex gap-1.5">
                  <span className="text-indigo-300">›</span> {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-rose-300 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}
    </div>
  );
}