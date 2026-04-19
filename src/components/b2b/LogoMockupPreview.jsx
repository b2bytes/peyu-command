import { useState, useRef, useMemo } from 'react';
import { Move, Sparkles, Eye, Trash2 } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';

const PRODUCT_IMAGES = [
  { sku: 'ESC-KIT5', cat: 'Escritorio', label: 'Kit Escritorio' },
  { sku: 'HOG-MACE-XL', cat: 'Hogar', label: 'Macetero' },
  { sku: 'ENT-CACH4', cat: 'Entretenimiento', label: 'Cacho Cubilete' },
  { sku: 'CORP-LAMP', cat: 'Corporativo', label: 'Lámpara' },
];

/**
 * Live logo mockup preview — overlays an uploaded logo on top of a product photo
 * using pure CSS so it updates instantly as the client edits.
 */
export default function LogoMockupPreview({ logoFile, texto }) {
  const [productoIdx, setProductoIdx] = useState(0);
  const [logoSize, setLogoSize] = useState(28); // % of product
  const [logoPosX, setLogoPosX] = useState(50); // %
  const [logoPosY, setLogoPosY] = useState(55); // %
  const [logoColor, setLogoColor] = useState('dark'); // dark | light
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const logoUrl = useMemo(() => {
    if (!logoFile) return null;
    return URL.createObjectURL(logoFile);
  }, [logoFile]);

  const producto = PRODUCT_IMAGES[productoIdx];
  const productImg = getProductImage(producto.sku, producto.cat);

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLogoPosX(Math.max(10, Math.min(90, x)));
    setLogoPosY(Math.max(10, Math.min(90, y)));
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
    setLogoPosX(Math.max(10, Math.min(90, x)));
    setLogoPosY(Math.max(10, Math.min(90, y)));
  };

  if (!logoUrl && !texto) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-dashed border-white/20 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
          <Eye className="w-6 h-6 text-white/30" />
        </div>
        <p className="text-sm font-semibold text-white/70">Preview de tu logo en el producto</p>
        <p className="text-xs text-white/40 mt-1">Sube un logo o escribe un texto para ver el mockup en vivo.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-teal-400/30 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-300" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">Mockup en vivo</p>
            <p className="text-[10px] text-white/50">Arrastra el logo para reposicionarlo</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 border border-teal-400/30 px-2 py-1 rounded-full">
          Actualizando en tiempo real
        </span>
      </div>

      {/* Product selector */}
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

      {/* Preview canvas */}
      <div
        ref={containerRef}
        className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
      >
        <img src={productImg} alt="Producto" className="w-full h-full object-cover" />

        {/* Engraved laser effect — dim area */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${logoPosX}%`,
            top: `${logoPosY}%`,
            width: `${logoSize * 1.2}%`,
            height: `${logoSize * 1.2}%`,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(0,0,0,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Logo overlay */}
        {logoUrl && (
          <div
            className="absolute cursor-move touch-none"
            style={{
              left: `${logoPosX}%`,
              top: `${logoPosY}%`,
              width: `${logoSize}%`,
              transform: 'translate(-50%, -50%)',
              filter: logoColor === 'light'
                ? 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                : 'brightness(0) invert(0) opacity(0.85) drop-shadow(0 1px 1px rgba(255,255,255,0.3))',
              mixBlendMode: logoColor === 'light' ? 'screen' : 'multiply',
            }}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            <img
              src={logoUrl}
              alt="Tu logo"
              draggable={false}
              className="w-full h-auto pointer-events-none"
            />
          </div>
        )}

        {/* Text overlay (if no logo) */}
        {!logoUrl && texto && (
          <div
            className="absolute pointer-events-none text-center"
            style={{
              left: `${logoPosX}%`,
              top: `${logoPosY}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${logoSize * 0.4}px`,
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: logoColor === 'light' ? '#fff' : '#000',
              letterSpacing: '0.15em',
              textShadow: logoColor === 'light'
                ? '0 1px 2px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3)'
                : '0 1px 1px rgba(255,255,255,0.3)',
              opacity: 0.85,
              whiteSpace: 'nowrap',
            }}
          >
            {texto.toUpperCase()}
          </div>
        )}

        {/* Watermark */}
        <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-md border border-white/15">
          <p className="text-[9px] text-white/60 font-medium">PEYU · Preview referencial</p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 text-xs">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-white/60 font-semibold">Tamaño</label>
            <span className="text-white/40">{logoSize}%</span>
          </div>
          <input
            type="range"
            min="10" max="50" value={logoSize}
            onChange={e => setLogoSize(Number(e.target.value))}
            className="w-full accent-teal-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLogoColor(logoColor === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 text-[11px] font-semibold"
          >
            <span className={`w-3 h-3 rounded-full ${logoColor === 'light' ? 'bg-white' : 'bg-gray-900'} border border-white/30`} />
            Tinta {logoColor === 'light' ? 'clara' : 'oscura'}
          </button>
          <button
            type="button"
            onClick={() => { setLogoPosX(50); setLogoPosY(55); setLogoSize(28); }}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 text-[11px] font-semibold"
          >
            <Move className="w-3 h-3" /> Centrar
          </button>
        </div>
      </div>

      <div className="text-[10px] text-white/40 italic bg-white/5 border border-white/10 rounded-xl p-2.5 leading-relaxed">
        Este preview es referencial. El grabado láser UV real se aplica a pedido y se ajusta al área técnica del producto ({PRODUCT_IMAGES[productoIdx].label.toLowerCase()} ≈ 40×25mm).
      </div>
    </div>
  );
}