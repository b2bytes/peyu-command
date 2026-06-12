import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Recycle, Sparkles, TrendingDown, Package, Ruler, Weight, Palette, Eye, EyeOff, Trash2 } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { getUnitBasePrice, getB2BPriceForQty } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';
import LogoMockupPreview from '@/components/cotizacion/LogoMockupPreview';

const TRAMOS_VISTA = [
  { min: 1,    label: 'Unitario' },
  { min: 10,   label: '10–49 u' },
  { min: 50,   label: '50–99 u' },
  { min: 100,  label: '100–249 u' },
  { min: 250,  label: '250–499 u' },
  { min: 500,  label: '500–999 u' },
  { min: 1000, label: '1.000–1.999 u' },
  { min: 2000, label: '2.000+ u' },
];

const SWATCH_MAP = {
  'azul':'#3B7DD8','negro':'#1A1A1A','rojo':'#D63B3B','verde':'#2E8B57',
  'blanco':'#E8E8E8','amarillo':'#F5C518','naranja':'#E07020','gris':'#9CA3AF',
  'turquesa':'#0E9C9C','rosa':'#E05A8A','celeste':'#5AACE0','café':'#7B4F2E',
  'beige':'#D4C4A0','morado':'#7B3FA0',
};
function swatchColor(name) {
  if (!name) return '#D4C4B0';
  const k = name.toLowerCase();
  for (const [key, val] of Object.entries(SWATCH_MAP)) { if (k.includes(key)) return val; }
  return '#D4C4B0';
}
function getColores(p) {
  if (Array.isArray(p.colores_v2) && p.colores_v2.length) return p.colores_v2;
  if (Array.isArray(p.colores) && p.colores.length) return p.colores;
  return [];
}

const TRAMOS_RAPIDOS = [10, 50, 100, 250, 500, 1000];

export default function QuoteProductModal({ producto, onClose, onAdd, yaAgregado, logoUrl, onRemoveLogo }) {
  const [added, setAdded] = useState(false);
  const [qtyPreview, setQtyPreview] = useState(50);
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    if (producto) {
      document.body.style.overflow = 'hidden';
      setAdded(false);
      setQtyPreview(50);
      setShowLogo(true);
      return () => { document.body.style.overflow = ''; };
    }
  }, [producto]);

  if (!producto) return null;

  const base = getUnitBasePrice(producto);
  const colores = getColores(producto);
  const dim = producto.dim_detalle_v2 || producto.dimensiones;
  const pesoPack = producto.peso_pack_gr;
  const pesoUnit = producto.peso_kg ? Math.round(producto.peso_kg * 1000) : null;
  const tapitas = producto.tapitas_aprox;
  const moq = producto.personalizacion_gratis_desde || producto.moq_personalizacion || 10;
  const esCompostable = producto.material?.includes('Trigo');

  const incluye = Array.isArray(producto.incluye_items_v2) && producto.incluye_items_v2.length
    ? producto.incluye_items_v2
    : (producto.incluye ? [producto.incluye] : []);

  const tramos = TRAMOS_VISTA
    .map((t) => ({ ...t, b2b: getB2BPriceForQty(producto, t.min) }))
    .filter((t) => t.b2b?.precio);
  const ahorroMax = tramos.reduce((m, t) => Math.max(m, t.b2b.ahorroPct || 0), 0);

  const b2bPreview = getB2BPriceForQty(producto, qtyPreview);
  const precioPreview = b2bPreview?.precio ?? base;
  const precioBase = b2bPreview?.baseUnit ?? base;
  const ahorroPreview = b2bPreview?.ahorroPct ?? 0;
  const ahorroUnitario = precioBase - precioPreview;
  const netoPreview = precioPreview * qtyPreview;
  const ivaPreview = Math.round(netoPreview * 0.19);
  const totalConIVA = netoPreview + ivaPreview;
  const ahorroTotal = ahorroUnitario * qtyPreview;
  const logoGratis = qtyPreview >= moq;

  const handleAdd = () => { onAdd(producto); setAdded(true); setTimeout(onClose, 700); };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-[#2A2420]/55 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-[#FAF7F2] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* ── MOCKUP INTELIGENTE DE LOGO ── */}
          <div className="relative flex-shrink-0 p-4 pb-0">
            <div className="relative rounded-2xl overflow-hidden" style={{ height: '200px' }}>
              <LogoMockupPreview
                logoUrl={showLogo ? logoUrl : null}
                productImg={getProductImage(producto)}
                size="lg"
              />
              <button onClick={onClose}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur flex items-center justify-center text-[#2A2420] shadow-md hover:bg-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[10px] font-bold px-2.5 py-1 rounded-full text-[#0F8B6C] shadow-sm">
                <Recycle className="w-3 h-3" /> {esCompostable ? 'Compostable' : '100% Reciclado'}
              </span>
              {ahorroMax > 0 && (
                <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 bg-[#D96B4D] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  <TrendingDown className="w-3 h-3" /> hasta −{ahorroMax}%
                </span>
              )}
              {logoUrl && showLogo && (
                <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[10px] font-bold px-2.5 py-1 rounded-full text-[#4B4F54] shadow-sm">
                  <Sparkles className="w-3 h-3 text-[#D96B4D]" /> Simulación con tu logo
                </span>
              )}
            </div>

            {/* Control explícito del logo: el cliente ve QUÉ logo se está usando,
                puede ocultarlo para ver el producto limpio, o quitarlo del todo
                (también lo elimina de la cotización guardada). */}
            {logoUrl && (
              <div className="mt-2 flex items-center gap-2.5 bg-white border border-[#EBE3D6] rounded-xl px-3 py-2">
                <img src={logoUrl} alt="Tu logo" className="w-8 h-8 object-contain rounded-lg bg-[#FAF7F2] border border-[#EBE3D6] flex-shrink-0" />
                <p className="flex-1 min-w-0 text-[11px] leading-tight text-[#4B4F54]">
                  <span className="font-bold text-[#2A2420]">Tu logo guardado.</span> Vista previa referencial del grabado láser.
                </p>
                <button onClick={() => setShowLogo((v) => !v)}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-[#0F8B6C] bg-[#0F8B6C]/8 hover:bg-[#0F8B6C]/15 px-2 py-1.5 rounded-lg transition-colors">
                  {showLogo ? <><EyeOff className="w-3 h-3" /> Sin logo</> : <><Eye className="w-3 h-3" /> Con logo</>}
                </button>
                {onRemoveLogo && (
                  <button onClick={onRemoveLogo} title="Quitar este logo de la cotización"
                    className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-[#D96B4D] bg-[#D96B4D]/8 hover:bg-[#D96B4D]/15 px-2 py-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-3 h-3" /> Quitar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── CUERPO SCROLLEABLE ── */}
          <div className="flex-1 overflow-y-auto peyu-scrollbar">
            <div className="p-5 space-y-4">

              {/* Encabezado */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A78B6F] mb-1">
                  {producto.categoria?.replace(' B2C', '')}
                </p>
                <h2 className="font-fraunces text-2xl leading-tight text-[#2A2420] mb-1">{producto.nombre}</h2>
                <p className="text-xs font-bold text-[#0F8B6C]">desde {fmtCLP(base)}/u (neto sin IVA)</p>
                {producto.descripcion && (
                  <p className="text-sm text-[#4B4F54] leading-relaxed mt-1">{producto.descripcion}</p>
                )}
              </div>

              {/* ── CALCULADORA INTERACTIVA CON DESGLOSE COMPLETO ── */}
              <div className="bg-white border border-[#EBE3D6] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-[#F8F4EE] border-b border-[#EBE3D6] flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-[#0F8B6C]" />
                  <span className="text-xs font-bold text-[#2A2420]">Calcula tu precio por volumen</span>
                </div>
                <div className="p-4 space-y-3">
                  {/* Chips rápidos */}
                  <div className="flex gap-1.5 flex-wrap">
                    {TRAMOS_RAPIDOS.map((n) => {
                      const tier = getB2BPriceForQty(producto, n);
                      const isActive = qtyPreview === n;
                      return (
                        <button key={n} onClick={() => setQtyPreview(n)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            isActive ? 'bg-[#0F8B6C] text-white' : 'bg-[#FAF7F2] border border-[#EBE3D6] text-[#4B4F54] hover:border-[#0F8B6C]/40'
                          }`}>
                          {n >= 1000 ? `${n / 1000}k` : n}u
                          {tier?.ahorroPct > 0 && !isActive && (
                            <span className="ml-0.5 text-[10px] text-[#D96B4D]">−{tier.ahorroPct}%</span>
                          )}
                        </button>
                      );
                    })}
                    <input type="number" min={1} value={qtyPreview}
                      onChange={(e) => setQtyPreview(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-14 h-7 text-center text-[11px] font-bold text-[#2A2420] bg-[#FAF7F2] border border-[#EBE3D6] rounded-lg focus:outline-none focus:border-[#0F8B6C] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="otro" />
                  </div>

                  {/* Desglose completo neto + IVA */}
                  <div className="space-y-1.5 text-sm border-t border-[#EBE3D6] pt-3">
                    {/* Precio unitario con precio tachado */}
                    <div className="flex justify-between items-center">
                      <span className="text-[#A78B6F]">Precio/u neto</span>
                      <div className="flex items-center gap-2">
                        {ahorroPreview > 0 && (
                          <span className="text-[11px] text-[#A78B6F] line-through">{fmtCLP(precioBase)}</span>
                        )}
                        <span className="font-bold text-[#0F8B6C]">{fmtCLP(precioPreview)}</span>
                        {ahorroPreview > 0 && (
                          <span className="text-[10px] font-bold bg-[#D96B4D] text-white px-1.5 py-0.5 rounded-full">−{ahorroPreview}%</span>
                        )}
                      </div>
                    </div>

                    {/* Ahorro unitario */}
                    {ahorroUnitario > 0 && (
                      <div className="flex justify-between items-center text-[#D96B4D]">
                        <span className="text-[12px]">Ahorras por unidad</span>
                        <span className="text-[12px] font-bold">{fmtCLP(ahorroUnitario)}/u</span>
                      </div>
                    )}

                    <div className="border-t border-[#EBE3D6] pt-1.5 space-y-1">
                      <div className="flex justify-between text-[#4B4F54]">
                        <span>Subtotal neto ({qtyPreview}u)</span>
                        <span className="font-semibold">{fmtCLP(netoPreview)}</span>
                      </div>
                      {ahorroTotal > 0 && (
                        <div className="flex justify-between text-[#D96B4D]">
                          <span className="text-[12px]">Descuento por volumen</span>
                          <span className="text-[12px] font-bold">−{fmtCLP(ahorroTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#A78B6F]">
                        <span>IVA (19%)</span>
                        <span>+{fmtCLP(ivaPreview)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#2A2420] pt-1 border-t border-[#EBE3D6]">
                        <span>Total c/IVA</span>
                        <span className="font-fraunces text-xl text-[#0F8B6C]">{fmtCLP(totalConIVA)}</span>
                      </div>
                    </div>

                    {/* Badge logo gratis */}
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold ${
                      logoGratis ? 'bg-[#0F8B6C]/8 text-[#0F8B6C]' : 'bg-[#FAF7F2] text-[#A78B6F]'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      {logoGratis
                        ? `✓ Logo láser incluido gratis (≥${moq}u)`
                        : `Logo láser gratis desde ${moq}u (faltan ${moq - qtyPreview}u)`}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── TABLA DE 8 TRAMOS COMPLETA ── */}
              {tramos.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#2A2420] mb-2 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-[#0F8B6C]" /> Todos los tramos de precio
                  </p>
                  <div className="bg-white border border-[#EBE3D6] rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-4 px-3 py-2 bg-[#F8F4EE] border-b border-[#EBE3D6]">
                      <span className="col-span-2 text-[10px] font-bold text-[#A78B6F] uppercase tracking-wide">Tramo</span>
                      <span className="text-[10px] font-bold text-[#A78B6F] uppercase tracking-wide text-center">Neto/u</span>
                      <span className="text-[10px] font-bold text-[#A78B6F] uppercase tracking-wide text-right">-Desc.</span>
                    </div>
                    {tramos.map((t, i) => {
                      const isHighlighted = qtyPreview >= t.min && (i === tramos.length - 1 || qtyPreview < tramos[i + 1]?.min);
                      const precioConIVA = Math.round(t.b2b.precio * 1.19);
                      return (
                        <button key={t.min} onClick={() => setQtyPreview(t.min)}
                          className={`w-full grid grid-cols-4 items-center px-3 py-2.5 border-b border-[#EBE3D6] last:border-0 transition-colors text-left ${
                            isHighlighted ? 'bg-[#0F8B6C]/8' : i % 2 === 0 ? 'bg-white hover:bg-[#FAF7F2]' : 'bg-[#FAF7F2] hover:bg-white'
                          }`}>
                          <span className={`col-span-2 text-xs font-semibold flex items-center gap-1.5 ${isHighlighted ? 'text-[#0F8B6C]' : 'text-[#4B4F54]'}`}>
                            {isHighlighted && <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B6C] flex-shrink-0" />}
                            {t.label}
                          </span>
                          <div className="text-center">
                            <p className={`text-xs font-bold ${isHighlighted ? 'text-[#0F8B6C]' : 'text-[#2A2420]'}`}>{fmtCLP(t.b2b.precio)}</p>
                            <p className="text-[9px] text-[#A78B6F]">c/IVA {fmtCLP(precioConIVA)}</p>
                          </div>
                          <div className="text-right">
                            {t.b2b.ahorroPct > 0 ? (
                              <span className="text-[10px] font-bold text-white bg-[#D96B4D] px-1.5 py-0.5 rounded-full">−{t.b2b.ahorroPct}%</span>
                            ) : (
                              <span className="text-[10px] text-[#A78B6F]">—</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-[#A78B6F] mt-1 px-1">Haz clic en un tramo para calcular. Precios netos + IVA 19%.</p>
                </div>
              )}

              {/* ── ESPECIFICACIONES TÉCNICAS ── */}
              {(dim || pesoPack || pesoUnit || tapitas || colores.length > 0) && (
                <div className="bg-white border border-[#EBE3D6] rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-[#2A2420]">Especificaciones técnicas</p>
                  <div className="grid grid-cols-2 gap-3">
                    {dim && (
                      <div className="flex items-start gap-2">
                        <Ruler className="w-3.5 h-3.5 text-[#0F8B6C] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#A78B6F]">Dimensiones</p>
                          <p className="text-xs font-semibold text-[#2A2420]">{dim}</p>
                        </div>
                      </div>
                    )}
                    {(pesoUnit || pesoPack) && (
                      <div className="flex items-start gap-2">
                        <Weight className="w-3.5 h-3.5 text-[#0F8B6C] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#A78B6F]">Peso</p>
                          {pesoUnit && <p className="text-xs font-semibold text-[#2A2420]">{pesoUnit}gr/u</p>}
                          {pesoPack && <p className="text-xs text-[#7A6050]">Pack: {pesoPack}gr</p>}
                        </div>
                      </div>
                    )}
                    {tapitas && (
                      <div className="flex items-start gap-2 col-span-2">
                        <Recycle className="w-3.5 h-3.5 text-[#0F8B6C] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-[#A78B6F]">Impacto ESG</p>
                          <p className="text-xs font-semibold text-[#2A2420]">~{tapitas} tapas plásticas recicladas/u</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {colores.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#A78B6F] mb-1.5 flex items-center gap-1">
                        <Palette className="w-3 h-3" /> Colores disponibles
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {colores.map((c) => (
                          <div key={c} className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full ring-1 ring-black/10 flex-shrink-0" style={{ background: swatchColor(c) }} />
                            <span className="text-xs text-[#4B4F54]">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Qué incluye */}
              {incluye.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#2A2420] mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#0F8B6C]" /> Qué incluye
                  </p>
                  <ul className="space-y-1.5">
                    {incluye.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#4B4F54]">
                        <Check className="w-3.5 h-3.5 text-[#0F8B6C] mt-0.5 flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Personalización */}
              <div className="flex items-center gap-2 text-xs text-[#4B4F54] bg-[#0F8B6C]/6 rounded-xl px-3 py-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D96B4D] flex-shrink-0" />
                Grabado láser UV de tu logo <strong className="text-[#2A2420]">gratis desde {moq}u</strong> — no se borra, resistente a UV y agua.
              </div>
            </div>
          </div>

          {/* ── CTA FIJA ── */}
          <div className="p-4 border-t border-[#EBE3D6] bg-[#FAF7F2]">
            {yaAgregado ? (
              <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-[#0F8B6C] text-[#0F8B6C] font-bold flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> Ya está en tu cotización
              </button>
            ) : (
              <button onClick={handleAdd} disabled={added}
                className="w-full h-12 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all active:scale-[0.99]">
                {added
                  ? <><Check className="w-5 h-5" /> ¡Agregado!</>
                  : <><Plus className="w-5 h-5" /> Agregar · {fmtCLP(netoPreview)} neto · {fmtCLP(totalConIVA)} c/IVA</>
                }
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}