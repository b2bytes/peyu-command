import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle, Upload, Loader2,
  Recycle, Package, Palette, Pencil, ShoppingCart, Check, ShieldCheck,
  Truck, Star, Zap, Eye, ChevronRight
} from 'lucide-react';
import MarbleSwatch from '@/components/personalizacion/MarbleSwatch';
import LaserEngravePreview from '@/components/personalizacion/LaserEngravePreview';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';
import { getColoresProducto } from '@/lib/color-parser';
import { trackAddToCart } from '@/lib/analytics-peyu';
import { PRECIO_PERSONALIZACION, PERSONALIZACION_LABEL, MOQ_PERSONALIZACION_GRATIS } from '@/lib/personalizacion-config';
import DisenosPeyuPicker from '@/components/personalizacion/DisenosPeyuPicker';
import ColorPickerCarcasa from '@/components/personalizacion/ColorPickerCarcasa';
import QuantityStepper from '@/components/personalizacion/QuantityStepper';
import PersonalizacionOptionPicker from '@/components/personalizacion/PersonalizacionOptionPicker';
import MockupGenerator from '@/components/MockupGenerator';
import PublicSEO from '@/components/PublicSEO';

const C = {
  bg: '#F8F3ED',
  bgSoft: '#F2EBE0',
  surface: '#FFFFFF',
  border: '#D4C4B0',
  fg: '#2C1810',
  fgSoft: '#7A6050',
  fgMuted: '#A08070',
  action: '#C0785C',
  actionGrad: 'linear-gradient(135deg,#C0785C,#A86440)',
  actionShadow: '0 6px 20px rgba(192,120,92,.28)',
  green: '#8BAD8A',
  greenSoft: 'rgba(139,173,138,.15)',
  greenBorder: '#8BAD8A',
};

const STEPS = [
  { label: 'Producto', Icon: Package, hint: 'Elige qué quieres personalizar' },
  { label: 'Color', Icon: Palette, hint: 'Escoge el acabado perfecto' },
  { label: 'Diseño', Icon: Pencil, hint: 'Tu logo o texto grabado con láser' },
  { label: 'Confirmar', Icon: ShoppingCart, hint: 'Revisa y agrega al carrito' },
];

const fmtCLP = (n) => `$${Math.round(n).toLocaleString('es-CL')}`;

// ── Desktop Stepper lateral ──────────────────────────────────────────────────
function DesktopStepper({ step, onGoTo }) {
  return (
    <div className="hidden lg:flex flex-col gap-1 mb-8">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <button
            key={i}
            onClick={() => done && onGoTo(i)}
            disabled={!done}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all group"
            style={{
              background: active ? 'rgba(192,120,92,.10)' : 'transparent',
              border: active ? `1.5px solid ${C.action}` : '1.5px solid transparent',
              cursor: done ? 'pointer' : 'default',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: done ? C.action : active ? C.actionGrad : C.border,
                boxShadow: active ? C.actionShadow : 'none',
              }}
            >
              {done
                ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                : <s.Icon className="w-3.5 h-3.5" style={{ color: active ? 'white' : C.fgMuted }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight" style={{ color: active ? C.action : done ? C.fgSoft : C.fgMuted }}>
                {i + 1}. {s.label}
              </p>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: active ? C.action : C.fgMuted, opacity: active ? 1 : 0.7 }}>
                {s.hint}
              </p>
            </div>
            {done && <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: C.action }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Mobile Progress Bar ──────────────────────────────────────────────────────
function MobileProgressBar({ step }) {
  return (
    <div className="lg:hidden px-4 pt-2 pb-3">
      <div className="relative h-1 rounded-full mb-2" style={{ background: C.border }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${((step + 1) / 4) * 100}%`, background: C.actionGrad }}
        />
      </div>
      <div className="flex justify-between">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5" style={{ width: '22%' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                style={{ background: done ? C.action : active ? C.actionGrad : C.border, boxShadow: active ? C.actionShadow : 'none' }}>
                {done
                  ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  : <s.Icon className="w-2.5 h-2.5" style={{ color: active ? 'white' : C.fgMuted }} />
                }
              </div>
              <span className="text-[8px] font-bold uppercase tracking-wide text-center" style={{ color: active ? C.action : done ? C.fgSoft : C.fgMuted }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel lateral izquierdo (solo desktop) ───────────────────────────────────
function DesktopLeftPanel({ producto, displayImg, colorLabel, texto, disenoPeyuUrl, archivo, logoUrlSubido, mockupUrl, precioFinal, cantidad, step, onGoTo }) {
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-72 xl:w-80 flex-shrink-0">
      {/* Logo + brand */}
      <div className="flex items-center gap-2 mb-2">
        <Link to="/" className="flex items-center group">
          <img src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
            alt="PEYU" className="h-7 w-auto group-hover:scale-105 transition-transform" draggable={false} />
        </Link>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(192,120,92,.12)', color: C.action }}>
          Personalizar
        </span>
      </div>

      {/* Stepper lateral */}
      <DesktopStepper step={step} onGoTo={onGoTo} />

      {/* Preview del producto seleccionado */}
      {producto && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, background: C.surface }}>
          {/* Imagen grande */}
          <div className="relative aspect-square overflow-hidden" style={{ background: C.bgSoft }}>
            {(mockupUrl || displayImg) && (
              <img
                src={mockupUrl || displayImg}
                alt={producto.nombre}
                className="w-full h-full object-cover transition-all duration-500"
              />
            )}
            {mockupUrl && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(255,255,255,.92)', color: C.green }}>
                <Sparkles className="w-3 h-3" /> Mockup IA
              </div>
            )}
            {/* Laser badge */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(192,120,92,.92)', color: 'white' }}>
              <Zap className="w-3 h-3" /> Láser UV
            </div>
          </div>
          {/* Info producto */}
          <div className="p-3">
            <p className="font-bold text-sm leading-tight line-clamp-2" style={{ color: C.fg }}>{producto.nombre}</p>
            <div className="flex items-center justify-between mt-1.5">
              {colorLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: C.bgSoft, color: C.fgSoft }}>
                  {colorLabel}
                </span>
              )}
              <span className="font-bold text-base ml-auto" style={{ color: C.action }}>{fmtCLP(precioFinal)}</span>
            </div>
            {texto && (
              <div className="mt-2 px-2 py-1.5 rounded-xl text-xs font-bold text-center tracking-widest"
                style={{ background: C.bgSoft, color: C.fg, border: `1px dashed ${C.border}` }}>
                "{texto}"
              </div>
            )}
            {(disenoPeyuUrl || archivo || logoUrlSubido) && (
              <p className="text-xs mt-1.5 font-semibold text-center" style={{ color: C.action }}>+ Logo/diseño adjunto</p>
            )}
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { icon: ShieldCheck, label: '10 años', sub: 'garantía' },
          { icon: Recycle, label: '100%', sub: 'reciclado' },
          { icon: Truck, label: 'Todo', sub: 'Chile' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl text-center"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <Icon className="w-4 h-4" style={{ color: C.action }} />
            <span className="text-[10px] font-bold leading-tight" style={{ color: C.fg }}>{label}</span>
            <span className="text-[9px]" style={{ color: C.fgMuted }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* Social proof */}
      <div className="flex items-center justify-center gap-1 py-1">
        {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" style={{ color: '#F5A623' }} />)}
        <span className="text-[10px] font-semibold ml-1" style={{ color: C.fgMuted }}>+1.200 grabados</span>
      </div>
    </aside>
  );
}

export default function PersonalizacionFlow() {
  const navigate = useNavigate();
  const location = useLocation();

  const [productos, setProductos] = useState([]);
  const [productosLoading, setProductosLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [productoId, setProductoId] = useState(null);
  const [colorId, setColorId] = useState(null);
  const [carcasaColorKey, setCarcasaColorKey] = useState(null);
  const [texto, setTexto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [archivo, setArchivo] = useState(null);
  const [logoUrlSubido, setLogoUrlSubido] = useState('');
  const [disenoPeyuUrl, setDisenoPeyuUrl] = useState('');
  const [opcion, setOpcion] = useState(null);
  const [mockupModalOpen, setMockupModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mockupUrl, setMockupUrl] = useState('');
  const [cleanBaseUrl, setCleanBaseUrl] = useState('');
  const [cleanBaseLoading, setCleanBaseLoading] = useState(false);

  useEffect(() => {
    base44.entities.Producto.list('-updated_date', 200).then(data => {
      const personalizables = (data || []).filter(p => {
        if (p.activo === false) return false;
        if (p.canal === 'B2B Exclusivo') return false;
        if (p.categoria === 'Gift Card') return false;
        const sku = String(p.sku || '').toUpperCase();
        if (sku.startsWith('GC-PEYU')) return false;
        if (!p.precio_b2c) return false;
        return true;
      });
      setProductos(personalizables);
      const params = new URLSearchParams(location.search);
      const preId = params.get('productoId');
      const initial = personalizables.find(p => p.id === preId) || personalizables[0];
      if (initial) setProductoId(initial.id);
      const preStep = parseInt(params.get('step'), 10);
      if (!isNaN(preStep) && preStep >= 0 && preStep <= 3) setStep(preStep);
    }).finally(() => setProductosLoading(false));
  }, [location.search]);

  const producto = useMemo(() => productos.find(p => p.id === productoId), [productos, productoId]);
  useEffect(() => { setCleanBaseUrl(producto?.imagen_base_limpia_url || ''); }, [producto]);

  const cleanBaseTried = useRef(new Set());
  const tieneDiseno = !!(archivo || logoUrlSubido || texto || disenoPeyuUrl);
  useEffect(() => {
    if (!producto || !tieneDiseno || cleanBaseUrl || cleanBaseLoading) return;
    if (cleanBaseTried.current.has(producto.id)) return;
    cleanBaseTried.current.add(producto.id);
    setCleanBaseLoading(true);
    base44.functions.invoke('generateCleanBaseImage', { productoId: producto.id })
      .then(res => { if (res?.data?.clean_url) setCleanBaseUrl(res.data.clean_url); })
      .catch(() => {})
      .finally(() => setCleanBaseLoading(false));
  }, [producto, tieneDiseno, cleanBaseUrl, cleanBaseLoading]);

  const imagenesPorColor = useMemo(() => {
    const mapa = producto?.imagenes_por_color;
    if (mapa && typeof mapa === 'object') {
      const valid = Object.entries(mapa).filter(([, u]) => typeof u === 'string' && u.startsWith('http'));
      if (valid.length > 0) return Object.fromEntries(valid);
    }
    return null;
  }, [producto]);

  const colores = useMemo(() => (producto && !imagenesPorColor) ? getColoresProducto(producto) : [], [producto, imagenesPorColor]);
  const color = useMemo(() => colores.find(c => c.id === colorId), [colores, colorId]);
  const colorLabel = imagenesPorColor ? carcasaColorKey : (color?.label || colorId || null);

  const displayImg = useMemo(() => {
    if (!producto) return null;
    if (imagenesPorColor) return getProductImageForColor(producto, carcasaColorKey);
    return getProductImageForColor(producto, color || colorId);
  }, [producto, imagenesPorColor, carcasaColorKey, color, colorId]);

  useEffect(() => {
    if (imagenesPorColor) {
      const keys = Object.keys(imagenesPorColor);
      if (!carcasaColorKey || !keys.includes(carcasaColorKey)) setCarcasaColorKey(keys[0] || null);
      return;
    }
    setCarcasaColorKey(null);
    if (colores.length > 0 && !colores.find(c => c.id === colorId)) setColorId(colores[0].id);
    else if (colores.length === 0) setColorId(null);
  }, [colores, imagenesPorColor]); // eslint-disable-line

  const tipoPersonalizacion = useMemo(() => opcion === 'none' ? null : (opcion || null), [opcion]);
  const personalizacionCompleta = useMemo(() => {
    if (opcion === 'none') return true;
    if (opcion === 'frase') return texto.trim().length > 0;
    if (opcion === 'peyu') return !!disenoPeyuUrl;
    if (opcion === 'archivo') return !!(archivo || logoUrlSubido);
    return false;
  }, [opcion, texto, disenoPeyuUrl, archivo, logoUrlSubido]);

  const moqGratis = producto?.personalizacion_gratis_desde || producto?.moq_personalizacion || MOQ_PERSONALIZACION_GRATIS;
  const cargoPersonalizacionUnit = tipoPersonalizacion ? (PRECIO_PERSONALIZACION[tipoPersonalizacion] || 0) : 0;
  const personalizacionGratis = cantidad >= moqGratis;
  const cargoPersonalizacion = personalizacionGratis ? 0 : cargoPersonalizacionUnit * cantidad;
  const precioBaseProducto = producto ? (producto.precio_b2c || 9990) : 0;
  const subtotalProducto = precioBaseProducto * cantidad;
  const precioFinal = subtotalProducto + cargoPersonalizacion;

  const grabadoDefaults = useMemo(() => {
    const area = producto?.grabado_area;
    if (area && typeof area === 'object') return { size: area.size ?? 30, x: area.x ?? 50, y: area.y ?? 52 };
    const cat = (producto?.categoria || '').toLowerCase();
    if (cat.includes('carcasa')) return { size: 34, x: 50, y: 44 };
    if (cat.includes('hogar')) return { size: 30, x: 50, y: 50 };
    return { size: 30, x: 50, y: 52 };
  }, [producto]);

  const canAdvance = useMemo(() => {
    if (step === 0) return !!producto;
    if (step === 1) return true;
    if (step === 2) return !!opcion && personalizacionCompleta;
    return true;
  }, [step, producto, opcion, personalizacionCompleta]);

  const handleAddToCart = async () => {
    if (!producto) return;
    setLoading(true);
    let logoUrl = logoUrlSubido;
    if (archivo && !logoUrlSubido) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      logoUrl = file_url;
    }
    const personalizacionLabel = texto || (logoUrl ? '[Logo personalizado]' : (disenoPeyuUrl ? '[Diseño PEYU]' : null));
    const item = {
      id: Math.random(),
      productoId: producto.id,
      sku: producto.sku || null,
      nombre: producto.nombre,
      precio: precioBaseProducto,
      cargo_personalizacion: cargoPersonalizacionUnit,
      tipo_personalizacion: tipoPersonalizacion,
      moq_personalizacion: moqGratis,
      personalizacion_gratis_desde: moqGratis,
      cantidad,
      color: colorLabel,
      personalizacion: personalizacionLabel,
      imagen: displayImg,
      logoUrl: logoUrl || disenoPeyuUrl || null,
      disenoPeyuUrl: disenoPeyuUrl || null,
      mockupUrl: mockupUrl || null,
      posicion_grabado: 'centro',
    };
    const actual = JSON.parse(localStorage.getItem('carrito_v2') || '[]');
    localStorage.setItem('carrito_v2', JSON.stringify([...actual, item]));
    trackAddToCart({ ...item, sku: producto.sku, categoria: producto.categoria });
    const arteUrl = logoUrl || disenoPeyuUrl || null;
    base44.entities.PersonalizationJob.create({
      source_type: 'Pedido B2C', product_name: producto.nombre, sku: producto.sku,
      quantity: cantidad, laser_required: true, laser_text: texto, logo_url: arteUrl,
      design_type: tipoPersonalizacion, design_url: arteUrl, engrave_position: grabadoDefaults,
      color_producto: colorLabel || '', status: mockupUrl ? 'Preview generado' : 'Pendiente',
      mockup_urls: mockupUrl ? [mockupUrl] : [], estimated_minutes: 5,
    }).catch(() => {});
    setLoading(false);
    setDone(true);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (productosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto" style={{ borderColor: C.border, borderTopColor: C.action }} />
          <p className="text-sm font-semibold" style={{ color: C.fgMuted }}>Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bg }}>
        <div className="text-center space-y-4 max-w-sm">
          <Package className="w-12 h-12 mx-auto" style={{ color: C.fgMuted }} />
          <h2 className="text-xl font-bold" style={{ color: C.fg }}>Sin productos disponibles</h2>
          <Link to="/CatalogoNuevo" className="inline-block px-6 py-3 rounded-2xl text-white font-bold" style={{ background: C.actionGrad }}>
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 pb-8 pt-10" style={{ background: C.bg }}>
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-xl"
            style={{ background: C.actionGrad, boxShadow: C.actionShadow }}>
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-poppins font-bold mb-1" style={{ color: C.fg }}>¡Listo! Agregado al carrito</h2>
            <p className="text-sm" style={{ color: C.fgMuted }}>Tu personalización quedó guardada. Continúa para pagar.</p>
          </div>
          <div className="rounded-3xl p-4 text-left" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
            <div className="flex items-center gap-3">
              {(mockupUrl || displayImg) && (
                <img src={mockupUrl || displayImg} alt={producto?.nombre}
                  className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                  style={{ border: `1px solid ${C.border}` }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate" style={{ color: C.fg }}>{producto?.nombre} × {cantidad}</div>
                <div className="text-xs truncate mt-0.5" style={{ color: C.fgMuted }}>
                  {colorLabel || '—'}{texto ? ` · "${texto}"` : ''}{personalizacionGratis ? ' · grabado gratis ✓' : ''}
                </div>
              </div>
              <div className="font-poppins font-bold text-base flex-shrink-0" style={{ color: C.action }}>{fmtCLP(precioFinal)}</div>
            </div>
          </div>
          <div className="space-y-2">
            <button onClick={() => navigate('/CheckoutNuevo')}
              className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
              style={{ background: C.actionGrad, boxShadow: C.actionShadow }}>
              <ShoppingCart className="w-5 h-5" /> Ir a pagar · {fmtCLP(precioFinal)}
            </button>
            <button onClick={() => navigate('/CatalogoNuevo')}
              className="w-full h-12 rounded-2xl font-semibold text-sm"
              style={{ background: 'transparent', border: `1.5px solid ${C.border}`, color: C.fgSoft }}>
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PASO 0 — Elige tu producto ─────────────────────────────────────────────
  const StepProducto = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.action }}>Paso 1 de 4</p>
        <h2 className="text-xl lg:text-2xl font-poppins font-bold" style={{ color: C.fg }}>¿Qué quieres personalizar?</h2>
        <p className="text-sm mt-0.5" style={{ color: C.fgMuted }}>Grabado láser UV permanente · {productos.length} productos disponibles</p>
      </div>
      {/* Grid — 2 cols mobile, 3 cols desktop dentro del panel */}
      <div
        className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1"
        style={{ maxHeight: 'calc(100vh - 320px)', scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
      >
        {productos.map(p => {
          const sel = productoId === p.id;
          return (
            <button key={p.id}
              onClick={() => { setProductoId(p.id); setMockupUrl(''); }}
              className="relative rounded-2xl text-left transition-all group hover:-translate-y-0.5"
              style={{
                border: sel ? `2px solid ${C.action}` : `1.5px solid ${C.border}`,
                background: sel ? 'rgba(192,120,92,.08)' : C.surface,
                boxShadow: sel ? '0 4px 16px rgba(192,120,92,.18)' : '0 1px 4px rgba(44,24,16,.04)',
                padding: '10px',
              }}
            >
              {sel && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  style={{ background: C.action, boxShadow: C.actionShadow }}>
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
              <div className="aspect-square rounded-xl overflow-hidden mb-2 relative" style={{ background: C.bg }}>
                <img src={getProductImage(p)} alt={p.nombre}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={e => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1'; }} />
              </div>
              <div className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: C.fg }}>{p.nombre}</div>
              <div className="text-sm font-poppins font-bold mt-1 flex items-center justify-between">
                <span style={{ color: C.action }}>{fmtCLP(p.precio_b2c || 9990)}</span>
                {!sel && <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: C.fgMuted }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── PASO 1 — Elige el color ────────────────────────────────────────────────
  const StepColor = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.action }}>Paso 2 de 4</p>
        <h2 className="text-xl lg:text-2xl font-poppins font-bold" style={{ color: C.fg }}>Elige el color</h2>
        <p className="text-sm mt-0.5" style={{ color: C.fgMuted }}>
          {imagenesPorColor ? 'Escoge el acabado perfecto para tu producto' : 'Cada marmolado es único e irrepetible'}
        </p>
      </div>

      {/* En mobile mostramos imagen arriba; en desktop ya está en el panel lateral */}
      {displayImg && (
        <div className="lg:hidden flex justify-center">
          <img src={displayImg} alt={producto?.nombre}
            className="w-32 h-32 rounded-2xl object-cover shadow-md"
            style={{ border: `1.5px solid ${C.border}` }} />
        </div>
      )}

      {imagenesPorColor ? (
        <ColorPickerCarcasa
          imagenesPorColor={imagenesPorColor}
          selectedKey={carcasaColorKey}
          onSelect={(key) => { setCarcasaColorKey(key); setMockupUrl(''); }}
        />
      ) : colores.length === 0 ? (
        <div className="rounded-2xl p-5 text-center" style={{ background: C.greenSoft, border: `1.5px solid ${C.greenBorder}` }}>
          <CheckCircle className="w-7 h-7 mx-auto mb-2" style={{ color: C.green }} />
          <p className="text-sm font-bold" style={{ color: C.fg }}>Color natural único</p>
          <p className="text-xs mt-1" style={{ color: C.fgMuted }}>Este producto tiene su color original. Pasa al siguiente paso.</p>
        </div>
      ) : (
        // Colores en grid 2 cols en desktop
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {colores.map((c, idx) => {
            const sel = colorId === c.id;
            return (
              <button key={c.id}
                onClick={() => { setColorId(c.id); setMockupUrl(''); }}
                className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:-translate-y-0.5"
                style={{
                  border: sel ? `2px solid ${C.action}` : `1.5px solid ${C.border}`,
                  background: sel ? 'rgba(192,120,92,.06)' : C.surface,
                  boxShadow: sel ? '0 2px 12px rgba(192,120,92,.15)' : 'none',
                }}
              >
                <div className="w-10 h-10 rounded-xl border-2 flex-shrink-0 overflow-hidden" style={{ borderColor: C.border }}>
                  <MarbleSwatch hex={c.hex} seed={idx + 1} className="w-full h-full" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm" style={{ color: C.fg }}>{c.label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.fgMuted }}>Marmolado único · Reciclado</div>
                </div>
                {sel && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.action }}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: C.greenSoft, border: `1px solid ${C.greenBorder}` }}>
        <Recycle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: C.green }} />
        <p className="text-xs leading-relaxed" style={{ color: C.fgSoft }}>
          <strong style={{ color: C.fg }}>Hecho con tapitas recicladas de Santiago.</strong> Cada pieza tiene un patrón marmolado único, nunca habrá dos iguales.
        </p>
      </div>
    </div>
  );

  // ── PASO 2 — Personaliza el diseño ────────────────────────────────────────
  const tint = (() => {
    if (imagenesPorColor && carcasaColorKey) {
      const n = carcasaColorKey.toLowerCase();
      return ['negro', 'black', 'azul', 'blue', 'verde', 'green', 'morado', 'rojo', 'red'].some(d => n.includes(d)) ? 'light' : 'dark';
    }
    if (!imagenesPorColor && color?.hex) return parseInt(color.hex.replace('#', '').slice(0, 2), 16) < 130 ? 'light' : 'dark';
    return 'dark';
  })();

  const StepDiseno = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.action }}>Paso 3 de 4</p>
        <h2 className="text-xl lg:text-2xl font-poppins font-bold" style={{ color: C.fg }}>Personaliza tu diseño</h2>
        <p className="text-sm mt-0.5" style={{ color: C.fgMuted }}>Grabado láser UV · gratis desde {moqGratis} unidades</p>
      </div>

      {/* Preview láser — en desktop ocupamos más espacio */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${C.border}` }}>
        {mockupUrl ? (
          <div className="relative">
            <img src={mockupUrl} alt="Mockup IA" className="w-full h-auto" />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,.9)', color: C.action }}>
              <Sparkles className="w-3 h-3" /> Mockup IA
            </div>
          </div>
        ) : (
          <LaserEngravePreview
            productImageUrl={displayImg}
            cleanImageUrl={cleanBaseUrl}
            logoFile={opcion === 'archivo' ? archivo : null}
            logoUrl={opcion === 'archivo' ? logoUrlSubido : (opcion === 'peyu' ? disenoPeyuUrl : '')}
            texto={opcion === 'frase' ? texto : ''}
            areaLabel={producto?.area_laser_mm}
            defaultTint={tint}
          />
        )}
      </div>

      <PersonalizacionOptionPicker
        value={opcion}
        gratis={personalizacionGratis}
        moq={moqGratis}
        onSelect={(id) => {
          setOpcion(id);
          if (id !== 'frase') setTexto('');
          if (id !== 'peyu') setDisenoPeyuUrl('');
          if (id !== 'archivo') { setArchivo(null); setLogoUrlSubido(''); }
          if (mockupUrl) setMockupUrl('');
        }}
      />

      {opcion === 'frase' && (
        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: C.fgMuted }}>
            Texto a grabar (máx. 20 caracteres)
          </label>
          <input
            value={texto}
            onChange={e => { setTexto(e.target.value.slice(0, 20)); if (mockupUrl) setMockupUrl(''); }}
            placeholder="Tu nombre, empresa, frase..."
            className="w-full h-12 px-4 rounded-2xl text-center font-bold tracking-widest text-base outline-none transition-all"
            style={{ background: C.bg, border: `1.5px solid ${texto ? C.action : C.border}`, color: C.fg, boxShadow: texto ? `0 0 0 3px rgba(192,120,92,.12)` : 'none' }}
          />
          <p className="text-xs text-right mt-1 font-bold" style={{ color: texto.length >= 18 ? C.action : C.fgMuted }}>{texto.length}/20</p>
        </div>
      )}

      {opcion === 'peyu' && (
        <DisenosPeyuPicker selectedUrl={disenoPeyuUrl}
          onSelect={(url) => { setDisenoPeyuUrl(url); if (url) { setArchivo(null); setLogoUrlSubido(''); } if (mockupUrl) setMockupUrl(''); }} />
      )}

      {opcion === 'archivo' && (
        <div
          className="rounded-2xl p-5 text-center cursor-pointer transition-all"
          style={{ border: `2px dashed ${(archivo || logoUrlSubido) ? C.action : C.border}`, background: (archivo || logoUrlSubido) ? 'rgba(192,120,92,.06)' : C.bg }}
          onClick={() => document.getElementById('pers-logo-v2').click()}
        >
          <Upload className="w-7 h-7 mx-auto mb-2" style={{ color: (archivo || logoUrlSubido) ? C.action : C.fgMuted }} />
          {archivo ? <p className="text-sm font-bold" style={{ color: C.action }}>✓ {archivo.name}</p>
           : logoUrlSubido ? <p className="text-sm font-bold" style={{ color: C.action }}>✓ Logo cargado</p>
           : <><p className="text-sm font-semibold" style={{ color: C.fgSoft }}>Sube tu logo</p><p className="text-xs mt-0.5" style={{ color: C.fgMuted }}>PNG, SVG, AI, JPG · máx. 10MB</p></>}
          <input id="pers-logo-v2" type="file" className="hidden" accept=".png,.svg,.ai,.pdf,.jpg"
            onChange={e => { setArchivo(e.target.files[0]); setLogoUrlSubido(''); setDisenoPeyuUrl(''); if (mockupUrl) setMockupUrl(''); }} />
        </div>
      )}

      {opcion && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.fgMuted }}>Cantidad</p>
            {tipoPersonalizacion && (
              <p className="text-xs mt-0.5 font-semibold" style={{ color: personalizacionGratis ? C.green : C.fgMuted }}>
                {personalizacionGratis ? `✓ Grabado GRATIS desde ${moqGratis} u.` : `Faltan ${moqGratis - cantidad} u. para grabado gratis`}
              </p>
            )}
          </div>
          <QuantityStepper value={cantidad} onChange={setCantidad} min={1} />
        </div>
      )}

      {opcion && opcion !== 'none' && personalizacionCompleta && (
        <>
          <button
            onClick={() => setMockupModalOpen(true)}
            className="w-full rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              padding: '12px 16px',
              background: mockupUrl ? 'rgba(139,173,138,.18)' : C.actionGrad,
              border: mockupUrl ? `1.5px solid ${C.greenBorder}` : 'none',
              color: mockupUrl ? '#5B7D5A' : 'white',
              boxShadow: mockupUrl ? 'none' : C.actionShadow,
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{mockupUrl ? '✓ Mockup listo · click para ver o regenerar' : '✨ Generar mockup fotorrealista con IA'}</span>
          </button>
          <p className="text-[10px] text-center" style={{ color: C.fgMuted }}>
            {mockupUrl ? 'El mockup quedará adjunto como referencia de producción.' : 'Toma ~10 seg · La IA simula el grabado sobre tu producto.'}
          </p>
        </>
      )}
    </div>
  );

  // ── PASO 3 — Confirmar ────────────────────────────────────────────────────
  const StepConfirmar = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: C.action }}>Paso 4 de 4</p>
        <h2 className="text-xl lg:text-2xl font-poppins font-bold" style={{ color: C.fg }}>Revisa y agrega al carrito</h2>
        <p className="text-sm mt-0.5" style={{ color: C.fgMuted }}>Confirma tu personalización antes de pagar</p>
      </div>

      {mockupUrl ? (
        <div className="rounded-2xl overflow-hidden relative" style={{ border: `2px solid ${C.green}` }}>
          <img src={mockupUrl} alt="Tu mockup personalizado" className="w-full object-contain" style={{ maxHeight: '280px', background: C.bg }} />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,.92)', color: C.green }}>
            <CheckCircle className="w-3 h-3" /> Mockup aprobado
          </div>
          <button onClick={() => setMockupModalOpen(true)}
            className="absolute top-2 right-2 px-2.5 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,255,255,.92)', color: C.action }}>
            Cambiar
          </button>
        </div>
      ) : (
        <button onClick={() => setMockupModalOpen(true)}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:-translate-y-0.5"
          style={{ border: `1.5px dashed ${C.border}`, background: C.bg }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: C.greenSoft, border: `1px solid ${C.greenBorder}` }}>
            <Sparkles className="w-5 h-5" style={{ color: C.green }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold" style={{ color: C.fg }}>¿Quieres ver el mockup?</p>
            <p className="text-xs mt-0.5" style={{ color: C.fgMuted }}>Vista fotorrealista con IA · opcional</p>
          </div>
          <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: C.fgMuted }} />
        </button>
      )}

      {/* Resumen del pedido */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, background: C.surface }}>
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          {(mockupUrl || displayImg) && (
            <img src={mockupUrl || displayImg} alt={producto?.nombre}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              style={{ border: `1px solid ${C.border}` }} />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: C.fg }}>{producto?.nombre}</p>
            {colorLabel && <p className="text-xs mt-0.5" style={{ color: C.fgMuted }}>Color: {colorLabel}</p>}
            {texto && <p className="text-xs mt-0.5 font-semibold" style={{ color: C.action }}>"{texto}"</p>}
            {disenoPeyuUrl && <p className="text-xs mt-0.5" style={{ color: C.action }}>+ Diseño PEYU</p>}
            {(archivo || logoUrlSubido) && <p className="text-xs mt-0.5" style={{ color: C.action }}>+ Tu logo adjunto</p>}
            {mockupUrl && <p className="text-xs mt-0.5 font-semibold" style={{ color: C.green }}>✓ Mockup listo</p>}
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.fgMuted }}>Cantidad</p>
            {tipoPersonalizacion && (
              <p className="text-xs mt-0.5 font-semibold" style={{ color: personalizacionGratis ? C.green : C.fgMuted }}>
                {personalizacionGratis ? `✓ Grabado GRATIS desde ${moqGratis} u.` : `+${fmtCLP(cargoPersonalizacion)} por grabado`}
              </p>
            )}
          </div>
          <QuantityStepper value={cantidad} onChange={setCantidad} min={1} />
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm" style={{ color: C.fgMuted }}>
            <span>Producto × {cantidad}</span><span>{fmtCLP(subtotalProducto)}</span>
          </div>
          {tipoPersonalizacion && (
            <div className="flex justify-between text-sm">
              <span style={{ color: C.fgMuted }}>Personalización {PERSONALIZACION_LABEL[tipoPersonalizacion]}</span>
              <span className="font-bold" style={{ color: personalizacionGratis ? C.green : C.fg }}>
                {personalizacionGratis ? 'GRATIS ✓' : `+${fmtCLP(cargoPersonalizacion)}`}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span className="font-bold text-sm" style={{ color: C.fg }}>Total</span>
            <span className="font-poppins font-bold text-lg" style={{ color: C.action }}>{fmtCLP(precioFinal)}</span>
          </div>
          <p className="text-[10px] text-center" style={{ color: C.fgMuted }}>+ IVA 19% · Envío calculado en checkout</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: ShieldCheck, label: '10 años garantía', color: C.action },
          { icon: Recycle, label: '100% reciclado', color: C.green },
          { icon: Truck, label: 'Envío a Chile', color: C.fgSoft },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <Icon className="w-5 h-5" style={{ color }} />
            <span className="text-[10px] font-semibold leading-tight" style={{ color: C.fgSoft }}>{label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 py-1">
        {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#F5A623' }} />)}
        <span className="text-xs font-semibold ml-1" style={{ color: C.fgMuted }}>+1.200 personalizaciones entregadas</span>
      </div>
    </div>
  );

  const stepsContent = [StepProducto, StepColor, StepDiseno, StepConfirmar];

  const ctaLabel = step < 3
    ? step === 2 && opcion && personalizacionCompleta ? `Confirmar diseño → ${fmtCLP(precioFinal)}` : 'Continuar'
    : loading ? 'Agregando...' : `Agregar al carrito · ${fmtCLP(precioFinal)}`;

  const handleCTA = () => {
    if (step < 3) setStep(s => s + 1);
    else handleAddToCart();
  };

  // ── LAYOUT PRINCIPAL ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-inter" style={{ background: C.bg }}>
      <PublicSEO
        pageKey="personalizar"
        breadcrumbs={[
          { name: 'Inicio', url: 'https://peyuchile.cl/' },
          { name: 'Personalizar', url: 'https://peyuchile.cl/personalizar' },
        ]}
      />

      {/* ── TOP NAV (mobile) + full-width header desktop ─────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(248,243,237,.97)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 1px 10px rgba(44,24,16,.07)' }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex items-center gap-3">
          {/* Volver */}
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white"
              style={{ border: `1.5px solid ${C.border}` }}>
              <ArrowLeft className="w-4 h-4" style={{ color: C.fgSoft }} />
            </button>
          ) : (
            <Link to="/CatalogoNuevo"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white"
              style={{ border: `1.5px solid ${C.border}` }}>
              <ArrowLeft className="w-4 h-4" style={{ color: C.fgSoft }} />
            </Link>
          )}

          {/* Logo (solo desktop) */}
          <Link to="/" className="hidden lg:block flex-shrink-0 group mr-4">
            <img src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU" className="h-8 w-auto group-hover:scale-105 transition-transform" draggable={false} />
          </Link>

          {/* Brand mobile */}
          <div className="flex items-center gap-2 lg:hidden flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.actionGrad }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-poppins font-bold text-sm leading-tight" style={{ color: C.fg }}>Personalización PEYU</p>
              <p className="text-[10px] leading-tight font-semibold" style={{ color: C.action }}>Grabado láser UV · Gratis desde 10u</p>
            </div>
          </div>

          {/* Desktop: steps inline en header */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <button key={i}
                  onClick={() => done && setStep(i)}
                  disabled={!done && !active}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    background: active ? 'rgba(192,120,92,.10)' : 'transparent',
                    border: active ? `1.5px solid ${C.action}` : '1.5px solid transparent',
                    cursor: done ? 'pointer' : 'default',
                    opacity: !done && !active ? 0.5 : 1,
                  }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: done ? C.action : active ? C.actionGrad : C.border }}>
                    {done ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      : <s.Icon className="w-2.5 h-2.5" style={{ color: active ? 'white' : C.fgMuted }} />}
                  </div>
                  <span className="text-xs font-bold" style={{ color: active ? C.action : done ? C.fgSoft : C.fgMuted }}>
                    {s.label}
                  </span>
                  {i < 3 && <ChevronRight className="w-3 h-3 ml-1" style={{ color: C.border }} />}
                </button>
              );
            })}
          </div>

          {/* Step counter mobile */}
          <span className="lg:hidden text-xs font-bold" style={{ color: C.fgMuted }}>{step + 1}/4</span>

          {/* Desktop: precio + CTA botón en header */}
          {canAdvance && (
            <button
              onClick={handleCTA}
              disabled={loading}
              className="hidden lg:flex items-center gap-2 px-5 h-10 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: C.actionGrad, boxShadow: C.actionShadow, flexShrink: 0 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 3 ? <ShoppingCart className="w-4 h-4" /> : null}
              <span>{step === 3 ? `Agregar · ${fmtCLP(precioFinal)}` : 'Continuar'}</span>
              {step < 3 && !loading && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Mobile progress bar */}
        <MobileProgressBar step={step} />
      </header>

      {/* ── BODY: 2 cols desktop, 1 col mobile ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
        <div className="flex gap-8 items-start">

          {/* Panel izquierdo desktop */}
          <DesktopLeftPanel
            producto={producto}
            displayImg={displayImg}
            colorLabel={colorLabel}
            texto={texto}
            disenoPeyuUrl={disenoPeyuUrl}
            archivo={archivo}
            logoUrlSubido={logoUrlSubido}
            mockupUrl={mockupUrl}
            precioFinal={precioFinal}
            cantidad={cantidad}
            step={step}
            onGoTo={setStep}
          />

          {/* Contenido principal del paso */}
          <div className="flex-1 min-w-0 pb-32 lg:pb-8">
            <div className="rounded-3xl p-5 lg:p-7 shadow-sm" style={{ background: C.surface, border: `1.5px solid ${C.border}` }}>
              {stepsContent[step]}
            </div>

            {/* CTA desktop inline (debajo del card) */}
            <div className="hidden lg:block mt-4">
              <div className="flex items-center gap-4">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="h-12 px-5 rounded-2xl font-semibold text-sm flex items-center gap-2 transition-all hover:bg-white"
                    style={{ border: `1.5px solid ${C.border}`, color: C.fgSoft }}>
                    <ArrowLeft className="w-4 h-4" /> Volver
                  </button>
                )}
                <button
                  onClick={handleCTA}
                  disabled={!canAdvance || loading}
                  className="flex-1 h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 hover:-translate-y-0.5"
                  style={{ background: canAdvance ? C.actionGrad : C.border, boxShadow: canAdvance ? C.actionShadow : 'none' }}
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Agregando...</>
                    : <>{step === 3 && <ShoppingCart className="w-5 h-5" />}<span>{ctaLabel}</span>{step < 3 && <ArrowRight className="w-5 h-5" />}</>}
                </button>
              </div>
              {!canAdvance && step === 0 && <p className="text-center text-xs mt-2 font-semibold" style={{ color: C.fgMuted }}>Elige un producto para continuar</p>}
              {!canAdvance && step === 2 && <p className="text-center text-xs mt-2 font-semibold" style={{ color: C.fgMuted }}>{!opcion ? 'Elige qué tipo de grabado quieres' : 'Completa tu diseño para continuar'}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA MOBILE STICKY ────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          paddingTop: '10px',
          background: 'rgba(248,243,237,.97)',
          borderTop: `1.5px solid ${C.border}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 -4px 20px rgba(44,24,16,.10)',
        }}>
        {step >= 1 && producto && (
          <div className="flex items-center gap-2 mb-2 px-1">
            {(mockupUrl || displayImg) && (
              <img src={mockupUrl || displayImg} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                style={{ border: `1px solid ${C.border}` }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: C.fg }}>{producto.nombre}</p>
              {colorLabel && <p className="text-[10px]" style={{ color: C.fgMuted }}>{colorLabel}</p>}
            </div>
            <span className="text-sm font-poppins font-bold flex-shrink-0" style={{ color: C.action }}>{fmtCLP(precioFinal)}</span>
          </div>
        )}
        <button
          onClick={handleCTA}
          disabled={!canAdvance || loading}
          className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: canAdvance ? C.actionGrad : C.border, boxShadow: canAdvance ? C.actionShadow : 'none' }}
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Agregando...</>
            : <>{step === 3 && <ShoppingCart className="w-5 h-5" />}<span>{ctaLabel}</span>{step < 3 && <ArrowRight className="w-5 h-5" />}</>}
        </button>
        {!canAdvance && step === 0 && <p className="text-center text-xs mt-1.5 font-semibold" style={{ color: C.fgMuted }}>Elige un producto para continuar</p>}
        {!canAdvance && step === 2 && <p className="text-center text-xs mt-1.5 font-semibold" style={{ color: C.fgMuted }}>{!opcion ? 'Elige qué tipo de grabado quieres' : 'Completa tu diseño para continuar'}</p>}
      </div>

      <MockupGenerator
        open={mockupModalOpen}
        onOpenChange={setMockupModalOpen}
        productName={producto?.nombre}
        productCategory={producto?.categoria || 'Personalización'}
        productSku={producto?.sku}
        productImageUrl={displayImg}
        initialText={opcion === 'frase' ? texto : ''}
        initialColor={colorLabel || ''}
        initialResultUrl={mockupUrl}
        onLogoUploaded={(url) => { if (url) { setLogoUrlSubido(url); setArchivo(null); } }}
        onGenerated={(url) => { if (url) setMockupUrl(url); }}
      />
    </div>
  );
}