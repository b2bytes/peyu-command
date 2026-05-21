// ============================================================================
// KeywordPropagationPanel · Dispara seoPropagateKeywords (dry-run + apply)
// Muestra qué productos se van a optimizar con las 9 keywords prioritarias
// de may-2026 y permite aplicar los cambios al catálogo.
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Rocket, Loader2, CheckCircle2, AlertTriangle, Eye, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function KeywordPropagationPanel() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState(null); // 'dry' | 'apply'

  const run = async (dryRun) => {
    setBusy(true);
    setMode(dryRun ? 'dry' : 'apply');
    try {
      const res = await base44.functions.invoke('seoPropagateKeywords', {
        dry_run: dryRun,
        limit: 100,
        only_missing: false,
      });
      if (res?.data?.ok) {
        setResult(res.data);
        toast.success(
          dryRun
            ? `🔍 Preview: ${res.data.optimized} productos optimizables`
            : `✅ ${res.data.optimized} productos optimizados`
        );
      } else {
        toast.error(res?.data?.error || 'Error desconocido');
      }
    } catch (e) {
      toast.error(e?.message || 'Error de red');
    }
    setBusy(false);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl overflow-hidden">
      <div className="px-4 md:px-5 py-4 border-b border-slate-800">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-jakarta font-extrabold text-slate-50 text-base md:text-lg tracking-tight">
                Propagar keywords prioritarias al catálogo
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 font-jakarta">
                9 KW · may-2026
              </span>
            </div>
            <p className="text-[12px] md:text-[13px] text-slate-400 font-inter mt-0.5 leading-relaxed">
              Reescribe meta_title, meta_description y focus_keyword de productos cuya categoría matchea con las 9 keywords prioritarias (organizadores, carcasas iPhone, maceteros, bandejas, oficina, merchandising, sustentables, corporativos reciclados, ecológicos).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => run(true)}
            disabled={busy}
            variant="outline"
            size="sm"
            className="h-9 bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-50 hover:text-emerald-200 gap-1.5"
          >
            {busy && mode === 'dry' ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando…</>
            ) : (
              <><Eye className="w-3.5 h-3.5" /> Preview (sin aplicar)</>
            )}
          </Button>
          <Button
            onClick={() => {
              if (!confirm('🚀 Voy a regenerar meta_title + meta_description + focus_keyword de TODOS los productos que matchean con las 9 keywords prioritarias.\n\nLos cambios se guardan directo. ¿Continuar?')) return;
              run(false);
            }}
            disabled={busy}
            size="sm"
            className="h-9 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold font-jakarta gap-1.5 shadow-lg shadow-emerald-500/30"
          >
            {busy && mode === 'apply' ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Aplicando…</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Aplicar al catálogo</>
            )}
          </Button>
        </div>
      </div>

      {result && (
        <div className="px-4 md:px-5 py-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <KPI label="Escaneados" value={result.total_products_scanned} tone="slate" />
            <KPI label="Matched" value={result.matched_products} tone="emerald" />
            <KPI label="Optimizados" value={result.optimized} tone="teal" />
            <KPI label="Errores" value={result.errors} tone={result.errors > 0 ? 'rose' : 'slate'} />
          </div>

          {/* Distribución por keyword */}
          {result.by_keyword && Object.keys(result.by_keyword).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 font-jakarta">
                Distribución por keyword
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(result.by_keyword).map(([kw, n]) => (
                  <span key={kw} className="text-[11px] px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 font-inter">
                    {kw} <span className="text-emerald-100 font-bold">· {n}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Banner aplicado / preview */}
          <div className={`flex items-start gap-2 p-3 rounded-xl border ${
            result.dry_run
              ? 'bg-amber-500/10 border-amber-400/30 text-amber-200'
              : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
          }`}>
            {result.dry_run ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <p className="text-[12px] font-inter leading-relaxed">
              {result.dry_run
                ? <>Esto es un <strong>preview</strong>. Los cambios todavía NO se aplicaron al catálogo. Revisa los resultados y dale "Aplicar al catálogo" para guardarlos.</>
                : <>Cambios aplicados al catálogo de productos. Los meta_title, meta_description y focus_keyword fueron actualizados con historial.</>
              }
            </p>
          </div>

          {/* Lista detallada */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto peyu-scrollbar-light">
            {result.changes.slice(0, 50).map(c => (
              <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-jakarta font-bold text-slate-50 text-[13px] leading-tight">{c.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{c.sku} · {c.categoria}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-500/15 text-emerald-200 border-emerald-400/30 font-jakarta whitespace-nowrap flex-shrink-0">
                    {c.target_keyword}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 pt-1 border-t border-slate-800">
                  <Field label={`title · ${c.meta_title_length}c`} value={c.meta_title} prev={c.previous_meta_title} />
                  <Field label={`desc · ${c.meta_description_length}c`} value={c.meta_description} prev={c.previous_meta_description} />
                </div>
              </div>
            ))}
            {result.changes.length > 50 && (
              <p className="text-[11px] text-slate-500 text-center pt-2">
                Mostrando 50 de {result.changes.length} cambios.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, tone }) {
  const TONE = {
    slate:   'border-slate-700 text-slate-300',
    emerald: 'border-emerald-500/30 text-emerald-200',
    teal:    'border-teal-500/30 text-teal-200',
    rose:    'border-rose-500/30 text-rose-200',
  };
  return (
    <div className={`bg-slate-950 border ${TONE[tone]} rounded-xl p-3`}>
      <p className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1 font-jakarta">{label}</p>
      <p className="font-jakarta font-extrabold text-2xl tracking-tight leading-none">{value}</p>
    </div>
  );
}

function Field({ label, value, prev }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-0.5 font-jakarta">{label}</p>
      {prev && prev !== value && (
        <p className="text-[10px] text-slate-600 line-through font-inter mb-0.5 leading-snug break-words">{prev}</p>
      )}
      <p className="text-[11px] text-slate-200 font-inter leading-snug break-words">{value}</p>
    </div>
  );
}