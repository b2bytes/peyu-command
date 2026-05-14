import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Loader2, GitMerge, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

/**
 * MergePreviewModal — Vista detallada de qué se va a fusionar.
 * Permite desmarcar campos específicos antes de aplicar.
 */
const FIELD_LABELS = {
  descripcion: 'Descripción',
  imagen_url: 'Imagen principal',
  galeria_urls: 'Galería de imágenes',
  imagen_promo_url: 'Imagen promo social',
  area_laser_mm: 'Área grabado láser',
  garantia_anios: 'Garantía (años)',
  peso_kg: 'Peso (kg)',
  largo_cm: 'Largo (cm)',
  ancho_cm: 'Ancho (cm)',
  alto_cm: 'Alto (cm)',
  precio_base_b2b: 'Precio base B2B',
  precio_50_199: 'Precio 50–199 u.',
  precio_200_499: 'Precio 200–499 u.',
  precio_500_mas: 'Precio 500+ u.',
  seo_meta_title: 'SEO · Meta Title',
  seo_meta_description: 'SEO · Meta Description',
  seo_focus_keyword: 'SEO · Focus Keyword',
  stock_actual: 'Stock (suma total)',
};

function formatValue(val) {
  if (val === null || val === undefined || val === '') return <span className="text-white/30 italic">vacío</span>;
  if (Array.isArray(val)) return <span>{val.length} URL{val.length !== 1 ? 's' : ''}</span>;
  if (typeof val === 'string' && val.length > 80) return <span title={val}>{val.slice(0, 80)}…</span>;
  if (typeof val === 'number') return val.toLocaleString('es-CL');
  return String(val);
}

export default function MergePreviewModal({ context, onClose, onApplied }) {
  const { primaryId, duplicateIds, group } = context;
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [enabledFields, setEnabledFields] = useState({});
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await base44.functions.invoke('scanDuplicateProducts', {
          mode: 'preview_merge', primaryId, duplicateIds,
        });
        if (cancelled) return;
        if (res?.data?.error) throw new Error(res.data.error);
        setPreview(res.data.preview);
        // Por defecto, todos los campos "changed" arrancan habilitados
        const enabled = {};
        for (const [key, info] of Object.entries(res.data.preview || {})) {
          enabled[key] = info.changed;
        }
        setEnabledFields(enabled);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [primaryId, duplicateIds.join(',')]);

  const toggleField = (key) => {
    setEnabledFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyMerge = async () => {
    if (!preview) return;
    const fieldsToApply = {};
    for (const [key, info] of Object.entries(preview)) {
      if (enabledFields[key] && info.proposed !== undefined && info.proposed !== null && info.proposed !== '') {
        fieldsToApply[key] = info.proposed;
      }
    }
    if (!confirm(`Se aplicarán ${Object.keys(fieldsToApply).length} cambios al primario y se desactivarán ${duplicateIds.length} duplicados.\n\n¿Continuar?`)) return;

    setApplying(true);
    try {
      const res = await base44.functions.invoke('scanDuplicateProducts', {
        mode: 'apply_merge', primaryId, duplicateIds, fieldsToApply,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      setResult(res.data);
      setTimeout(() => { onApplied(); }, 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setApplying(false);
    }
  };

  const changedFields = preview
    ? Object.entries(preview).filter(([_, info]) => info.changed)
    : [];

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-400/30 rounded-2xl w-full max-w-3xl my-4 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <GitMerge className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-poppins font-bold text-white text-base">Preview de fusión</h3>
              <p className="text-xs text-white/60 mt-0.5 truncate">
                <strong className="text-emerald-300">{group.primary.nombre}</strong> ← {duplicateIds.length} duplicado{duplicateIds.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 peyu-scrollbar-light">
          {loading && (
            <div className="text-center py-10 text-white/50 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Calculando preview de fusión…
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-400/30 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-400/30 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <p className="font-bold text-emerald-200 text-sm">¡Fusión completada!</p>
              <p className="text-xs text-emerald-200/70 mt-1">
                {result.fields_applied?.length || 0} campos fusionados · {result.deactivated_count} duplicados desactivados
              </p>
            </div>
          )}

          {!loading && !error && !result && preview && (
            <>
              {changedFields.length === 0 ? (
                <div className="p-6 bg-amber-500/10 border border-amber-400/30 rounded-xl text-center">
                  <AlertCircle className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                  <p className="font-bold text-amber-200 text-sm">El primario ya tiene los mejores datos</p>
                  <p className="text-xs text-amber-200/70 mt-1">No hay metadatos extra que aportar desde los duplicados. Solo se desactivarán los duplicados.</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs text-white/60">
                      {changedFields.length} campo{changedFields.length !== 1 ? 's' : ''} se actualizará{changedFields.length !== 1 ? 'n' : ''} en el primario. Desmarca los que no quieras.
                    </p>
                    <div className="flex gap-1.5">
                      <button onClick={() => {
                        const all = {};
                        changedFields.forEach(([k]) => { all[k] = true; });
                        setEnabledFields(prev => ({ ...prev, ...all }));
                      }} className="text-[10px] text-cyan-300 hover:text-cyan-200 underline">marcar todos</button>
                      <button onClick={() => {
                        const none = {};
                        changedFields.forEach(([k]) => { none[k] = false; });
                        setEnabledFields(prev => ({ ...prev, ...none }));
                      }} className="text-[10px] text-white/50 hover:text-white underline">ninguno</button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {changedFields.map(([key, info]) => (
                      <FieldDiff
                        key={key}
                        fieldKey={key}
                        info={info}
                        enabled={enabledFields[key]}
                        onToggle={() => toggleField(key)}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/60 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white/80">Qué pasa al confirmar:</strong>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    <li>El producto primario recibe los campos marcados arriba.</li>
                    <li>Los {duplicateIds.length} duplicados se marcan <code className="text-cyan-300">activo=false</code> (NO se borran).</li>
                    <li>Se agrega nota interna en la descripción del duplicado para trazabilidad.</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2 flex-shrink-0">
            <Button variant="ghost" onClick={onClose} disabled={applying} className="text-white/70 hover:text-white text-xs h-9">
              Cancelar
            </Button>
            <Button
              onClick={applyMerge}
              disabled={loading || applying || !preview}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-9 gap-2"
            >
              {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
              {applying ? 'Fusionando…' : `Aplicar fusión (${Object.values(enabledFields).filter(Boolean).length} campos)`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldDiff({ fieldKey, info, enabled, onToggle }) {
  const label = FIELD_LABELS[fieldKey] || fieldKey;
  return (
    <label
      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
        enabled
          ? 'bg-cyan-500/5 border-cyan-400/30 hover:bg-cyan-500/10'
          : 'bg-white/[0.02] border-white/5 opacity-60'
      }`}
    >
      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        className="mt-0.5 accent-cyan-500 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white">{label}</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mt-1 text-[11px]">
          <div className="text-white/50 line-through truncate">{formatValue(info.current)}</div>
          <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
          <div className="text-cyan-200 font-medium truncate">{formatValue(info.proposed)}</div>
        </div>
      </div>
    </label>
  );
}