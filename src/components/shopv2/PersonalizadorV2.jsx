import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Upload, X, Check, Loader2, Type, Palette } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';
import PersToggleCardV2 from '@/components/shopv2/PersToggleCardV2';
import DisenosPeyuPickerB2C from '@/components/personalizacion/DisenosPeyuPickerB2C';
import { PRECIO_PERSONALIZACION } from '@/lib/personalizacion-config';
import { tiposActivos, feeUnitarioCombinado, labelCombinada } from '@/lib/pers-combinable';

// ════════════════════════════════════════════════════════════════════════
// PersonalizadorV2 — Circuito EXCLUYENTE del Shop v2 (piel Tema 6).
// El cliente elige UNA sola opción por ítem: Frase · Diseño PEYU · Tu logo.
// Al elegir una, se deselecciona la otra (tipo radio). Es CONTROLADO: recibe
// `pers` y `setPers` del padre con { tipo, texto, disenoPeyuUrl, logoUrl }.
// ════════════════════════════════════════════════════════════════════════
export default function PersonalizadorV2({ pers, setPers, gratis, moq = 10 }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  // Selección única: al elegir un tipo, se limpia el dato de los otros.
  // Si se toca el tipo ya activo, se deselecciona (vuelve a "sin personalización").
  const elegir = (tipo) => {
    setError('');
    if (pers.tipo === tipo) {
      setPers({ tipo: null, texto: '', disenoPeyuUrl: '', logoUrl: '' });
      return;
    }
    setPers({ tipo, texto: '', disenoPeyuUrl: '', logoUrl: '' });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('El archivo supera 10MB.'); return; }
    setError('');
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setPers({ ...pers, logoUrl: res.file_url || '' });
    } catch {
      setError('No se pudo subir el archivo. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const activos = tiposActivos(pers);
  const feeUnit = feeUnitarioCombinado(pers);

  return (
    <div data-personalizador>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-[#D96B4D]" />
        <label className="text-sm font-bold text-[#2A2420]">Personalización (opcional)</label>
      </div>
      <p className="text-[11px] text-[#A78B6F] mb-2.5">Elige una opción de grabado láser. Gratis desde {moq}u.</p>

      {/* Opciones EXCLUYENTES (radio) */}
      <div className="grid grid-cols-3 gap-2">
        <PersToggleCardV2 Icon={Type} label="Frase" precio={PRECIO_PERSONALIZACION.frase} active={pers.tipo === 'frase'} onToggle={() => elegir('frase')} gratis={gratis} />
        <PersToggleCardV2 Icon={Palette} label="Diseño PEYU" precio={PRECIO_PERSONALIZACION.peyu} active={pers.tipo === 'peyu'} onToggle={() => elegir('peyu')} gratis={gratis} />
        <PersToggleCardV2 Icon={Upload} label="Tu logo" precio={PRECIO_PERSONALIZACION.archivo} active={pers.tipo === 'archivo'} onToggle={() => elegir('archivo')} gratis={gratis} />
      </div>

      {/* Resumen de la opción activa */}
      {activos.length > 0 && (
        <div className="flex items-center justify-between mt-2.5 bg-[#0F8B6C]/5 border border-[#0F8B6C]/20 rounded-xl px-3 py-2">
          <span className="text-[11px] font-bold text-[#0F8B6C] truncate">{labelCombinada(pers)}</span>
          <span className="text-[11px] font-bold text-[#0F8B6C] flex-shrink-0 ml-2">
            {gratis ? `GRATIS desde ${moq}u` : `+${fmtCLP(feeUnit)}/u`}
          </span>
        </div>
      )}

      {/* FRASE */}
      {pers.tipo === 'frase' && (
        <div className="mt-3">
          <input
            value={pers.texto}
            onChange={(e) => setPers({ ...pers, texto: e.target.value.slice(0, 20) })}
            placeholder="Tu nombre, frase o empresa..."
            className="w-full h-11 px-4 rounded-xl bg-white border border-[#EBE3D6] text-center font-bold tracking-wide text-[#2A2420] placeholder:text-[#A78B6F] focus:outline-none focus:border-[#0F8B6C] focus:ring-2 focus:ring-[#0F8B6C]/15"
          />
          <p className="text-[11px] text-right text-[#A78B6F] mt-1 font-bold">{pers.texto.length}/20</p>
        </div>
      )}

      {/* DISEÑO PEYU — galería real (entidad DisenoPeyu) */}
      {pers.tipo === 'peyu' && (
        <div className="mt-3 bg-white border border-[#EBE3D6] rounded-2xl p-3.5">
          <DisenosPeyuPickerB2C
            selectedUrl={pers.disenoPeyuUrl}
            onSelect={(url) => setPers({ ...pers, disenoPeyuUrl: url })}
          />
        </div>
      )}

      {/* TU LOGO — upload del cliente */}
      {pers.tipo === 'archivo' && (
        <div className="mt-3">
          {pers.logoUrl ? (
            <div className="flex items-center gap-3 bg-white border border-[#EBE3D6] rounded-xl p-3">
              <img src={pers.logoUrl} alt="Subido" className="w-12 h-12 object-contain rounded-lg bg-[#FAF7F2]" />
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