import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Loader2, Check } from 'lucide-react';

// Modal crear/editar diseño PEYU. Al subir o cambiar la imagen se limpia la
// versión grabado y se regenera con engraveDisenosPeyu (en segundo plano).
export default function DisenoFormModal({ diseno, categorias = [], onClose, onSaved }) {
  const [nombre, setNombre] = useState(diseno?.nombre || '');
  const [categoria, setCategoria] = useState(diseno?.categoria || categorias[0] || 'Otro');
  const [imagenUrl, setImagenUrl] = useState(diseno?.imagen_url || '');
  const [orden, setOrden] = useState(diseno?.orden ?? 0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const subirImagen = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file }).catch(() => ({}));
    if (file_url) setImagenUrl(file_url);
    setUploading(false);
  };

  const guardar = async () => {
    if (!nombre.trim() || !imagenUrl) return;
    setSaving(true);
    const cambioImagen = !diseno || diseno.imagen_url !== imagenUrl;
    const data = {
      nombre: nombre.trim(),
      categoria: categoria.trim() || 'Otro',
      imagen_url: imagenUrl,
      orden: Number(orden) || 0,
      // Imagen nueva → limpiar el grabado viejo para que se regenere.
      ...(cambioImagen ? { imagen_grabado_url: '' } : {}),
      ...(diseno ? {} : { activo: true, es_ejemplo: false }),
    };
    if (diseno) {
      await base44.entities.DisenoPeyu.update(diseno.id, data).catch(() => {});
    } else {
      await base44.entities.DisenoPeyu.create(data).catch(() => {});
    }
    // Regenerar la versión grabado en segundo plano (no bloquea el guardado).
    if (cambioImagen) base44.functions.invoke('engraveDisenosPeyu', {}).catch(() => {});
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="ld-glass-strong rounded-3xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-ld-fg">{diseno ? 'Editar diseño' : 'Nuevo diseño'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl ld-btn-ghost flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Imagen */}
        <div
          className="rounded-2xl border-2 border-dashed border-ld-border-strong bg-white/50 flex flex-col items-center justify-center p-4 mb-4 cursor-pointer min-h-[140px]"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-ld-action" />
          ) : imagenUrl ? (
            <img src={imagenUrl} alt="Diseño" className="max-h-36 object-contain" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-ld-fg-muted mb-1.5" />
              <p className="text-xs font-bold text-ld-fg">Subir imagen del diseño</p>
              <p className="text-[10px] text-ld-fg-muted">PNG con fondo transparente recomendado</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => subirImagen(e.target.files?.[0])}
          />
        </div>
        {imagenUrl && (
          <button onClick={() => fileRef.current?.click()} className="text-[11px] font-bold text-ld-action mb-3 block mx-auto">
            Cambiar imagen
          </button>
        )}

        <label className="block text-[11px] font-bold text-ld-fg-muted mb-1">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Ranita de Darwin"
          className="w-full h-10 px-3 rounded-xl ld-input text-sm mb-3"
        />

        <label className="block text-[11px] font-bold text-ld-fg-muted mb-1">Categoría (texto libre)</label>
        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          list="disenos-cats"
          placeholder="Ej: Animales Chilenos, Frases, Navidad…"
          className="w-full h-10 px-3 rounded-xl ld-input text-sm mb-3"
        />
        <datalist id="disenos-cats">
          {categorias.map((c) => <option key={c} value={c} />)}
        </datalist>

        <label className="block text-[11px] font-bold text-ld-fg-muted mb-1">Orden</label>
        <input
          type="number"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="w-full h-10 px-3 rounded-xl ld-input text-sm mb-5"
        />

        <button
          onClick={guardar}
          disabled={saving || uploading || !nombre.trim() || !imagenUrl}
          className="w-full h-11 rounded-2xl text-white font-bold text-sm ld-btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {diseno ? 'Guardar cambios' : 'Crear diseño'}
        </button>
        <p className="text-[10px] text-ld-fg-muted text-center mt-2">
          La versión "grabado láser" se genera automáticamente al guardar.
        </p>
      </div>
    </div>
  );
}