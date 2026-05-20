// ============================================================================
// OptimizeMetaTagsButton · Lanza optimización IA de meta tags para queries P2
// ----------------------------------------------------------------------------
// Llama a optimizePage2Keywords con dry_run=false. Muestra un modal con el
// resultado: productos optimizados, queries asignadas, queries huérfanas.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

export default function OptimizeMetaTagsButton({ days = 28, onDone }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    if (!confirm(
      '🚀 Optimización de meta tags\n\n' +
      `Voy a tomar las queries en página 2 (pos 11-20) de los últimos ${days} días, ` +
      'identificar qué productos rankean para cada una, y regenerar sus meta tags ' +
      'con IA priorizando esas keywords reales.\n\n' +
      'Los cambios se aplican DIRECTO en los productos. ¿Continuar?'
    )) return;

    setBusy(true);
    try {
      const res = await base44.functions.invoke('optimizePage2Keywords', { days, country: 'chl', dry_run: false });
      if (res?.data?.ok) {
        setResult(res.data);
        toast.success(`✅ ${res.data.products_optimized} productos optimizados`);
        if (onDone) onDone();
      } else {
        toast.error(res?.data?.error || 'Error desconocido');
      }
    } catch (e) {
      toast.error(e?.message || 'Error de red');
    }
    setBusy(false);
  };

  return (
    <>
      <Button
        onClick={handleRun}
        disabled={busy}
        size="sm"
        className="h-9 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold font-jakarta gap-1.5 shadow-lg shadow-violet-500/30"
      >
        {busy ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Optimizando…
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            Optimizar meta tags con IA
          </>
        )}
      </Button>

      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="max-w-3xl bg-slate-950 border-white/10 max-h-[85vh] overflow-y-auto peyu-scrollbar-light">
          <DialogHeader>
            <DialogTitle className="font-jakarta text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Resultado de optimización
            </DialogTitle>
          </DialogHeader>

          {result && (
            <div className="space-y-5">
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <KPI label="Queries P2 detectadas" value={result.page2_queries_total} tone="amber" />
                <KPI label="Productos optimizados" value={result.products_optimized} tone="emerald" />
                <KPI label="Queries sin producto" value={result.orphan_queries?.length || 0} tone="rose" />
              </div>

              {/* Optimizaciones aplicadas */}
              {result.optimizations?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-jakarta font-bold text-white text-sm">Cambios aplicados</h3>
                  {result.optimizations.map(o => (
                    <div key={o.id} className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-jakarta font-bold text-white text-sm">{o.nombre}</p>
                          <p className="text-[10px] text-white/40 font-mono">{o.sku}</p>
                        </div>
                        {o.applied && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-500/15 text-emerald-200 border-emerald-400/25 font-jakarta">
                            APLICADO
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {o.queries_target.map(q => (
                          <span key={q} className="text-[10px] bg-violet-500/15 text-violet-200 border border-violet-400/25 px-2 py-0.5 rounded font-mono">
                            {q}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                        <Field label={`Title (${o.meta_title_length} chars)`} value={o.meta_title} prev={o.current_meta_title} />
                        <Field label={`Description (${o.meta_description_length} chars)`} value={o.meta_description} prev={o.current_meta_description} />
                      </div>
                      <p className="text-[10px] text-white/40 font-mono">
                        focus_keyword: <span className="text-teal-300">{o.focus_keyword}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Queries huérfanas */}
              {result.orphan_queries?.length > 0 && (
                <div className="bg-rose-500/5 border border-rose-400/20 rounded-xl p-4">
                  <p className="text-[12px] font-jakarta font-bold text-rose-200 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Queries sin producto mapeado ({result.orphan_queries.length})
                  </p>
                  <p className="text-[11px] text-rose-100/70 mb-3 font-inter">
                    Estas queries apuntan a páginas que no son fichas de producto (categorías, blog, home).
                    Requieren optimización manual o crear contenido específico.
                  </p>
                  <div className="space-y-1">
                    {result.orphan_queries.slice(0, 10).map(q => (
                      <div key={q.query} className="flex items-center justify-between text-[11px] font-inter">
                        <span className="text-white/80">{q.query}</span>
                        <div className="flex items-center gap-2 text-white/40 font-mono">
                          <span>pos {q.position.toFixed(1)}</span>
                          <span>{q.impressions} imp</span>
                          {q.url && (
                            <a href={q.url} target="_blank" rel="noopener noreferrer" className="text-teal-300 hover:text-teal-200">
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors?.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-400/25 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-rose-200 mb-1">Errores: {result.errors.length}</p>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-[10px] text-rose-100/70 font-mono">
                      {e.sku}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function KPI({ label, value, tone }) {
  const TONE = {
    emerald: 'border-emerald-400/25 text-emerald-200',
    amber: 'border-amber-400/25 text-amber-200',
    rose: 'border-rose-400/25 text-rose-200',
  };
  return (
    <div className={`bg-white/[0.04] border ${TONE[tone]} rounded-xl p-3`}>
      <p className="text-[9px] uppercase tracking-wider font-bold opacity-70 mb-1 font-jakarta">{label}</p>
      <p className="font-jakarta font-extrabold text-2xl tracking-tight leading-none">{value}</p>
    </div>
  );
}

function Field({ label, value, prev }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1 font-jakarta">{label}</p>
      {prev && prev !== value && (
        <p className="text-[10px] text-white/30 line-through font-inter mb-0.5">{prev}</p>
      )}
      <p className="text-[12px] text-white/90 font-inter leading-snug">{value}</p>
    </div>
  );
}