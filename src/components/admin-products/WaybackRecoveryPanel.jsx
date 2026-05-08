import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Archive, Check, X, AlertCircle, Sparkles, Pause, Play, Eye, ImageIcon } from 'lucide-react';

/**
 * WaybackRecoveryPanel
 * Recupera imágenes históricas de cada producto desde Wayback Machine
 * (snapshots archivados de peyuchile.cl WordPress original).
 * Workflow: preview matching → migrar lote por lote.
 */
export default function WaybackRecoveryPanel({ onComplete }) {
  const [stage, setStage] = useState('idle'); // idle | preview | migrating | done
  const [progress, setProgress] = useState({ processed: 0, total: 0, results: [] });
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState(null);
  const [replacePrincipal, setReplacePrincipal] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(true);

  const run = async (previewOnly = false) => {
    setStage(previewOnly ? 'preview' : 'migrating');
    setPaused(false);
    setError(null);
    setProgress({ processed: 0, total: 0, results: [] });

    let cursor = 0;
    let total = 0;
    const allResults = [];

    while (true) {
      if (paused) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      try {
        const res = await base44.functions.invoke('waybackImportProductImages', {
          cursor,
          batchSize: previewOnly ? 20 : 3,
          replacePrincipal,
          onlyMissing,
          previewOnly,
        });
        const data = res.data;
        if (!data?.ok) throw new Error(data?.error || 'Error');
        total = data.total;
        cursor = data.processed;
        if (data.resultados) allResults.push(...data.resultados);
        setProgress({ processed: cursor, total, results: allResults });
        if (data.done) break;
        await new Promise(r => setTimeout(r, previewOnly ? 200 : 800));
      } catch (e) {
        setError(e.message);
        break;
      }
    }
    setStage('done');
    if (!previewOnly && onComplete) onComplete();
  };

  if (stage === 'idle') {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-2xl p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Archive className="w-5 h-5 text-amber-300" />
              <h3 className="text-base lg:text-lg font-poppins font-bold text-white">
                Recuperar imágenes desde Wayback Machine
              </h3>
            </div>
            <p className="text-white/70 text-xs lg:text-sm leading-relaxed">
              Busca cada producto en archive.org (snapshots de la web WordPress original) y migra todas las imágenes
              archivadas al CDN. Ideal para recuperar las galerías secundarias que se perdieron.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <label className="flex items-center gap-2 text-xs text-white/70 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer">
            <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} />
            Solo productos con &lt; 2 imágenes
          </label>
          <label className="flex items-center gap-2 text-xs text-white/70 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer">
            <input type="checkbox" checked={replacePrincipal} onChange={e => setReplacePrincipal(e.target.checked)} />
            Reemplazar imagen principal
          </label>
          <Button onClick={() => run(true)} variant="outline" className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
            <Eye className="w-4 h-4" />
            Solo previsualizar matches
          </Button>
          <Button onClick={() => run(false)} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
            <Archive className="w-4 h-4" />
            Recuperar imágenes
          </Button>
        </div>

        {error && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    );
  }

  // ─── stage = preview | migrating | done ───
  const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;
  const exitos = progress.results.filter(r => r.ok).length;
  const errores = progress.results.filter(r => !r.ok).length;
  const totalImgs = progress.results.filter(r => r.ok && !r.preview).reduce((a, r) => a + (r.subidas || 0), 0);
  const isPreview = progress.results.some(r => r.preview);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-base lg:text-lg font-poppins font-bold text-white flex items-center gap-2">
            {stage === 'done' ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
            )}
            {isPreview
              ? (stage === 'done' ? 'Preview completado' : 'Buscando matches en Wayback…')
              : (stage === 'done' ? 'Recuperación completada' : 'Recuperando imágenes…')}
          </h3>
          <p className="text-white/60 text-xs mt-1">
            {progress.processed} / {progress.total} productos
            {!isPreview && ` · ${totalImgs} imágenes subidas al CDN`}
          </p>
        </div>
        {stage === 'migrating' && (
          <Button onClick={() => setPaused(p => !p)} variant="outline" size="sm" className="gap-1.5 bg-white/5 border-white/10 text-white hover:bg-white/10">
            {paused ? <><Play className="w-3.5 h-3.5" />Reanudar</> : <><Pause className="w-3.5 h-3.5" />Pausar</>}
          </Button>
        )}
        {stage === 'done' && (
          <Button onClick={() => { setStage('idle'); setProgress({ processed: 0, total: 0, results: [] }); }} className="bg-white/10 hover:bg-white/15 text-white">
            Cerrar
          </Button>
        )}
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div className={`h-full transition-all duration-500 ${stage === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="Con match" value={exitos} color="text-emerald-300" />
        <Stat label="Sin match" value={errores} color="text-rose-300" />
        <Stat label={isPreview ? 'Productos' : 'Imágenes'} value={isPreview ? exitos : totalImgs} color="text-cyan-300" />
      </div>

      <div className="bg-black/30 border border-white/10 rounded-lg max-h-72 overflow-y-auto peyu-scrollbar-light p-2 space-y-0.5 font-mono text-[11px]">
        {progress.results.slice(-30).reverse().map((r, idx) => (
          <div key={idx} className={`flex items-center gap-2 ${r.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
            {r.ok ? <Check className="w-3 h-3 flex-shrink-0" /> : <X className="w-3 h-3 flex-shrink-0" />}
            <span className="truncate flex-1">
              <span className="text-white/40">[{r.sku}]</span> {r.nombre}
              {r.ok && r.slug_match && <span className="text-amber-300/70"> → /{r.slug_match}</span>}
              {r.ok && !r.preview && r.subidas > 0 && <span className="text-cyan-300"> · {r.subidas} imgs</span>}
              {!r.ok && <span className="text-rose-300/70"> · {r.error}</span>}
            </span>
            {r.ok && typeof r.score === 'number' && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-white/5 text-white/60">{Math.round(r.score * 100)}%</span>
            )}
          </div>
        ))}
        {progress.results.length === 0 && (
          <div className="text-white/40 text-center py-4">Esperando primer lote…</div>
        )}
      </div>

      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
      <div className="text-[10px] text-white/50 uppercase tracking-wide">{label}</div>
      <div className={`text-lg font-poppins font-bold ${color}`}>{value}</div>
    </div>
  );
}