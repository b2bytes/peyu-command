// ============================================================================
// BulkImageGeneratorPanel — Generación MASIVA de imágenes IA para todo el
// catálogo (o un subconjunto), aplicando todo el razonamiento del producto:
// título, cantidad detectada, material, descripción, anti-marcas Google Shop.
//
// Flujo:
//   1. El admin elige un alcance (Sin imagen / Activos / Todos / Categoría)
//   2. Elige modo: "Solo galería" (seguro) o "Reemplazar principal" (riesgo)
//   3. Elige cuál de los 4 estilos usar (o "Mejor de 2" para mayor calidad)
//   4. Lanza la generación con concurrencia controlada y progreso en vivo
//   5. Cancela en cualquier momento
// ============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Wand2, Sparkles, Loader2, Play, Square, CheckCircle2, AlertTriangle,
  Star, Layers, ImageOff, Package, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ESTILOS, buildPrompt } from '@/lib/image-prompt-builder';

const SCOPES = [
  { id: 'sin_imagen',  label: 'Sin imagen',       desc: 'Productos activos que no tienen imagen principal',         filter: (p) => p.activo !== false && !p.imagen_url },
  { id: 'activos',     label: 'Solo activos',     desc: 'Todos los productos publicados',                            filter: (p) => p.activo !== false },
  { id: 'todos',       label: 'Todo el catálogo', desc: 'Activos + inactivos (¡usá con cuidado!)',                  filter: () => true },
];

const MODOS = [
  { id: 'galeria',    label: 'Solo galería',         icon: Layers, desc: 'Añade la imagen a galería sin tocar la principal (seguro)' },
  { id: 'principal',  label: 'Reemplazar principal', icon: Star,   desc: 'Si el producto no tiene principal, la nueva pasa a principal; si tenía, la antigua va a galería' },
];

const CONCURRENCY = 3; // 3 imágenes en paralelo — equilibra velocidad y rate-limit

export default function BulkImageGeneratorPanel({ productos = [], onComplete }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState('sin_imagen');
  const [modo, setModo] = useState('galeria');
  const [estiloId, setEstiloId] = useState('lifestyle');
  const [maxItems, setMaxItems] = useState(20);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]); // [{ sku, nombre, status, url, error }]
  const [stats, setStats] = useState({ ok: 0, fail: 0, done: 0, total: 0 });
  const cancelRef = useRef(false);
  const logEndRef = useRef(null);

  // ─── Cálculo del lote objetivo ──────────────────────────────────────
  const objetivo = useMemo(() => {
    const scopeDef = SCOPES.find(s => s.id === scope);
    const filtrados = productos.filter(scopeDef.filter);
    return filtrados.slice(0, Math.max(1, maxItems));
  }, [productos, scope, maxItems]);

  // Categorías únicas (informativo)
  const categoriasEnLote = useMemo(() => {
    const set = new Set(objetivo.map(p => p.categoria).filter(Boolean));
    return Array.from(set);
  }, [objetivo]);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
  }, [log.length]);

  // ─── Procesa UN producto ───────────────────────────────────────────
  const procesarUno = async (producto) => {
    const styleObj = ESTILOS.find(s => s.id === estiloId);
    const galeria = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];
    const refs = [producto.imagen_url, ...galeria].filter(Boolean).slice(0, 4);
    const tieneRef = refs.length > 0;

    const prompt = buildPrompt(producto, styleObj, tieneRef, '');
    const payload = { prompt };
    if (tieneRef) payload.existing_image_urls = refs;

    const res = await base44.integrations.Core.GenerateImage(payload);
    const url = res?.url || res?.data?.url;
    if (!url) throw new Error('Sin URL devuelta por la IA');

    // Persistir según modo
    const updateData = {};
    if (modo === 'principal' && !producto.imagen_url) {
      updateData.imagen_url = url;
    } else if (modo === 'principal' && producto.imagen_url) {
      // Mover la antigua a galería y poner la nueva como principal
      updateData.imagen_url = url;
      updateData.galeria_urls = [producto.imagen_url, ...galeria];
    } else {
      // Modo galería
      updateData.galeria_urls = [...galeria, url];
    }
    await base44.entities.Producto.update(producto.id, updateData);
    return url;
  };

  // ─── Worker pool con concurrencia ──────────────────────────────────
  const lanzar = async () => {
    cancelRef.current = false;
    setRunning(true);
    setLog([]);
    setStats({ ok: 0, fail: 0, done: 0, total: objetivo.length });

    let cursor = 0;

    const worker = async () => {
      while (true) {
        if (cancelRef.current) return;
        const idx = cursor++;
        if (idx >= objetivo.length) return;
        const p = objetivo[idx];

        setLog(prev => [...prev, { sku: p.sku, nombre: p.nombre, status: 'running' }]);

        try {
          const url = await procesarUno(p);
          setLog(prev => prev.map((it, i) =>
            i === prev.length - (objetivo.length - idx) // best-effort: actualiza por sku
              ? it : it
          ));
          // Reemplazar el item específico (más robusto):
          setLog(prev => {
            const copy = [...prev];
            // último item con este SKU en status running → done
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].sku === p.sku && copy[i].status === 'running') {
                copy[i] = { ...copy[i], status: 'done', url };
                break;
              }
            }
            return copy;
          });
          setStats(s => ({ ...s, ok: s.ok + 1, done: s.done + 1 }));
        } catch (err) {
          setLog(prev => {
            const copy = [...prev];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].sku === p.sku && copy[i].status === 'running') {
                copy[i] = { ...copy[i], status: 'fail', error: err.message };
                break;
              }
            }
            return copy;
          });
          setStats(s => ({ ...s, fail: s.fail + 1, done: s.done + 1 }));
        }
      }
    };

    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);

    setRunning(false);
    if (onComplete) onComplete();
  };

  const cancelar = () => { cancelRef.current = true; };

  const sinImagen = productos.filter(p => p.activo !== false && !p.imagen_url).length;

  return (
    <div className="bg-gradient-to-br from-fuchsia-500/10 via-violet-500/10 to-cyan-500/10 border border-fuchsia-400/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/30 flex items-center justify-center flex-shrink-0">
            <Wand2 className="w-4 h-4 text-fuchsia-300" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-white flex items-center gap-1.5">
              Generación masiva de imágenes IA
              {sinImagen > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40">
                  <ImageOff className="w-3 h-3" /> {sinImagen} sin imagen
                </span>
              )}
            </p>
            <p className="text-[11px] text-white/55 truncate">
              Procesa muchos productos a la vez · Razona título, cantidad, material y descripción · Sin marcas (Google Shopping)
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4">
          {/* Alcance */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">1 · Qué productos</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SCOPES.map(s => {
                const count = productos.filter(s.filter).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setScope(s.id)}
                    disabled={running}
                    className={`text-left p-2.5 rounded-lg border transition ${
                      scope === s.id
                        ? 'bg-fuchsia-500/15 border-fuchsia-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      {s.label}
                      <span className="text-[10px] font-mono text-white/50">{count}</span>
                    </p>
                    <p className="text-[10.5px] text-white/55 mt-0.5 leading-snug">{s.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modo */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">2 · Dónde guardar</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODOS.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModo(m.id)}
                    disabled={running}
                    className={`text-left p-2.5 rounded-lg border transition ${
                      modo === m.id
                        ? 'bg-violet-500/15 border-violet-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" /> {m.label}
                    </p>
                    <p className="text-[10.5px] text-white/55 mt-0.5 leading-snug">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estilo + cantidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">3 · Estilo</p>
              <div className="flex flex-wrap gap-1.5">
                {ESTILOS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setEstiloId(s.id)}
                    disabled={running}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                      estiloId === s.id
                        ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-50'
                        : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/10'
                    }`}
                  >{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">4 · Cuántos máx.</p>
              <input
                type="number"
                min={1}
                max={200}
                disabled={running}
                value={maxItems}
                onChange={e => setMaxItems(Number(e.target.value) || 20)}
                className="w-full h-9 rounded-lg bg-white/10 border border-white/15 px-3 text-white text-sm focus:border-fuchsia-400/50 outline-none"
              />
              <p className="text-[10px] text-white/45 mt-1">Se procesan en lotes de {CONCURRENCY} en paralelo</p>
            </div>
          </div>

          {/* Resumen del lote */}
          <div className="bg-black/30 border border-white/10 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-fuchsia-300" />
                Lote a procesar: <span className="font-mono text-fuchsia-200">{objetivo.length}</span> productos
              </p>
              <p className="text-[10.5px] text-white/55">
                Costo aprox: ~{objetivo.length} imágenes IA
              </p>
            </div>
            {categoriasEnLote.length > 0 && (
              <p className="text-[10.5px] text-white/55">
                Categorías: {categoriasEnLote.join(' · ')}
              </p>
            )}
            {modo === 'principal' && (
              <p className="text-[10.5px] text-amber-200 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                Modo "Reemplazar principal": las imágenes anteriores se moverán a galería, no se borrarán.
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2 flex-wrap">
            {!running ? (
              <Button
                onClick={lanzar}
                disabled={objetivo.length === 0}
                className="flex-1 min-w-[200px] gap-2 bg-gradient-to-r from-fuchsia-500 to-violet-600 hover:from-fuchsia-600 hover:to-violet-700 text-white"
              >
                <Play className="w-4 h-4" />
                Generar {objetivo.length} {objetivo.length === 1 ? 'imagen' : 'imágenes'} ahora
              </Button>
            ) : (
              <Button
                onClick={cancelar}
                className="flex-1 min-w-[200px] gap-2 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Square className="w-4 h-4" /> Cancelar (termina lo en vuelo)
              </Button>
            )}
          </div>

          {/* Progreso */}
          {(running || stats.done > 0) && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 flex items-center gap-1.5">
                  {running && <Loader2 className="w-3.5 h-3.5 animate-spin text-fuchsia-300" />}
                  Progreso: <span className="font-mono text-white">{stats.done}/{stats.total}</span>
                </span>
                <span className="flex items-center gap-3 text-[11px]">
                  <span className="text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {stats.ok}</span>
                  <span className="text-rose-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {stats.fail}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all"
                  style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }}
                />
              </div>

              {/* Log */}
              <div
                ref={logEndRef}
                className="max-h-56 overflow-y-auto peyu-scrollbar-light bg-black/20 rounded-lg p-1.5 space-y-0.5 mt-2"
              >
                {log.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] px-1.5 py-1 rounded">
                    {item.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-fuchsia-300 flex-shrink-0" />}
                    {item.status === 'done' && <CheckCircle2 className="w-3 h-3 text-emerald-300 flex-shrink-0" />}
                    {item.status === 'fail' && <AlertTriangle className="w-3 h-3 text-rose-300 flex-shrink-0" />}
                    <span className="font-mono text-white/50 text-[10px] w-20 truncate flex-shrink-0">{item.sku}</span>
                    <span className="text-white/80 truncate flex-1">{item.nombre}</span>
                    {item.url && <img src={item.url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />}
                    {item.error && <span className="text-rose-300 text-[10px] truncate max-w-[140px]" title={item.error}>{item.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer: garantías */}
          <div className="text-[10.5px] text-white/45 flex items-start gap-1.5">
            <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-fuchsia-300" />
            <span>
              Cada imagen razona <strong className="text-white/70">título + cantidad detectada + material + descripción</strong>.
              Sin marcas, logos ni texto — apto Google Shopping.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}