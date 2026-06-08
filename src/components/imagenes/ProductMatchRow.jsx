// Fila individual de auditoría 1:1: producto, imagen actual, carpeta sugerida, archivos disponibles.
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductMatchRow({ item, folderCatalog, onApplied }) {
  const [selectedFolder, setSelectedFolder] = useState(item.carpeta_sugerida || '');
  const [files, setFiles] = useState(item.archivos_disponibles || []);
  const [selectedIds, setSelectedIds] = useState((item.archivos_disponibles || []).slice(0, 5).map(f => f.id));
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  const handleFolderChange = (newFolder) => {
    setSelectedFolder(newFolder);
    const f = folderCatalog.find(x => x.path === newFolder);
    if (f) {
      setFiles(f.samples.map(s => ({ id: s.id, name: s.name })));
      setSelectedIds(f.samples.map(s => s.id));
    }
  };

  const toggleFile = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const apply = async () => {
    if (selectedIds.length === 0) { toast.error('Seleccioná al menos 1 imagen'); return; }
    setApplying(true);
    try {
      const chosen = files.filter(f => selectedIds.includes(f.id));
      const res = await base44.functions.invoke('buildProductDriveMatchPlan', {
        mode: 'apply', replacePrincipal: true,
        assignments: [{ producto_id: item.producto_id, folder_path: selectedFolder, files: chosen.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType || 'image/jpeg' })) }],
      });
      if (res?.data?.success > 0) {
        toast.success(`✓ ${item.sku} actualizado`);
        setDone(true);
        onApplied?.(item.producto_id);
      } else {
        toast.error(`Falló: ${res?.data?.results?.[0]?.error || 'desconocido'}`);
      }
    } catch (e) { toast.error(`Error: ${e.message}`); }
    setApplying(false);
  };

  return (
    <div className={`bg-white border rounded-xl p-3 shadow-sm transition-all ${
      done ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
    }`}>
      <div className="grid grid-cols-12 gap-3 items-start">
        {/* Imagen actual */}
        <div className="col-span-2">
          <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
            {item.imagen_actual ? (
              <img src={item.imagen_actual} alt={item.sku} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="text-[10px] text-gray-400 mt-1 text-center font-medium">actual</div>
        </div>

        {/* Info producto */}
        <div className="col-span-3 min-w-0">
          <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
          <div className="text-sm font-semibold text-gray-900 truncate" title={item.nombre}>{item.nombre}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{item.categoria}</div>
          <select value={selectedFolder} onChange={e => handleFolderChange(e.target.value)} disabled={done}
            className="mt-2 w-full bg-white border border-gray-300 rounded text-xs text-gray-900 px-2 py-1 focus:outline-none focus:border-cyan-500">
            <option value="">— sin carpeta —</option>
            {folderCatalog.map(f => <option key={f.path} value={f.path}>{f.path} ({f.count})</option>)}
          </select>
        </div>

        {/* Archivos disponibles */}
        <div className="col-span-6">
          {files.length === 0 ? (
            <div className="text-xs text-gray-400 italic py-4 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
              Sin archivos en esta carpeta
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {files.slice(0, 8).map(f => {
                const sel = selectedIds.includes(f.id);
                const thumbUrl = `https://drive.google.com/thumbnail?id=${f.id}&sz=w200`;
                return (
                  <button key={f.id} onClick={() => !done && toggleFile(f.id)} disabled={done} title={f.name}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      sel ? 'border-emerald-500 ring-2 ring-emerald-400/40' : 'border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-400'
                    }`}>
                    <img src={thumbUrl} alt={f.name} className="w-full h-full object-cover" loading="lazy"
                      onError={(e) => { e.currentTarget.style.opacity = '0.3'; }} />
                    {sel && (
                      <div className="absolute top-1 right-1 bg-emerald-500 rounded-full shadow">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="text-[10px] text-gray-400 mt-1">
            {selectedIds.length} de {files.length} seleccionados · click para alternar
          </div>
        </div>

        {/* Acción */}
        <div className="col-span-1 flex items-center justify-end">
          {done ? (
            <div className="text-emerald-700 flex items-center gap-1 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" /> OK
            </div>
          ) : (
            <Button size="sm" onClick={apply} disabled={applying || selectedIds.length === 0 || !selectedFolder}
              className="bg-cyan-600 hover:bg-cyan-700 text-white h-8 text-xs">
              {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aplicar'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}