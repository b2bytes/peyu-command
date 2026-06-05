import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';
import {
  ArrowLeft, Check, Building2, ShoppingCart, Shield, Truck, Zap,
  Star, Recycle, Sparkles, ChevronRight, Heart, Share2,
  RotateCcw, BadgeCheck, Copy, X, Gift, AlertCircle
} from 'lucide-react';
import MockupGenerator from '@/components/MockupGenerator';
import PersonalizacionOptionPicker from '@/components/personalizacion/PersonalizacionOptionPicker';
import PriceBreakdownB2C from '@/components/personalizacion/PriceBreakdownB2C';
import DisenosPeyuPickerB2C from '@/components/personalizacion/DisenosPeyuPickerB2C';
import { Upload, Loader2 } from 'lucide-react';
import { saveMockupDraft } from '@/lib/mockup-draft';
import { getColoresProducto } from '@/lib/color-parser';
import { findColorImageMatch } from '@/lib/color-image-matcher';
import { resolveColorImage } from '@/lib/color-image-resolver';
import { getPackSize } from '@/lib/pack-parser';
import PackColorPicker from '@/components/producto/PackColorPicker';
import EngravingPositionPicker from '@/components/producto/EngravingPositionPicker';
import GiftCardVisual from '@/components/giftcard/GiftCardVisual';
import ImpactoAmbientalProducto from '@/components/producto/ImpactoAmbientalProducto';
import FrequentlyBoughtTogether from '@/components/bundles/FrequentlyBoughtTogether';
import { getTipoMaterial } from '@/lib/impacto-ambiental';
import SEO from '@/components/SEO';
import { buildOrganizationSchema, buildProductSchema, buildBreadcrumbSchema, combineSchemas } from '@/lib/schemas-peyu';
import { trackAddToCart } from '@/lib/analytics-peyu';
import { track } from '@/lib/activity-tracker';
import { isCyberActive, CYBER_COPY, tieneOfertaCyber } from '@/lib/cyber-campaign';
import CyberBadge from '@/components/cyber/CyberBadge';
import { PRECIO_PERSONALIZACION, PERSONALIZACION_LABEL, MOQ_PERSONALIZACION_GRATIS, getPrecioPersonalizacion } from '@/lib/personalizacion-config';


// Los colores ahora se extraen dinámicamente desde la descripción del producto
// vía `getColoresProducto` (lib/color-parser).
const getColores = getColoresProducto;

const REVIEWS_MOCK = [
  { autor: 'Martina G.', ciudad: 'Providencia', rating: 5, txt: 'Calidad increíble. El marmolado es único, exactamente como en la foto.', fecha: 'Hace 3 días', verificado: true },
  { autor: 'Rodrigo T.', ciudad: 'Las Condes', rating: 5, txt: 'El grabado láser quedó perfecto. Lo regalé en el aniversario de la empresa y todos lo amaron.', fecha: 'Hace 1 semana', verificado: true },
  { autor: 'Carolina V.', ciudad: 'Ñuñoa', rating: 4, txt: 'Muy buen producto. Llegó antes de lo esperado y en embalaje impecable.', fecha: 'Hace 2 semanas', verificado: true },
];

// Garantías base — la primera tarjeta se calcula dinámicamente según material
// del producto en `getGarantias()` más abajo. Las carcasas compostables y
// productos de fibra de trigo no tienen "10 años": tienen vida útil distinta.
const GARANTIAS_FIJAS = [
  { icon: Truck, label: 'Envío a todo Chile', sub: 'Gratis sobre $40.000', color: '#60a5fa' },
  { icon: RotateCcw, label: '30 días devolución', sub: 'Sin preguntas', color: '#fb923c' },
  { icon: BadgeCheck, label: 'Hecho en Chile', sub: 'Fábrica Santiago', color: '#34d399' },
];

// Devuelve la garantía adecuada según el tipo de producto.
// - Carcasas (Carcasas B2C): compostables en 2-3 años industrial → no aplica "10 años"
// - Fibra de trigo: producto compostable
// - Plástico reciclado: garantía 10 años contra defectos
function getGarantiaPorMaterial(producto) {
  if (!producto) return { icon: Shield, label: 'Garantía PEYU', sub: 'Calidad respaldada' };
  const esCarcasa = producto.categoria === 'Carcasas B2C';
  const esFibra = producto.material?.includes('Trigo') || producto.material?.includes('Compostable');
  const anios = producto.garantia_anios;

  if (esCarcasa) {
    return { icon: Recycle, label: 'Compostable', sub: '2-3 años industrial' };
  }
  if (esFibra) {
    return { icon: Recycle, label: 'Compostable', sub: 'Fibra de trigo' };
  }
  // Plástico reciclado convencional
  const aniosLabel = anios && anios > 0 ? `Garantía ${anios} años` : 'Garantía PEYU';
  return { icon: Shield, label: aniosLabel, sub: 'Plástico reciclado' };
}

const SKU_IMAGES_ALT = {
  'CARC-AIRP-12':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/amarillo.webp?fit=600%2C600&ssl=1',
  'CARC-IP16E':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/photoroom_20250605_115909.jpeg?fit=600%2C600&ssl=1',
  'CARC-HW-P30':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-Huawei-p30-Biodegradable-rosa.webp?fit=600%2C600&ssl=1',
  'CARC-HW-P30L':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-Huawei-p30-lite-Biodegradable-turquesa.webp?fit=600%2C600&ssl=1',
  'CARC-IP11':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-11-Biodegradable-nuevo-rosa.webp?fit=600%2C600&ssl=1',
  'CARC-IP13':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-Biodegradable-azul.webp?fit=600%2C600&ssl=1',
  'CARC-IP13M':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-mini-Biodegradable-turquesa-1.webp?fit=600%2C600&ssl=1',
  'CARC-IP13P':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/aasasas.webp?fit=600%2C600&ssl=1',
  'CARC-IP13PM':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-pro-Max-Biodegradable-azul.webp?fit=600%2C600&ssl=1',
  'CARC-IP14':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-amarillo.webp?fit=600%2C600&ssl=1',
  'CARC-IP14PL':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-Plus-azul.webp?fit=600%2C600&ssl=1',
  'CARC-IP14P':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-amarillo.webp?fit=600%2C600&ssl=1',
  'CARC-IP14PM':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-Max-biodegradable-negro.webp?fit=600%2C600&ssl=1',
  'CARC-IP15PM':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-Max-biodegradable-negro.webp?fit=600%2C600&ssl=1',
  'CARC-IP16':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/i16-turquesa.jpg?fit=600%2C600&ssl=1',
  'CARC-IP16PL':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/i16-plus-amarillo.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH4TT':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/44.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH4':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/4.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH5':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/5-2.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH5TT':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/55-2.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH6':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/6-1.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH6TT':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/66.jpg?fit=600%2C600&ssl=1',
  'ENT-JENGA':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2026/03/jenga.jpg?fit=600%2C600&ssl=1',
  'HOG-LAMP':      'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/lampara-2.webp?fit=600%2C600&ssl=1',
  'HOG-MACE-XL':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/bowlcoverst-Photoroom.jpg?fit=600%2C600&ssl=1',
  'HOG-CUADRO2':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/image00008-scaled-1.jpeg?fit=600%2C600&ssl=1',
  'HOG-CUADRO1':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/frontrettor-Photoroom.jpg?fit=600%2C600&ssl=1',
};

// Decodifica entidades HTML comunes (&#8220; &#8221; &amp; &nbsp; etc.) y limpia
// caracteres invisibles que algunos productos importados desde WooCommerce traen.
function cleanDescripcion(raw) {
  if (!raw) return '';
  return raw
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/[⭐🌾]/g, '')
    .replace(/\uFFFD/g, '')        // replacement char � (encoding roto)
    .replace(/[\u0000-\u001F\u007F]/g, ' ') // caracteres de control invisibles
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parsea descripción tipo "✓ ítem 1\n✓ ítem 2" en { intro, bullets[] }
function parseGiftCardDescription(raw) {
  const clean = cleanDescripcion(raw);
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  const intro = [];
  const bullets = [];
  const outro = [];
  let foundBullets = false;
  let bulletsDone = false;
  for (const line of lines) {
    if (/^[✓✔•·\-]/.test(line)) {
      foundBullets = true;
      bullets.push(line.replace(/^[✓✔•·\-]\s*/, ''));
    } else if (!foundBullets) {
      intro.push(line);
    } else {
      bulletsDone = true;
      outro.push(line);
    }
  }
  return { intro: intro.join(' '), bullets, outro: outro.join(' ') };
}

function getPrecioVolumen(producto, cantidad) {
  if (!producto) return null;
  if (cantidad >= 500 && producto.precio_500_mas) return { precio: producto.precio_500_mas, label: '500+ u.' };
  if (cantidad >= 200 && producto.precio_200_499) return { precio: producto.precio_200_499, label: '200–499 u.' };
  if (cantidad >= 50 && producto.precio_50_199) return { precio: producto.precio_50_199, label: '50–199 u.' };
  if (cantidad >= 10 && producto.precio_base_b2b) return { precio: producto.precio_base_b2b, label: 'Base B2B' };
  return null;
}

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ctaRef = useRef(null);
  const [producto, setProducto] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [relacionados, setRelacionados] = useState([]);
  const [cantidad, setCantidad] = useState(1);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [coloresPack, setColoresPack] = useState([]); // multi-color para packs
  const [personalizacion, setPersonalizacion] = useState('');
  // 🎨 Opción de personalización elegida en la ficha B2C:
  //   'none' (sin grabado) · 'frase' · 'peyu' (galería) · 'archivo' (logo propio)
  const [opcionPers, setOpcionPers] = useState('none');
  const [disenoPeyuUrl, setDisenoPeyuUrl] = useState(''); // diseño elegido de la galería PEYU
  const [logoUploading, setLogoUploading] = useState(false);
  const [posicionGrabado, setPosicionGrabado] = useState('centro');
  const [carrito, setCarrito] = useState(() => {
    // Lectura defensiva: si el localStorage está corrupto no debe crashear la página.
    try { return JSON.parse(localStorage.getItem('carrito') || '[]') || []; }
    catch { return []; }
  });
  const [agregado, setAgregado] = useState(false);
  const [colorError, setColorError] = useState(false); // bloqueo: color obligatorio
  const [vistaActiva, setVistaActiva] = useState(0);
  const [colorMatchFeedback, setColorMatchFeedback] = useState(null); // { label, key } para badge "Mostrando en X"
  const [imageFading, setImageFading] = useState(false); // fade-in/out al cambiar imagen por color
  const userInteractedRef = useRef(false); // si el usuario tocó thumbnails manualmente, no auto-saltamos
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [showB2BTable, setShowB2BTable] = useState(false);
  const [tabActiva, setTabActiva] = useState('descripcion');
  const [mockupOpen, setMockupOpen] = useState(false);
  const [mockupGenerado, setMockupGenerado] = useState('');
  const [logoCliente, setLogoCliente] = useState(''); // logo/arte que el cliente subió para estampar

  useEffect(() => {
    // Scroll al tope cuando cambiamos de producto (al hacer clic en relacionados).
    // El layout usa un wrapper con `overflow-auto`, así que scrollean ambos.
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.querySelectorAll('.overflow-auto, .overflow-y-auto').forEach(el => {
      if (el.scrollTop > 0) el.scrollTop = 0;
    });

    // Si la URL trae el placeholder ":id" (acceso directo sin producto), redirigimos
    if (!id || id === ':id' || id.length < 6) {
      navigate('/shop', { replace: true });
      return;
    }

    setNotFound(false);
    // Carga directa por ID (rápido) — sin descargar el catálogo entero.
    // Guard `alive` evita setStates si el usuario navega antes de que resuelva.
    let alive = true;
    base44.entities.Producto.get(id).then(prod => {
      if (!alive) return;
      if (!prod) {
        setNotFound(true);
        return;
      }
      setProducto(prod);
      // Trazabilidad 360°: registrar product view
      try { track.productView(prod); } catch (_) { /* trazabilidad no debe romper UI */ }
      const cols = getColores(prod);
      const firstId = cols[0]?.id || null;
      // 🎨 FIX 2 · NO pre-seleccionar color automáticamente. El color SOLO se
      // setea cuando el usuario lo elige (regla dura: cero color por defecto).
      // Si el producto no tiene colores (gift cards, etc.) → null y el bloqueo
      // de color no aplica. Para carcasas/productos con color → el cliente debe elegir.
      setColorSeleccionado(null);
      // Si es pack, inicializamos array con N copias del primer color (los packs
      // SÍ requieren un estado inicial completo para el PackColorPicker).
      const packN = getPackSize(prod);
      if (packN && firstId) {
        setColoresPack(Array.from({ length: packN }, () => firstId));
      } else {
        setColoresPack([]);
      }
      // Relacionados: filtramos sólo por categoría (server-side), trae 5 y excluimos el actual
      base44.entities.Producto.filter({ categoria: prod.categoria }, '-updated_date', 8).then(rel => {
        if (!alive) return;
        setRelacionados((rel || []).filter(p => p.id !== id && p.canal !== 'B2B Exclusivo').slice(0, 4));
      }).catch(() => { if (alive) setRelacionados([]); });
    }).catch(() => { if (alive) setNotFound(true); });
    return () => { alive = false; };
  }, [id, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (ctaRef.current) setShowStickyBar(ctaRef.current.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const precioFinal = producto ? (producto.precio_b2c || 9990) : 0;
  const precioVolumen = getPrecioVolumen(producto, cantidad);
  const precioActual = precioVolumen ? precioVolumen.precio : precioFinal;

  // ✨ Cargo de personalización láser (coherente con /personalizar y el carrito).
  // El TIPO lo define la OPCIÓN elegida por el cliente en el selector:
  //   - 'frase'   → texto ($3.990/u)
  //   - 'peyu'    → diseño de la galería PEYU ($4.990/u)
  //   - 'archivo' → logo propio subido ($7.990/u)
  //   - 'none'    → sin grabado ($0)
  // GRATIS desde el MOQ del producto. Se cobra unitario × cantidad bajo el MOQ.
  const tipoPersonalizacion = opcionPers === 'none' ? null : opcionPers;
  const hayPersonalizacion = !!tipoPersonalizacion;
  const moqGratisPers = producto?.personalizacion_gratis_desde || producto?.moq_personalizacion || MOQ_PERSONALIZACION_GRATIS;
  const personalizacionGratis = cantidad >= moqGratisPers;
  const cargoPersUnit = hayPersonalizacion ? getPrecioPersonalizacion(tipoPersonalizacion) : 0;
  const cargoPersTotal = personalizacionGratis ? 0 : cargoPersUnit * cantidad;
  const totalConPers = precioActual * cantidad + cargoPersTotal;

  // 🔧 FIX CRÍTICO: estas variables se usan dentro de agregarAlCarrito() y
  // antes vivían DESPUÉS del return condicional (líneas ~301). Eso causaba
  // ReferenceError (TDZ) al hacer click en "Agregar al carrito" sobre PACKS
  // como "Pack 6 Cachos" — el carrito recibía objetos rotos sin color ni
  // pack_resumen, y luego mostraba la imagen / precio del primer producto.
  // Las dejamos acá, antes de cualquier handler que las consuma.
  const colores = producto ? getColores(producto) : [];
  const packSize = producto ? getPackSize(producto) : null;
  // 🎨 FIX 2 · Color obligatorio: si el producto ofrece selector de color (no pack)
  // y el usuario aún no eligió uno, el botón "Agregar al carrito" queda bloqueado.
  // NO se mete un color por defecto silenciosamente.
  const faltaColor = !packSize && colores.length > 0 && !colorSeleccionado;

  const agregarAlCarrito = () => {
    // 🔒 Color OBLIGATORIO: si el producto tiene selector de color (no pack) y no
    // se eligió ninguno, bloqueamos y mostramos mensaje claro. Aplica a carcasas
    // y cualquier producto con colores disponibles.
    if (!packSize && colores.length > 0 && !colorSeleccionado) {
      setColorError(true);
      // Scroll al selector de color para que el cliente lo vea.
      setTimeout(() => {
        document.querySelector('[data-color-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setColorError(false);
    // Resumen legible del pack para mostrar en carrito (ej. "2× Negro · 1× Verde")
    const packSummary = (packSize && coloresPack.length === packSize)
      ? (() => {
          const counts = {};
          coloresPack.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
          return Object.entries(counts)
            .map(([id, n]) => {
              const c = colores.find(x => x.id === id);
              return `${n}× ${c?.label || id}`;
            })
            .join(' · ');
        })()
      : null;

    const item = {
      id: Math.random(), productoId: producto.id, sku: producto.sku, nombre: producto.nombre,
      precio: precioActual, cantidad,
      color: packSize ? null : (colores.find(c => c.id === colorSeleccionado)?.label || colorSeleccionado || null),
      colores_pack: packSize ? coloresPack : null,
      pack_resumen: packSummary,
      // Marca de personalización legible según la opción elegida. SIEMPRE no-vacío
      // cuando hay grabado, para que el carrito detecte la línea y sume el cargo.
      personalizacion: hayPersonalizacion
        ? (personalizacion ||
           (opcionPers === 'peyu' ? 'Diseño PEYU' :
            opcionPers === 'archivo' ? 'Logo personalizado' : 'Grabado láser'))
        : null,
      tipo_personalizacion: tipoPersonalizacion,
      moq_personalizacion: moqGratisPers,
      personalizacion_gratis_desde: moqGratisPers,
      fee_personalizacion: cargoPersTotal,
      posicion_grabado: hayPersonalizacion ? posicionGrabado : null,
      // 🎨 Arte del cliente — viaja con el item al carrito y luego al pedido,
      // para que producción y soporte vean exactamente qué estampar.
      mockupUrl: mockupGenerado || null,
      logoUrl: (opcionPers === 'archivo' ? logoCliente : null) || null,
      diseno_peyu_url: opcionPers === 'peyu' ? (disenoPeyuUrl || null) : null,
      imagen: packSize ? getProductImage(producto) : imagenColorSeleccionado,
    };
    const nuevo = [...carrito, item];
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
    setAgregado(true);
    // 📊 Funnel event: add_to_cart (GA4)
    trackAddToCart({ ...item, sku: producto.sku, categoria: producto.categoria });
    // Trazabilidad 360°: add_to_cart en ActivityLog
    track.addToCart({ ...item, sku: producto.sku, id: producto.id });
  };

  // Cambia la opción de personalización y limpia el contenido de las otras
  // opciones para que el dato que viaja al carrito sea siempre consistente.
  const handleOpcionPers = (op) => {
    setOpcionPers(op);
    if (op !== 'frase') setPersonalizacion('');
    if (op !== 'peyu') setDisenoPeyuUrl('');
    if (op !== 'archivo') setLogoCliente('');
  };

  // Subida del logo propio (opción 'archivo'). Usa el integration UploadFile.
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) setLogoCliente(res.file_url);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Mira este producto sustentable de PEYU Chile: ${producto?.nombre}`;
    if (navigator.share) {
      try { await navigator.share({ title: producto?.nombre, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg('¡Enlace copiado!');
      setTimeout(() => setShareMsg(''), 2500);
    }
  };

  const imgPrincipal = producto ? getProductImage(producto) : '';
  const imgAlterna = producto ? (SKU_IMAGES_ALT[producto.sku] || imgPrincipal) : '';
  // Galería: imagen principal + alterna (si difiere) + imágenes de la galería
  // del producto (de WooCommerce) sin duplicados.
  // ⚠️ Filtramos URLs de IA (generated_image.png): son imágenes inventadas que
  // NO representan fielmente el color/producto. No se borran de la base, solo se
  // ignoran en el frontend hasta que existan fotos reales por color.
  const galeria = producto
    ? Array.from(new Set([
        imgPrincipal,
        imgAlterna !== imgPrincipal ? imgAlterna : null,
        ...(Array.isArray(producto.galeria_urls) ? producto.galeria_urls : []),
      ].filter(Boolean)))
        .filter(u => !/generated_image\.png/i.test(u))
    : [];

  // 🎨 Imagen que corresponde al color seleccionado. Fuente de verdad:
  //   1) mapa estructurado imagenes_por_color (color → URL) que Diego carga
  //   2) match scored sobre la galería (filename con el color)
  //   3) imagen principal del producto (fallback)
  // Se usa para el item del carrito y como base del mockup láser, así el
  // cliente ve SU color elegido (no la imagen genérica del primer producto).
  const colorObjSel = producto ? getColores(producto).find(c => c.id === colorSeleccionado) : null;
  // Una URL es "IA placeholder" si apunta a un generated_image.png. Mientras el
  // cliente no suba fotos REALES por color, ignoramos estas imágenes inventadas
  // y mostramos siempre la foto de catálogo (imagen_url). Honesto y profesional.
  const esImagenIA = (url) => typeof url === 'string' && /generated_image\.png/i.test(url);
  const imagenColorSeleccionado = (() => {
    if (!producto) return '';
    if (colorObjSel) {
      // 🎨 FIX 6 · FUENTE DE VERDAD: producto.imagenes_por_color[color] vía
      // getProductImageForColor (matching robusto label/id/aliases). Si existe
      // la foto real del color elegido, esa MANDA — aunque no esté en la galería.
      const mapa = producto.imagenes_por_color;
      if (mapa && typeof mapa === 'object') {
        const porMapa = getProductImageForColor(producto, colorObjSel);
        // getProductImageForColor cae a getProductImage si no encuentra el color;
        // solo la usamos si efectivamente difiere de la base (= hubo match real)
        // y no es una imagen IA inventada.
        if (porMapa && !esImagenIA(porMapa) && porMapa !== getProductImage(producto)) return porMapa;
      }
      // Fallback secundario: resolver legacy + match scored sobre la galería.
      const porResolver = resolveColorImage(producto, colorObjSel.label, null) || resolveColorImage(producto, colorObjSel.id, null);
      if (porResolver && !esImagenIA(porResolver)) return porResolver;
      const match = findColorImageMatch(galeria, colorObjSel);
      if (match && galeria[match.index] && !esImagenIA(galeria[match.index])) return galeria[match.index];
    }
    // 🎨 FIX 6 · Fallback final: imagen base limpia (sin logo PEYU) si existe,
    // NUNCA la imagen de otro color.
    if (producto.imagen_base_limpia_url) return producto.imagen_base_limpia_url;
    return imgPrincipal;
  })();

  // 🖼️ Imagen principal mostrada en la galería grande.
  // Prioridad: si el usuario tocó manualmente un thumbnail → respeta su elección
  // (galeria[vistaActiva]). Si no → muestra la imagen del COLOR seleccionado
  // (imagenColorSeleccionado), que lee imagenes_por_color[color]. Así el clic en
  // un swatch cambia la imagen aunque esa URL no esté dentro de la galería.
  const imagenPrincipalMostrada = userInteractedRef.current
    ? (galeria[vistaActiva] || imgPrincipal)
    : (imagenColorSeleccionado || galeria[vistaActiva] || imgPrincipal);

  // 🎨 UX 2026 — Sync inteligente color ↔ imagen
  // Cuando el cliente cambia el color, buscamos en la galería la imagen que
  // mejor representa ese color usando matching scored (no solo substring) con
  // aliases en español. Cambio con micro-fade + badge contextual.
  // Respeta la navegación manual: si el usuario tocó thumbnails, no forzamos.
  useEffect(() => {
    if (!colorSeleccionado || !producto || galeria.length === 0) return;
    const coloresLista = getColores(producto);
    const color = coloresLista.find(c => c.id === colorSeleccionado);
    if (!color) return;

    // Fuente de verdad 1: mapa estructurado imagenes_por_color (Diego / backend).
    // Tiene la imagen REAL del producto en ese color.
    const mapa = producto.imagenes_por_color || {};
    const urlMapeada = mapa[color.label] || mapa[color.id];

    let targetIndex = -1;
    // Caso A: la URL real del color está dentro de la galería → saltamos a su índice.
    // (Solo aplica a fotos reales; las generated_image.png IA no viven en la galería.)
    if (urlMapeada) {
      targetIndex = galeria.findIndex(u => u === urlMapeada);
    }

    // Fuente de verdad 2: match scored por filename de la galería.
    // Esto cubre el caso del usuario: si el color elegido aparece en la galería
    // del producto (filename con el color), saltamos a esa imagen automáticamente.
    if (targetIndex < 0) {
      const match = findColorImageMatch(galeria, color);
      if (match) targetIndex = match.index;
    }

    // Honestidad visual: si NO hay foto real para este color (galería de ángulos
    // del mismo modelo sin color en el filename), NO mostramos el badge ni
    // forzamos un cambio falso. Dejamos la imagen tal cual.
    if (targetIndex < 0) {
      setColorMatchFeedback(null);
      return;
    }

    // Encontramos la imagen real del color en la galería → la mostramos.
    // Soltamos la navegación manual para que la galería grande sincronice.
    userInteractedRef.current = false;

    if (targetIndex !== vistaActiva) {
      setImageFading(true);
      const t = setTimeout(() => {
        setVistaActiva(targetIndex);
        setImageFading(false);
      }, 180);
      setColorMatchFeedback({ label: color.label, key: Date.now() });
      const tBadge = setTimeout(() => setColorMatchFeedback(null), 2500);
      return () => { clearTimeout(t); clearTimeout(tBadge); };
    } else {
      setColorMatchFeedback({ label: color.label, key: Date.now() });
      const tBadge = setTimeout(() => setColorMatchFeedback(null), 1800);
      return () => clearTimeout(tBadge);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorSeleccionado, producto?.id]);

  if (notFound) return (
    <div className="flex-1 flex items-center justify-center py-20 ld-canvas min-h-screen px-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-5xl">🔍</div>
        <h2 className="ld-display text-2xl text-ld-fg">Producto no encontrado</h2>
        <p className="text-ld-fg-muted text-sm">Es posible que ya no esté disponible o que el enlace esté incorrecto.</p>
        <Link to="/shop">
          <Button className="ld-btn-primary gap-2 rounded-full mt-2">
            <ArrowLeft className="w-4 h-4" /> Ver toda la tienda
          </Button>
        </Link>
      </div>
    </div>
  );

  if (!producto) return (
    <div className="flex-1 flex items-center justify-center py-20 ld-canvas min-h-screen">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--ld-border)', borderTopColor: 'var(--ld-action)' }} />
        <p className="text-ld-fg-muted text-sm font-medium">Cargando producto...</p>
      </div>
    </div>
  );

  // ── Detección de Gift Card ────────────────────────────────────────
  // Si el producto es una giftcard (por categoría, sku o nombre), mostramos
  // el visual oficial PEYU en lugar de imagen genérica + UI específica.
  const isGiftCard = (
    producto.categoria === 'Gift Card' ||
    /gift\s*card/i.test(producto.nombre || '') ||
    /^GC-/i.test(producto.sku || '')
  );
  // Para giftcards, mapeamos el precio al monto más cercano de la línea oficial
  const giftCardMonto = isGiftCard
    ? [10000, 20000, 50000, 100000].reduce((prev, curr) =>
        Math.abs(curr - precioFinal) < Math.abs(prev - precioFinal) ? curr : prev, 20000)
    : null;

  // SEO: schema.org Product + Breadcrumb + Organization en un solo @graph
  const canonicalUrl = `https://peyuchile.cl/producto/${producto.id}`;
  const productImageForSeo = imgPrincipal;
  // Galería deduplicada para schema (Google premia múltiples imágenes)
  const seoImages = Array.from(new Set([imgPrincipal, imgAlterna].filter(Boolean)));
  const productJsonLd = combineSchemas(
    buildOrganizationSchema(),
    buildBreadcrumbSchema([
      { name: 'Inicio', url: 'https://peyuchile.cl/' },
      { name: 'Tienda', url: 'https://peyuchile.cl/shop' },
      { name: producto.categoria, url: `https://peyuchile.cl/shop?cat=${encodeURIComponent(producto.categoria || '')}` },
      { name: producto.nombre, url: canonicalUrl },
    ]),
    buildProductSchema({
      ...producto,
      images: seoImages,
      imagen_url: productImageForSeo,
      precio_final: precioFinal,
      canonicalUrl,
      rating: { value: 5.0, count: 127 },
    }),
  );

  // ── Título y descripción dinámicos ─────────────────────────────────
  // Estructura: "{Nombre} {Categoría} {Material} | PEYU Chile" (~60 chars)
  const materialCorto = producto.material?.includes('100%')
    ? '100% Reciclado'
    : producto.material?.includes('Trigo')
      ? 'Compostable'
      : 'Sustentable';
  const seoTitleRaw = `${producto.nombre} · ${materialCorto} · $${precioFinal.toLocaleString('es-CL')} | PEYU Chile`;
  const seoTitle = seoTitleRaw.length > 65
    ? `${producto.nombre} · ${materialCorto} | PEYU Chile`.slice(0, 65)
    : seoTitleRaw;

  // Descripción: incluye material, precio, lead time, personalización y origen
  const descripcionLimpia = producto.descripcion?.replace(/[⭐🌾✨💚🇨🇱♻️]/g, '').trim();
  const stockHint = producto.stock_actual > 0 ? '✓ Stock disponible. ' : '';
  const personalizacionHint = producto.moq_personalizacion
    ? `Personalización láser UV gratis desde ${producto.moq_personalizacion} u. `
    : '';
  const seoDescriptionRaw = descripcionLimpia
    ? `${descripcionLimpia.slice(0, 90)}. ${materialCorto}, hecho en Chile. ${stockHint}${personalizacionHint}Envío gratis sobre $40.000.`
    : `${producto.nombre}: ${materialCorto.toLowerCase()}, fabricado en Chile. Desde $${precioFinal.toLocaleString('es-CL')}. ${personalizacionHint}${stockHint}Envío a todo el país.`;
  const seoDescription = seoDescriptionRaw.replace(/\s+/g, ' ').trim().slice(0, 160);

  return (
    <>
    <SEO
      title={seoTitle}
      description={seoDescription}
      canonical={canonicalUrl}
      image={productImageForSeo}
      type="product"
      jsonLd={productJsonLd}
      product={{
        price: precioFinal,
        currency: 'CLP',
        availability: producto.stock_actual === 0 ? 'out of stock'
          : producto.stock_actual <= 5 ? 'limited availability'
          : 'in stock',
        condition: 'new',
        brand: 'PEYU',
        sku: producto.sku,
        category: producto.categoria,
        retailerItemId: producto.sku,
      }}
    />
    <div className="flex-1 overflow-auto font-inter ld-canvas min-h-screen">

        {/* STICKY CTA BAR */}
        <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${showStickyBar ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="ld-glass-strong border-b border-ld-border shadow-2xl">
            <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img src={imgPrincipal} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-ld-border" />
                <p className="font-semibold text-sm text-ld-fg truncate">{producto.nombre}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="font-poppins font-bold text-ld-fg">${totalConPers.toLocaleString('es-CL')}</p>
                {agregado ? (
                  <Link to="/cart">
                    <Button size="sm" className="ld-btn-primary gap-2 rounded-full">
                      <ShoppingCart className="w-4 h-4" /> Ver carrito
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={agregarAlCarrito} size="sm" disabled={faltaColor}
                    className="ld-btn-primary gap-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                    <ShoppingCart className="w-4 h-4" /> {faltaColor ? 'Elige color' : 'Agregar'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botón "volver" minimal — el header global ya viene de PublicLayout
            (PublicMobileHeader). Antes esta página agregaba SU PROPIO header
            con logo "P" + carrito, causando una doble barra superpuesta. */}
        <div className="px-4 sm:px-6 pt-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 ld-btn-ghost rounded-xl flex items-center justify-center"
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4 text-ld-fg" />
          </button>
        </div>

        {/* Breadcrumb */}
        <nav aria-label="Migas de pan" className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-xs text-ld-fg-muted">
          <Link to="/" className="hover:text-ld-fg transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <Link to="/shop" className="hover:text-ld-fg transition-colors">Tienda</Link>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span>{producto.categoria}</span>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span className="text-ld-fg font-medium truncate max-w-[200px]" aria-current="page">{producto.nombre}</span>
        </nav>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-10">

          {/* MAIN GRID — más denso, columna info más estrecha.
              FIX 10 móvil: orden galería(imagen+thumbs) → info(color/precio/personalización)
              → historia sustentable. Logrado con flex + order en móvil, grid en desktop. */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-5 lg:gap-7">

            {/* LEFT: GALERÍA — en móvil es flex-col con order para mover la historia al final */}
            <div className="flex flex-col gap-3 lg:space-y-3 lg:gap-0">
              {/* Main visual: GiftCard oficial o imagen del producto */}
              {isGiftCard ? (
                <div className="space-y-4">
                  <div className="ld-card p-4 sm:p-6 shadow-2xl">
                    <GiftCardVisual monto={giftCardMonto} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { e: '⚡', t: 'Entrega instantánea', s: 'Email en segundos' },
                      { e: '♻️', t: 'Sin impresión', s: 'Digital, cero residuos' },
                      { e: '📅', t: 'Vigencia 12 meses', s: 'Sin apuros' },
                    ].map((b, i) => (
                      <div key={i} className="ld-glass rounded-2xl p-3 text-center">
                        <div className="text-2xl mb-1">{b.e}</div>
                        <div className="text-[11px] font-bold text-ld-fg leading-tight">{b.t}</div>
                        <div className="text-[10px] text-ld-fg-muted mt-0.5">{b.s}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
              <div className="relative ld-card overflow-hidden shadow-xl mx-auto w-full max-w-[460px] lg:max-w-none bg-white" style={{ aspectRatio: '1' }}>
                <img
                  key={imagenPrincipalMostrada}
                  src={imagenPrincipalMostrada}
                  alt={`${producto.nombre} · ${producto.material || 'Plástico reciclado'} · ${producto.categoria} · PEYU Chile`}
                  width="600"
                  height="600"
                  loading="eager"
                  fetchpriority="high"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-all duration-300 ease-out ${imageFading ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}
                  onError={e => {
                    // Guard anti-loop: marcamos en data-attr el nivel de fallback ya probado.
                    const tried = e.target.dataset.fallbackTried || '';
                    if (!tried && imgPrincipal && e.target.src !== imgPrincipal) {
                      e.target.dataset.fallbackTried = 'main';
                      e.target.src = imgPrincipal;
                    } else if (tried !== 'final') {
                      e.target.dataset.fallbackTried = 'final';
                      e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1';
                    }
                  }}
                />
                {vistaActiva === 3 && personalizacion && (
                  <div className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none">
                    <div className="bg-gray-900/75 backdrop-blur text-yellow-400 text-sm font-bold tracking-[0.2em] px-5 py-2 rounded-xl border border-yellow-400/30"
                      style={{ textShadow: '0 0 12px rgba(212,175,55,0.6)', fontFamily: 'monospace' }}>
                      {personalizacion.toUpperCase()}
                    </div>
                  </div>
                )}
                {/* Material badge */}
                <div className="absolute top-4 left-4">
                  <span className="ld-glass-strong inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-ld-fg shadow">
                    <Recycle className="w-3 h-3" style={{ color: 'var(--ld-action)' }} />
                    {producto.material?.includes('100%') ? '100% Reciclado' : 'Compostable'}
                  </span>
                </div>
                {/* Actions */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button onClick={() => setWishlist(!wishlist)}
                    className="w-9 h-9 ld-glass-strong rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                    <Heart className={`w-4 h-4 transition-colors ${wishlist ? 'fill-red-500 text-red-500' : 'text-ld-fg-muted'}`} />
                  </button>
                  <button onClick={handleShare}
                    className="w-9 h-9 ld-glass-strong rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                    {shareMsg ? <Check className="w-4 h-4" style={{ color: 'var(--ld-action)' }} /> : <Share2 className="w-4 h-4 text-ld-fg-muted" />}
                  </button>
                </div>
                {shareMsg && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 ld-glass-strong text-ld-fg text-xs font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
                    <Copy className="w-3 h-3" /> {shareMsg}
                  </div>
                )}
                {/* Badge persistente del color elegido (swatch + label) — refuerza
                    la elección de forma honesta sobre la foto marmolada real.
                    Solo cuando hay color elegido, no es pack y no hay otro feedback activo. */}
                {colorObjSel && !packSize && !colorMatchFeedback && (
                  <div className="absolute bottom-4 left-4 ld-glass-strong text-ld-fg text-[11px] font-semibold pl-2 pr-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner flex-shrink-0"
                      style={{ backgroundColor: colorObjSel.hex }}
                      aria-hidden
                    />
                    <span className="text-ld-fg">{colorObjSel.label}</span>
                  </div>
                )}
                {/* Badge contextual UI 2026: feedback sutil "Mostrando en X" cuando el color sincronizó la galería */}
                {colorMatchFeedback && (
                  <div
                    key={colorMatchFeedback.key}
                    className="absolute bottom-4 left-4 ld-glass-strong text-ld-fg text-[11px] font-semibold pl-2 pr-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner flex-shrink-0"
                      style={{ backgroundColor: colores.find(c => c.id === colorSeleccionado)?.hex || '#ccc' }}
                      aria-hidden
                    />
                    <span className="text-ld-fg-muted">Mostrando en</span>
                    <span className="text-ld-fg">{colorMatchFeedback.label}</span>
                  </div>
                )}
              </div>
              )}

              {/* Thumbnails — con indicador sutil del color activo cuando hubo match */}
              {!isGiftCard && galeria.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {galeria.slice(0, 4).map((img, i) => {
                  const colorMatchActivo = colorMatchFeedback && vistaActiva === i;
                  const activeHex = colores.find(c => c.id === colorSeleccionado)?.hex;
                  return (
                  <button
                    key={`${img}-${i}`}
                    onClick={() => {
                      userInteractedRef.current = true;
                      setVistaActiva(i);
                      setColorMatchFeedback(null);
                    }}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all bg-white ${vistaActiva === i ? 'shadow-lg scale-[1.03]' : 'opacity-70 hover:opacity-100'}`}
                    style={{ borderColor: vistaActiva === i ? 'var(--ld-action)' : 'var(--ld-border)' }}>
                    <img
                      src={img}
                      alt={`${producto.nombre} - vista ${i + 1}`}
                      width="150"
                      height="150"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={e => {
                        if (e.target.dataset.fallbackTried) return;
                        if (imgPrincipal && e.target.src !== imgPrincipal) {
                          e.target.dataset.fallbackTried = '1';
                          e.target.src = imgPrincipal;
                        }
                      }}
                    />
                    {/* Dot 2026: muestra el color que corresponde a este thumbnail tras match */}
                    {colorMatchActivo && activeHex && (
                      <span
                        className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md animate-in zoom-in-50 duration-300"
                        style={{ backgroundColor: activeHex }}
                        aria-hidden
                      />
                    )}
                  </button>
                  );
                })}
              </div>
              )}
            {/* /galería imagen+thumbs — cerramos aquí para que la historia sea
                un hermano del flex y pueda ir order-last en móvil (FIX 10) */}
            </div>

            {/* Sustainability story — order-last en móvil (tras comprar), col-izq en desktop */}
            <div className="order-last lg:order-none lg:col-start-1 lg:row-start-2 space-y-3">
              {isGiftCard ? (
                <div className="ld-card p-6 space-y-4 shadow-xl mt-6 relative overflow-hidden">
                  <div aria-hidden className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--ld-action-soft)', opacity: 0.5 }} />
                  <div className="relative flex items-center gap-2">
                    <Gift className="w-5 h-5" style={{ color: 'var(--ld-action)' }} />
                    <h3 className="font-poppins font-bold text-sm text-ld-fg">¿Cómo funciona?</h3>
                  </div>
                  <ol className="relative space-y-2.5 text-sm text-ld-fg-soft">
                    {[
                      <><strong className="text-ld-fg">Compras la Gift Card</strong> con el monto que quieras</>,
                      <>Le <strong className="text-ld-fg">enviamos un email</strong> al destinatario con el código y tu mensaje</>,
                      <>Canjea el código en <strong className="text-ld-fg">peyuchile.cl/canjear</strong> o en el checkout</>,
                    ].map((content, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--ld-grad-action)' }}>{i + 1}</span>
                        <span>{content}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="relative flex gap-4 pt-2 flex-wrap border-t border-ld-border">
                    {[['⚡', 'Entrega instantánea'], ['📅', 'Válida 12 meses'], ['♻️', 'Sin plástico ni papel']].map(([e, l]) => (
                      <div key={l} className="flex items-center gap-1.5 text-xs text-ld-fg-muted pt-2">
                        <span>{e}</span><span>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                (() => {
                  const tipo = getTipoMaterial(producto);
                  const isFibra = tipo === 'fibra_trigo';
                  return (
                  <div className="ld-card p-6 space-y-3 shadow-xl mt-6 relative overflow-hidden">
                    <div aria-hidden className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: isFibra ? 'var(--ld-highlight-soft)' : 'var(--ld-action-soft)', opacity: 0.5 }} />
                    <div className="relative flex items-center gap-2">
                      <span className="text-xl">{isFibra ? '🌾' : '♻️'}</span>
                      <h3 className="font-poppins font-bold text-sm text-ld-fg">
                        {isFibra ? 'Nacida del trigo, devuelta a la tierra' : 'Plástico chileno con segunda vida'}
                      </h3>
                    </div>
                    <p className="relative text-ld-fg-soft text-sm leading-relaxed">
                      {isFibra
                        ? 'Esta carcasa está hecha con paja de trigo: el residuo agrícola que tradicionalmente se quema en el campo y contamina el aire. La valorizamos en un biocomposite duradero que protege tu equipo igual que una carcasa convencional, pero al final de su vida útil se composta en 90-180 días sin dejar microplásticos. Cada unidad evita ~2.4 kg de CO₂ frente a una carcasa de policarbonato virgen.'
                        : 'Este producto se fabrica con plástico post-consumo recolectado en Santiago — botellas, tapas y envases que iban al vertedero o al mar. Cada pieza es única: el marmolado nace del proceso de inyección artesanal con materiales reciclados mezclados a mano. Cada unidad rescata ~30 g de plástico y evita ~2.1 kg de CO₂.'}
                    </p>
                    <div className="relative flex gap-4 pt-1 flex-wrap">
                      {(isFibra
                        ? [['🌾', 'Paja valorizada'], ['🌱', 'Compostable'], ['🇨🇱', 'Hecho en Chile']]
                        : [['♻️', '100% Reciclado'], ['🛡️', '10 años garantía'], ['🇨🇱', 'Hecho en Chile']]
                      ).map(([e, l]) => (
                        <div key={l} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: isFibra ? 'var(--ld-highlight)' : 'var(--ld-action)' }}>
                          <span>{e}</span><span>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })()
              )}
            </div>{/* /historia sustentable */}

            {/* RIGHT: INFO + CTA — col-2 en desktop, abarca ambas filas */}
            <div className="space-y-3.5 lg:col-start-2 lg:row-span-2 lg:sticky lg:top-20 lg:self-start">

              {/* Header */}
              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>{producto.categoria}</span>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-mono ld-glass-soft text-ld-fg-muted border border-ld-border">{producto.sku}</span>
                  {producto.stock_actual !== undefined && producto.stock_actual <= 5 && producto.stock_actual > 0 && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold animate-pulse" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>⚡ Últimas {producto.stock_actual} u.</span>
                  )}
                </div>
                <h1 className="ld-display text-3xl lg:text-4xl text-ld-fg leading-tight mb-2">{producto.nombre}</h1>
                {producto.descripcion && (
                  isGiftCard ? (
                    (() => {
                      const { intro, bullets, outro } = parseGiftCardDescription(producto.descripcion);
                      return (
                        <div className="space-y-2.5 mt-2">
                          {intro && <p className="text-sm text-ld-fg-soft leading-relaxed">{intro}</p>}
                          {bullets.length > 0 && (
                            <ul className="space-y-1.5">
                              {bullets.map((b, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-ld-fg-soft">
                                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ld-action)' }} />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {outro && <p className="text-xs text-ld-fg-muted leading-relaxed pt-1">{outro}</p>}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-ld-fg-soft leading-relaxed whitespace-pre-line">{cleanDescripcion(producto.descripcion)}</p>
                  )
                )}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <span className="text-sm font-bold text-ld-fg">5.0</span>
                  <span className="text-xs text-ld-fg-muted">· 127 reseñas verificadas</span>
                </div>
              </div>

              {/* Precio */}
              <div className="ld-card p-4 shadow-lg space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {precioVolumen ? (
                      <>
                        <p className="text-[10px] font-bold mb-0.5 uppercase tracking-wider" style={{ color: 'var(--ld-highlight)' }}>Precio volumen ({precioVolumen.label})</p>
                        <p className="ld-display text-4xl text-ld-fg leading-none">${precioVolumen.precio.toLocaleString('es-CL')}</p>
                        <p className="text-[10px] text-ld-fg-muted mt-1">por unidad · IVA incluido</p>
                      </>
                    ) : isCyberActive() && tieneOfertaCyber(producto) ? (
                      <>
                        <p className="text-sm line-through text-ld-fg-subtle leading-none">${precioFinal.toLocaleString('es-CL')}</p>
                        <p className="ld-display text-4xl leading-none mt-1" style={{ color: 'var(--ld-highlight)' }}>${producto.precio_oferta.toLocaleString('es-CL')}</p>
                        <p className="text-[10px] font-semibold mt-1" style={{ color: 'var(--ld-action)' }}>Ahorras ${(precioFinal - producto.precio_oferta).toLocaleString('es-CL')} · IVA incluido</p>
                      </>
                    ) : (
                      <>
                        <p className="ld-display text-4xl text-ld-fg leading-none">${precioFinal.toLocaleString('es-CL')}</p>
                        <p className="text-[10px] text-ld-fg-muted mt-1">IVA incluido</p>
                      </>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    {precioVolumen && <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>Precio B2B</span>}
                    <CyberBadge producto={producto} className="ml-auto" />
                  </div>
                </div>
                {precioFinal * cantidad < 40000 && !precioVolumen && (
                  <div className="flex items-center gap-2 text-xs font-semibold rounded-xl p-2.5" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>
                    <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                    Agrega ${(40000 - precioFinal * cantidad).toLocaleString('es-CL')} más para envío gratis
                  </div>
                )}
                {!isGiftCard && isCyberActive() && (
                  <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--ld-highlight)' }}>
                    {CYBER_COPY.microUrgency}
                  </p>
                )}
                {(producto.precio_50_199 || producto.precio_base_b2b) && (
                  <button onClick={() => setShowB2BTable(!showB2BTable)}
                    className="text-xs font-bold flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: 'var(--ld-action)' }}>
                    <Sparkles className="w-3 h-3" />
                    {showB2BTable ? 'Ocultar' : 'Ver'} precios por volumen B2B
                    <ChevronRight className={`w-3 h-3 transition-transform ${showB2BTable ? 'rotate-90' : ''}`} />
                  </button>
                )}
                {showB2BTable && (
                  <div className="rounded-xl overflow-hidden border border-ld-border ld-glass-soft">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: 'var(--ld-action-soft)' }}>
                          <th className="px-3 py-2 text-left font-bold text-ld-fg">Cantidad</th>
                          <th className="px-3 py-2 text-right font-bold text-ld-fg">Precio/u</th>
                          <th className="px-3 py-2 text-right font-bold text-ld-fg">Descuento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ld-border">
                        {[
                          { label: '1–9 u.', precio: precioFinal, base: true },
                          producto.precio_base_b2b && { label: '10–49 u.', precio: producto.precio_base_b2b },
                          producto.precio_50_199 && { label: '50–199 u.', precio: producto.precio_50_199 },
                          producto.precio_200_499 && { label: '200–499 u.', precio: producto.precio_200_499 },
                          producto.precio_500_mas && { label: '500+ u.', precio: producto.precio_500_mas },
                        ].filter(Boolean).map((tier, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-semibold text-ld-fg-soft">{tier.label}</td>
                            <td className="px-3 py-2 text-right font-bold text-ld-fg">${tier.precio.toLocaleString('es-CL')}</td>
                            <td className="px-3 py-2 text-right font-bold" style={{ color: 'var(--ld-action)' }}>
                              {i === 0 ? '—' : `−${Math.round((1 - tier.precio / (producto.precio_b2c || 9990)) * 100)}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[10px] text-ld-fg-muted px-3 py-2">* Personalización láser UV gratis desde {producto.moq_personalizacion || 10} u.</p>
                  </div>
                )}
              </div>

              {/* Color selector — Pack: por unidad / Normal: color global */}
              {!isGiftCard && colores.length > 0 && (
                packSize ? (
                  <PackColorPicker
                    packSize={packSize}
                    colores={colores}
                    value={coloresPack}
                    onChange={setColoresPack}
                  />
                ) : (
                  <div data-color-selector>
                    <label className="text-sm font-bold text-ld-fg mb-2.5 block">
                      Color: <span className="font-normal text-ld-fg-muted">{colores.find(c => c.id === colorSeleccionado)?.label || <span style={{ color: 'var(--ld-highlight)' }}>elige uno *</span>}</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {colores.map(c => (
                        <button key={c.id} onClick={() => {
                            setColorSeleccionado(c.id);
                            setColorError(false);
                            // 🎨 FIX 6 · Al elegir color, soltamos la navegación manual
                            // para que la imagen principal muestre imagenes_por_color[color]
                            // aunque esa URL no viva dentro de la galería de thumbnails.
                            userInteractedRef.current = false;
                          }}
                          title={c.label}
                          className="w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 shadow-md"
                          style={{ backgroundColor: c.hex, borderColor: colorSeleccionado === c.id ? 'var(--ld-action)' : (colorError ? 'var(--ld-highlight)' : 'var(--ld-border)'), boxShadow: colorSeleccionado === c.id ? '0 0 0 3px var(--ld-action-soft)' : undefined }}>
                          {colorSeleccionado === c.id && <Check className="w-4 h-4 text-white mx-auto drop-shadow" />}
                        </button>
                      ))}
                    </div>
                    {colorError && (
                      <p className="text-xs font-semibold mt-2 flex items-center gap-1.5" style={{ color: 'var(--ld-highlight)' }}>
                        <AlertCircle className="w-3.5 h-3.5" /> Elige un color antes de agregar al carrito
                      </p>
                    )}
                  </div>
                )
              )}

              {/* Cantidad */}
              <div>
                <label className="text-sm font-bold text-ld-fg mb-2 block">Cantidad</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center ld-card overflow-hidden">
                    <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      className="w-11 h-11 hover:bg-ld-bg-soft font-bold text-xl text-ld-fg transition-colors flex items-center justify-center">−</button>
                    <input
                      type="number" min="1" value={cantidad}
                      onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 h-11 text-center font-bold text-ld-fg border-x border-ld-border focus:outline-none text-sm bg-transparent" />
                    <button onClick={() => setCantidad(cantidad + 1)}
                      className="w-11 h-11 hover:bg-ld-bg-soft font-bold text-xl text-ld-fg transition-colors flex items-center justify-center">+</button>
                  </div>
                  {cantidad >= 500 && producto.precio_500_mas && (
                    <span className="text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>
                      <Sparkles className="w-3 h-3" /> Máximo descuento
                    </span>
                  )}
                  {cantidad >= 200 && cantidad < 500 && producto.precio_200_499 && (
                    <span className="text-xs font-bold px-3 py-2 rounded-xl" style={{ background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)' }}>−{Math.round((1 - producto.precio_200_499 / (producto.precio_b2c || 9990)) * 100)}% vol.</span>
                  )}
                  {cantidad >= 50 && cantidad < 200 && producto.precio_50_199 && (
                    <span className="text-xs font-bold px-3 py-2 rounded-xl" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>−{Math.round((1 - producto.precio_50_199 / (producto.precio_b2c || 9990)) * 100)}% vol.</span>
                  )}
                  {cantidad >= 10 && cantidad < 50 && (
                    <span className="text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>
                      <Sparkles className="w-3 h-3" /> Láser gratis
                    </span>
                  )}
                </div>
                <p className="text-xs text-ld-fg-muted mt-2">Total: <span className="font-bold text-ld-fg">${(precioActual * cantidad).toLocaleString('es-CL')}</span></p>
                {/* Descuento B2C automático por cantidad del MISMO producto (no aplica al
                    tramo corporativo ≥10u que usa precios B2B escalonados). No-acumula
                    con Cyber: si hay oferta Cyber, esa prevalece y no sumamos %. */}
                {!isGiftCard && !precioVolumen && cantidad >= 2 && !(isCyberActive() && tieneOfertaCyber(producto)) && (() => {
                  const pct = cantidad >= 3 ? 15 : 10;
                  const ahorro = Math.floor(precioActual * cantidad * (pct / 100));
                  return (
                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold rounded-xl p-2.5" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      Llevas {cantidad} → −{pct}% automático · ahorras ${ahorro.toLocaleString('es-CL')} en el carrito
                    </div>
                  );
                })()}
                {!isGiftCard && !precioVolumen && cantidad === 1 && (
                  <p className="text-[11px] text-ld-fg-muted mt-1.5">💡 Lleva 2 y obtén −10% · 3 o más −15% (automático en el carrito)</p>
                )}
              </div>

              {/* Personalización láser UV — selector de opciones con precio (B2C) */}
              {!isGiftCard && producto.moq_personalizacion && (
                <div className="ld-card p-4 space-y-3.5" style={{ background: 'var(--ld-highlight-soft)' }}>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-bold text-ld-fg flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: 'var(--ld-highlight)' }} /> Personalización láser UV
                    </label>
                    {personalizacionGratis ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1" style={{ background: 'var(--ld-action)' }}>
                        <Check className="w-3 h-3" strokeWidth={3} /> Gratis desde {moqGratisPers}u
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--ld-highlight)' }}>
                        GRATIS desde {moqGratisPers} u.
                      </span>
                    )}
                  </div>

                  {/* A · Selector de las 3 opciones + sin personalización */}
                  <PersonalizacionOptionPicker
                    value={opcionPers}
                    onSelect={handleOpcionPers}
                    gratis={personalizacionGratis}
                    moq={moqGratisPers}
                  />

                  {/* Control según la opción elegida */}
                  {opcionPers === 'frase' && (
                    <div className="space-y-2">
                      <Input value={personalizacion} onChange={e => setPersonalizacion(e.target.value.slice(0, 25))}
                        placeholder="Tu nombre, empresa o frase..."
                        className="ld-input text-sm rounded-xl h-11 font-medium tracking-wide bg-ld-bg text-ld-fg placeholder:text-ld-fg-muted" />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-ld-fg-soft">Área: {producto.area_laser_mm || '40×25mm'} · Grabado permanente</p>
                        <span className="text-xs font-bold" style={{ color: personalizacion.length >= 22 ? 'var(--ld-highlight)' : 'var(--ld-fg-muted)' }}>{personalizacion.length}/25</span>
                      </div>
                      {personalizacion && (
                        <div className="rounded-xl px-4 py-2 text-center bg-slate-900 border border-yellow-500/40">
                          <p className="font-bold tracking-[0.2em] text-sm text-yellow-400" style={{ fontFamily: 'monospace' }}>{personalizacion.toUpperCase()}</p>
                          <p className="text-white/40 text-[9px] mt-0.5">Preview del grabado láser</p>
                        </div>
                      )}
                    </div>
                  )}

                  {opcionPers === 'peyu' && (
                    <DisenosPeyuPickerB2C selectedUrl={disenoPeyuUrl} onSelect={(url) => setDisenoPeyuUrl(url)} />
                  )}

                  {opcionPers === 'archivo' && (
                    <div className="space-y-2">
                      {logoCliente ? (
                        <div className="flex items-center gap-3 bg-ld-bg border border-ld-border rounded-xl p-3">
                          <img src={logoCliente} alt="Logo subido" className="w-12 h-12 object-contain rounded-lg bg-white" />
                          <div className="flex-1 text-xs">
                            <p className="font-bold flex items-center gap-1" style={{ color: 'var(--ld-action)' }}><Check className="w-3 h-3" /> Logo cargado</p>
                            <p className="text-ld-fg-muted">Listo para grabar</p>
                          </div>
                          <button onClick={() => setLogoCliente('')} className="w-8 h-8 rounded-lg bg-ld-glass hover:bg-ld-glass-soft flex items-center justify-center text-ld-fg-muted">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 bg-ld-bg hover:bg-ld-bg-soft border border-dashed border-ld-border-strong rounded-xl py-6 cursor-pointer transition-colors">
                          {logoUploading ? (
                            <><Loader2 className="w-4 h-4 animate-spin text-ld-fg-muted" /> <span className="text-sm text-ld-fg-muted">Subiendo...</span></>
                          ) : (
                            <><Upload className="w-4 h-4 text-ld-fg-muted" /> <span className="text-sm text-ld-fg-muted">Subir PNG, SVG o imagen</span></>
                          )}
                          <input type="file" accept="image/*,.svg" onChange={handleLogoUpload} disabled={logoUploading} className="hidden" />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Posición de grabado — cuando hay personalización */}
                  {hayPersonalizacion && (
                    <EngravingPositionPicker
                      value={posicionGrabado}
                      onChange={setPosicionGrabado}
                      areaLaser={producto.area_laser_mm || '40×25mm'}
                    />
                  )}

                  {/* B · Desglose de precio en vivo */}
                  <PriceBreakdownB2C
                    precioUnit={precioActual}
                    cantidad={cantidad}
                    subtotalProducto={precioActual * cantidad}
                    tipoLabel={hayPersonalizacion ? PERSONALIZACION_LABEL[tipoPersonalizacion] : null}
                    cargoUnit={cargoPersUnit}
                    cargoTotal={cargoPersTotal}
                    gratis={personalizacionGratis}
                  />

                  {/* Mockup IA real (mandato #2 aparte) */}
                  {hayPersonalizacion && (
                    <button
                      type="button"
                      onClick={() => setMockupOpen(true)}
                      className="ld-btn-primary w-full flex items-center justify-center gap-2 text-xs font-bold rounded-xl py-2.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {mockupGenerado ? 'Regenerar mockup con IA' : 'Probar mi mockup realista con IA'}
                    </button>
                  )}

                  {mockupGenerado && (
                    <div className="rounded-xl overflow-hidden border border-ld-border bg-white">
                      <img src={mockupGenerado} alt="Mockup generado" className="w-full h-auto" />
                      <p className="text-[10px] text-ld-fg-muted text-center py-1.5" style={{ background: 'var(--ld-action-soft)' }}>✨ Mockup generado con IA · referencial</p>
                    </div>
                  )}
                </div>
              )}

              {/* CTAs — B2C funnel */}
              <div ref={ctaRef} className="space-y-2.5">
                {agregado ? (
                  <div className="space-y-2">
                    <div className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>
                      <Check className="w-4 h-4" />
                      <span>¡Producto agregado al carrito!</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/cart">
                        <Button size="sm" className="ld-btn-primary w-full h-10 rounded-xl font-semibold gap-2 text-xs">
                          <ShoppingCart className="w-3.5 h-3.5" /> Ir al carrito
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => setAgregado(false)}
                        className="ld-btn-ghost w-full h-10 rounded-xl text-ld-fg font-semibold text-xs">
                        Seguir comprando
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={agregarAlCarrito} size="lg"
                    disabled={faltaColor}
                    className="ld-btn-primary w-full h-12 font-bold text-sm gap-2 rounded-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                    <ShoppingCart className="w-4 h-4" />
                    {faltaColor ? 'Elige un color para continuar' : `Agregar al carrito · $${totalConPers.toLocaleString('es-CL')}`}
                  </Button>
                )}

                {/* B2B funnel */}
                {!isGiftCard && (
                <div className="ld-card p-4 space-y-3 relative overflow-hidden">
                  <div aria-hidden className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--ld-action-soft)', opacity: 0.6 }} />
                  <div className="relative flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: 'var(--ld-action)' }} />
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ld-action)' }}>Canal Corporativo B2B</p>
                  </div>
                  <p className="relative text-xs text-ld-fg-soft leading-relaxed">
                    ¿Necesitas +10 unidades con tu logo? Cotización con mockup en menos de 24 horas. Precios por volumen y personalización láser gratis.
                  </p>
                  <div className="relative grid grid-cols-2 gap-2">
                    <Link
                      to="/b2b/self-service?anchor=1"
                      onClick={() => {
                        // 🎯 Pre-anclamos el producto seleccionado al embudo conversacional B2B.
                        // Así el cliente NO cae en una galería vacía: arranca con su producto
                        // ya en el carrito, con la cantidad mínima B2B y su personalización.
                        try {
                          sessionStorage.setItem('peyu_b2b_anchor', JSON.stringify({
                            sku: producto.sku,
                            nombre: producto.nombre,
                            cantidad: Math.max(10, cantidad),
                            personalizar: !!personalizacion,
                          }));
                        } catch { /* ignore */ }
                        if (mockupGenerado || personalizacion) {
                          saveMockupDraft({
                            productoId: producto.id,
                            productoNombre: producto.nombre,
                            productoSku: producto.sku,
                            productoCategoria: producto.categoria,
                            color: colores.find(c => c.id === colorSeleccionado)?.label || '',
                            texto: personalizacion || '',
                            mockupUrl: mockupGenerado || '',
                          });
                        }
                      }}
                    >
                      <Button size="sm" className="ld-btn-primary w-full font-bold gap-1.5 rounded-xl h-10 text-xs">
                        <Building2 className="w-3.5 h-3.5" /> Cotizar B2B
                      </Button>
                    </Link>
                    <a href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, me interesa cotizar el producto: ${producto.nombre} (SKU: ${producto.sku}) para mi empresa`)}`}
                      target="_blank" rel="noreferrer" className="block">
                      <Button size="sm" className="ld-btn-ghost w-full font-bold gap-1.5 rounded-xl text-ld-fg h-10 text-xs">
                        💬 WhatsApp B2B
                      </Button>
                    </a>
                  </div>
                </div>
                )}

                {/* Atajo a flujo de regalo personalizado para gift cards */}
                {isGiftCard && (
                  <Link to="/regalar-giftcard" className="block">
                    <Button size="lg" className="ld-btn-primary w-full h-12 gap-2 rounded-2xl font-bold">
                      <Gift className="w-4 h-4" /> Regalar con mensaje personalizado
                    </Button>
                  </Link>
                )}
              </div>

              {/* Garantías — primera tarjeta dinámica por material/categoría */}
              <div className="grid grid-cols-4 gap-1.5">
                {[getGarantiaPorMaterial(producto), ...GARANTIAS_FIJAS].map((g, i) => (
                  <div key={i} className="ld-card flex flex-col items-center gap-1 p-2 text-center" title={g.sub}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ld-action-soft)' }}>
                      <g.icon className="w-3 h-3" style={{ color: 'var(--ld-action)' }} />
                    </div>
                    <p className="text-[9px] font-bold text-ld-fg leading-tight">{g.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="mt-9">
            <div className="flex gap-0 border-b border-ld-border mb-4 overflow-x-auto scrollbar-hide">
              {[
                { id: 'descripcion', label: 'Descripción' },
                { id: 'specs', label: 'Especificaciones' },
                { id: 'faq', label: 'Preguntas frecuentes' },
              ].map(t => (
                <button key={t.id} onClick={() => setTabActiva(t.id)}
                  className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
                  style={{
                    borderColor: tabActiva === t.id ? 'var(--ld-action)' : 'transparent',
                    color: tabActiva === t.id ? 'var(--ld-action)' : 'var(--ld-fg-muted)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {tabActiva === 'descripcion' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="ld-display text-2xl text-ld-fg">Sobre este producto</h3>
                  <p className="text-sm text-ld-fg-soft leading-relaxed whitespace-pre-line">
                    {cleanDescripcion(producto.descripcion) || `${producto.nombre} es un producto diseñado y fabricado en Chile con materiales ${producto.material?.includes('100%') ? '100% reciclados post-consumo' : 'compostables de fibra de trigo'}. Cada unidad es única gracias al proceso de inyección artesanal.`}
                  </p>
                  <ul className="space-y-2">
                    {[
                      `Material: ${producto.material}`,
                      // Garantía contextual: carcasas/fibra son compostables, plástico reciclado lleva años.
                      producto.categoria === 'Carcasas B2C'
                        ? 'Compostable industrial: 2-3 años'
                        : producto.material?.includes('Trigo') || producto.material?.includes('Compostable')
                          ? 'Material compostable (fibra de trigo)'
                          : `Garantía: ${producto.garantia_anios || 10} años contra defectos`,
                      producto.area_laser_mm && `Área grabado láser: ${producto.area_laser_mm}`,
                      'Fabricado en Santiago, Chile',
                      producto.moq_personalizacion && 'Compatible con personalización UV',
                    ].filter(Boolean).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ld-fg-soft">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ld-action)' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <ImpactoAmbientalProducto producto={producto} />
              </div>
            )}

            {tabActiva === 'specs' && (
              <div className="ld-card overflow-hidden max-w-lg">
                <div className="divide-y divide-ld-border">
                  {[
                    ['Material', producto.material],
                    ['Categoría', producto.categoria],
                    ['SKU', producto.sku],
                    ['Canal', producto.canal],
                    ['Garantía',
                      producto.categoria === 'Carcasas B2C'
                        ? 'Compostable 2-3 años (industrial)'
                        : (producto.material?.includes('Trigo') || producto.material?.includes('Compostable'))
                          ? 'Material compostable'
                          : `${producto.garantia_anios || 10} años contra defectos`,
                    ],
                    ['Lead time s/personalización', `${producto.lead_time_sin_personal || 7} días hábiles`],
                    ['Lead time c/personalización', `${producto.lead_time_con_personal || 9} días hábiles`],
                    producto.area_laser_mm && ['Área grabado UV', producto.area_laser_mm],
                    producto.moq_personalizacion && ['MOQ personalización', `${producto.moq_personalizacion} unidades`],
                    ['Stock actual', producto.stock_actual > 0 ? `${producto.stock_actual} u. disponibles` : 'Consultar disponibilidad'],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} className="px-5 py-3 flex items-center justify-between text-sm">
                      <span className="text-ld-fg-muted font-medium">{k}</span>
                      <span className="font-semibold text-ld-fg text-right max-w-[55%]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tabActiva === 'faq' && (
              <div className="space-y-3 max-w-2xl">
                {[
                  ['¿Cuánto demora el despacho?', `Sin personalización: ${producto.lead_time_sin_personal || 7} días hábiles. Con grabado láser UV: ${producto.lead_time_con_personal || 9} días hábiles. Todo Chile vía Starken, Chilexpress o BlueExpress.`],
                  ['¿Puedo personalizar con mi logo?', `Sí. Ofrecemos grabado láser UV permanente en área de ${producto.area_laser_mm || '40×25mm'}. Gratis desde ${producto.moq_personalizacion || 10} unidades.`],
                  ['¿El color marmolado es exactamente igual al de la foto?', 'El marmolado es un proceso artesanal, por lo que cada pieza tiene variaciones únicas. Los colores base son los mismos pero el patrón nunca se repite.'],
                  ['¿Qué pasa si el producto llega dañado?',
                    producto.categoria === 'Carcasas B2C'
                      ? 'Ofrecemos 30 días de devolución sin preguntas. Las carcasas tienen garantía contra defectos de fabricación durante toda su vida útil esperada (2-3 años de uso normal antes de iniciar su compostaje industrial).'
                      : 'Ofrecemos 30 días de devolución sin preguntas. Además, los productos de plástico reciclado tienen garantía de 10 años contra defectos de fabricación.',
                  ],
                  ['¿Tienen precios especiales para empresas?', `Sí. Desde ${producto.moq_personalizacion || 10} unidades accedes a precios B2B. Desde 50 unidades, descuento adicional.`],
                ].map(([q, a], i) => (
                  <details key={i} className="group ld-card overflow-hidden">
                    <summary className="px-5 py-4 cursor-pointer font-semibold text-sm text-ld-fg flex items-center justify-between list-none hover:bg-ld-bg-soft transition-colors">
                      {q}
                      <ChevronRight className="w-4 h-4 text-ld-fg-muted group-open:rotate-90 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-5 pb-4 text-sm text-ld-fg-soft leading-relaxed border-t border-ld-border pt-3">{a}</div>
                  </details>
                ))}
              </div>
            )}
          </div>

          {/* REVIEWS */}
          <div className="mt-12 space-y-4">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--ld-action)' }}>Reseñas verificadas</p>
                <h2 className="ld-display text-3xl text-ld-fg">Lo que dicen nuestros clientes</h2>
              </div>
              <div className="ld-card hidden sm:flex items-center gap-2 px-4 py-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="font-poppins font-bold text-ld-fg">5.0</span>
                <span className="text-xs text-ld-fg-muted">/ 127</span>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {REVIEWS_MOCK.map((r, i) => (
                <div key={i} className="ld-card p-5 hover:-translate-y-1 transition-all shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-ld-fg-subtle'}`} />
                      ))}
                    </div>
                    {r.verificado && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}>
                        <BadgeCheck className="w-3 h-3" /> Verificado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ld-fg-soft italic leading-relaxed mb-4">"{r.txt}"</p>
                  <div className="flex items-center gap-2.5 pt-3 border-t border-ld-border">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--ld-grad-action)' }}>
                      {r.autor[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ld-fg">{r.autor}</p>
                      <p className="text-[10px] text-ld-fg-muted">{r.ciudad} · {r.fecha}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FREQUENTLY BOUGHT TOGETHER — bundle IA */}
          <div className="mt-9">
            <FrequentlyBoughtTogether productSku={producto.sku} />
          </div>

          {/* RELACIONADOS */}
          {relacionados.length > 0 && (
            <div className="mt-12 space-y-4">
              <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--ld-action)' }}>También te podría gustar</p>
                  <h2 className="ld-display text-3xl text-ld-fg">Productos relacionados</h2>
                </div>
                <Link to="/shop" className="flex items-center gap-1.5 text-sm font-bold transition-colors hover:opacity-80" style={{ color: 'var(--ld-action)' }}>
                  Ver todos <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relacionados.map(p => (
                  <Link key={p.id} to={`/producto/${p.id}`}>
                    <div className="group ld-card overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-lg">
                      <div className="aspect-square overflow-hidden bg-white">
                        <img
                          src={getProductImage(p)}
                          alt={`${p.nombre} · ${p.categoria || 'PEYU'}`}
                          width="300"
                          height="300"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => {
                            if (e.target.dataset.fallbackTried) return;
                            e.target.dataset.fallbackTried = '1';
                            e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1';
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-xs text-ld-fg line-clamp-2 transition-colors leading-snug" style={{ transitionProperty: 'color' }}>{p.nombre}</h3>
                        <p className="font-poppins font-bold text-sm mt-1" style={{ color: 'var(--ld-action)' }}>${(p.precio_b2c || 9990).toLocaleString('es-CL')}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <MockupGenerator
          open={mockupOpen}
          onOpenChange={setMockupOpen}
          productName={producto.nombre}
          productCategory={producto.categoria}
          productSku={producto.sku}
          productImageUrl={imagenColorSeleccionado || galeria[vistaActiva] || imgPrincipal}
          initialText={personalizacion}
          initialColor={colores.find(c => c.id === colorSeleccionado)?.label || ''}
          onLogoUploaded={(url) => setLogoCliente(url)}
          onGenerated={(url, extra = {}) => {
            setMockupGenerado(url);
            if (extra.logoUrl) setLogoCliente(extra.logoUrl);
            // Persistir draft con todo el contexto para que B2BContacto lo recupere
            saveMockupDraft({
              productoId: producto.id,
              productoNombre: producto.nombre,
              productoSku: producto.sku,
              productoCategoria: producto.categoria,
              color: colores.find(c => c.id === colorSeleccionado)?.label || '',
              texto: extra.texto || personalizacion || '',
              logoUrl: extra.logoUrl || '',
              mockupUrl: url,
            });
          }}
        />
    </div>
    </>
  );
}