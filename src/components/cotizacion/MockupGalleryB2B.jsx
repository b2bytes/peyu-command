// ════════════════════════════════════════════════════════════════════════
// MockupGalleryB2B — Galería de mockups inteligentes para propuesta B2B.
// Aplica automáticamente el logo del cliente sobre TODOS los productos
// de la cotización/propuesta. Motor CSS instantáneo + IA por producto.
// ════════════════════════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Sparkles, RefreshCw, X, Check } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import LogoMockupPreview from '@/components/cotizacion/LogoMockupPreview';

export default function MockupGalleryB2B({
  items = [],        // [{ producto, qty }] o [{ producto }]
  logoUrl: externalLogoUrl = null,
  onLogoChange = null,
  showUploader = true,
  compact = false,
  frameless = false,   // sin card propia (cuando vive dentro de otro panel)
}) {
  const [internalLogoUrl, setInternalLogoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generatingIdx, setGeneratingIdx] = useState(null); // índice del item generando
  const [mockupUrls, setMockupUrls] = useState({}); // { sku: url }
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const logoUrl = externalLogoUrl || internalLogoUrl;

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (onLogoChange) onLogoChange(file_url);
      else setInternalLogoUrl(file_url);
      setMockupUrls({}); // resetea mockups IA al cambiar logo
    } catch {
      const localUrl = URL.createObjectURL(file);
      if (onLogoChange) onLogoChange(localUrl);
      else setInternalLogoUrl(localUrl);
      setMockupUrls({});
    } finally {
      setUploading(false);
    }
  }, [onLogoChange]);

  const clearLogo = () => {
    if (onLogoChange) onLogoChange(null);
    else setInternalLogoUrl(null);
    setMockupUrls({});
  };

  const generateOne = async (item, idx) => {
    if (!logoUrl) return;
    const sku = item.producto?.sku;
    const productImg = item.producto?.imagen_base_limpia_url || getProductImage(item.producto);
    if (!productImg || !sku) return;
    setGeneratingIdx(idx);
    setError('');
    try {
      const res = await base44.functions.invoke('generateMockup', {
        productName: item.producto.nombre,
        productCategory: item.producto.categoria,
        productImageUrl: productImg,
        logoUrl,
        mockupType: 'logo',
      });
      if (res.data?.mockup_url) {
        setMockupUrls((prev) => ({ ...prev, [sku]: res.data.mockup_url }));
      }
    } catch {
      setError(`Error generando mockup de ${item.producto?.nombre}.`);
    } finally {
      setGeneratingIdx(null);
    }
  };

  const generateAll = async () => {
    if (!logoUrl || !items.length) return;
    setMockupUrls({}); // resetea antes de generar todos
    for (let i = 0; i < items.length; i++) {
      await generateOne(items[i], i);
    }
  };

  if (!items.length) return null;

  return (
    <div className={(compact || frameless) ? '' : 'bg-white border border-[#EBE3D6] rounded-3xl overflow-hidden'}>
      {!compact && (
        <div className={`${frameless ? 'pb-3' : 'px-5 py-4'} border-b border-[#EBE3D6] flex items-center justify-between gap-3`}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="w-4 h-4 text-[#D96B4D]" />
              <p className="text-sm font-bold text-[#2A2420]">Mockup corporativo inteligente</p>
            </div>
            <p className="text-xs text-[#A78B6F]">
              Tu logo grabado láser sobre {items.length} {items.length === 1 ? 'producto' : 'productos'}. Vista previa instantánea.
            </p>
          </div>
          {logoUrl && (
            <div className="flex items-center gap-2 bg-[#0F8B6C]/8 border border-[#0F8B6C]/20 rounded-xl px-2.5 py-1.5">
              <img src={logoUrl} alt="logo" className="w-6 h-6 object-contain rounded" style={{ background: '#F2ECE2' }} />
              <span className="text-[10px] font-bold text-[#0F8B6C]">Logo activo</span>
              <button onClick={clearLogo} className="w-4 h-4 flex items-center justify-center text-[#A78B6F] hover:text-[#D96B4D] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className={compact ? '' : frameless ? 'py-4 space-y-4' : 'p-4 space-y-4'}>
        {/* Uploader si no hay logo */}
        {showUploader && !logoUrl && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            className="flex flex-col items-center gap-2 py-6 rounded-2xl cursor-pointer transition-all border-2 border-dashed border-[#D4C4B0] hover:border-[#0F8B6C] bg-[#FAF7F2]"
          >
            {uploading
              ? <Loader2 className="w-6 h-6 animate-spin text-[#0F8B6C]" />
              : <Upload className="w-6 h-6 text-[#A78B6F]" />
            }
            <p className="text-sm font-bold text-[#2A2420]">
              {uploading ? 'Subiendo…' : 'Sube el logo de tu empresa'}
            </p>
            <p className="text-[11px] text-[#A78B6F]">PNG transparente recomendado · JPG, SVG</p>
          </div>
        )}

        {/* Galería de mockups por producto */}
        {logoUrl && (
          <>
            <div className={`grid gap-3 ${items.length === 1 ? 'grid-cols-1' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {items.map((item, idx) => {
                const sku = item.producto?.sku;
                const aiMockup = mockupUrls[sku];
                const isGenerating = generatingIdx === idx;
                const productImg = item.producto?.imagen_base_limpia_url || getProductImage(item.producto);
                const hasMockup = !!aiMockup; // True si ya tiene mockup IA

                return (
                  <div key={sku || idx} className="relative group">
                    {/* Mockup — siempre muestra CSS preview con logo hasta IA genera la versión fotorrealista */}
                    <div className="relative rounded-2xl overflow-hidden border border-[#EBE3D6]"
                      style={{ aspectRatio: '1', background: '#F8F4EE' }}>
                      {hasMockup && !isGenerating ? (
                        <>
                          <img src={aiMockup} alt={item.producto?.nombre} className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#0F8B6C] text-white">
                            <Check className="w-2.5 h-2.5" /> IA Fotorrealista
                          </span>
                        </>
                      ) : (
                        <LogoMockupPreview
                          logoUrl={logoUrl}
                          productImg={productImg}
                          producto={item.producto}
                          size="md"
                          showBadge={!isGenerating}
                        />
                      )}
                      {isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
                          style={{ background: 'rgba(250,247,242,.85)', backdropFilter: 'blur(4px)' }}>
                          <Loader2 className="w-6 h-6 animate-spin text-[#0F8B6C]" />
                        </div>
                      )}
                      {/* Botón de generar IA por producto (hover) */}
                      {!isGenerating && (
                        <button
                          onClick={() => generateOne(item, idx)}
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full bg-white/90 text-[#0F8B6C] border border-[#0F8B6C]/30 hover:bg-[#0F8B6C] hover:text-white"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {aiMockup ? 'Regenerar' : 'IA'}
                        </button>
                      )}
                    </div>
                    {/* Nombre del producto */}
                    <p className="text-[11px] font-semibold text-[#4B4F54] mt-1.5 text-center leading-tight truncate px-1">
                      {item.qty && `${item.qty}× `}{item.producto?.nombre}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Acción generar todos con IA */}
            <div className="flex gap-2">
              <button
                onClick={generateAll}
                disabled={generatingIdx !== null}
                className="flex-1 h-10 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: generatingIdx !== null ? '#D4C4B0' : 'linear-gradient(135deg,#0F8B6C,#0B6E55)',
                  color: 'white',
                  boxShadow: generatingIdx !== null ? 'none' : '0 4px 14px rgba(15,139,108,.22)',
                }}
              >
                {generatingIdx !== null
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando…</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Generar todos con IA foto-realista</>
                }
              </button>
              {showUploader && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="h-10 px-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-[#EBE3D6] bg-white text-[#4B4F54] hover:border-[#0F8B6C]/40 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Cambiar logo
                </button>
              )}
            </div>
            <p className="text-[10px] text-center text-[#A78B6F]">
              Vista previa instantánea activa · IA genera resultado foto-realista (~20s/producto)
            </p>
          </>
        )}

        {error && (
          <p className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#D96B4D]/10 text-[#D96B4D] border border-[#D96B4D]/25">
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}