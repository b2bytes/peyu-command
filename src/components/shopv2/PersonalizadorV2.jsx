import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Upload, X, Check, Loader2 } from 'lucide-react';
import PersonalizacionPickerV2 from '@/components/shopv2/PersonalizacionPickerV2';
import DisenosPeyuPickerB2C from '@/components/personalizacion/DisenosPeyuPickerB2C';

// ════════════════════════════════════════════════════════════════════════
// PersonalizadorV2 — Circuito de personalización del Shop v2 (piel Tema 6).
// Tipos excluyentes (frase / Diseño PEYU / Tu logo), galería real DisenoPeyu,
// upload de imagen propia. Es CONTROLADO: recibe `pers` y `setPers` del padre,
// que mantiene { opcion, texto, logoUrl, disenoPeyuUrl } para el mockup y cart.
// ════════════════════════════════════════════════════════════════════════
export default function PersonalizadorV2({ pers, setPers, gratis, moq = 10 }) {
  const { opcion, texto, logoUrl } = pers;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const setOpcion = (o) => {
    setError('');
    // Al cambiar de tipo, limpia los datos de los otros tipos.
    setPers({ opcion: o, texto: '', logoUrl: '', disenoPeyuUrl: '' });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('El archivo supera 10MB.'); return; }
    setError('');
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      const url = res.file_url || '';
      setPers({ ...pers, logoUrl: url, disenoPeyuUrl: '' });
    } catch {
      setError('No se pudo subir el archivo. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="w-4 h-4 text-[#D96B4D]" />
        <label className="text-sm font-bold text-[#2A2420]">Personalización (opcional)</label>
      </div>

      <PersonalizacionPickerV2 value={opcion} onSelect={setOpcion} gratis={gratis} moq={moq} />

      {/* FRASE */}
      {opcion === 'frase' && (
        <div className="mt-3">
          <input
            value={texto}
            onChange={(e) => setPers({ ...pers, texto: e.target.value.slice(0, 20) })}
            placeholder="Tu nombre, frase o empresa..."
            className="w-full h-11 px-4 rounded-xl bg-white border border-[#EBE3D6] text-center font-bold tracking-wide text-[#2A2420] placeholder:text-[#A78B6F] focus:outline-none focus:border-[#0F8B6C] focus:ring-2 focus:ring-[#0F8B6C]/15"
          />
          <p className="text-[11px] text-right text-[#A78B6F] mt-1 font-bold">{texto.length}/20</p>
        </div>
      )}

      {/* DISEÑO PEYU — galería real (entidad DisenoPeyu) */}
      {opcion === 'peyu' && (
        <div className="mt-3 bg-white border border-[#EBE3D6] rounded-2xl p-3.5">
          <DisenosPeyuPickerB2C
            selectedUrl={logoUrl}
            onSelect={(url) => setPers({ ...pers, logoUrl: url, disenoPeyuUrl: url })}
          />
        </div>
      )}

      {/* TU LOGO — upload del cliente */}
      {opcion === 'archivo' && (
        <div className="mt-3">
          {logoUrl ? (
            <div className="flex items-center gap-3 bg-white border border-[#EBE3D6] rounded-xl p-3">
              <img src={logoUrl} alt="Subido" className="w-12 h-12 object-contain rounded-lg bg-[#FAF7F2]" />
              <div className="flex-1 text-xs">
                <p className="text-[#0F8B6C] font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Logo cargado</p>
                <p className="text-[#A78B6F]">Listo para grabar</p>
              </div>
              <button
                onClick={() => setPers({ ...pers, logoUrl: '' })}
                className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#EBE3D6] hover:border-[#D96B4D]/40 flex items-center justify-center text-[#A78B6F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#FAF7F2] border border-dashed border-[#EBE3D6] hover:border-[#0F8B6C]/40 rounded-xl py-6 transition-colors"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin text-[#0F8B6C]" /> <span className="text-sm text-[#4B4F54]">Subiendo...</span></>
              ) : (
                <><Upload className="w-4 h-4 text-[#A78B6F]" /> <span className="text-sm text-[#4B4F54] font-semibold">Sube tu logo o imagen (PNG, JPG, SVG)</span></>
              )}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*,.svg" onChange={handleUpload} disabled={uploading} className="hidden" />
        </div>
      )}

      {error && (
        <p className="text-xs font-semibold text-[#D96B4D] bg-[#D96B4D]/10 border border-[#D96B4D]/30 rounded-xl p-2.5 mt-2">{error}</p>
      )}
    </div>
  );
}