import { motion } from 'framer-motion';
import { Plus, Check, Leaf } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';
import { getProductImage } from '@/utils/productImages';

// ════════════════════════════════════════════════════════════════════════
// CanvasProductCard — Tarjeta de producto PEYU en el canvas derecho.
// Estética Stripe/Notion: tarjeta limpia, foto real, precio, botón "Agregar".
// El canvas se sincroniza con el chat: cada producto aparece con stagger.
// ════════════════════════════════════════════════════════════════════════
export default function CanvasProductCard({ producto, index, added, onAdd }) {
  const img = getProductImage(producto);
  const precio = producto.precio_b2c || 9990;
  const compostable = producto.material?.includes('Trigo') || producto.categoria === 'Carcasas B2C';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#fff', border: '1px solid rgba(15,40,30,.08)', boxShadow: '0 4px 20px -8px rgba(15,40,30,.12)' }}
    >
      <div className="relative aspect-square overflow-hidden" style={{ background: '#F4F2EC' }}>
        <img
          src={img}
          alt={producto.nombre}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{ background: 'rgba(255,255,255,.92)', color: '#0F8B6C' }}>
          <Leaf className="w-3 h-3" />
          {compostable ? 'Compostable' : '100% reciclado'}
        </span>
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#A0978A' }}>
          {producto.categoria?.replace(' B2C', '')}
        </p>
        <h3 className="text-[14px] font-bold leading-tight mb-1.5 line-clamp-2" style={{ color: '#1C2421', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          {producto.nombre}
        </h3>
        <p className="text-[16px] font-bold mb-3" style={{ color: '#0F8B6C' }}>{fmtCLP(precio)}</p>

        <button
          onClick={() => onAdd(producto)}
          disabled={added}
          className="mt-auto w-full h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-100"
          style={
            added
              ? { background: 'rgba(15,139,108,.12)', color: '#0F8B6C' }
              : { background: '#D96B4D', color: '#fff', boxShadow: '0 4px 14px rgba(217,107,77,.32)' }
          }
        >
          {added ? <><Check className="w-4 h-4" /> Agregado</> : <><Plus className="w-4 h-4" /> Agregar</>}
        </button>
      </div>
    </motion.div>
  );
}