// ============================================================================
// CarcasasReviewModal — Tabla editable para revisar y confirmar la asignación
// archivo Drive → producto del catálogo, ANTES de aplicar masivamente.
//
// Cada fila: thumbnail + nombre del archivo + dropdown del producto sugerido
// (editable) + botón "Saltar". El usuario puede:
//   • Aceptar la sugerencia automática (default)
//   • Cambiar el producto a cualquier modelo del catálogo
//   • Saltar el archivo (no asignarlo)
//   • Buscar producto por nombre/SKU desde el dropdown
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Loader2, CheckCircle2, AlertCircle, ExternalLink, Search, X, Sparkles, ImageIcon,
} from 'lucide-react';

export default function CarcasasReviewModal({ open, onClose, preview, onApplied }) {
  // assignments[file_id] = producto_id | "" (saltar)
  const [assignments, setAssignments] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | matched | unmatched | skipped
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Inicializar asignaciones con la sugerencia automática
  useEffect(() => {
    if (!preview?.files) return;
    const init = {};
    for (const f of preview.files) {
      init[f.file_id] = f.suggestion?.producto_id || '';
    }
    setAssignments(init);
    setResult(null);
    setError(null);
  }, [preview]);

  const files = preview?.files || [];
  const catalogo = preview?.catalogo || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter(f => {
      const assigned = assignments[f.file_id];
      if (filter === 'matched' && !assigned) return false;
      if (filter === 'skipped' && assigned) return false;
      if (filter === 'unmatched' && f.suggestion) return false;
      if (q && !f.file_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [files, assignments, search, filter]);

  const counts = useMemo(() => {
    const total = files.length;
    let matched = 0, skipped = 0, unmatched = 0;
    for (const f of files) {
      if (assignments[f.file_id]) matched++;
      else skipped++;
      if (!f.suggestion) unmatched++;
    }
    return { total, matched, skipped, unmatched };
  }, [files, assignments]);

  const setAssignment = (fileId, productoId) => {
    setAssignments(prev => ({ ...prev, [fileId]: productoId }));
  };

  const acceptAllSuggestions = () => {
    const init = {};
    for (const f of files) init[f.file_id] = f.suggestion?.producto_id || '';
    setAssignments(init);
  };
  const skipAll = () => {
    const empty = {};
    for (const f of files) empty[f.file_id] = '';
    setAssignments(empty);
  };

  const apply = async () => {
    const selection = Object.entries(assignments)
      .filter(([_, pid]) => !!pid)
      .map(([fileId, pid]) => {
        const f = files.find(x => x.file_id === fileId);
        return {
          file_id: fileId,
          file_name: f?.file_name,
          producto_id: pid,
        };
      });

    if (selection.length === 0) {
      setError('No hay asignaciones para aplicar.');
      return;
    }
    if (!confirm(`Aplicar ${selection.length} asignaciones? Se reemplazarán las imágenes principales de los productos involucrados.`)) return;

    setApplying(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('driveMatchCarcasas', {
        mode: 'applySelection',
        selection,
        replacePrincipal: true,
      });
      setResult(res?.data || null);
      onApplied?.();
    } catch (e) {
      setError(e.message);
    }
    setApplying(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-5xl border max-h-[90vh] flex flex-col p-0"
        style={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
      >
        <DialogHeader className="p-5 pb-3 border-b border-white/10">
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-300" />
            Confirmar asignación de imágenes · Carcasas
          </DialogTitle>
          <DialogDescription className="text-white/60 text-xs">
            Revisá cada archivo del Drive y confirmá a qué producto del catálogo le corresponde.
            La sugerencia automática viene precargada — podés cambiarla o saltar lo que no quieras asignar.
          </DialogDescription>
        </DialogHeader>

        {/* KPIs + filtros */}
        <div className="px-5 py-3 border-b border-white/10 space-y-2.5 flex-shrink-0">
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Archivos" value={counts.total} />
            <Stat label="Asignados" value={counts.matched} accent="text-emerald-300" />
            <Stat label="Saltados" value={counts.skipped} accent="text-amber-300" />
            <Stat label="Sin sugerencia" value={counts.unmatched} accent="text-rose-300" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar archivo…"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                className="pl-8 h-8 placeholder:text-white/50 text-xs"
              />
            </div>
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterChip>
            <FilterChip active={filter === 'matched'} onClick={() => setFilter('matched')}>Asignados</FilterChip>
            <FilterChip active={filter === 'skipped'} onClick={() => setFilter('skipped')}>Saltados</FilterChip>
            <FilterChip active={filter === 'unmatched'} onClick={() => setFilter('unmatched')}>Sin sugerencia</FilterChip>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={acceptAllSuggestions} className="h-8 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10">
                Aceptar sugerencias
              </Button>
              <Button size="sm" variant="outline" onClick={skipAll} className="h-8 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10">
                Saltar todo
              </Button>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-3 space-y-1.5 min-h-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-sm">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              Sin archivos para mostrar con esos filtros
            </div>
          ) : filtered.map(f => (
            <FileRow
              key={f.file_id}
              file={f}
              catalogo={catalogo}
              assigned={assignments[f.file_id] || ''}
              onChange={(pid) => setAssignment(f.file_id, pid)}
            />
          ))}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-white/10 bg-black/20 flex-shrink-0 sm:justify-between gap-2">
          {error ? (
            <div className="text-xs text-rose-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </div>
          ) : result ? (
            <div className="text-xs text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {result.total_subidas_ok} imágenes aplicadas en {result.productos_actualizados} productos
            </div>
          ) : (
            <p className="text-xs text-white/50">
              {counts.matched} asignaciones listas para aplicar
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              {result ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!result && (
              <Button
                onClick={apply}
                disabled={applying || counts.matched === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Aplicar {counts.matched} asignaciones
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────
function Stat({ label, value, accent = 'text-white' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
      <p className="text-[10px] text-white/50">{label}</p>
      <p className={`text-base font-poppins font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
        active
          ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-100'
          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function FileRow({ file, catalogo, assigned, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const assignedProd = catalogo.find(c => c.id === assigned);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return catalogo.slice(0, 60);
    return catalogo.filter(c =>
      (c.nombre || '').toLowerCase().includes(query) ||
      (c.sku || '').toLowerCase().includes(query)
    ).slice(0, 60);
  }, [catalogo, q]);

  const isSuggestion = assigned && file.suggestion?.producto_id === assigned;
  const isManual = assigned && !isSuggestion;
  const isSkipped = !assigned;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border transition ${
      isSkipped ? 'bg-amber-500/5 border-amber-500/20' :
      isManual ? 'bg-indigo-500/10 border-indigo-400/30' :
      'bg-white/5 border-white/10'
    }`}>
      {/* Thumb */}
      <div className="w-12 h-12 rounded bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
        <img
          src={file.thumb_url}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* Filename */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className="text-sm truncate font-mono font-medium"
            style={{ color: '#fff' }}
            title={file.file_name}
          >
            {file.file_name}
          </p>
          <a
            href={file.drive_view_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            title="Abrir en Drive"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        {file.color && (
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
            color: {file.color}
          </p>
        )}
      </div>

      {/* Dropdown asignación */}
      <div className="relative w-[260px] flex-shrink-0">
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full text-left text-xs px-3 py-2 rounded border transition ${
            isSkipped
              ? 'bg-amber-500/10 border-amber-400/30 text-amber-200'
              : isManual
              ? 'bg-indigo-500/15 border-indigo-400/40 text-indigo-100'
              : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-100'
          }`}
        >
          {isSkipped ? (
            <span className="opacity-70">— Saltar (no asignar) —</span>
          ) : (
            <span className="truncate block">
              {isSuggestion && <span className="text-[9px] mr-1 px-1 rounded bg-emerald-400/20">AUTO</span>}
              {isManual && <span className="text-[9px] mr-1 px-1 rounded bg-indigo-400/20">MANUAL</span>}
              {assignedProd?.nombre || 'Producto…'}
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 mt-1 w-[320px] border rounded-lg shadow-2xl z-50 overflow-hidden"
              style={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.18)' }}
            >
              <div className="p-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <Input
                  autoFocus
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Buscar producto o SKU…"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                  className="h-8 placeholder:text-white/50 text-xs"
                />
              </div>
              <div className="max-h-64 overflow-y-auto peyu-scrollbar-light">
                <button
                  onClick={() => { onChange(''); setOpen(false); }}
                  className="w-full text-left text-xs px-3 py-2 hover:bg-white/5 text-amber-200 border-b border-white/10"
                >
                  — Saltar (no asignar) —
                </button>
                {file.suggestion && (
                  <button
                    onClick={() => { onChange(file.suggestion.producto_id); setOpen(false); }}
                    className="w-full text-left text-xs px-3 py-2 hover:bg-emerald-500/10 text-emerald-100 border-b border-white/10"
                  >
                    <span className="text-[9px] mr-1 px-1 rounded bg-emerald-400/20">SUGERIDO</span>
                    {file.suggestion.producto_nombre}
                  </button>
                )}
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { onChange(c.id); setOpen(false); }}
                    className={`w-full text-left text-xs px-3 py-1.5 hover:bg-white/10 ${
                      c.id === assigned ? 'bg-indigo-500/10 text-indigo-100' : 'text-white/80'
                    }`}
                  >
                    <span className="block truncate">{c.nombre}</span>
                    {c.sku && <span className="block text-[10px] text-white/40 font-mono">{c.sku}</span>}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-[11px] text-white/40 px-3 py-3">Sin resultados</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Skip rápido */}
      {!isSkipped && (
        <button
          onClick={() => onChange('')}
          className="text-white/40 hover:text-rose-400 flex-shrink-0 p-1"
          title="Saltar este archivo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}