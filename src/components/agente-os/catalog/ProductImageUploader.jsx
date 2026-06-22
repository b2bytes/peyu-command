import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { ImagePlus, Loader2, X } from 'lucide-react';

// Subida de imagen reutilizable para el gestor de catálogo del chat.
// Sube el archivo a storage y devuelve la URL al padre vía onUploaded.
// `current` muestra la imagen actual; `label` el texto del botón.
export default function ProductImageUploader({ current, onUploaded, onRemove, label = 'Subir imagen', size = 'md' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUploaded?.(file_url);
    } finally {
      setUploading(false);
    }
  };

  const box = size === 'sm' ? 'w-14 h-14' : 'w-20 h-20';

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ''; }}
      />
      {current ? (
        <div className="relative group">
          <img src={current} alt="" className={`${box} rounded-xl object-cover border border-ld-border`} />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/80 border border-white/20 flex items-center justify-center text-white/80 hover:text-white"
              title="Quitar"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className={`${box} rounded-xl border border-dashed border-ld-border bg-ld-bg-soft/40 flex items-center justify-center`}>
          <ImagePlus className="w-5 h-5 text-ld-fg-subtle" />
        </div>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="ld-btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-ld-fg-soft disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
        {uploading ? 'Subiendo…' : label}
      </button>
    </div>
  );
}