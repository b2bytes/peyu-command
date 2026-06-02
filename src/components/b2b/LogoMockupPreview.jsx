import { useState } from 'react';
import { getProductImage } from '@/utils/productImages';
import LaserEngravePreview from '@/components/personalizacion/LaserEngravePreview';

const PRODUCT_IMAGES = [
  { sku: 'ESC-KIT5', cat: 'Escritorio', label: 'Kit Escritorio', area: '≈ 40×25mm' },
  { sku: 'HOG-MACE-XL', cat: 'Hogar', label: 'Macetero', area: '≈ 50×30mm' },
  { sku: 'ENT-CACH4', cat: 'Entretenimiento', label: 'Cacho Cubilete', area: '≈ 30×30mm' },
  { sku: 'CORP-LAMP', cat: 'Corporativo', label: 'Lámpara', area: '≈ 45×25mm' },
];

/**
 * Live logo mockup preview B2B — usa el motor compartido LaserEngravePreview,
 * que elimina el fondo del logo y lo compone como grabado láser monocromo
 * (sin caja negra). Mantiene el selector de producto de ejemplo.
 */
export default function LogoMockupPreview({ logoFile, texto }) {
  const [productoIdx, setProductoIdx] = useState(0);
  const producto = PRODUCT_IMAGES[productoIdx];
  const productImg = getProductImage(producto.sku, producto.cat);

  if (!logoFile && !texto) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-dashed border-white/20 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">👁️</span>
        </div>
        <p className="text-sm font-semibold text-white/70">Preview de tu logo en el producto</p>
        <p className="text-xs text-white/40 mt-1">Sube un logo o escribe un texto para ver el mockup en vivo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selector de producto de ejemplo */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {PRODUCT_IMAGES.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setProductoIdx(i)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition whitespace-nowrap flex-shrink-0 ${
              productoIdx === i
                ? 'bg-teal-500/30 text-white border border-teal-400/50'
                : 'bg-white/5 text-white/60 border border-white/15 hover:bg-white/10'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      <LaserEngravePreview
        productImageUrl={productImg}
        logoFile={logoFile}
        texto={texto}
        areaLabel={producto.area}
      />
    </div>
  );
}