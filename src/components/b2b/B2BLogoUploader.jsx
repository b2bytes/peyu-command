// ════════════════════════════════════════════════════════════════════════
// B2BLogoUploader — Subida de logo B2B, CONTROLADA por el padre.
// Solo el control: el mockup se dibuja sobre la MISMA imagen del producto
// que el cliente ya está viendo (galería), no en una segunda foto abajo.
// Incrusta el logo al instante con un objectURL local y luego lo reemplaza
// por la URL pública subida.
// ════════════════════════════════════════════════════════════════════════
import { useRef, useState } from 'react';
import { Upload, Loader2, Sparkles } from 'lucide-react';
import { uploadImagePublic } from '@/lib/public-upload';

export default function B2BLogoUploader({ value, onChange, logoGratis = false, moq = 10 }) {
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    setFileName(file.name || 'Logo');
    // Incrustación instantánea: el cliente ve su logo grabado al segundo.
    onChange?.(URL.createObjectURL(file));
    try {
      const { file_url } = await uploadImagePublic(file);
      onChange?.(file_url);
    } catch (err) {
      console.error('Error subiendo logo B2B:', err);
      setError('No se pudo subir el archivo. Prueba con PNG o JPG.');
    } finally {
      setUploading(false);
    }
  };

  const pick = () => inputRef.current?.click();

  return (
    <div className="rounded-2xl p-3.5" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {!value ? (
        <button
          type="button"
          onClick={pick}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          onDragOver={(e) => e.preventDefault()}
          className="w-full flex items-center gap-3 text-left transition-opacity hover:opacity-80"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F2ECE2', border: '1.5px dashed #D4C4B0' }}>
            {uploading
              ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0F8B6C' }} />
              : <Upload className="w-4 h-4" style={{ color: '#A08070' }} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: '#2C1810' }}>
              {uploading ? 'Subiendo logo…' : 'Sube tu logo y velo grabado arriba'}
            </p>
            <p className="text-[11px]" style={{ color: '#A08070' }}>
              PNG transparente, JPG o SVG · {logoGratis ? 'grabado incluido' : `gratis desde ${moq}u`}
            </p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#F2ECE2' }}>
            <img src={value} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: '#2C1810' }}>
              {fileName.length > 26 ? `${fileName.slice(0, 18)}…${fileName.slice(-6)}` : (fileName || 'Logo subido')}
            </p>
            <p className="text-[11px] flex items-center gap-1" style={{ color: '#0F8B6C' }}>
              <Sparkles className="w-3 h-3" /> Grabado activo · ajústalo sobre la imagen
            </p>
          </div>
          <button
            type="button"
            onClick={pick}
            className="flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
            style={{ color: '#7A6050', background: '#F2ECE2', border: '1px solid #D4C4B0' }}
          >
            Cambiar
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs font-semibold mt-2.5 px-3 py-2 rounded-xl" style={{ background: '#D96B4D15', color: '#D96B4D', border: '1px solid #D96B4D30' }}>
          {error}
        </p>
      )}
    </div>
  );
}