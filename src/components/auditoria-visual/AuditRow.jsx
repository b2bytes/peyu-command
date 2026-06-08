import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, Sparkles, Loader2, ExternalLink, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const SEVERIDAD_STYLE = {
  alta: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    chip: 'bg-red-100 text-red-800 border-red-300',
    text: 'text-red-700',
    icon: AlertCircle,
    label: 'Crítico',
  },
  media: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    chip: 'bg-amber-100 text-amber-800 border-amber-300',
    text: 'text-amber-700',
    icon: AlertTriangle,
    label: 'Medio',
  },
  baja: {
    border: 'border-sky-200',
    bg: 'bg-sky-50',
    chip: 'bg-sky-100 text-sky-800 border-sky-300',
    text: 'text-sky-700',
    icon: Info,
    label: 'Bajo',
  },
};

const VEREDICTO_STYLE = {
  buena: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  aceptable: 'bg-amber-100 border-amber-300 text-amber-800',
  reemplazar: 'bg-red-100 border-red-300 text-red-800',
};

export default function AuditRow({ row }) {
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const style = SEVERIDAD_STYLE[row.severidad] || SEVERIDAD_STYLE.baja;
  const Icon = style.icon;
  const { inspection } = row;

  const runAIAnalysis = async () => {
    setAnalyzing(true); setError(null);
    try {
      const res = await base44.functions.invoke('compareImageWithMockup', { producto_id: row.producto_id });
      setAnalysis(res?.data || null);
    } catch (e) { setError(e.message); }
    setAnalyzing(false);
  };

  return (
    <div className={`rounded-xl border p-3 ${style.border} ${style.bg}`}>
      <div className="flex items-start gap-3">
        {/* Thumb */}
        <div className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {row.imagen_url ? (
            <img src={row.imagen_url} alt={row.nombre} className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <Package className="w-7 h-7 text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${style.chip}`}>
              <Icon className="w-3 h-3" /> {style.label}
            </span>
            <span className="text-[11px] text-gray-500 font-mono">{row.sku}</span>
            <span className="text-[11px] text-gray-400">· {row.categoria}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{row.nombre}</p>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {row.tags.map((t, i) => (
              <span key={i} className="text-[10px] bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">{t}</span>
            ))}
          </div>

          {inspection?.ok && (
            <div className="text-[11px] text-gray-500 mt-1.5 flex gap-3 flex-wrap">
              {inspection.width > 0 && <span>📐 {inspection.width}×{inspection.height}</span>}
              {inspection.size_bytes > 0 && <span>💾 {Math.round(inspection.size_bytes / 1024)}KB</span>}
              {inspection.format && inspection.format !== 'unknown' && <span>🖼 {inspection.format}</span>}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Button size="sm" onClick={runAIAnalysis} disabled={analyzing || !row.imagen_url}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5">
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Análisis IA
          </Button>
          <Link to={`/admin/imagenes?sku=${encodeURIComponent(row.sku)}`}>
            <Button size="sm" variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-xs h-8 w-full gap-1.5">
              <ExternalLink className="w-3 h-3" /> Galería
            </Button>
          </Link>
        </div>
      </div>

      {/* Resultado IA */}
      {analysis && (
        <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-800">Veredicto IA:</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${VEREDICTO_STYLE[analysis.veredicto] || 'bg-gray-100 border-gray-300 text-gray-700'}`}>
              {analysis.veredicto?.toUpperCase()}
              {analysis.score_actual != null && ` · ${analysis.score_actual}/100`}
            </span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{analysis.razon}</p>
          {Array.isArray(analysis.recomendaciones) && analysis.recomendaciones.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {analysis.recomendaciones.slice(0, 4).map((r, i) => (
                <li key={i} className="text-[11px] text-gray-600 flex gap-1.5">
                  <span className="text-indigo-500">›</span> {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-red-700 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}