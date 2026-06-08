import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, Check, Smartphone, Wand2, ChevronDown } from 'lucide-react';
import CarcasaPickerAccordion from '@/components/shopv2/CarcasaPickerAccordion';
import ColorSwatchesV2 from '@/components/shopv2/ColorSwatchesV2';
import PersonalizadorV2 from '@/components/shopv2/PersonalizadorV2';
import MockupLivePreviewV2 from '@/components/shopv2/MockupLivePreviewV2';
import PriceBreakdownV2 from '@/components/shopv2/PriceBreakdownV2';
import QtyStepperV2 from '@/components/shopv2/QtyStepperV2';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';
import { getColoresProducto } from '@/lib/color-parser';
import { modeloDe, modelosDisponibles } from '@/lib/phone-models-v2';
import { MOQ_PERSONALIZACION_GRATIS } from '@/lib/personalizacion-config';
import { getQtyDiscountPct } from '@/lib/volume-discount';
import { addToCartV2, fmtCLP } from '@/lib/shop-v2-cart';
import { saveDraftV2, loadDraftV2, clearDraftV2 } from '@/lib/shop-v2-draft';
import {
  PERS_VACIO, tiposActivos, feeUnitarioCombinado, labelCombinada,
  resumenPersonalizacion, persCompleta, hayAlgunoActivado,
} from '@/lib/pers-combinable';
import { getProductEngraggingArea, isProductoCarcasa } from '@/lib/product-engraving-areas';
import { applyAutoPlacement } from '@/lib/auto-placement';

// ════════════════════════════════════════════════════════════════════════
// Configurador EN VIVO de la home v2 (Tema 6). Modelo → color real → tipo de
// personalización → preview en vivo → breakdown IVA → add-to-cart (carrito_v2).
// Reutiliza la lógica real ya existente. carcasas = lista de productos carcasa.
// ════════════════════════════════════════════════════════════════════════
export default function LiveConfiguratorV2({ carcasas = [] }) {
  const navigate = useNavigate();

  // Selección desde el accordion: { productoId, producto, colorId, color }
  const [pickerSelection, setPickerSelection] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // Producto carcasa activo: viene del picker o es el primero del catálogo.
  const producto = useMemo(
    () => pickerSelection?.producto || carcasas[0] || null,
    [pickerSelection, carcasas]
  );
  
  // Deduce automáticamente el área de estampado del producto.
  const engraggingArea = useMemo(() => getProductEngraggingArea(producto), [producto]);

  // Estado del configurador
  const [colorId, setColorId] = useState(null);
  const [pers, setPers] = useState(PERS_VACIO);
  const [placements, setPlacements] = useState({});
  const [cantidad, setCantidad] = useState(1);
  const [colorError, setColorError] = useState(false);
  const [added, setAdded] = useState(false);
  const mockupRef = useRef(null);

  const colores = useMemo(() => (producto ? getColoresProducto(producto) : []), [producto]);
  const requiereColor = colores.length > 1;
  const color = useMemo(() => colores.find((c) => c.id === colorId), [colores, colorId]);

  // Si el picker tiene color seleccionado, sincronízalo al colorId
  useEffect(() => {
    if (pickerSelection?.colorId) {
      setColorId(pickerSelection.colorId);
    }
  }, [pickerSelection]);

  // Al cambiar de producto/modelo: restaura el borrador guardado de ESE producto
  // si existe (auto-guardado), o resetea a estado limpio. Así la configuración
  // sobrevive recargas y cambios de modelo sin perderse.
  useEffect(() => {
    if (!producto) return;
    const draft = loadDraftV2(producto.id);
    if (draft) {
      // Validamos que el color guardado siga existiendo en este producto.
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
    setColorError(false);
  }, [producto, colores]);

  // Auto-guardado: cada cambio de configuración persiste el borrador del producto
  // actual. Garantiza que al pasar al carrito (o recargar) nada se pierda.
  useEffect(() => {
    if (!producto) return;
    saveDraftV2(producto.id, { colorId, pers, placements, cantidad });
  }, [producto, colorId, pers, placements, cantidad]);

  // Auto-placement: cuando se selecciona un logo/diseño, automáticamente se coloca
  // en la posición predeterminada del producto (carcasa = centro siempre).
  useEffect(() => {
    if (!producto) return;
    applyAutoPlacement(producto, pers, setPlacements);
  }, [producto, pers.logoUrl, pers.disenoPeyuUrl, pers.texto]);

  const precioUnit = producto?.precio_b2c || 9990;
  const moq = producto?.personalizacion_gratis_desde || producto?.moq_personalizacion || MOQ_PERSONALIZACION_GRATIS;
  const activos = useMemo(() => tiposActivos(pers), [pers]);
  const feeUnit = useMemo(() => feeUnitarioCombinado(pers), [pers]);
  const gratis = cantidad >= moq;
  const feeTotal = gratis ? 0 : feeUnit * cantidad;
  // Descuento automático B2C por cantidad del mismo producto (2u → 10% · 3+u → 15%).
  const descuentoPct = getQtyDiscountPct(cantidad);
  const descuentoMonto = Math.floor(precioUnit * cantidad * (descuentoPct / 100));
  const total = precioUnit * cantidad + feeTotal - descuentoMonto;

  // Capas (combinables) para el mockup. ORDEN FIJO de apilado (arriba→abajo):
  // 1) Tu logo  2) Diseño PEYU  3) Frase. Mismo orden en mockup y controles.
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

  // Preview en vivo: imagen del color elegido o principal.
  const previewImg = useMemo(() => {
    if (!producto) return null;
    return color ? getProductImageForColor(producto, color) : getProductImage(producto);
  }, [producto, color]);

  const handleAdd = async () => {
    if (!producto) return;
    if (requiereColor && !colorId) { setColorError(true); return; }
    if (!persOk) return;

    // Captura el snapshot del canvas (foto base + grabado) como mockupUrl real.
    let mockupUrl = muestraMockup ? previewImg : null;
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
      imagen_base: previewImg,
      imagen: previewImg,
    });
    clearDraftV2(producto.id);
    setAdded(true);
    setTimeout(() => navigate('/CarritoNuevo'), 700);
  };

  if (!producto) return null;

  return (
    <section id="configurador" className="max-w-6xl mx-auto px-4 sm:px-6 mb-14 scroll-mt-20">
      <div className="text-center mb-7">
        <span className="inline-flex items-center gap-1.5 bg-[#D96B4D]/10 text-[#D96B4D] text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          <Wand2 className="w-3.5 h-3.5" /> Diséñala en segundos
        </span>
        <h2 className="font-fraunces text-3xl sm:text-4xl">Crea tu carcasa</h2>
        <p className="text-[#4B4F54] text-sm mt-1.5">Elige modelo, color y personalización. El precio se actualiza en vivo.</p>
      </div>

      <div className="bg-white border border-[#EBE3D6] rounded-[2rem] p-4 sm:p-7 shadow-[0_24px_60px_-30px_rgba(74,63,51,0.4)]">
        <div className="grid lg:grid-cols-2 gap-7 lg:gap-10">
          {/* PREVIEW en vivo — mockup interactivo si hay diseño, foto si no */}
          <div className="lg:sticky lg:top-24 self-start">
            {muestraMockup ? (
              <MockupLivePreviewV2
                ref={mockupRef}
                productImageUrl={previewImg}
                fallbackUrl={getProductImage(producto)}
                capas={capas}
                onPlacementChange={setPlacements}
                esCarcasa={true}
                customArea={engraggingArea}
              />
            ) : (
              <div className="relative aspect-square rounded-[1.75rem] overflow-hidden bg-[#FAF7F2] border border-[#EBE3D6]">
                {previewImg && (
                  <img src={previewImg} alt={producto.nombre} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-all duration-500" />
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-[10px] font-bold px-2.5 py-1 rounded-full text-[#0F8B6C] shadow-sm">
                  <Sparkles className="w-3 h-3" /> Vista previa
                </span>
              </div>
            )}
          </div>

          {/* CONTROLES */}
          <div className="space-y-5">
            {/* Modelo — accordion expandible */}
            <div>
              <button
                onClick={() => setShowPicker((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all hover:border-[#0F8B6C]/40"
                style={{ background: 'white', border: '1.5px solid #D4C4B0' }}
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#0F8B6C]" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#2A2420]">
                      {producto ? producto.nombre : 'Elige tu modelo'}
                    </p>
                    {pickerSelection?.color && (
                      <p className="text-[11px] text-[#A08070]">Color: {pickerSelection.color.label}</p>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#A08070] transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} />
              </button>

              {showPicker && (
                <div className="mt-2">
                  <CarcasaPickerAccordion
                    carcasas={carcasas}
                    selected={pickerSelection}
                    onSelect={(sel) => {
                      setPickerSelection(sel);
                      setShowPicker(false);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Color */}
            {colores.length > 0 && (
              <ColorSwatchesV2
                colores={colores}
                value={colorId}
                onSelect={(v) => { setColorId(v); setColorError(false); }}
                error={colorError}
                producto={producto}
              />
            )}

            {/* Personalización — circuito completo (frase / PEYU / logo) */}
            <PersonalizadorV2 pers={pers} setPers={setPers} gratis={gratis} moq={moq} />

            {/* Cantidad */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-[#2A2420]">Cantidad</span>
                {activos.length > 0 && (
                  <p className={`text-[11px] mt-0.5 font-semibold ${gratis ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`}>
                    {gratis ? `✓ Grabado GRATIS desde ${moq}u` : `Faltan ${moq - cantidad}u para grabado gratis`}
                  </p>
                )}
                {descuentoPct > 0 ? (
                  <p className="text-[11px] mt-0.5 font-bold text-[#0F8B6C]">✓ Descuento {descuentoPct}% por {cantidad}u aplicado</p>
                ) : (
                  <p className="text-[11px] mt-0.5 font-semibold text-[#A78B6F]">Lleva 2u y ahorra 10% · 3u → 15%</p>
                )}
              </div>
              <QtyStepperV2 value={cantidad} onChange={setCantidad} min={1} />
            </div>

            {/* Breakdown en vivo */}
            <PriceBreakdownV2
              precioUnit={precioUnit}
              cantidad={cantidad}
              tipoLabel={labelCombinada(pers)}
              feeUnit={feeUnit}
              feeTotal={feeTotal}
              gratis={gratis}
              descuentoPct={descuentoPct}
              descuentoMonto={descuentoMonto}
              productoNombre={producto.nombre}
              colorLabel={color?.label || null}
            />

            {/* CTA */}
            <button
              onClick={handleAdd}
              disabled={added || !persOk}
              className="w-full h-14 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
            >
              {added ? (
                <><Check className="w-5 h-5" /> ¡Agregado!</>
              ) : hayAlgunoActivado(pers) && !pers.aprobada ? (
                <><Sparkles className="w-5 h-5" /> Aprueba tu personalización</>
              ) : (
                <><ShoppingBag className="w-5 h-5" /> Agregar al carro · {fmtCLP(total)}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}