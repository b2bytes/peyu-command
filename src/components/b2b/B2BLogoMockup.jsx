// Motor de mockup B2B — canal EmpresaProducto y ficha de producto.
// Vista previa instantánea CSS: el mockup ES la galería del producto + logo
// grabado en vivo. Sin botón "generar mockup" — la preview CSS es definitiva.
//
// CLAVE: recibe productImgOverride del padre (EmpresaProducto), que es la
// MISMA imagen que muestra la galería (con el color seleccionado). Así el
// mockup nunca cambia a una foto por defecto distinta del color elegido.
import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Sparkles, RefreshCw, Check } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import MockupLivePreviewV2 from '@/components/shopv2/MockupLivePreviewV2';
import { getProductEngraggingArea, isProductoCarcasa } from '@/lib/product-engraving-areas';

export default function B2BLogoMockup({
  producto,
  initialLogoUrl = null,
  onLogoChange,
  // Imagen override: la que el padre ya resolvió (color seleccionado).
  // Si llega, se usa en VEZ de getProductImage(producto) → el mockup
  // muestra exactamente el mismo color que la galería.
  productImgOverride = null,
  // Filtro CSS del color (tinte) — se aplica también al mockup para que
  // coincida 1:1 con la galería cuando no hay foto real del color.
  colorFilterOverride = '',
}) {
  const [logoUrl, setLogoUrlState] = useState(initialLogoUrl);
  // Notifica cada cambio de logo al padre → el logo VIAJA al cotizador y no
  // se le pide al cliente una segunda vez (flujo B2B continuo).
  const setLogoUrl = (u) => { setLogoUrlState(u); onLogoChange?.(u); };
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Imagen del producto para el mockup:
  // ① override del padre (color elegido = misma que la galería)
  // ② imagen base limpia (sin logo PEYU de fábrica) si existe
  // ③ imagen principal del catálogo (fallback)
  const productImg = productImgOverride
    || producto?.imagen_base_limpia_url
    || getProductImage(producto);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    // ⚡ Incrustación INSTANTÁNEA: mostramos el logo en el mockup con un object
    // URL local ANTES de que termine la subida — el cliente ve su diseño
    // grabado sobre el producto al segundo de elegirlo.
    const localUrl = URL.createObjectURL(file);
    setLogoUrlState(localUrl);
    setLogoFile(file);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
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

  return (
    <div className="rounded-3xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0', background: '#FAF7F2' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: '#EDE3D6' }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: '#D96B4D' }} />
          <p className="text-sm font-bold" style={{ color: '#2C1810' }}>Mockup con tu logo</p>
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#A08070' }}>
          Sube tu logo y se graba al instante sobre el producto · {colorFilterOverride ? 'Color aplicado' : 'Color real'}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Mockup COMPLETO — mismo motor que B2C (MockupLivePreviewV2):
            el logo se ARRASTRA para posicionarlo y se escala con el slider,
            con la regla única de tinta. Usa la MISMA imagen que la galería. */}
        <MockupLivePreviewV2
          productImageUrl={productImg}
          fallbackUrl={getProductImage(producto)}
          capas={logoUrl ? [{ id: 'archivo', tipo: 'archivo', url: logoUrl }] : []}
          baseFilter={colorFilterOverride || ''}
          esCarcasa={isProductoCarcasa(producto)}
          customArea={getProductEngraggingArea(producto)}
        />

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
            <p className="text-[10px] mt-0.5 text-center max-w-[240px]" style={{ color: '#0F8B6C' }}>
              ✓ Se graba automáticamente al instante
            </p>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Logo preview strip */}
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 w-full max-w-full min-w-0 overflow-hidden" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#F2ECE2' }}>
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-bold truncate" style={{ color: '#2C1810', maxWidth: '100%' }}>
                  {(() => { const n = logoFile?.name || 'Logo subido'; return n.length > 26 ? `${n.slice(0, 18)}…${n.slice(-6)}` : n; })()}
                </p>
                <p className="text-[11px]" style={{ color: '#0F8B6C' }}>✓ Grabado láser activo sobre tu color elegido</p>
              </div>
              <button
                onClick={() => { setLogoUrl(null); setLogoFile(null); inputRef.current?.click(); }}
                className="flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: '#7A6050', background: '#F2ECE2', border: '1px solid #D4C4B0' }}>
                Cambiar
              </button>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
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