import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Folder, Check, X, AlertCircle, Image as ImageIcon, Sparkles, ArrowRight, Pause, Play } from 'lucide-react';

/**
 * DriveMatchMigrationPanel
 * Workflow:
 *  1. Preview: pide matching carpeta→producto sin tocar nada.
 *  2. El admin revisa la tabla, puede deseleccionar mapeos dudosos.
 *  3. Migración: ejecuta driveMigrateProductImages en lotes hasta terminar.
 */
export default function DriveMatchMigrationPanel({ onComplete }) {
  const [stage, setStage] = useState('idle'); // idle | previewing | reviewing | migrating | done
  const [preview, setPreview] = useState(null);
  const [stats, setStats] = useState(null);
  const [rawMapping, setRawMapping] = useState([]);
  const [excludedKeys, setExcludedKeys] = useState(new Set()); // carpetas que el admin desactiva
  const [migrationProgress, setMigrationProgress] = useState({ processed: 0, total: 0, results: [] });
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState(null);
  const [replacePrincipal, setReplacePrincipal] = useState(true);

  const runPreview = async () => {
    setStage('previewing');
    setError(null);
    try {
      const res = await base44.functions.invoke('drivePreviewMapping', {
        folderId: '1qXw3mA_KcimLqC5pH5sZr1Ib7gm9mBDR',
      });
      const data = res.data;
      if (!data?.ok) throw new Error(data?.error || 'Error en preview');
      setPreview(data.preview);
      setStats(data.stats);
      setRawMapping(data.raw_mapping);
      setStage('reviewing');
    } catch (e) {
      setError(e.message);
      setStage('idle');
    }
  };

  const toggleExcluded = (carpeta) => {
    const next = new Set(excludedKeys);
    next.has(carpeta) ? next.delete(carpeta) : next.add(carpeta);
    setExcludedKeys(next);
  };

  const startMigration = async () => {
    // Filtra el mapping con las exclusiones del admin
    const finalMapping = rawMapping
      .filter(m => !m.skip && !excludedKeys.has(m.carpeta))
      .map(m => ({ ...m }));

    if (finalMapping.length === 0) {
      setError('No hay carpetas seleccionadas para migrar');
      return;
    }

    setStage('migrating');
    setPaused(false);
    setError(null);

    let cursor = 0;
    let total = 0;
    const allResults = [];

    while (true) {
      if (paused) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      try {
        const res = await base44.functions.invoke('driveMigrateProductImages', {
          mapping: finalMapping,
          cursor,
          batchSize: 5,
          replacePrincipal,
        });
        const data = res.data;
        if (!data?.ok) throw new Error(data?.error || 'Error en migración');

        total = data.total;
        cursor = data.processed;
        if (data.resultados) allResults.push(...data.resultados);

        setMigrationProgress({ processed: cursor, total, results: allResults });

        if (data.done) break;

        // Pausa breve entre lotes para no saturar
        await new Promise(r => setTimeout(r, 600));
      } catch (e) {
        setError(e.message);
        break;
      }
    }

    setStage('done');
    if (onComplete) onComplete();
  };

  // ─────────── RENDER ───────────
  if (stage === 'idle') {
    return (
      <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-400/30 rounded-2xl p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-violet-300" />
              <h3 className="text-base lg:text-lg font-poppins font-bold text-white">
                Restaurar imágenes desde Google Drive
              </h3>
            </div>
            <p className="text-white/70 text-xs lg:text-sm leading-relaxed">
              Recupera las 121 imágenes perdidas desde tu Drive. Hago match inteligente carpeta↔producto,
              descargo y subo todo al CDN de Base44 con un click.
            </p>
          </div>
          <Button onClick={runPreview} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <Folder className="w-4 h-4" />
            Analizar carpetas
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

  if (stage === 'previewing') {
    return (
      <div className="bg-violet-500/10 border border-violet-400/30 rounded-2xl p-5 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-violet-300 animate-spin" />
        <span className="text-white/80 text-sm">Analizando estructura del Drive y haciendo match con tu catálogo…</span>
      </div>
    );
  }

  if (stage === 'reviewing') {
    const matchedItems = preview.filter(p => !p.skip);
    const skippedItems = preview.filter(p => p.skip);
    const seleccionadas = matchedItems.filter(p => !excludedKeys.has(p.carpeta));
    const totalImagenesSel = seleccionadas.reduce((acc, p) => acc + p.cantidad_imagenes, 0);

    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-base lg:text-lg font-poppins font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-300" />
                Revisa el matching propuesto
              </h3>
              <p className="text-white/60 text-xs mt-1">
                {matchedItems.length} carpetas matcheadas → {seleccionadas.reduce((acc, p) => acc + p.productos.length, 0)} productos · {totalImagenesSel} imágenes
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-xs text-white/70 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 cursor-pointer">
                <input type="checkbox" checked={replacePrincipal} onChange={e => setReplacePrincipal(e.target.checked)} />
                Reemplazar imagen principal
              </label>
              <Button onClick={() => setStage('idle')} variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                Cancelar
              </Button>
              <Button onClick={startMigration} disabled={seleccionadas.length === 0} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <ArrowRight className="w-4 h-4" />
                Migrar {totalImagenesSel} imágenes
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-[480px] overflow-y-auto peyu-scrollbar-light">
          {/* Matches */}
          {matchedItems.map(item => {
            const excluida = excludedKeys.has(item.carpeta);
            return (
              <div key={item.carpeta} className={`px-4 py-3 border-b border-white/5 ${excluida ? 'opacity-40' : ''}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleExcluded(item.carpeta)} className="mt-1 flex-shrink-0">
                    {excluida ? (
                      <div className="w-5 h-5 rounded-md border-2 border-white/30" />
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Folder className="w-4 h-4 text-violet-300 flex-shrink-0" />
                      <span className="font-mono text-sm text-white truncate">{item.carpeta}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />{item.cantidad_imagenes}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 pl-6">
                      {item.productos.map(p => (
                        <div key={p.producto_id} className="flex items-center gap-2 text-xs">
                          <ArrowRight className="w-3 h-3 text-white/30 flex-shrink-0" />
                          <span className="text-white/80 truncate flex-1">{p.nombre}</span>
                          <span className="font-mono text-white/40 text-[10px]">{p.sku}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            p.confianza >= 0.8 ? 'bg-emerald-500/20 text-emerald-300' :
                            p.confianza >= 0.5 ? 'bg-amber-500/20 text-amber-300' :
                            'bg-rose-500/20 text-rose-300'
                          }`}>
                            {Math.round(p.confianza * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Skipped */}
          {skippedItems.length > 0 && (
            <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/5">
              <p className="text-[11px] text-white/40 uppercase tracking-wide mb-1.5">
                Saltadas ({skippedItems.length}) · {skippedItems.reduce((a, p) => a + p.cantidad_imagenes, 0)} imágenes
              </p>
              <div className="space-y-0.5">
                {skippedItems.map(item => (
                  <div key={item.carpeta} className="flex items-center gap-2 text-xs text-white/40">
                    <X className="w-3 h-3" />
                    <span className="font-mono truncate">{item.carpeta}</span>
                    <span>·</span>
                    <span>{item.cantidad_imagenes} imgs</span>
                    <span>·</span>
                    <span className="italic">{item.razon_skip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'migrating' || stage === 'done') {
    const pct = migrationProgress.total > 0 ? Math.round((migrationProgress.processed / migrationProgress.total) * 100) : 0;
    const exitos = migrationProgress.results.filter(r => r.ok).length;
    const errores = migrationProgress.results.filter(r => !r.ok).length;
    const totalImgs = migrationProgress.results.filter(r => r.ok).reduce((a, r) => a + (r.imagenes_migradas || 0), 0);

    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h3 className="text-base lg:text-lg font-poppins font-bold text-white flex items-center gap-2">
              {stage === 'done' ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-violet-300 animate-spin" />
              )}
              {stage === 'done' ? 'Migración completada' : 'Migrando imágenes…'}
            </h3>
            <p className="text-white/60 text-xs mt-1">
              {migrationProgress.processed} / {migrationProgress.total} productos · {totalImgs} imágenes subidas al CDN
            </p>
          </div>
          {stage === 'migrating' && (
            <Button onClick={() => setPaused(p => !p)} variant="outline" size="sm" className="gap-1.5 bg-white/5 border-white/10 text-white hover:bg-white/10">
              {paused ? <><Play className="w-3.5 h-3.5" />Reanudar</> : <><Pause className="w-3.5 h-3.5" />Pausar</>}
            </Button>
          )}
          {stage === 'done' && (
            <Button onClick={() => { setStage('idle'); setPreview(null); setMigrationProgress({ processed: 0, total: 0, results: [] }); }} className="bg-white/10 hover:bg-white/15 text-white">
              Cerrar
            </Button>
          )}
        </div>

        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
          <div className={`h-full transition-all duration-500 ${stage === 'done' ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${pct}%` }} />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <Stat label="Éxitos" value={exitos} color="text-emerald-300" />
          <Stat label="Errores" value={errores} color="text-rose-300" />
          <Stat label="Imágenes" value={totalImgs} color="text-cyan-300" />
        </div>

        {/* Activity feed */}
        <div className="bg-black/30 border border-white/10 rounded-lg max-h-48 overflow-y-auto peyu-scrollbar-light p-2 space-y-0.5 font-mono text-[11px]">
          {migrationProgress.results.slice(-15).reverse().map((r, idx) => (
            <div key={idx} className={`flex items-center gap-2 ${r.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
              {r.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              <span className="truncate flex-1">
                {r.carpeta || r.producto_id?.slice(-8)} {r.ok && `· ${r.imagenes_migradas} imgs`}
                {!r.ok && ` · ${r.error}`}
              </span>
            </div>
          ))}
          {migrationProgress.results.length === 0 && (
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

  return null;
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
      <div className="text-[10px] text-white/50 uppercase tracking-wide">{label}</div>
      <div className={`text-lg font-poppins font-bold ${color}`}>{value}</div>
    </div>
  );
}