import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Recycle, Sparkles, TrendingDown, Package } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { getUnitBasePrice, getB2BPriceForQty } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Tramos de volumen mostrados en la tabla de precios B2B del modal.
const TRAMOS_VISTA = [
  { min: 10, label: '10–49 u' },
  { min: 50, label: '50–99 u' },
  { min: 100, label: '100–249 u' },
  { min: 250, label: '250–499 u' },
  { min: 500, label: '500–999 u' },
  { min: 1000, label: '1000+ u' },
];

// ════════════════════════════════════════════════════════════════════════
// QuoteProductModal — Ficha emergente de producto para la cotización B2B.
// Muestra imagen, descripción, qué incluye y la tabla de precios por volumen
// en vivo. Permite agregar a la cotización directo desde aquí.
// ════════════════════════════════════════════════════════════════════════
export default function QuoteProductModal({ producto, onClose, onAdd, yaAgregado }) {
  const [added, setAdded] = useState(false);

  // Bloquea el scroll del body mientras el modal está abierto.
  useEffect(() => {
    if (producto) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [producto]);

  if (!producto) return null;

  const base = getUnitBasePrice(producto);
  const incluye = Array.isArray(producto.incluye_items_v2) && producto.incluye_items_v2.length
    ? producto.incluye_items_v2
    : (producto.incluye ? [producto.incluye] : []);
  const esCompostable = producto.material?.includes('Trigo') || producto.categoria === 'Carcasas B2C';

  // Tramos con precio real (filtra los que no existan en este producto).
  const tramos = TRAMOS_VISTA
    .map((t) => ({ ...t, b2b: getB2BPriceForQty(producto, t.min) }))
    .filter((t) => t.b2b?.precio);
  const ahorroMax = tramos.reduce((m, t) => Math.max(m, t.b2b.ahorroPct || 0), 0);

  const handleAdd = () => {
    onAdd(producto);
    setAdded(true);
    setTimeout(onClose, 600);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-[#2A2420]/50 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-[#FAF7F2] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* Imagen + cerrar */}
          <div className="relative">
            <div className="aspect-[16/10] bg-white overflow-hidden">
              <img
                src={getProductImage(producto)}
                alt={producto.nombre}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.visibility = 'hidden'; }}
              />
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-[#2A2420] shadow-sm hover:bg-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-[10px] font-bold px-2.5 py-1 rounded-full text-[#0F8B6C] shadow-sm">
              <Recycle className="w-3 h-3" /> {esCompostable ? 'Compostable' : '100% Reciclado'}
            </span>
            {ahorroMax > 0 && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 bg-[#D96B4D] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
                <TrendingDown className="w-3 h-3" /> Hasta −{ahorroMax}% por volumen
              </span>
            )}
          </div>

          {/* Cuerpo scrolleable */}
          <div className="flex-1 overflow-y-auto peyu-scrollbar p-5 sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#A78B6F] mb-1">
              {producto.categoria?.replace(' B2C', '')}
            </p>
            <h2 className="font-fraunces text-2xl leading-tight text-[#2A2420] mb-1.5">{producto.nombre}</h2>
            <p className="font-poppins font-bold text-lg text-[#0F8B6C] mb-3">desde {fmtCLP(base)}/u</p>

            {producto.descripcion && (
              <p className="text-sm text-[#4B4F54] leading-relaxed mb-4">{producto.descripcion}</p>
            )}

            {/* Qué incluye */}
            {incluye.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-[#2A2420] mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#0F8B6C]" /> Qué incluye
                </p>
                <ul className="space-y-1">
                  {incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#4B4F54]">
                      <Check className="w-3.5 h-3.5 text-[#0F8B6C] mt-0.5 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tabla de precios por volumen */}
            {tramos.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-[#2A2420] mb-2 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-[#0F8B6C]" /> Precio por volumen
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {tramos.map((t) => (
                    <div key={t.min} className="flex items-center justify-between bg-white border border-[#EBE3D6] rounded-xl px-3 py-2">
                      <span className="text-[11px] text-[#A78B6F] font-semibold">{t.label}</span>
                      <span className="text-sm font-bold text-[#2A2420]">
                        {fmtCLP(t.b2b.precio)}
                        {t.b2b.ahorroPct > 0 && (
                          <span className="text-[10px] text-[#D96B4D] ml-1">−{t.b2b.ahorroPct}%</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#A78B6F] mt-1.5">Precios netos referenciales (sin IVA).</p>
              </div>
            )}

            {/* Personalización láser */}
            <div className="flex items-center gap-2 text-xs text-[#4B4F54] bg-[#0F8B6C]/5 rounded-xl px-3 py-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D96B4D] flex-shrink-0" />
              Grabado láser de tu logo <strong className="text-[#2A2420]">gratis desde {producto.personalizacion_gratis_desde || 10}u</strong>
            </div>
          </div>

          {/* CTA fija */}
          <div className="p-4 border-t border-[#EBE3D6] bg-[#FAF7F2]">
            {yaAgregado ? (
              <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-[#0F8B6C] text-[#0F8B6C] font-bold flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> Ya está en tu cotización
              </button>
            ) : (
              <button
                onClick={handleAdd}
                disabled={added}
                className="w-full h-12 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0F8B6C]/20 transition-all active:scale-[0.99]"
              >
                {added ? <><Check className="w-5 h-5" /> ¡Agregado!</> : <><Plus className="w-5 h-5" /> Agregar a la cotización</>}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}