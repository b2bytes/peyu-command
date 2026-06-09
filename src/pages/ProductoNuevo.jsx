import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SEOHead from '@/components/SEOHead';
import {
  ArrowLeft, Recycle, ShieldCheck, Truck, Check, Loader2, ShoppingBag, Sparkles, Lock,
} from 'lucide-react';
import PublicNavBar from '@/components/PublicNavBar';
import CheckoutStepperV2 from '@/components/shopv2/CheckoutStepperV2';
import ColorSwatchesV2 from '@/components/shopv2/ColorSwatchesV2';
import PersonalizadorV2 from '@/components/shopv2/PersonalizadorV2';
import MockupLivePreviewV2 from '@/components/shopv2/MockupLivePreviewV2';
import PriceBreakdownV2 from '@/components/shopv2/PriceBreakdownV2';
import QtyStepperV2 from '@/components/shopv2/QtyStepperV2';
import ProductGalleryV2 from '@/components/shopv2/ProductGalleryV2';
import ProductIncludesV2 from '@/components/shopv2/ProductIncludesV2';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';
import { getColoresProducto } from '@/lib/color-parser';
import { MOQ_PERSONALIZACION_GRATIS } from '@/lib/personalizacion-config';
import { addToCartV2, fmtCLP } from '@/lib/shop-v2-cart';
import { saveDraftV2, loadDraftV2, clearDraftV2 } from '@/lib/shop-v2-draft';
import {
  PERS_VACIO, tiposActivos, feeUnitarioCombinado, labelCombinada,
  resumenPersonalizacion, persCompleta, hayAlgunoActivado,
} from '@/lib/pers-combinable';
import { getProductEngraggingArea, isProductoCarcasa } from '@/lib/product-engraving-areas';
import { applyAutoPlacement } from '@/lib/auto-placement';
import { getQtyDiscountPct } from '@/lib/volume-discount';

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
  const mockupRef = useRef(null);

  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let retries = 0;
    const cargar = () => {
      // Base44 SDK: list() retorna todos, hay que filtrar por id en el lado del cliente
      // O usar filter() con la query correcta. Usamos list() y buscamos el primero que coincida.
      base44.entities.Producto.list('-updated_date', 500)
        .then((rows) => {
          const encontrado = rows?.find(r => r.id === id);
          setProducto(encontrado || null);
          setError(null);
        })
        .catch((err) => {
          // Retry automático hasta 3 veces (conexión intermitente)
          if (retries < 3) {
            retries++;
            setTimeout(cargar, 1000 * retries);
          } else {
            setError('Error de conexión. Por favor recarga la página.');
          }
        })
        .finally(() => setLoading(false));
    };
    cargar();
  }, [id]);

  // ¿Es carcasa? Usa la función inteligente que deduce de categoría/nombre/BD.
  // Solo en carcasas se permiten las 3 personalizaciones (Frase + Diseño PEYU + Tu diseño).
  // En el resto: SOLO "Tu diseño".
  const esCarcasa = producto ? isProductoCarcasa(producto) : false;
  const engraggingArea = producto ? getProductEngraggingArea(producto) : null;
  const soloArchivo = !!producto && !esCarcasa;

  // Colores reales del producto (carcasas = 5 colores, resto = 4, etc.)
  const colores = useMemo(() => (producto ? getColoresProducto(producto) : []), [producto]);
  const requiereColor = colores.length > 1;
  const color = useMemo(() => colores.find((c) => c.id === colorId), [colores, colorId]);

  // Inicializa: restaura el borrador auto-guardado de este producto si existe
  // (color, personalización, posiciones, cantidad). Si no, estado limpio. Así la
  // configuración sobrevive a recargas o salir/volver, y llega intacta al carrito.
  useEffect(() => {
    if (!producto) return;
    const draft = loadDraftV2(producto.id);
    if (draft) {
      const colorValido = draft.colorId && colores.some((c) => c.id === draft.colorId);
      setColorId(colorValido ? draft.colorId : (colores.length === 1 ? colores[0].id : null));
      // En productos NO-carcasa solo se permite "Tu diseño": descartamos frase/peyu
      // que pudieran venir en un borrador para mantener la regla consistente.
      const draftPers = draft.pers || PERS_VACIO;
      setPers(esCarcasa
        ? draftPers
        : { ...draftPers, frase: false, peyu: false, texto: '', disenoPeyuUrl: '' });
      setPlacements(draft.placements || {});
      setCantidad(draft.cantidad || 1);
    } else {
      setColorId(colores.length === 1 ? colores[0].id : null);
      setPers(PERS_VACIO);
      setPlacements({});
      setCantidad(1);
    }
  }, [producto, colores, esCarcasa]);

  // Auto-guardado: persiste el borrador del producto actual en cada cambio.
  useEffect(() => {
    if (!producto) return;
    saveDraftV2(producto.id, { colorId, pers, placements, cantidad });
  }, [producto, colorId, pers, placements, cantidad]);

  // Auto-placement: cuando se cambia la personalización, auto-asigna las posiciones.
  // Cada vez que el usuario selecciona un logo/diseño, automáticamente se coloca
  // en la posición predeterminada del producto sin requerir ajuste manual.
  useEffect(() => {
    if (!producto || !pers) return;
    applyAutoPlacement(producto, pers, setPlacements);
  }, [producto, pers.logoUrl, pers.disenoPeyuUrl, pers.texto]);

  // Galería: imagen por color elegido (1ª) + ángulos extra de galeria_urls.
  const galleryImages = useMemo(() => {
    if (!producto) return [];
    const main = color ? getProductImageForColor(producto, color) : getProductImage(producto);
    let extra = Array.isArray(producto.galeria_urls)
      ? producto.galeria_urls.filter((u) => typeof u === 'string' && u.startsWith('http') && u !== main)
      : [];
    
    // Filtro especial: cacho unitario no muestra imagen amarilla
    if (producto.sku === 'ENT-CACH-1') {
      extra = extra.filter((u) => !u.toLowerCase().includes('amarillo') && !u.includes('1-2.jpg'));
    }
    
    return [main, ...extra].slice(0, 6);
  }, [producto, color]);

  // Al cambiar de color, vuelve a la 1ª imagen (la del color elegido).
  useEffect(() => { setGalIdx(0); }, [colorId]);

  // IMPORTANTE: la imagen principal SIEMPRE es la del color elegido (galleryImages[0]),
  // sin importar qué thumbnail se seleccione en la galería. Los thumbnails solo permiten
  // ver ángulos alternativos, pero el color elegido prevalece siempre.
  const displayImg = color ? getProductImageForColor(producto, color) : getProductImage(producto);

  const precioUnit = producto?.precio_b2c || 9990;
  const moq = producto?.personalizacion_gratis_desde || producto?.moq_personalizacion || MOQ_PERSONALIZACION_GRATIS;
  const activos = useMemo(() => tiposActivos(pers), [pers]);
  const feeUnit = useMemo(() => feeUnitarioCombinado(pers), [pers]);
  const gratis = cantidad >= moq;
  const feeTotal = gratis ? 0 : feeUnit * cantidad;
  
  // Descuento por cantidad: 2u → 10% · 3+u → 15%
  const descuentoPct = getQtyDiscountPct(cantidad);
  const descuentoMonto = Math.floor(precioUnit * cantidad * (descuentoPct / 100));
  
  const total = precioUnit * cantidad + feeTotal - descuentoMonto;

  // Imagen base (lienzo) del mockup.
  // • Carcasas: foto del color elegido.
  // • Resto de productos: imagen base LIMPIA (sin el logo PEYU grabado de fábrica)
  //   si existe, para montar el diseño del cliente sin superposiciones. Cae a la
  //   foto normal si aún no se generó la versión limpia.
  const colorImg = useMemo(() => {
    if (!esCarcasa && producto?.imagen_base_limpia_url) return producto.imagen_base_limpia_url;
    return color ? getProductImageForColor(producto, color) : displayImg;
  }, [producto, color, displayImg, esCarcasa]);

  // Capas (combinables) para el mockup en vivo. ORDEN FIJO de apilado
  // (arriba→abajo): 1) Tu logo  2) Diseño PEYU  3) Frase.
  const capas = useMemo(() => {
    const out = [];
    if (pers.archivo && pers.logoUrl) out.push({ id: 'archivo', tipo: 'archivo', url: pers.logoUrl });
    if (pers.peyu && pers.disenoPeyuUrl) out.push({ id: 'peyu', tipo: 'peyu', url: pers.disenoPeyuUrl });
    if (pers.frase && pers.texto.trim()) out.push({ id: 'frase', tipo: 'frase', texto: pers.texto });
    return out;
  }, [pers]);

  // Listo para agregar: sin personalización, o con personalización aprobada.
  const persOk = persCompleta(pers) && (!hayAlgunoActivado(pers) || pers.aprobada);
  const muestraMockup = capas.length > 0;

  // Stock/urgencia sutil (Baymard #6): solo si el dato existe y es bajo.
  const stock = producto?.stock_actual;
  const stockBajo = typeof stock === 'number' && stock > 0 && stock <= 8;

  const handleAdd = async () => {
    if (requiereColor && !colorId) {
      setColorError(true);
      document.querySelector('[data-color-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!persOk) {
      document.querySelector('[data-personalizador]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Captura el snapshot del canvas en vivo (foto base + grabado) como mockupUrl real.
    // Si falla (CORS, etc.) cae a colorImg como antes.
    let mockupUrl = muestraMockup ? colorImg : null;
    if (muestraMockup && mockupRef.current?.captureSnapshot) {
      const snap = await mockupRef.current.captureSnapshot();
      if (snap) mockupUrl = snap;
    }

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
      mockupUrl,
      capas_grabado: capas.map((c) => ({ tipo: c.tipo, url: c.url || null, texto: c.texto || null, ...(placements[c.id] || {}) })),
      imagen_base: colorImg,
      imagen: colorImg,
    });
    clearDraftV2(producto.id);
    setAdded(true);
    setTimeout(() => navigate('/CarritoNuevo'), 700);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#F8F3ED' }}>
        <PublicNavBar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C0785C' }} />
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen font-inter" style={{ background: '#F8F3ED' }}>
        <PublicNavBar />
        <div className="text-center py-32 px-4">
          <p className="font-bold mb-2" style={{ color: '#2C1810' }}>
            {error ? 'Error de conexión' : 'Producto no encontrado'}
          </p>
          <p className="text-sm mb-4" style={{ color: '#7A6050' }}>
            {error || 'Este producto no existe o fue eliminado.'}
          </p>
          <Link to="/CatalogoNuevo" className="font-bold text-sm" style={{ color: '#C0785C' }}>← Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  const esCompostable = producto.material?.includes('Trigo') || producto.categoria === 'Carcasas B2C';

  // SEO: metaetiquetas dinámicas por producto
  const seoUrl = `https://peyuchile.cl/ProductoNuevo?id=${id}`;
  const seoImage = color ? getProductImageForColor(producto, color) : getProductImage(producto);
  const seoSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion || `${producto.nombre} - ${producto.categoria}`,
    image: seoImage,
    brand: { '@type': 'Brand', name: 'PEYU Chile' },
    offers: {
      '@type': 'Offer',
      url: seoUrl,
      priceCurrency: 'CLP',
      price: precioUnit.toString(),
      availability: 'https://schema.org/InStock',
    },
    category: producto.categoria,
    material: producto.material,
  };

  return (
    <div className="min-h-screen font-inter pb-20 lg:pb-0" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <SEOHead
        title={`${producto.nombre} - PEYU Chile`}
        description={producto.descripcion || `Compra ${producto.nombre} personalizado. Regalos corporativos sostenibles hechos con plástico 100% reciclado.`}
        image={seoImage}
        url={seoUrl}
        type="product"
        schema={seoSchema}
      />
      <PublicNavBar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-4">
        <CheckoutStepperV2 current="producto" />
        {/* Link de vuelta solo visible en desktop (mobile usa el navbar inferior) */}
        <Link to="/CatalogoNuevo" className="hidden lg:inline-flex items-center gap-1.5 text-sm font-bold mb-4 transition-colors" style={{ color: '#7A6050' }}>
          <ArrowLeft className="w-4 h-4" /> Volver a la tienda
        </Link>

        {/* Layout: galería sticky izquierda · configurador scroll derecha */}
        <div className="grid lg:grid-cols-2 gap-3 sm:gap-5 lg:gap-8 lg:items-start">
          {/* GALERÍA sticky — fija en desktop mientras scrolleas el configurador */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGalleryV2
              images={galleryImages}
              active={galIdx}
              onSelect={setGalIdx}
              badge={esCompostable ? 'Compostable' : '100% Reciclado'}
              fallback={getProductImage(producto)}
            />
          </div>

          {/* CONFIGURADOR — scroll libre en desktop */}
          <div className="space-y-3.5 lg:pb-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#A08070' }}>
                {producto.categoria?.replace(' B2C', '')}
              </p>
              <h1 className="font-fraunces text-lg sm:text-4xl leading-[1.05] mb-1" style={{ color: '#2C1810' }}>{producto.nombre}</h1>
              <p className="font-poppins font-bold text-lg sm:text-2xl" style={{ color: '#C0785C' }}>{fmtCLP(precioUnit)}</p>
              {stockBajo && (
                <p className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#C0785C', background: 'rgba(192,120,92,.1)' }}>
                  🔥 Solo {stock}u
                </p>
              )}
              {producto.descripcion && (
                <p className="text-xs leading-relaxed mt-2" style={{ color: '#7A6050' }}>{producto.descripcion}</p>
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
              <PersonalizadorV2 pers={pers} setPers={setPers} gratis={gratis} moq={moq} soloArchivo={soloArchivo} />

              {/* Mockup EN VIVO: compone todas las capas combinadas */}
              {muestraMockup && (
                <div className="mt-4">
                  <MockupLivePreviewV2
                    ref={mockupRef}
                    productImageUrl={colorImg}
                    fallbackUrl={getProductImage(producto)}
                    capas={capas}
                    onPlacementChange={setPlacements}
                    esCarcasa={esCarcasa}
                    customArea={engraggingArea}
                  />
                </div>
              )}
            </div>

            {/* Cantidad */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-bold" style={{ color: '#2C1810' }}>Cantidad</span>
                {activos.length > 0 && (
                  <p className="text-[10px] sm:text-[11px] mt-0.5 font-semibold truncate" style={{ color: gratis ? '#8BAD8A' : '#A08070' }}>
                    {gratis ? '✓ GRATIS' : `${moq - cantidad}u más`}
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
              descuentoPct={descuentoPct}
              descuentoMonto={descuentoMonto}
            />

            {/* CTA desktop */}
            <button
              onClick={handleAdd}
              disabled={added || !persOk}
              className="hidden lg:flex w-full h-14 rounded-2xl text-white font-bold text-base items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
              style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 8px 28px rgba(192,120,92,.28)' }}
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
                <div key={i} className="flex flex-col items-center gap-1.5 bg-white rounded-xl p-3 text-center" style={{ border: '1.5px solid #D4C4B0' }}>
                  <b.icon className="w-4 h-4" style={{ color: '#8BAD8A' }} />
                  <span className="text-[10px] font-bold leading-tight" style={{ color: '#7A6050' }}>{b.t}</span>
                </div>
              ))}
            </div>

            {/* Incluye + impacto ambiental (Baymard #7) */}
            <ProductIncludesV2 producto={producto} cantidad={cantidad} />
          </div>
        </div>
      </div>

      {/* Barra inferior mobile: back + agregar al carrito */}
      <MobileNavBarV2
        backTo="/CatalogoNuevo"
        backLabel="Tienda"
        ctaLabel={added ? '✓ ¡Agregado!' : hayAlgunoActivado(pers) && !pers.aprobada ? 'Aprueba tu diseño' : 'Agregar al carrito'}
        onCta={handleAdd}
        ctaDisabled={added || !persOk}
        total={added ? null : total}
      />
    </div>
  );
}