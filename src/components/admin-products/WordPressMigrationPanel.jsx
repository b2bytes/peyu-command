import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, CloudUpload, CheckCircle2, AlertCircle, Pause, Play } from 'lucide-react';

/**
 * WordPressMigrationPanel
 * ────────────────────────
 * Migra masivamente las imágenes de productos desde WordPress (i0.wp.com)
 * hacia el CDN de Base44 (media.base44.com), procesando en lotes de 5
 * para no agotar timeout. Permite pausar y reanudar.
 */
export default function WordPressMigrationPanel({ onComplete }) {
  const [stats, setStats] = useState(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({ migrated: 0, errors: 0, total: 0 });
  const [logs, setLogs] = useState([]);

  // Cargar conteo inicial
  useEffect(() => {
    (async () => {
      const res = await base44.functions.invoke('migrateProductImagesToBase44', { dryRun: true });
      if (res.data?.ok) {
        setStats(res.data);
        setProgress(p => ({ ...p, total: res.data.totalPendientes }));
      }
    })();
  }, []);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ msg, type, at: new Date() }, ...prev].slice(0, 20));
  };

  const runBatch = async () => {
    const res = await base44.functions.invoke('migrateProductImagesToBase44', { batchSize: 5 });
    if (!res.data?.ok) {
      addLog(`Error en lote: ${res.data?.error || 'desconocido'}`, 'error');
      return { done: true, error: true };
    }
    const { migrated, errors, remaining, done, details } = res.data;
    setProgress(p => ({
      migrated: p.migrated + migrated,
      errors: p.errors + (errors?.length || 0),
      total: p.total,
    }));
    if (details?.length) {
      details.forEach(d => addLog(`✓ ${d.sku} · ${d.nombre.slice(0, 40)}`, 'success'));
    }
    if (errors?.length) {
      errors.forEach(e => addLog(`✗ ${e.sku}: ${e.error}`, 'error'));
    }
    return { done, remaining };
  };

  const start = async () => {
    setRunning(true);
    setPaused(false);
    addLog('Iniciando migración por lotes…', 'info');

    let safeguard = 0;
    while (safeguard < 50) { // máx 50 lotes (250 productos) por sesión
      if (paused) break;
      const result = await runBatch();
      if (result.done) {
        addLog('🎉 Migración completa', 'success');
        if (onComplete) onComplete();
        break;
      }
      safeguard += 1;
      // Pausa entre lotes para no saturar
      await new Promise(r => setTimeout(r, 800));
    }
    setRunning(false);
  };

  const pause = () => {
    setPaused(true);
    setRunning(false);
    addLog('⏸ Pausado por el usuario', 'info');
  };

  if (!stats) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2 text-xs text-white/60">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Calculando productos pendientes…
      </div>
    );
  }

  if (stats.totalPendientes === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-300">
        <CheckCircle2 className="w-4 h-4" />
        Todas las imágenes ya están en Base44 CDN ✨
      </div>
    );
  }

  const pct = progress.total > 0 ? Math.round((progress.migrated / progress.total) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2 min-w-0">
          <CloudUpload className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">
              Migrar imágenes WordPress → Base44 CDN
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              <strong className="text-amber-300">{progress.total - progress.migrated}</strong> productos
              {' '}aún dependen de <code className="px-1 bg-white/10 rounded">i0.wp.com</code>.
              Migrar las desconecta totalmente de WordPress.
            </p>
          </div>
        </div>
        {!running ? (
          <Button
            onClick={start}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 flex-shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            {progress.migrated > 0 ? 'Reanudar' : 'Iniciar migración'}
          </Button>
        ) : (
          <Button onClick={pause} size="sm" variant="outline" className="gap-1.5 flex-shrink-0">
            <Pause className="w-3.5 h-3.5" />
            Pausar
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {(running || progress.migrated > 0) && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-white/60">
            <span>{progress.migrated} / {progress.total} migradas · {pct}%</span>
            {progress.errors > 0 && <span className="text-rose-300">{progress.errors} errores</span>}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Logs en vivo */}
      {logs.length > 0 && (
        <div className="bg-black/30 rounded-lg p-2 max-h-32 overflow-y-auto peyu-scrollbar-light text-[10px] font-mono space-y-0.5">
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === 'success' ? 'text-emerald-300'
                : l.type === 'error' ? 'text-rose-300'
                : 'text-white/60'
              }
            >
              {l.msg}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-white/40 leading-relaxed">
        El proceso descarga cada imagen, la sube a Base44, y actualiza el producto.
        La URL antigua queda preservada en <code>galeria_urls</code> como respaldo.
        Procesa 5 por lote · ~3 segundos por producto.
      </p>
    </div>
  );
}