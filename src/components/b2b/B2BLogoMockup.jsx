// Generador de mockup con logo del cliente — canal B2B
// Permite subir un logo, vista previa instantánea, y generar el mockup con IA.
import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Sparkles, RefreshCw, Check, Image as ImageIcon } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';

export default function B2BLogoMockup({ producto }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mockupUrl, setMockupUrl] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Para el mockup siempre usamos la imagen BASE LIMPIA (sin logo PEYU grabado de fábrica).
  // Si aún no se generó la versión limpia, caemos a la imagen principal.
  const productImg = producto?.imagen_base_limpia_url || getProductImage(producto);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    setMockupUrl(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
      setLogoFile(file);
    } catch {
      setError('No se pudo subir el archivo. Prueba con PNG o JPG.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const generateMockup = async () => {
    if (!logoUrl || !productImg) return;
    setGenerating(true);
    setError('');
    try {
      const res = await base44.functions.invoke('generateMockup', {
        productName: producto.nombre,
        productCategory: producto.categoria,
        productImageUrl: productImg,
        logoUrl,
        mockupType: 'logo',
      });
      if (res.data?.mockup_url) {
        setMockupUrl(res.data.mockup_url);
      } else {
        setError('No se pudo generar el mockup. Intenta con otra imagen.');
      }
    } catch {
      setError('Error al generar el mockup. Inténtalo de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0', background: '#FAF7F2' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: '#EDE3D6' }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: '#D96B4D' }} />
          <p className="text-sm font-bold" style={{ color: '#2C1810' }}>Mockup con tu logo</p>
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>Visualiza cómo quedará el grabado láser con el logo de tu empresa</p>
      </div>

      {/* Preview area */}
      <div className="p-4">
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-4" style={{ background: '#F2ECE2', border: '1.5px solid #EDE3D6' }}>
          <img
            src={mockupUrl || productImg}
            alt={producto.nombre}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = productImg; }}
          />
          {generating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(248,243,237,.85)', backdropFilter: 'blur(4px)' }}>
              <Loader2 className="w-8 h-8 animate-spin mb-2" style={{ color: '#0F8B6C' }} />
              <p className="text-sm font-bold" style={{ color: '#2C1810' }}>Generando mockup…</p>
              <p className="text-xs mt-1" style={{ color: '#A08070' }}>Esto toma ~20 segundos</p>
            </div>
          )}
          {mockupUrl && !generating && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#0F8B6C', color: 'white' }}>
              <Check className="w-3 h-3" /> Mockup generado
            </span>
          )}
          {!mockupUrl && !generating && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,.9)', color: '#A08070' }}>
              <ImageIcon className="w-3 h-3" /> Referencial
            </span>
          )}
        </div>

        {/* Upload zone */}
        {!logoUrl ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-6 cursor-pointer transition-all hover:border-[#0F8B6C]"
            style={{ border: '2px dashed #D4C4B0', background: 'white' }}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#0F8B6C' }} />
            ) : (
              <Upload className="w-6 h-6" style={{ color: '#A08070' }} />
            )}
            <p className="text-sm font-bold" style={{ color: '#2C1810' }}>
              {uploading ? 'Subiendo logo…' : 'Sube tu logo aquí'}
            </p>
            <p className="text-[11px]" style={{ color: '#A08070' }}>PNG, JPG o SVG · Fondo transparente recomendado</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Logo preview + cambiar */}
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
              <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" style={{ background: '#F2ECE2' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#2C1810' }}>{logoFile?.name || 'Logo subido'}</p>
                <p className="text-[11px]" style={{ color: '#0F8B6C' }}>✓ Logo listo para el mockup</p>
              </div>
              <button
                onClick={() => { setLogoUrl(null); setLogoFile(null); setMockupUrl(null); inputRef.current?.click(); }}
                className="text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: '#7A6050', background: '#F2ECE2', border: '1px solid #D4C4B0' }}
              >
                Cambiar
              </button>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>

            {/* CTA generar */}
            <button
              onClick={generateMockup}
              disabled={generating}
              className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: generating ? '#D4C4B0' : 'linear-gradient(135deg,#0F8B6C,#0B6E55)',
                color: 'white',
                boxShadow: generating ? 'none' : '0 4px 16px rgba(15,139,108,.25)',
              }}
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</>
              ) : mockupUrl ? (
                <><RefreshCw className="w-4 h-4" /> Regenerar mockup</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generar mockup con IA</>
              )}
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs font-semibold mt-3 px-3 py-2 rounded-xl" style={{ background: '#D96B4D15', color: '#D96B4D', border: '1px solid #D96B4D30' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}