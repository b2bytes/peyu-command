// Componente fila individual de auditoría 1:1.
// Muestra: producto, imagen actual, carpeta sugerida, archivos disponibles para elegir.
// Usuario puede: cambiar carpeta, seleccionar archivos específicos, aplicar.
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2, Folder, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductMatchRow({ item, folderCatalog, onApplied }) {
  const [selectedFolder, setSelectedFolder] = useState(item.carpeta_sugerida || '');
  const [files, setFiles] = useState(item.archivos_disponibles || []);
  const [selectedIds, setSelectedIds] = useState(
    (item.archivos_disponibles || []).slice(0, 5).map(f => f.id)
  );
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  const handleFolderChange = (newFolder) => {
    setSelectedFolder(newFolder);
    const f = folderCatalog.find(x => x.path === newFolder);
    if (f) {
      // Recargar files desde el catálogo (limit a samples por ahora)
      setFiles(f.samples.map(s => ({ id: s.id, name: s.name })));
      setSelectedIds(f.samples.map(s => s.id));
    }
  };

  const toggleFile = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const apply = async () => {
    if (selectedIds.length === 0) {
      toast.error('Seleccioná al menos 1 imagen');
      return;
    }
    setApplying(true);
    try {
      const chosen = files.filter(f => selectedIds.includes(f.id));
      const res = await base44.functions.invoke('buildProductDriveMatchPlan', {
        mode: 'apply',
        replacePrincipal: true,
        assignments: [{
          producto_id: item.producto_id,
          folder_path: selectedFolder,
          files: chosen.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType || 'image/jpeg' })),
        }],
      });
      const ok = res?.data?.success > 0;
      if (ok) {
        toast.success(`✓ ${item.sku} actualizado`);
        setDone(true);
        if (onApplied) onApplied(item.producto_id);
      } else {
        toast.error(`Falló: ${res?.data?.results?.[0]?.error || 'desconocido'}`);
      }
    } catch (e) {
      toast.error(`Error: ${e.message}`);
    }
    setApplying(false);
  };

  return (
    <div className={`bg-white/5 border rounded-xl p-3 transition-all ${
      done ? 'border-emerald-400/50 bg-emerald-500/5' : 'border-white/10'
    }`}>
      <div className="grid grid-cols-12 gap-3 items-start">
        {/* Imagen actual */}
        <div className="col-span-2">
          <div className="aspect-square rounded-lg bg-white/5 overflow-hidden border border-white/10">
            {item.imagen_actual ? (
              <img src={item.imagen_actual} alt={item.sku} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="text-[10px] text-white/40 mt-1 text-center">actual</div>
        </div>

        {/* Info producto */}
        <div className="col-span-3 min-w-0">
          <div className="text-xs text-white/40">{item.sku}</div>
          <div className="text-sm font-medium text-white truncate" title={item.nombre}>
            {item.nombre}
          </div>
          <div className="text-[11px] text-white/50 mt-1">{item.categoria}</div>
          <select
            value={selectedFolder}
            onChange={e => handleFolderChange(e.target.value)}
            disabled={done}
            className="mt-2 w-full bg-white/5 border border-white/10 rounded text-xs text-white px-2 py-1"
          >
            <option value="" className="bg-slate-900">— sin carpeta —</option>
            {folderCatalog.map(f => (
              <option key={f.path} value={f.path} className="bg-slate-900">
                {f.path} ({f.count})
              </option>
            ))}
          </select>
        </div>

        {/* Archivos disponibles */}
        <div className="col-span-6">
          {files.length === 0 ? (
            <div className="text-xs text-white/40 italic py-4 text-center border border-dashed border-white/10 rounded">
              Sin archivos en esta carpeta
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {files.slice(0, 8).map(f => {
                const sel = selectedIds.includes(f.id);
                const thumbUrl = `https://drive.google.com/thumbnail?id=${f.id}&sz=w200`;
                return (
                  <button
                    key={f.id}
                    onClick={() => !done && toggleFile(f.id)}
                    disabled={done}
                    className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                      sel ? 'border-emerald-400 ring-2 ring-emerald-400/40' : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                    title={f.name}
                  >
                    <img src={thumbUrl} alt={f.name} className="w-full h-full object-cover" loading="lazy"
                      onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
                    />
                    {sel && (
                      <div className="absolute top-1 right-1 bg-emerald-500 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="text-[10px] text-white/40 mt-1">
            {selectedIds.length} de {files.length} seleccionados · click para alternar
          </div>
        </div>

        {/* Acción */}
        <div className="col-span-1 flex items-center justify-end">
          {done ? (
            <div className="text-emerald-400 flex items-center gap-1 text-xs">
              <CheckCircle2 className="w-4 h-4" /> OK
            </div>
          ) : (
            <Button
              size="sm"
              onClick={apply}
              disabled={applying || selectedIds.length === 0 || !selectedFolder}
              className="bg-cyan-600 hover:bg-cyan-700 text-white h-8 text-xs"
            >
              {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aplicar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}