import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShoppingBag, Check, Smartphone, Wand2 } from 'lucide-react';
import ColorSwatchesV2 from '@/components/shopv2/ColorSwatchesV2';
import PersonalizacionPickerV2 from '@/components/shopv2/PersonalizacionPickerV2';
import PriceBreakdownV2 from '@/components/shopv2/PriceBreakdownV2';
import QtyStepperV2 from '@/components/shopv2/QtyStepperV2';
import { getProductImage, getProductImageForColor } from '@/utils/productImages';
import { getColoresProducto } from '@/lib/color-parser';
import { modeloDe, modelosDisponibles } from '@/lib/phone-models-v2';
import {
  PRECIO_PERSONALIZACION, PERSONALIZACION_LABEL, MOQ_PERSONALIZACION_GRATIS,
} from '@/lib/personalizacion-config';
import { addToCartV2, fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// Configurador EN VIVO de la home v2 (Tema 6). Modelo → color real → tipo de
// personalización → preview en vivo → breakdown IVA → add-to-cart (carrito_v2).
// Reutiliza la lógica real ya existente. carcasas = lista de productos carcasa.
// ════════════════════════════════════════════════════════════════════════
export default function LiveConfiguratorV2({ carcasas = [] }) {
  const navigate = useNavigate();

  // Modelos disponibles desde el catálogo real.
  const modelos = useMemo(() => modelosDisponibles(carcasas), [carcasas]);
  const [modelo, setModelo] = useState(null);

  useEffect(() => { if (modelos.length && !modelo) setModelo(modelos[0]); }, [modelos, modelo]);

  // Producto carcasa que matchea el modelo elegido.
  const producto = useMemo(
    () => carcasas.find((p) => modeloDe(p) === modelo) || carcasas[0] || null,
    [carcasas, modelo]
  );

  // Estado del configurador
  const [colorId, setColorId] = useState(null);
  const [opcion, setOpcion] = useState('none');
  const [texto, setTexto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [colorError, setColorError] = useState(false);
  const [added, setAdded] = useState(false);

  const colores = useMemo(() => (producto ? getColoresProducto(producto) : []), [producto]);
  const requiereColor = colores.length > 1;
  const color = useMemo(() => colores.find((c) => c.id === colorId), [colores, colorId]);

  // Al cambiar de producto/modelo, resetea color (1 solo → fija).
  useEffect(() => {
    if (colores.length === 1) setColorId(colores[0].id);
    else setColorId(null);
    setColorError(false);
  }, [colores]);

  const precioUnit = producto?.precio_b2c || 9990;
  const moq = producto?.personalizacion_gratis_desde || producto?.moq_personalizacion || MOQ_PERSONALIZACION_GRATIS;
  const tipo = opcion === 'none' ? null : opcion;
  const feeUnit = tipo ? (PRECIO_PERSONALIZACION[tipo] || 0) : 0;
  const gratis = cantidad >= moq;
  const feeTotal = gratis ? 0 : feeUnit * cantidad;
  const total = precioUnit * cantidad + feeTotal;

  const persOk = opcion === 'none' || opcion !== 'frase' || texto.trim().length > 0;

  // Preview en vivo: imagen del color elegido o principal.
  const previewImg = useMemo(() => {
    if (!producto) return null;
    return color ? getProductImageForColor(producto, color) : getProductImage(producto);
  }, [producto, color]);

  const handleAdd = () => {
    if (!producto) return;
    if (requiereColor && !colorId) { setColorError(true); return; }
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
      imagen: previewImg,
    });
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
          {/* PREVIEW en vivo */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="relative aspect-square rounded-[1.75rem] overflow-hidden bg-[#FAF7F2] border border-[#EBE3D6]">
              {previewImg && (
                <img src={previewImg} alt={producto.nombre} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-all duration-500" />
              )}
              {/* Overlay de la frase (preview grabado en vivo) */}
              {opcion === 'frase' && texto.trim() && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-fraunces text-2xl sm:text-3xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] tracking-wide px-4 text-center">
                    {texto}
                  </span>
                </div>
              )}
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-[10px] font-bold px-2.5 py-1 rounded-full text-[#0F8B6C] shadow-sm">
                <Sparkles className="w-3 h-3" /> Vista previa
              </span>
            </div>
          </div>

          {/* CONTROLES */}
          <div className="space-y-5">
            {/* Modelo */}
            {modelos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Smartphone className="w-4 h-4 text-[#0F8B6C]" />
                  <label className="text-sm font-bold text-[#2A2420]">Modelo</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {modelos.map((m) => (
                    <button
                      key={m}
                      onClick={() => setModelo(m)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        modelo === m
                          ? 'bg-[#0F8B6C] text-white shadow-sm'
                          : 'bg-white border border-[#EBE3D6] text-[#4B4F54] hover:border-[#0F8B6C]/40'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    className="w-full h-11 px-4 rounded-xl bg-white border border-[#EBE3D6] text-center font-bold tracking-wide text-[#2A2420] placeholder:text-[#A78B6F] focus:outline-none focus:border-[#0F8B6C] focus:ring-2 focus:ring-[#0F8B6C]/15"
                  />
                  <p className="text-[11px] text-right text-[#A78B6F] mt-1 font-bold">{texto.length}/20</p>
                </div>
              )}
              {(opcion === 'peyu' || opcion === 'archivo') && (
                <p className="text-[11px] text-[#A78B6F] mt-2 leading-relaxed">
                  Coordinaremos el diseño contigo después de la compra para el mejor grabado.
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

            {/* Breakdown en vivo */}
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
                <><ShoppingBag className="w-5 h-5" /> Agregar al carro · {fmtCLP(total)}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}