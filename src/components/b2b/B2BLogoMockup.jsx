// Motor de mockup B2B — canal EmpresaProducto y ficha de producto.
// Vista previa instantánea CSS + generación IA con backend generateMockup.
import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Sparkles, RefreshCw, Check, Image as ImageIcon } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import LogoMockupPreview from '@/components/cotizacion/LogoMockupPreview';

export default function B2BLogoMockup({ producto }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mockupUrl, setMockupUrl] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Preferimos imagen base limpia (sin logo PEYU de fábrica) para el mockup IA.
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

  const generateMockupIA = async () => {
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
        <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>
          Vista previa instantánea · Genera con IA para resultado foto-realista
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Preview: si hay mockup IA lo muestra, si no → preview CSS inteligente */}
        <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '1', background: '#F2ECE2', border: '1.5px solid #EDE3D6' }}>
          {mockupUrl && !generating ? (
            <>
              <img src={mockupUrl} alt="Mockup generado" className="w-full h-full object-cover" onError={(e) => { e.target.style.opacity = '0'; }} />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#0F8B6C', color: 'white' }}>
                <Check className="w-3 h-3" /> Mockup IA generado
              </span>
            </>
          ) : (
            <LogoMockupPreview
              logoUrl={logoUrl}
              productImg={productImg}
              producto={producto}
              size="md"
              showBadge={!!logoUrl}
            />
          )}
          {generating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl"
              style={{ background: 'rgba(248,243,237,.9)', backdropFilter: 'blur(6px)' }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0F8B6C' }} />
              <p className="text-sm font-bold" style={{ color: '#2C1810' }}>Generando con IA…</p>
              <p className="text-xs" style={{ color: '#A08070' }}>Procesando tu logo sobre el producto</p>
            </div>
          )}
        </div>

        {/* Upload zone o logo preview */}
        {!logoUrl ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-5 cursor-pointer transition-all hover:border-[#0F8B6C]"
            style={{ border: '2px dashed #D4C4B0', background: 'white' }}
          >
            {uploading
              ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#0F8B6C' }} />
              : <Upload className="w-6 h-6" style={{ color: '#A08070' }} />
            }
            <p className="text-sm font-bold" style={{ color: '#2C1810' }}>
              {uploading ? 'Subiendo logo…' : 'Sube tu logo aquí'}
            </p>
            <p className="text-[11px]" style={{ color: '#A08070' }}>PNG transparente recomendado · JPG, SVG</p>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Logo preview strip */}
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#F2ECE2' }}>
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#2C1810' }}>{logoFile?.name || 'Logo subido'}</p>
                <p className="text-[11px]" style={{ color: '#0F8B6C' }}>✓ Vista previa instantánea activa</p>
              </div>
              <button
                onClick={() => { setLogoUrl(null); setLogoFile(null); setMockupUrl(null); inputRef.current?.click(); }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: '#7A6050', background: '#F2ECE2', border: '1px solid #D4C4B0' }}>
                Cambiar
              </button>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>

            {/* Dos CTAs: preview CSS (instantáneo) vs IA (foto-realista) */}
            <button
              onClick={generateMockupIA}
              disabled={generating}
              className="w-full h-11 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: generating ? '#D4C4B0' : 'linear-gradient(135deg,#0F8B6C,#0B6E55)',
                color: 'white',
                boxShadow: generating ? 'none' : '0 4px 16px rgba(15,139,108,.25)',
              }}
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</>
                : mockupUrl
                  ? <><RefreshCw className="w-4 h-4" /> Regenerar con IA</>
                  : <><Sparkles className="w-4 h-4" /> Generar mockup foto-realista con IA</>
              }
            </button>
            <p className="text-[10px] text-center" style={{ color: '#A08070' }}>
              La vista previa de arriba ya muestra tu logo grabado. La IA genera resultado foto-realista.
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: '#D96B4D15', color: '#D96B4D', border: '1px solid #D96B4D30' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}