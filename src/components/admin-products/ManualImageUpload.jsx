import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, X, Check, AlertCircle } from 'lucide-react';

/**
 * ManualImageUpload — Sube imágenes desde el equipo del usuario.
 * Permite elegir si la imagen sube como principal o se añade a galería.
 * Soporta selección múltiple (drag&drop + input file).
 */
export default function ManualImageUpload({ producto, onSaved }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [destino, setDestino] = useState('galeria'); // 'principal' | 'galeria'
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const galeria = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.type?.startsWith('image/'));
    if (files.length === 0) {
      setError('Selecciona al menos una imagen válida (JPG, PNG, WebP)');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress({ done: 0, total: files.length });

    const urls = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const res = await base44.integrations.Core.UploadFile({ file: files[i] });
        if (res?.file_url) urls.push(res.file_url);
        setProgress({ done: i + 1, total: files.length });
      } catch (e) {
        console.error('Error subiendo', files[i].name, e);
      }
    }

    if (urls.length === 0) {
      setError('No se pudo subir ninguna imagen');
      setUploading(false);
      return;
    }

    // Aplicar al producto según destino
    let patch = {};
    if (destino === 'principal') {
      // Primera URL pasa a principal, resto a galería; la principal anterior se preserva en galería.
      const [primera, ...resto] = urls;
      const nuevaGaleria = [
        ...resto,
        ...(producto.imagen_url ? [producto.imagen_url] : []),
        ...galeria,
      ];
      patch = { imagen_url: primera, galeria_urls: [...new Set(nuevaGaleria)] };
    } else {
      const nuevaGaleria = [...new Set([...galeria, ...urls])];
      patch = { galeria_urls: nuevaGaleria };
    }

    await base44.entities.Producto.update(producto.id, patch);
    onSaved?.(patch);
    setUploading(false);
    setProgress({ done: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" />
          Subir desde tu equipo
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setDestino('galeria')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              destino === 'galeria' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            A galería
          </button>
          <button
            onClick={() => setDestino('principal')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              destino === 'principal' ? 'bg-yellow-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Como principal
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-cyan-200">
            <Loader2 className="w-4 h-4 animate-spin" />
            Subiendo {progress.done}/{progress.total}…
          </div>
        ) : (
          <div className="space-y-1">
            <Upload className="w-6 h-6 mx-auto text-white/40" />
            <p className="text-xs text-white/70">
              <span className="text-cyan-300 font-medium">Click para elegir</span> o arrastra imágenes aquí
            </p>
            <p className="text-[10px] text-white/40">JPG, PNG, WebP · selección múltiple</p>
          </div>
        )}
      </label>

      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded px-2 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
        </div>
      )}

      {!uploading && progress.total > 0 && progress.done === progress.total && (
        <div className="flex items-center gap-2 text-xs text-emerald-300">
          <Check className="w-3.5 h-3.5" />
          {progress.total} {progress.total === 1 ? 'imagen subida' : 'imágenes subidas'} correctamente
        </div>
      )}
    </div>
  );
}