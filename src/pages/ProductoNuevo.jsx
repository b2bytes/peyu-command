import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Recycle, ShieldCheck, Truck, Check, Loader2, ShoppingBag, Sparkles, Lock,
} from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import ColorSwatchesV2 from '@/components/shopv2/ColorSwatchesV2';
import PersonalizadorV2 from '@/components/shopv2/PersonalizadorV2';
import MockupLivePreviewV2 from '@/components/shopv2/MockupLivePreviewV2';
import PriceBreakdownV2 from '@/components/shopv2/PriceBreakdownV2';
import QtyStepperV2 from '@/components/shopv2/QtyStepperV2';
import ProductGalleryV2 from '@/components/shopv2/ProductGalleryV2';
import ProductIncludesV2 from '@/components/shopv2/ProductIncludesV2';
import StickyBuyBarV2 from '@/components/shopv2/StickyBuyBarV2';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';
import { getColoresProducto } from '@/lib/color-parser';
import { MOQ_PERSONALIZACION_GRATIS } from '@/lib/personalizacion-config';
import { addToCartV2, fmtCLP } from '@/lib/shop-v2-cart';
import {
  PERS_VACIO, tiposActivos, feeUnitarioCombinado, labelCombinada,
  resumenPersonalizacion, persCompleta, hayAlgunoActivado,
} from '@/lib/pers-combinable';

// ════════════════════════════════════════════════════════════════════════
// /ProductoNuevo?id= — Ficha de producto del Shop v2 (Tema 6 Conversion Machine).
// Galería con zoom · swatches con foto real · personalización en vivo · breakdown
// IVA · incluye/impacto · sticky móvil. Add-to-cart al carrito_v2 (aislado).
// ════════════════════════════════════════════════════════════════════════
export default function ProductoNuevo() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = new URLSearchParams(location.search).get('id');

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado del configurador
  const [colorId, setColorId] = useState(null);
  const [pers, setPers] = useState(PERS_VACIO);
  const [placements, setPlacements] = useState({}); // { [capaId]: {size,x,y} }
  const [cantidad, setCantidad] = useState(1);
  const [colorError, setColorError] = useState(false);
  const [added, setAdded] = useState(false);
  const [galIdx, setGalIdx] = useState(0);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    base44.entities.Producto.filter({ id }).then((rows) => {
      setProducto(rows?.[0] || null);
    }).finally(() => setLoading(false));
  }, [id]);

  // Colores reales del producto (carcasas = 5 colores, resto = 4, etc.)
  const colores = useMemo(() => (producto ? getColoresProducto(producto) : []), [producto]);
  const requiereColor = colores.length > 1;
  const color = useMemo(() => colores.find((c) => c.id === colorId), [colores, colorId]);

  // Inicializa color: si solo hay 1, lo fija; si hay varios, deja sin elegir.
  useEffect(() => {
    if (colores.length === 1) setColorId(colores[0].id);
    else setColorId(null);
  }, [colores]);

  // Galería: imagen por color elegido (1ª) + ángulos extra de galeria_urls.
  const galleryImages = useMemo(() => {
    if (!producto) return [];
    const main = color ? getProductImageForColor(producto, color) : getProductImage(producto);
    const extra = Array.isArray(producto.galeria_urls)
      ? producto.galeria_urls.filter((u) => typeof u === 'string' && u.startsWith('http') && u !== main)
      : [];
    return [main, ...extra].slice(0, 6);
  }, [producto, color]);

  // Al cambiar de color, vuelve a la 1ª imagen (la del color elegido).
  useEffect(() => { setGalIdx(0); }, [colorId]);

  const displayImg = galleryImages[0] || (producto ? getProductImage(producto) : null);

  const precioUnit = producto?.precio_b2c || 9990;
  const moq = producto?.personalizacion_gratis_desde || producto?.moq_personalizacion || MOQ_PERSONALIZACION_GRATIS;
  const activos = useMemo(() => tiposActivos(pers), [pers]);
  const feeUnit = useMemo(() => feeUnitarioCombinado(pers), [pers]);
  const gratis = cantidad >= moq;
  const feeTotal = gratis ? 0 : feeUnit * cantidad;
  const total = precioUnit * cantidad + feeTotal;

  // Imagen de la carcasa para el color elegido (lienzo del mockup).
  const colorImg = useMemo(
    () => (color ? getProductImageForColor(producto, color) : displayImg),
    [producto, color, displayImg]
  );

  // Capas (combinables) para el mockup en vivo: frase + diseño PEYU + logo propio.
  const capas = useMemo(() => {
    const out = [];
    if (pers.frase && pers.texto.trim()) out.push({ id: 'frase', tipo: 'frase', texto: pers.texto });
    if (pers.peyu && pers.disenoPeyuUrl) out.push({ id: 'peyu', tipo: 'peyu', url: pers.disenoPeyuUrl });
    if (pers.archivo && pers.logoUrl) out.push({ id: 'archivo', tipo: 'archivo', url: pers.logoUrl });
    return out;
  }, [pers]);

  // Listo para agregar: sin personalización, o con personalización aprobada.
  const persOk = persCompleta(pers) && (!hayAlgunoActivado(pers) || pers.aprobada);
  const muestraMockup = capas.length > 0;

  // Stock/urgencia sutil (Baymard #6): solo si el dato existe y es bajo.
  const stock = producto?.stock_actual;
  const stockBajo = typeof stock === 'number' && stock > 0 && stock <= 8;

  const handleAdd = () => {
    if (requiereColor && !colorId) {
      setColorError(true);
      document.querySelector('[data-color-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!persOk) {
      document.querySelector('[data-personalizador]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // El mockup que viaja al carrito/pedido = imagen del color con el diseño.
    // Guardamos cada capa (frase/diseño/logo) + su posición; producción
    // reconstruye el grabado combinado a partir de esto.
    addToCartV2({
      productoId: producto.id,
      sku: producto.sku || null,
      nombre: producto.nombre,
      precio: precioUnit,
      cargo_personalizacion: feeUnit,
      tipo_personalizacion: activos.length > 1 ? 'mixto' : (activos[0] || null),
      tipos_personalizacion: activos,
      moq_personalizacion: moq,
      personalizacion_gratis_desde: moq,
      cantidad,
      color: color?.label || null,
      personalizacion: resumenPersonalizacion(pers),
      texto: pers.texto || null,
      logoUrl: pers.logoUrl || null,
      disenoPeyuUrl: pers.disenoPeyuUrl || null,
      mockupUrl: muestraMockup ? colorImg : null,
      capas_grabado: capas.map((c) => ({ tipo: c.tipo, url: c.url || null, texto: c.texto || null, ...(placements[c.id] || {}) })),
      imagen: colorImg,
    });
    setAdded(true);
    setTimeout(() => navigate('/CarritoNuevo'), 700);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <ShopV2Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-[#0F8B6C] animate-spin" />
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] font-inter">
        <ShopV2Header />
        <div className="text-center py-32 px-4">
          <p className="font-bold text-[#2A2420] mb-2">Producto no encontrado</p>
          <Link to="/CatalogoNuevo" className="text-[#0F8B6C] font-bold text-sm">← Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  const esCompostable = producto.material?.includes('Trigo') || producto.categoria === 'Carcasas B2C';

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter text-[#2A2420] pb-24 lg:pb-0">
      <ShopV2Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/CatalogoNuevo" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4B4F54] hover:text-[#0F8B6C] mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a la tienda
        </Link>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
          {/* GALERÍA con zoom */}
          <div className="lg:sticky lg:top-24 self-start">
            <ProductGalleryV2
              images={galleryImages}
              active={galIdx}
              onSelect={setGalIdx}
              badge={esCompostable ? 'Compostable' : '100% Reciclado'}
              fallback={getProductImage(producto)}
            />
          </div>

          {/* CONFIGURADOR */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#A78B6F] mb-1.5">
                {producto.categoria?.replace(' B2C', '')}
              </p>
              <h1 className="font-fraunces text-3xl sm:text-4xl leading-[1.1] mb-2.5">{producto.nombre}</h1>
              <p className="font-poppins font-bold text-2xl text-[#0F8B6C]">{fmtCLP(precioUnit)}</p>
              {stockBajo && (
                <p className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-[#D96B4D] bg-[#D96B4D]/10 px-2.5 py-1 rounded-full">
                  🔥 Solo quedan {stock} unidades
                </p>
              )}
              {producto.descripcion && (
                <p className="text-sm text-[#4B4F54] leading-relaxed mt-3">{producto.descripcion}</p>
              )}
            </div>

            {/* Color — swatches visibles (Baymard #1) */}
            {colores.length > 0 && (
              <ColorSwatchesV2
                colores={colores}
                value={colorId}
                onSelect={(v) => { setColorId(v); setColorError(false); }}
                error={colorError}
                producto={producto}
              />
            )}

            {/* Personalización en vivo (Baymard #5) — circuito completo */}
            <div data-personalizador>
              <PersonalizadorV2 pers={pers} setPers={setPers} gratis={gratis} moq={moq} />

              {/* Mockup EN VIVO: compone todas las capas combinadas */}
              {muestraMockup && (
                <div className="mt-4">
                  <MockupLivePreviewV2
                    productImageUrl={colorImg}
                    fallbackUrl={getProductImage(producto)}
                    capas={capas}
                    onPlacementChange={setPlacements}
                  />
                </div>
              )}
            </div>

            {/* Cantidad */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-[#2A2420]">Cantidad</span>
                {activos.length > 0 && (
                  <p className={`text-[11px] mt-0.5 font-semibold ${gratis ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`}>
                    {gratis ? `✓ Grabado GRATIS desde ${moq}u` : `Faltan ${moq - cantidad}u para grabado gratis`}
                  </p>
                )}
              </div>
              <QtyStepperV2 value={cantidad} onChange={setCantidad} min={1} />
            </div>

            {/* Precio en vivo con desglose IVA (Baymard #4) */}
            <PriceBreakdownV2
              precioUnit={precioUnit}
              cantidad={cantidad}
              tipoLabel={labelCombinada(pers)}
              feeUnit={feeUnit}
              feeTotal={feeTotal}
              gratis={gratis}
            />

            {/* CTA desktop */}
            <button
              onClick={handleAdd}
              disabled={added || !persOk}
              className="hidden lg:flex w-full h-14 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold text-base items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
            >
              {added ? (
                <><Check className="w-5 h-5" /> ¡Agregado!</>
              ) : hayAlgunoActivado(pers) && !pers.aprobada ? (
                <><Sparkles className="w-5 h-5" /> Aprueba tu personalización</>
              ) : (
                <><ShoppingBag className="w-5 h-5" /> Agregar al carrito · {fmtCLP(total)}</>
              )}
            </button>

            {/* Trust badges (Baymard #6) */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Recycle, t: '100% reciclado' },
                { icon: Truck, t: 'Envío BlueExpress' },
                { icon: Lock, t: 'Pago seguro' },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 bg-white border border-[#EBE3D6] rounded-xl p-3 text-center">
                  <b.icon className="w-4 h-4 text-[#0F8B6C]" />
                  <span className="text-[10px] font-bold text-[#4B4F54] leading-tight">{b.t}</span>
                </div>
              ))}
            </div>

            {/* Incluye + impacto ambiental (Baymard #7) */}
            <ProductIncludesV2 producto={producto} cantidad={cantidad} />
          </div>
        </div>
      </div>

      {/* Sticky precio + CTA móvil (Baymard #2) */}
      <StickyBuyBarV2 total={total} onAdd={handleAdd} added={added} disabled={!persOk} />
    </div>
  );
}