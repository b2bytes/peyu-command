import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SEOHead from '@/components/SEOHead';
import {
  ArrowLeft, Recycle, Truck, Check, Loader2, ShoppingBag, Sparkles, Lock, ShoppingCart,
} from 'lucide-react';
import CheckoutStepperV2 from '@/components/shopv2/CheckoutStepperV2';
import ColorSwatchesV2 from '@/components/shopv2/ColorSwatchesV2';
import PersonalizadorV2 from '@/components/shopv2/PersonalizadorV2';
import MockupLivePreviewV2 from '@/components/shopv2/MockupLivePreviewV2';
import MockupApproveBarV2 from '@/components/shopv2/MockupApproveBarV2';
import PriceBreakdownV2 from '@/components/shopv2/PriceBreakdownV2';
import QtyStepperV2 from '@/components/shopv2/QtyStepperV2';
import ProductGalleryV2 from '@/components/shopv2/ProductGalleryV2';
import ProductIncludesV2 from '@/components/shopv2/ProductIncludesV2';
import DescripcionCollapsibleV2 from '@/components/shopv2/DescripcionCollapsibleV2';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
import PaymentMethodsBadgesV2 from '@/components/shopv2/PaymentMethodsBadgesV2';
import QtyDiscountNoticeV2 from '@/components/shopv2/QtyDiscountNoticeV2';
import IntencionCompraV2 from '@/components/shopv2/IntencionCompraV2';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';
import { getColoresProducto } from '@/lib/color-parser';
import { findColorImageMatch } from '@/lib/color-image-matcher';
import { getColorTintFilter } from '@/lib/color-tint';
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
// /ProductoNuevo?id= — Ficha de producto Shop v2 en formato COCKPIT de 1
// pantalla en escritorio (mismo patrón /personalizar): header wizard sticky
// con pasos + CTA, panel izquierdo con info y resumen vivo, preview/mockup
// GIGANTE al centro y el configurador a la derecha con scroll propio y CTA
// siempre visible. Incluye envío BlueExpress en vivo y medios de pago.
// Lógica intacta: borrador persistente, capas combinables, carrito_v2.
// ════════════════════════════════════════════════════════════════════════
const C = {
  bg: '#F8F3ED', surface: '#FFFFFF', border: '#D4C4B0',
  fg: '#2C1810', fgSoft: '#7A6050', fgMuted: '#A08070',
  action: '#C0785C', actionGrad: 'linear-gradient(135deg,#C0785C,#A86440)',
  actionShadow: '0 6px 20px rgba(192,120,92,.28)', green: '#8BAD8A',
};

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
  const mockupRefDesktop = useRef(null); // preview central gigante (desktop)
  const mockupRefMobile = useRef(null);  // preview bajo el personalizador (mobile)

  const [error, setError] = useState(null);

  // Fondo crema fijo (Warm Dusk): forzamos modo día mientras está abierta,
  // igual que /personalizar, para que el modo noche no borre los textos.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-liquid-mode');
    html.setAttribute('data-liquid-mode', 'day');
    return () => { if (prev) html.setAttribute('data-liquid-mode', prev); };
  }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setProducto(null);
    setError(null);

    // Carga resiliente: hasta 3 intentos. En cada intento prueba filter({id})
    // y, si viene vacío (a veces pasa de forma transitoria), verifica contra
    // list(). Solo declara "no encontrado" si las consultas respondieron BIEN
    // y el producto realmente no está. El loading se apaga ÚNICAMENTE al final.
    const cargar = async () => {
      let consultaOkSinProducto = false;
      for (let intento = 0; intento < 3; intento++) {
        try {
          const rows = await base44.entities.Producto.filter({ id }, '-updated_date', 1);
          let encontrado = rows?.[0] || null;
          if (!encontrado) {
            const all = await base44.entities.Producto.list('-updated_date', 300);
            encontrado = all?.find((r) => r.id === id) || null;
            if (!encontrado && all?.length) consultaOkSinProducto = true;
          }
          if (encontrado) {
            if (!cancelled) { setProducto(encontrado); setError(null); setLoading(false); }
            return;
          }
        } catch { /* reintenta */ }
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 600 * (intento + 1)));
      }
      if (cancelled) return;
      if (consultaOkSinProducto) {
        setProducto(null);
        setError(null); // "Producto no encontrado" real
      } else {
        setError('Error de conexión. Por favor recarga la página.');
      }
      setLoading(false);
    };
    cargar();
    return () => { cancelled = true; };
  }, [id]);

  // ¿Es carcasa? Solo en carcasas se permiten las 3 personalizaciones
  // (Frase + Diseño PEYU + Tu diseño). En el resto: SOLO "Tu diseño".
  const esCarcasa = producto ? isProductoCarcasa(producto) : false;
  const engraggingArea = producto ? getProductEngraggingArea(producto) : null;
  // Todos los productos grabables ofrecen las 3 opciones: Frase · Diseño PEYU · Tu diseño.
  const soloArchivo = false;

  // Colores reales del producto (carcasas = 5 colores, resto = 4, etc.)
  const colores = useMemo(() => (producto ? getColoresProducto(producto) : []), [producto]);
  const requiereColor = colores.length > 1;
  const color = useMemo(() => colores.find((c) => c.id === colorId), [colores, colorId]);

  // Inicializa: restaura el borrador auto-guardado de este producto si existe
  // (color, personalización, posiciones, cantidad). La configuración sobrevive
  // a recargas o salir/volver, y llega intacta al carrito.
  useEffect(() => {
    if (!producto) return;
    const draft = loadDraftV2(producto.id);
    if (draft) {
      const colorValido = draft.colorId && colores.some((c) => c.id === draft.colorId);
      setColorId(colorValido ? draft.colorId : (colores.length === 1 ? colores[0].id : null));
      setPers(draft.pers || PERS_VACIO);
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

  // Auto-placement: cuando se cambia la personalización, auto-asigna posiciones.
  useEffect(() => {
    if (!producto || !pers) return;
    applyAutoPlacement(producto, pers, setPlacements);
  }, [producto, pers.logoUrl, pers.disenoPeyuUrl, pers.texto]);

  // Galería: imagen por color elegido (1ª) + ángulos extra de galeria_urls.
  const galleryImages = useMemo(() => {
    if (!producto) return [];
    const main = (esCarcasa && color) ? getProductImageForColor(producto, color) : getProductImage(producto);
    // Carcasas: la imagen por color es la ÚNICA fuente de verdad.
    if (esCarcasa) return [main];
    let extra = Array.isArray(producto.galeria_urls)
      ? producto.galeria_urls.filter((u) => typeof u === 'string' && u.startsWith('http') && u !== main)
      : [];

    // Filtro especial: cacho unitario no muestra imagen amarilla
    if (producto.sku === 'ENT-CACH-1') {
      extra = extra.filter((u) => !u.toLowerCase().includes('amarillo') && !u.includes('1-2.jpg'));
    }

    return [main, ...extra].slice(0, 6);
  }, [producto, color, esCarcasa]);

  // Al cambiar de color, saltamos a la imagen correcta en la galería.
  // Prioridad: imagenes_por_color (foto real) > match por nombre > índice 0.
  useEffect(() => {
    if (!color || esCarcasa) { setGalIdx(0); return; }
    // Si imagenes_por_color tiene foto real para este color, va al índice 0
    // (la galería arranca con la imagen principal, que displayImg ya resolvió).
    const colorPhoto = getProductImageForColor(producto, color);
    if (colorPhoto && colorPhoto !== getProductImage(producto)) {
      setGalIdx(0);
      return;
    }
    const match = findColorImageMatch(galleryImages, color);
    setGalIdx(match ? match.index : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorId, esCarcasa]);

  // La imagen principal SIEMPRE es la del color elegido.
  // Prioridad: 1) imagenes_por_color (foto real del color) → 2) match por nombre en galería → 3) base + tinte.
  const displayImg = useMemo(() => {
    if (!producto) return null;
    if (esCarcasa && color) return getProductImageForColor(producto, color);
    if (color) {
      const colorPhoto = getProductImageForColor(producto, color);
      const base = getProductImage(producto);
      if (colorPhoto !== base) return colorPhoto;
      const match = findColorImageMatch(galleryImages, color);
      if (match) return galleryImages[match.index];
    }
    return getProductImage(producto);
  }, [producto, color, esCarcasa, galleryImages]);

  // Tinte instantáneo al tono OFICIAL (norma catálogo B2B PDF): si el color
  // elegido NO tiene foto real (ni mapa ni match en galería), la imagen y el
  // mockup se re-pintan al tono oficial vía filtro CSS — cambio inmediato.
  const colorFilter = useMemo(() => {
    if (!producto || !color || esCarcasa) return '';
    const fotoReal = !!findColorImageMatch(galleryImages, color);
    return getColorTintFilter(producto, color, fotoReal);
  }, [producto, color, esCarcasa, galleryImages]);

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

  // Imagen base (lienzo) del mockup: versión LIMPIA sin marca PEYU si existe,
  // o la generada al vuelo (cleanBaseUrl) cuando el cliente carga su diseño.
  const [cleanBaseUrl, setCleanBaseUrl] = useState(null);
  const colorImg = useMemo(() => {
    if (!producto) return null;
    const base = getProductImage(producto);

    // ① CARCASA con color → foto real del color (imagenes_por_color).
    if (esCarcasa && color) {
      const colorPhoto = getProductImageForColor(producto, color);
      if (colorPhoto && colorPhoto !== base) return colorPhoto;
    }
    // ② NO-CARCASA con color: imagenes_por_color primero, galería después.
    if (!esCarcasa && color) {
      const colorPhoto = getProductImageForColor(producto, color);
      if (colorPhoto !== base) return colorPhoto;
      const match = findColorImageMatch(galleryImages, color);
      if (match) return galleryImages[match.index];
    }
    // ③ Fallback universal: la imagen principal del producto (SIEMPRE real, nunca IA).
    return base;
  }, [producto, color, esCarcasa, galleryImages]);

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

  // ═══ Pre-carga de imágenes de color ════════════════════════════════════
  // Apenas el producto carga, forzamos al navegador a descargar TODAS las fotos
  // de color (imagenes_por_color) en segundo plano. Así cuando el cliente cambia
  // de color en los swatches, la imagen YA está en caché y el cambio es instantáneo.
  const colorPreloadUrls = useMemo(() => {
    if (!producto || !producto.imagenes_por_color) return [];
    const mapa = producto.imagenes_por_color;
    return Object.values(mapa).filter((u) => typeof u === 'string' && u.startsWith('http'));
  }, [producto]);

  // La foto real del producto es la base del mockup. La "base limpia" generada
  // por IA solo se usa como fallback si la foto real no está disponible.
  // Este efecto ya no cambia la base del mockup — solo genera la limpia en
  // segundo plano por si acaso. El mockup siempre usa la foto real (colorImg).
  const cleanRequestedRef = useRef(false);
  useEffect(() => {
    if (!producto || esCarcasa || !muestraMockup) return;
    if (producto.imagen_base_limpia_url || cleanBaseUrl || cleanRequestedRef.current) return;
    cleanRequestedRef.current = true;
    base44.functions.invoke('generateCleanBaseImage', { productoId: producto.id })
      .then((res) => { if (res?.data?.clean_url) setCleanBaseUrl(res.data.clean_url); })
      .catch(() => {});
  }, [producto, esCarcasa, muestraMockup, cleanBaseUrl]);

  // Mobile: cuando el cliente carga su logo o elige un diseño PEYU, la página
  // sube SOLA al mockup (que vive arriba, en el lugar de la foto principal)
  // para que el resultado se vea de inmediato. No aplica al tipear la frase.
  const firstArtRef = useRef(true);
  useEffect(() => {
    if (firstArtRef.current) { firstArtRef.current = false; return; }
    if (!(pers.logoUrl || pers.disenoPeyuUrl)) return;
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
    setTimeout(() => {
      document.querySelector('[data-product-gallery]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, [pers.logoUrl, pers.disenoPeyuUrl]);

  // ── Stock disponible REAL del color elegido ──────────────────────────────
  // Si el producto tiene stock_por_color (carcasas), el tope es el stock de ESE
  // color. Si no hay variantes, es stock_actual global. Si no hay dato de stock,
  // no limitamos (null = sin tope, comportamiento legacy seguro).
  const stockDisponible = useMemo(() => {
    if (!producto) return null;
    const mapa = producto.stock_por_color;
    const tieneMapa = mapa && typeof mapa === 'object' && Object.keys(mapa).length > 0;
    if (tieneMapa && color) {
      const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const cand = [color.label, color.id, ...(color.aliases || [])].map(norm);
      const hit = Object.entries(mapa).find(([k]) => cand.includes(norm(k)));
      return hit ? Number(hit[1]) : 0; // color sin entrada en el mapa = agotado
    }
    if (typeof producto.stock_actual === 'number') return producto.stock_actual;
    return null;
  }, [producto, color]);

  // Tope de cantidad para el stepper (1 si no hay dato, para no romper el flujo).
  const maxCantidad = stockDisponible === null ? 9999 : Math.max(0, stockDisponible);
  const agotado = stockDisponible !== null && stockDisponible <= 0;

  // Si cambia el color/stock y la cantidad supera lo disponible, la ajustamos.
  useEffect(() => {
    if (stockDisponible !== null && cantidad > stockDisponible) {
      setCantidad(Math.max(1, stockDisponible));
    }
  }, [stockDisponible]); // eslint-disable-line

  // Stock/urgencia sutil: solo si el dato existe y es bajo.
  const stock = stockDisponible;
  const stockBajo = typeof stock === 'number' && stock > 0 && stock <= 8;

  const handleAdd = async () => {
    if (agotado) return; // sin stock del color elegido → no se puede agregar
    if (requiereColor && !colorId) {
      setColorError(true);
      document.querySelector('[data-color-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!persOk) {
      document.querySelector('[data-personalizador]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Captura el snapshot del canvas en vivo (foto base + grabado) como mockupUrl.
    let mockupUrl = muestraMockup ? colorImg : null;
    if (muestraMockup) {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
      const primario = isDesktop ? mockupRefDesktop : mockupRefMobile;
      const secundario = isDesktop ? mockupRefMobile : mockupRefDesktop;
      const snap = (await primario.current?.captureSnapshot?.())
        || (await secundario.current?.captureSnapshot?.());
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
      stockColor: stockDisponible, // tope real del color elegido (null = sin límite)
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
      <div className="min-h-screen" style={{ background: C.bg }}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.action }} />
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen font-inter" style={{ background: C.bg }}>
        <div className="text-center py-32 px-4">
          <p className="font-bold mb-2" style={{ color: C.fg }}>
            {error ? 'Error de conexión' : 'Producto no encontrado'}
          </p>
          <p className="text-sm mb-4" style={{ color: C.fgSoft }}>
            {error || 'Este producto no existe o fue eliminado.'}
          </p>
          <Link to="/CatalogoNuevo" className="font-bold text-sm" style={{ color: C.action }}>← Volver a la tienda</Link>
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

  const ctaLabel = added
    ? '✓ ¡Agregado!'
    : hayAlgunoActivado(pers) && !pers.aprobada
      ? 'Aprueba tu personalización'
      : `Agregar al carrito · ${fmtCLP(total)}`;

  const persResumen = resumenPersonalizacion(pers);

  return (
    <div className="min-h-screen lg:h-screen lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden font-inter pb-28 lg:pb-0" style={{ background: C.bg, color: C.fg, maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Pre-carga invisible de todas las fotos de color para cambio instantáneo */}
      {colorPreloadUrls.length > 0 && (
        <div aria-hidden="true" className="hidden">
          {colorPreloadUrls.map((url) => (
            <img key={url} src={url} alt="" referrerPolicy="no-referrer" />
          ))}
        </div>
      )}
      <SEOHead
        title={`${producto.nombre} - PEYU Chile`}
        description={producto.descripcion || `Compra ${producto.nombre} personalizado. Regalos corporativos sostenibles hechos con plástico 100% reciclado.`}
        image={seoImage}
        url={seoUrl}
        type="product"
        schema={seoSchema}
      />

      {/* ── TOP NAV sticky (mismo patrón /personalizar) ──────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(248,243,237,.97)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 10px rgba(44,24,16,.07)' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex items-center gap-3">
          <Link to="/CatalogoNuevo"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white flex-shrink-0"
            style={{ border: `1.5px solid ${C.border}` }}>
            <ArrowLeft className="w-4 h-4" style={{ color: C.fgSoft }} />
          </Link>

          {/* Logo (solo desktop) */}
          <Link to="/" className="hidden lg:block flex-shrink-0 group mr-4">
            <img src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU" className="h-8 w-auto group-hover:scale-105 transition-transform" draggable={false} />
          </Link>

          {/* Brand mobile: nombre + precio */}
          <div className="lg:hidden flex-1 min-w-0">
            <p className="font-poppins font-bold text-sm leading-tight truncate" style={{ color: C.fg }}>{producto.nombre}</p>
            <p className="text-[11px] leading-tight font-bold" style={{ color: C.action }}>{fmtCLP(precioUnit)} · envío a todo Chile</p>
          </div>

          {/* Pasos del funnel centrados (desktop) — coordinado con tienda/carrito/pago */}
          <div className="hidden lg:flex flex-1 justify-center">
            <CheckoutStepperV2 current="producto" className="" />
          </div>

          {/* CTA en header (desktop) */}
          <button
            onClick={handleAdd}
            disabled={added || !persOk || agotado}
            className="hidden lg:flex items-center gap-2 px-5 h-10 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ background: C.actionGrad, boxShadow: C.actionShadow, flexShrink: 0 }}
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            <span>{added ? '¡Agregado!' : agotado ? 'Agotado' : `Agregar · ${fmtCLP(total)}`}</span>
          </button>
        </div>
      </header>

      {/* ── BODY: cockpit 3 cols desktop (1 pantalla) · 1 col mobile ─────── */}
      <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 lg:py-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        {/* Stepper mobile */}
        <div className="lg:hidden">
          <CheckoutStepperV2 current="producto" />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 lg:items-stretch lg:h-full">

          {/* ── Panel izquierdo desktop: info + resumen vivo ─────────────── */}
          <aside className="hidden lg:flex flex-col gap-3 w-60 xl:w-72 flex-shrink-0 lg:h-full lg:min-h-0 lg:overflow-y-auto peyu-scrollbar pr-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.fgMuted }}>
                {producto.categoria?.replace(' B2C', '')}
              </p>
              <h1 className="font-fraunces text-2xl xl:text-3xl leading-[1.05] mb-1.5" style={{ color: C.fg }}>{producto.nombre}</h1>
              <p className="font-poppins font-bold text-xl" style={{ color: C.action }}>{fmtCLP(precioUnit)}</p>
              {stockBajo && (
                <p className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: C.action, background: 'rgba(192,120,92,.1)' }}>
                  🔥 Solo {stock}u disponibles
                </p>
              )}
            </div>

            <p className="text-[10px] font-bold text-center flex items-center justify-center gap-1" style={{ color: '#5B7D5A' }}>
              <Check className="w-3 h-3" /> Tu configuración se guarda automáticamente
            </p>

            {/* Resumen vivo de la configuración */}
            <div className="rounded-2xl p-3 space-y-1.5" style={{ border: `1.5px solid ${C.border}`, background: C.surface }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.fgMuted }}>Tu configuración</p>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: C.fgSoft }}>Color</span>
                <span className="font-bold" style={{ color: color ? C.fg : C.fgMuted }}>{color?.label || (requiereColor ? 'Por elegir' : 'Natural')}</span>
              </div>
              <div className="flex justify-between text-[11px] gap-2">
                <span className="flex-shrink-0" style={{ color: C.fgSoft }}>Grabado</span>
                <span className="font-bold text-right truncate" style={{ color: persResumen ? C.action : C.fgMuted }}>
                  {persResumen || 'Sin grabado'}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: C.fgSoft }}>Cantidad</span>
                <span className="font-bold" style={{ color: C.fg }}>{cantidad} u{descuentoPct > 0 ? ` · −${descuentoPct}%` : ''}</span>
              </div>
              <div className="flex justify-between pt-1.5" style={{ borderTop: `1px solid ${C.border}` }}>
                <span className="text-[11px] font-bold" style={{ color: C.fg }}>Total</span>
                <span className="text-sm font-poppins font-bold" style={{ color: C.action }}>{fmtCLP(total)}</span>
              </div>
              <p className="text-[9px] text-center" style={{ color: C.fgMuted }}>IVA incluido ✓</p>
            </div>

            {/* Medios de pago */}
            <PaymentMethodsBadgesV2 vertical />

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { icon: Recycle, label: '100%', sub: 'reciclado' },
                { icon: Truck, label: 'Bluex', sub: 'todo Chile' },
                { icon: Lock, label: 'Pago', sub: 'seguro' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl text-center"
                  style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <Icon className="w-4 h-4" style={{ color: C.green }} />
                  <span className="text-[10px] font-bold leading-tight" style={{ color: C.fg }}>{label}</span>
                  <span className="text-[9px]" style={{ color: C.fgMuted }}>{sub}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Centro desktop: mockup/galería GIGANTE en vivo ───────────── */}
          <main className="hidden lg:flex flex-col flex-1 min-w-0 lg:h-full lg:min-h-0 gap-3">
            <div
              className="relative flex-1 min-h-0 rounded-3xl overflow-y-auto peyu-scrollbar flex items-start justify-center p-4"
              style={{ background: C.surface, border: `1.5px solid ${C.border}` }}
            >
              <div className="w-full max-w-[640px]">
                {muestraMockup ? (
                  <>
                    <MockupLivePreviewV2
                      ref={mockupRefDesktop}
                      productImageUrl={colorImg}
                      fallbackUrl={getProductImage(producto)}
                      capas={capas}
                      onPlacementChange={setPlacements}
                      baseFilter={colorFilter}
                      esCarcasa={esCarcasa}
                      customArea={engraggingArea}
                    />
                    {/* Aprobación SIEMPRE junto al mockup — no se pierde el usuario */}
                    <MockupApproveBarV2 pers={pers} setPers={setPers} />
                  </>
                ) : (
                  <ProductGalleryV2
                    images={galleryImages}
                    active={galIdx}
                    onSelect={setGalIdx}
                    badge={esCompostable ? 'Compostable' : '100% Reciclado'}
                    imgFilter={colorFilter}
                    fallback={getProductImage(producto)}
                  />
                )}
              </div>
            </div>

            {/* Barra info inferior */}
            <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,.94)', border: `1px solid ${C.border}` }}>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: C.fg }}>{producto.nombre}</p>
                <p className="text-[11px] truncate" style={{ color: C.fgMuted }}>
                  {color?.label || 'Color natural'}{persResumen ? ` · ${persResumen}` : ''} · ×{cantidad}
                </p>
              </div>
              <span className="font-poppins font-bold text-lg flex-shrink-0" style={{ color: C.action }}>{fmtCLP(total)}</span>
            </div>
          </main>

          {/* ── Configurador: derecha desktop (scroll propio) · flujo mobile ── */}
          <div className="flex-1 min-w-0 lg:flex-none lg:w-[400px] xl:w-[440px] lg:h-full lg:min-h-0 lg:flex lg:flex-col">
            {/* ── Imagen principal mobile — MOCKUP EN VIVO grande y centrado ──
                Cuando el cliente personaliza, el mockup ocupa el ancho completo
                con altura generosa para que se aprecie cada detalle del grabado.
                La foto del color se ve igual de grande y nítida. */}
            <div className="lg:hidden -mx-3 sm:-mx-6 mb-3 scroll-mt-16" data-product-gallery>
              {muestraMockup ? (
                <div className="bg-white rounded-none sm:rounded-2xl overflow-hidden border-b border-[#D4C4B0] sm:border sm:mx-3 shadow-sm">
                  <div className="px-3 py-2 flex items-center justify-between bg-white/80 backdrop-blur border-b border-[#D4C4B0]/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0785C] flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Tu diseño en vivo
                    </span>
                    <span className="text-[9px] font-semibold text-[#A08070]">Mueve y escala el grabado</span>
                  </div>
                  <MockupLivePreviewV2
                    ref={mockupRefMobile}
                    productImageUrl={colorImg}
                    fallbackUrl={getProductImage(producto)}
                    capas={capas}
                    onPlacementChange={setPlacements}
                    baseFilter={colorFilter}
                    esCarcasa={esCarcasa}
                    customArea={engraggingArea}
                  />
                  <MockupApproveBarV2 pers={pers} setPers={setPers} />
                </div>
              ) : (
                <div className="sm:mx-3">
                  <ProductGalleryV2
                    images={galleryImages}
                    active={galIdx}
                    onSelect={setGalIdx}
                    badge={esCompostable ? 'Compostable' : '100% Reciclado'}
                    imgFilter={colorFilter}
                    fallback={getProductImage(producto)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3.5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto peyu-scrollbar lg:bg-white lg:rounded-3xl lg:p-5 lg:shadow-sm lg:border lg:border-[#D4C4B0]">
              {/* Título (mobile — en desktop vive en el panel izquierdo) */}
              <div className="lg:hidden">
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: C.fgMuted }}>
                  {producto.categoria?.replace(' B2C', '')}
                </p>
                <h1 className="font-fraunces text-lg sm:text-4xl leading-[1.05] mb-1" style={{ color: C.fg }}>{producto.nombre}</h1>
                <p className="font-poppins font-bold text-lg sm:text-2xl" style={{ color: C.action }}>{fmtCLP(precioUnit)}</p>
                {stockBajo && (
                  <p className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: C.action, background: 'rgba(192,120,92,.1)' }}>
                    🔥 Solo {stock}u
                  </p>
                )}
              </div>

              {/* Color — swatches visibles. Al elegir, la foto de arriba cambia
                  sola al color y en móvil se sube a la vista para que se VEA. */}
              {colores.length > 0 && (
                <ColorSwatchesV2
                  colores={colores}
                  value={colorId}
                  onSelect={(v) => {
                    setColorId(v);
                    setColorError(false);
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setTimeout(() => {
                        document.querySelector('[data-product-gallery]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }
                  }}
                  error={colorError}
                  producto={producto}
                />
              )}

              {/* Intención de compra: persona (B2C) o empresa (B2B) → precios por volumen */}
              <IntencionCompraV2 producto={producto} />

              {/* Personalización en vivo — circuito completo. En mobile el mockup
                  vive ARRIBA (reemplaza la foto principal): al cargar logo/diseño
                  la página sube sola para que se vea al instante. */}
              <div data-personalizador>
                <PersonalizadorV2 pers={pers} setPers={setPers} gratis={gratis} moq={moq} soloArchivo={soloArchivo} />
                {muestraMockup && (
                  <button
                    type="button"
                    onClick={() => document.querySelector('[data-product-gallery]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="lg:hidden w-full mt-2.5 h-10 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    style={{ background: 'white', border: '1.5px solid #D4C4B0', color: C.action }}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Ver tu diseño grabado
                  </button>
                )}
              </div>

              {/* Cantidad */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-bold" style={{ color: C.fg }}>Cantidad</span>
                  {activos.length > 0 && (
                    <p className="text-[10px] sm:text-[11px] mt-0.5 font-semibold truncate" style={{ color: gratis ? C.green : C.fgMuted }}>
                      {gratis ? '✓ GRATIS' : `${moq - cantidad}u más para grabado gratis`}
                    </p>
                  )}
                </div>
                <QtyStepperV2 value={cantidad} onChange={setCantidad} min={1} max={maxCantidad} />
              </div>
              {stockDisponible !== null && !agotado && cantidad >= stockDisponible && (
                <p className="text-[11px] font-semibold -mt-1.5" style={{ color: C.action }}>
                  Stock máximo disponible{color ? ` en ${color.label}` : ''}: {stockDisponible}u
                </p>
              )}
              {agotado && (
                <p className="text-[11px] font-bold -mt-1.5" style={{ color: '#D96B4D' }}>
                  {color ? `${color.label} agotado` : 'Producto agotado'} — elige otro color o vuelve pronto.
                </p>
              )}

              {/* Precio en vivo con desglose IVA */}
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

              {/* Aviso de descuentos por cantidad + grabado gratis desde 10u */}
              <QtyDiscountNoticeV2 cantidad={cantidad} moq={moq} />

              {/* El cotizador de envío vive solo en el carrito/checkout, donde se
                  piden los datos de envío. En la ficha de producto se eliminó. */}

              {/* Trust + medios de pago mobile — UNA franja compacta (menos scroll) */}
              <div className="lg:hidden space-y-2">
                <div className="flex items-center justify-center gap-3 bg-white rounded-2xl px-3 py-2.5" style={{ border: `1.5px solid ${C.border}` }}>
                  {[
                    { icon: Recycle, t: '100% reciclado' },
                    { icon: Truck, t: 'Bluex todo Chile' },
                    { icon: Lock, t: 'Pago seguro' },
                  ].map((b, i) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] font-bold" style={{ color: C.fgSoft }}>
                      <b.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.green }} />
                      {b.t}
                    </span>
                  ))}
                </div>
                <PaymentMethodsBadgesV2 />
              </div>

              {/* Descripción colapsable + incluye/impacto */}
              <DescripcionCollapsibleV2 texto={producto.descripcion} />
              <ProductIncludesV2 producto={producto} cantidad={cantidad} />
            </div>

            {/* CTA desktop fijo bajo la columna (siempre visible, sin scroll) */}
            <div className="hidden lg:block mt-3 lg:flex-shrink-0">
             <button
               onClick={handleAdd}
               disabled={added || !persOk || agotado}
               className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0"
               style={{ background: C.actionGrad, boxShadow: C.actionShadow }}
             >
               {added ? (
                 <><Check className="w-5 h-5" /> ¡Agregado!</>
               ) : agotado ? (
                 <>Agotado</>
               ) : hayAlgunoActivado(pers) && !pers.aprobada ? (
                 <><Sparkles className="w-5 h-5" /> Aprueba tu personalización</>
               ) : (
                 <><ShoppingBag className="w-5 h-5" /> {ctaLabel}</>
               )}
             </button>
             {!persOk && hayAlgunoActivado(pers) && (
               <p className="text-center text-xs mt-2 font-semibold" style={{ color: C.fgMuted }}>
                 Revisa el mockup y aprueba tu diseño para continuar
               </p>
             )}
             {persOk && (
               <Link to="/CatalogoNuevo" className="block text-center text-xs font-semibold mt-2 hover:underline" style={{ color: C.fgMuted }}>
                 ← Seguir comprando
               </Link>
             )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior mobile: back + agregar al carrito */}
      <MobileNavBarV2
        backTo="/CatalogoNuevo"
        backLabel="Tienda"
        ctaLabel={added ? '✓ ¡Agregado!' : agotado ? 'Agotado' : hayAlgunoActivado(pers) && !pers.aprobada ? 'Aprueba tu diseño' : 'Agregar al carrito'}
        onCta={handleAdd}
        ctaDisabled={added || !persOk || agotado}
        total={added ? null : total}
      />
    </div>
  );
}