// ============================================================================
// AllProductsReviewModal — revisa el plan carpeta→producto del Drive antes de aplicar.
// Cada fila representa una subcarpeta del Drive y permite confirmar, cambiar el
// producto destino, o saltar la carpeta.
// ============================================================================
import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ListChecks, Search, FolderOpen, AlertCircle, CheckCircle2, X, Filter } from 'lucide-react';

export default function AllProductsReviewModal({ open, onClose, preview, onApplied }) {
  const folders = preview?.folders || [];
  const catalogo = preview?.catalogo || [];

  // selection: { [folder_path]: { producto_id, skip } }
  const [selection, setSelection] = useState({});
  const [filter, setFilter] = useState('todas'); // todas | con_sugerencia | sin_sugerencia
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [replacePrincipal, setReplacePrincipal] = useState(false);

  // Inicializar selección con sugerencias automáticas
  useEffect(() => {
    if (!open || folders.length === 0) return;
    const init = {};
    for (const f of folders) {
      if (f.suggestion) {
        init[f.folder_path] = { producto_id: f.suggestion.producto_id, skip: false };
      } else {
        init[f.folder_path] = { producto_id: null, skip: true };
      }
    }
    setSelection(init);
    setApplyResult(null);
  }, [open, folders]);

  const visibleFolders = useMemo(() => {
    return folders.filter(f => {
      if (filter === 'con_sugerencia' && !f.suggestion) return false;
      if (filter === 'sin_sugerencia' && f.suggestion) return false;
      if (search && !f.folder_path.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [folders, filter, search]);

  const counts = useMemo(() => {
    let confirmar = 0, cambiados = 0, saltadas = 0, sinAsignar = 0;
    for (const f of folders) {
      const sel = selection[f.folder_path];
      if (!sel || sel.skip || !sel.producto_id) saltadas += 1;
      else if (f.suggestion && sel.producto_id === f.suggestion.producto_id) confirmar += 1;
      else if (sel.producto_id) cambiados += 1;
      else sinAsignar += 1;
    }
    return { confirmar, cambiados, saltadas, sinAsignar };
  }, [folders, selection]);

  const totalAplicar = counts.confirmar + counts.cambiados;

  const handleApply = async () => {
    setApplying(true);
    setApplyResult(null);
    try {
      const sel = Object.entries(selection)
        .filter(([_, v]) => !v.skip && v.producto_id)
        .map(([folder_path, v]) => ({ folder_path, producto_id: v.producto_id }));
      const res = await base44.functions.invoke('driveMatchAllProducts', {
        mode: 'applySelection',
        selection: sel,
        replacePrincipal,
      });
      setApplyResult(res?.data || null);
      if (onApplied) onApplied();
    } catch (e) {
      setApplyResult({ ok: false, error: e.message });
    }
    setApplying(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-6xl bg-slate-950 border-white/10 text-white p-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
          <DialogTitle className="flex items-center gap-2 text-white">
            <ListChecks className="w-5 h-5 text-emerald-300" />
            Revisión carpeta → producto · catálogo completo
          </DialogTitle>
        </DialogHeader>

        {/* Stats */}
        <div className="px-5 py-3 border-b border-white/10 grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-900/40">
          <Stat label="Total carpetas" value={folders.length} />
          <Stat label="Confirmar" value={counts.confirmar} accent="text-emerald-300" />
          <Stat label="Cambiados" value={counts.cambiados} accent="text-amber-300" />
          <Stat label="Saltadas" value={counts.saltadas} accent="text-white/60" />
          <Stat label="A aplicar" value={totalAplicar} accent="text-cyan-300" />
        </div>

        {/* Filtros */}
        <div className="px-5 py-2.5 border-b border-white/10 flex items-center gap-2 flex-wrap bg-slate-900/30">
          <FilterChip active={filter === 'todas'} onClick={() => setFilter('todas')}>Todas</FilterChip>
          <FilterChip active={filter === 'con_sugerencia'} onClick={() => setFilter('con_sugerencia')}>Con sugerencia</FilterChip>
          <FilterChip active={filter === 'sin_sugerencia'} onClick={() => setFilter('sin_sugerencia')}>Sin sugerencia</FilterChip>
          <div className="relative ml-auto w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar carpeta…"
              className="pl-8 h-8 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-xs"
            />
          </div>
        </div>

        {/* Lista carpetas */}
        <div className="max-h-[55vh] overflow-y-auto peyu-scrollbar-light">
          {visibleFolders.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-sm">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" /> No hay carpetas con esos filtros
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-950 z-10">
                <tr className="border-b border-white/10 text-white/50 text-xs">
                  <th className="text-left px-4 py-2 font-medium">Carpeta Drive</th>
                  <th className="text-left px-3 py-2 font-medium w-[60px]">Imgs</th>
                  <th className="text-left px-3 py-2 font-medium">Producto destino</th>
                  <th className="text-center px-3 py-2 font-medium w-[80px]">Saltar</th>
                </tr>
              </thead>
              <tbody>
                {visibleFolders.map(f => (
                  <FolderRow
                    key={f.folder_path}
                    folder={f}
                    catalogo={catalogo}
                    sel={selection[f.folder_path] || {}}
                    onChange={(v) => setSelection(s => ({ ...s, [f.folder_path]: { ...s[f.folder_path], ...v } }))}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex items-center gap-3 flex-wrap bg-slate-900/40">
          <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={replacePrincipal}
              onChange={(e) => setReplacePrincipal(e.target.checked)}
              className="accent-emerald-500"
            />
            Reemplazar imagen principal (si ya existe)
          </label>

          {applyResult && (
            <div className={`text-xs px-2.5 py-1 rounded ${applyResult.ok ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'} flex items-center gap-1.5`}>
              {applyResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {applyResult.ok
                ? `Listo · ${applyResult.productos_actualizados} productos · ${applyResult.total_files_uploaded} archivos`
                : `Error: ${applyResult.error || 'desconocido'}`}
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10" size="sm">
              Cerrar
            </Button>
            <Button
              onClick={handleApply}
              disabled={applying || totalAplicar === 0}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Aplicar a {totalAplicar} carpeta{totalAplicar !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, accent = 'text-white' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
      <p className="text-[10px] text-white/50">{label}</p>
      <p className={`text-base font-poppins font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
        active ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function FolderRow({ folder, catalogo, sel, onChange }) {
  const [search, setSearch] = useState('');

  const productoActual = catalogo.find(p => p.id === sel.producto_id);
  const sug = folder.suggestion;
  const cambiado = sug && sel.producto_id && sel.producto_id !== sug.producto_id;

  const filteredCatalogo = useMemo(() => {
    if (!search) return catalogo.slice(0, 50);
    const q = search.toLowerCase();
    return catalogo.filter(p =>
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.categoria || '').toLowerCase().includes(q)
    ).slice(0, 30);
  }, [catalogo, search]);

  return (
    <tr className={`border-b border-white/5 hover:bg-white/[0.02] ${sel.skip ? 'opacity-50' : ''}`}>
      <td className="px-4 py-2.5">
        <div className="flex items-start gap-2">
          <FolderOpen className="w-4 h-4 text-amber-300 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-white truncate font-medium">{folder.folder_path}</div>
            {sug && (
              <div className="text-[10px] text-white/40 mt-0.5">
                Match auto: <span className="text-emerald-300">score {sug.score}</span> · {sug.matched_tokens.join(', ')}
              </div>
            )}
            {!sug && (
              <div className="text-[10px] text-rose-300/70 mt-0.5">Sin sugerencia automática</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-white/60 text-xs">{folder.files_count}</td>
      <td className="px-3 py-2.5">
        <div className="flex flex-col gap-1.5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={productoActual ? '' : 'Buscar producto…'}
            className="h-7 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-xs"
          />
          {productoActual && !search && (
            <div className={`text-xs px-2 py-1 rounded ${cambiado ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'} flex items-center justify-between gap-1`}>
              <span className="truncate">{productoActual.nombre}</span>
              <button onClick={() => onChange({ producto_id: null })} className="hover:opacity-70 flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {search && (
            <div className="bg-slate-900 border border-white/10 rounded-md max-h-40 overflow-y-auto peyu-scrollbar-light">
              {filteredCatalogo.length === 0 ? (
                <div className="p-2 text-xs text-white/40">Sin resultados</div>
              ) : filteredCatalogo.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onChange({ producto_id: p.id, skip: false }); setSearch(''); }}
                  className="w-full text-left px-2 py-1.5 hover:bg-white/5 border-b border-white/5 last:border-0"
                >
                  <div className="text-xs text-white truncate">{p.nombre}</div>
                  <div className="text-[10px] text-white/40">{p.sku} · {p.categoria}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={!!sel.skip}
          onChange={(e) => onChange({ skip: e.target.checked })}
          className="accent-rose-500"
        />
      </td>
    </tr>
  );
}