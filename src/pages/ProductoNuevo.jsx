import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Recycle, ShieldCheck, Truck, Check, Loader2, ShoppingBag, Sparkles,
} from 'lucide-react';
import ShopV2Header from '@/components/shopv2/ShopV2Header';
import ColorSwatchesV2 from '@/components/shopv2/ColorSwatchesV2';
import PersonalizacionPickerV2 from '@/components/shopv2/PersonalizacionPickerV2';
import PriceBreakdownV2 from '@/components/shopv2/PriceBreakdownV2';
import QtyStepperV2 from '@/components/shopv2/QtyStepperV2';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';
import { getColoresProducto } from '@/lib/color-parser';
import {
  PRECIO_PERSONALIZACION, PERSONALIZACION_LABEL, MOQ_PERSONALIZACION_GRATIS,
} from '@/lib/personalizacion-config';
import { addToCartV2, fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// /ProductoNuevo?id= — Ficha de producto del Shop v2. Coordina:
// foto por color real · personalización excluyente · cantidad · precio en vivo
// · add-to-cart al carrito_v2 (aislado). NO toca lógica legacy.
// ════════════════════════════════════════════════════════════════════════
export default function ProductoNuevo() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = new URLSearchParams(location.search).get('id');

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado del configurador
  const [colorId, setColorId] = useState(null);
  const [opcion, setOpcion] = useState('none');
  const [texto, setTexto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [colorError, setColorError] = useState(false);
  const [added, setAdded] = useState(false);

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

  // Foto = variante del color elegido (real, NO IA). Si no hay color elegido,
  // muestra la imagen principal del producto.
  const displayImg = useMemo(() => {
    if (!producto) return null;
    if (color) return getProductImageForColor(producto, color);
    return getProductImage(producto);
  }, [producto, color]);

  const precioUnit = producto?.precio_b2c || 9990;
  const moq = producto?.personalizacion_gratis_desde || producto?.moq_personalizacion || MOQ_PERSONALIZACION_GRATIS;
  const tipo = opcion === 'none' ? null : opcion;
  const feeUnit = tipo ? (PRECIO_PERSONALIZACION[tipo] || 0) : 0;
  const gratis = cantidad >= moq;
  const feeTotal = gratis ? 0 : feeUnit * cantidad;
  const total = precioUnit * cantidad + feeTotal;

  // ¿La opción de personalización elegida está completa?
  const persOk = opcion === 'none' || opcion !== 'frase' || texto.trim().length > 0;

  const handleAdd = () => {
    if (requiereColor && !colorId) {
      setColorError(true);
      document.querySelector('[data-color-selector]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!persOk) return;

    addToCartV2({
      productoId: producto.id,
      sku: producto.sku || null,
      nombre: producto.nombre,
      precio: precioUnit,
      cargo_personalizacion: feeUnit,
      tipo_personalizacion: tipo,
      moq_personalizacion: moq,
      personalizacion_gratis_desde: moq,
      cantidad,
      color: color?.label || null,
      personalizacion: opcion === 'frase' ? texto : (tipo ? PERSONALIZACION_LABEL[tipo] : null),
      imagen: displayImg,
    });
    setAdded(true);
    setTimeout(() => navigate('/CarritoNuevo'), 700);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF7EF]">
        <ShopV2Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-[#0F8B6C] animate-spin" />
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-[#FBF7EF] font-inter">
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
    <div className="min-h-screen bg-[#FBF7EF] font-inter text-[#2A2420]">
      <ShopV2Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/CatalogoNuevo" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4B4F54] hover:text-[#0F8B6C] mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a la tienda
        </Link>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
          {/* GALERÍA */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-[#E7D8C6] shadow-lg">
              <img
                src={displayImg}
                alt={producto.nombre}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.src = getProductImage(producto); }}
              />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-[11px] font-bold px-2.5 py-1.5 rounded-full text-[#0F8B6C] shadow-sm">
                <Recycle className="w-3.5 h-3.5" />
                {esCompostable ? 'Compostable' : '100% Reciclado'}
              </span>
            </div>
          </div>

          {/* CONFIGURADOR */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#A78B6F] mb-1.5">
                {producto.categoria?.replace(' B2C', '')}
              </p>
              <h1 className="font-fraunces text-3xl sm:text-4xl leading-tight mb-2">{producto.nombre}</h1>
              <p className="font-poppins font-bold text-2xl text-[#0F8B6C]">{fmtCLP(precioUnit)}</p>
              {producto.descripcion && (
                <p className="text-sm text-[#4B4F54] leading-relaxed mt-3">{producto.descripcion}</p>
              )}
            </div>

            {/* Color */}
            {colores.length > 0 && (
              <ColorSwatchesV2
                colores={colores}
                value={colorId}
                onSelect={(v) => { setColorId(v); setColorError(false); }}
                error={colorError}
              />
            )}

            {/* Personalización */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="w-4 h-4 text-[#D96B4D]" />
                <label className="text-sm font-bold text-[#2A2420]">Personalización (opcional)</label>
              </div>
              <PersonalizacionPickerV2
                value={opcion}
                onSelect={(o) => { setOpcion(o); if (o !== 'frase') setTexto(''); }}
                gratis={gratis}
                moq={moq}
              />
              {opcion === 'frase' && (
                <div className="mt-3">
                  <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value.slice(0, 20))}
                    placeholder="Tu nombre, frase o empresa..."
                    className="w-full h-11 px-4 rounded-xl bg-white border border-[#E7D8C6] text-center font-bold tracking-wide text-[#2A2420] placeholder:text-[#A78B6F] focus:outline-none focus:border-[#0F8B6C] focus:ring-2 focus:ring-[#0F8B6C]/15"
                  />
                  <p className="text-[11px] text-right text-[#A78B6F] mt-1 font-bold">{texto.length}/20</p>
                </div>
              )}
              {(opcion === 'peyu' || opcion === 'archivo') && (
                <p className="text-[11px] text-[#A78B6F] mt-2 leading-relaxed">
                  Coordinaremos el diseño contigo después de la compra para asegurar el mejor resultado del grabado.
                </p>
              )}
            </div>

            {/* Cantidad */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-[#2A2420]">Cantidad</span>
                {tipo && (
                  <p className={`text-[11px] mt-0.5 font-semibold ${gratis ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`}>
                    {gratis ? `✓ Grabado GRATIS desde ${moq}u` : `Faltan ${moq - cantidad}u para grabado gratis`}
                  </p>
                )}
              </div>
              <QtyStepperV2 value={cantidad} onChange={setCantidad} min={1} />
            </div>

            {/* Precio en vivo */}
            <PriceBreakdownV2
              precioUnit={precioUnit}
              cantidad={cantidad}
              tipoLabel={tipo ? PERSONALIZACION_LABEL[tipo] : null}
              feeUnit={feeUnit}
              feeTotal={feeTotal}
              gratis={gratis}
            />

            {/* CTA */}
            <button
              onClick={handleAdd}
              disabled={added || !persOk}
              className="w-full h-14 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
            >
              {added ? (
                <><Check className="w-5 h-5" /> ¡Agregado!</>
              ) : (
                <><ShoppingBag className="w-5 h-5" /> Agregar al carrito · {fmtCLP(total)}</>
              )}
            </button>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon: ShieldCheck, t: 'Garantía 10 años' },
                { icon: Truck, t: 'Envío a todo Chile' },
                { icon: Recycle, t: 'Plástico reciclado' },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 bg-white border border-[#E7D8C6] rounded-xl p-3 text-center">
                  <b.icon className="w-4 h-4 text-[#0F8B6C]" />
                  <span className="text-[10px] font-bold text-[#4B4F54] leading-tight">{b.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}