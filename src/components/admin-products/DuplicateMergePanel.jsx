import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  GitMerge, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
  Sparkles, Star, ArrowRight, Image as ImageIcon, X
} from 'lucide-react';
import DuplicateGroupCard from './DuplicateGroupCard';
import MergePreviewModal from './MergePreviewModal';

/**
 * DuplicateMergePanel
 * Detecta duplicados con fuzzy matching y permite fusionar metadatos
 * (descripciones, imágenes, precios, dimensiones, SEO) en un primario.
 * NO afecta productos hasta que el usuario aprueba cada fusión.
 */
export default function DuplicateMergePanel({ onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(0.88);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [mergeContext, setMergeContext] = useState(null); // { primaryId, duplicateIds }
  const [processed, setProcessed] = useState(new Set());

  const runScan = async () => {
    setLoading(true);
    setError('');
    setProcessed(new Set());
    try {
      const res = await base44.functions.invoke('scanDuplicateProducts', {
        mode: 'scan', threshold, includeInactive,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      setReport(res.data);
    } catch (e) {
      setError(e.message || 'Error escaneando duplicados');
    } finally {
      setLoading(false);
    }
  };

  const openMergePreview = (group) => {
    setMergeContext({
      primaryId: group.primary.id,
      duplicateIds: group.duplicates.map(d => d.id),
      group,
    });
  };

  const onMergeApplied = (groupKey) => {
    setProcessed(prev => new Set(prev).add(groupKey));
    setMergeContext(null);
    onActionComplete?.();
  };

  // Filtros aplicados a los grupos
  const filteredGroups = report?.groups.filter(g => {
    if (processed.has(g.primary.id)) return false;
    if (confidenceFilter === 'all') return true;
    return g.best_match_confidence === confidenceFilter;
  }) || [];

  return (
    <div className="bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-indigo-500/10 border border-cyan-400/30 rounded-2xl p-4 lg:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <GitMerge className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-poppins font-bold text-white text-base flex items-center gap-2 flex-wrap">
              Fusión inteligente de duplicados
              {report && (
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full">
                  {filteredGroups.length} grupos · {filteredGroups.reduce((s, g) => s + g.duplicates.length, 0)} duplicados
                </span>
              )}
            </h3>
            <p className="text-xs text-white/65 mt-0.5 leading-relaxed">
              Match exacto + fuzzy + SKU root. Conserva el mejor metadato (descripción más larga, todas las imágenes, precios B2B, SEO) y desactiva los redundantes. <strong className="text-white/80">Nada se borra.</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {report && (
            <button onClick={() => setExpanded(!expanded)} className="text-white/50 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-white/5 flex items-center gap-1">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Colapsar' : 'Expandir'}
            </button>
          )}
          <Button onClick={runScan} disabled={loading} size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Escaneando...' : report ? 'Re-escanear' : 'Detectar duplicados'}
          </Button>
        </div>
      </div>

      {/* Controles de scan */}
      {expanded && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2 text-white/70">
            <span>Umbral similitud:</span>
            <input
              type="range" min="0.75" max="0.99" step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-32 accent-cyan-500"
            />
            <span className="font-mono text-cyan-300 w-12">{(threshold * 100).toFixed(0)}%</span>
          </label>
          <label className="flex items-center gap-1.5 text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="accent-cyan-500"
            />
            <span>Incluir inactivos en scan</span>
          </label>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-rose-500/10 border border-rose-400/30 rounded-lg text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Resultados */}
      {report && expanded && (
        <div className="mt-4 space-y-3">
          {/* Filtros por confianza */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `Todos · ${report.total_groups}`, color: 'white' },
              { id: 'very_high', label: `Muy alta · ${report.by_confidence.very_high}`, color: 'emerald' },
              { id: 'high', label: `Alta · ${report.by_confidence.high}`, color: 'cyan' },
              { id: 'medium', label: `Media · ${report.by_confidence.medium}`, color: 'amber' },
              { id: 'low', label: `Baja · ${report.by_confidence.low}`, color: 'rose' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setConfidenceFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  confidenceFilter === f.id
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Grupos */}
          {filteredGroups.length === 0 ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-400/30 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <p className="font-bold text-emerald-200 text-sm">Sin duplicados en este filtro</p>
              <p className="text-xs text-emerald-200/70 mt-1">
                {processed.size > 0 ? `${processed.size} grupos ya fusionados en esta sesión` : 'Catálogo limpio para este nivel de confianza.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto peyu-scrollbar-light pr-1">
              {filteredGroups.map((g) => (
                <DuplicateGroupCard
                  key={g.primary.id}
                  group={g}
                  onMerge={() => openMergePreview(g)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal preview/merge */}
      {mergeContext && (
        <MergePreviewModal
          context={mergeContext}
          onClose={() => setMergeContext(null)}
          onApplied={() => onMergeApplied(mergeContext.primaryId)}
        />
      )}
    </div>
  );
}