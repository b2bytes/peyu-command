import { motion } from 'framer-motion';
import { Plus, Check, Sparkles } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';
import { getProductImage } from '@/utils/productImages';

// ════════════════════════════════════════════════════════════════════════
// CockpitProductCard — Tarjeta de producto en la tienda dark del Agent Cockpit.
// Glass oscuro, glow esmeralda/cyan al hover, foto real PEYU.
// ════════════════════════════════════════════════════════════════════════
export default function CockpitProductCard({ producto, index, added, onAdd, onAskAgent }) {
  const img = getProductImage(producto);
  const precio = producto.precio_b2c || 9990;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}
    >
      {/* glow al hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, rgba(15,139,108,.18), transparent 60%)' }} />

      <div className="relative aspect-square overflow-hidden" style={{ background: '#0B1220' }}>
        <img
          src={img}
          alt={producto.nombre}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={() => onAskAgent?.(producto)}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          style={{ background: 'rgba(2,6,23,.7)', border: '1px solid rgba(34,211,238,.4)', backdropFilter: 'blur(8px)' }}
          title="Preguntar al copiloto"
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#22D3EE' }} />
        </button>
      </div>

      <div className="relative p-3.5 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#22D3EE' }}>
          {producto.categoria?.replace(' B2C', '')}
        </p>
        <h3 className="text-[14px] font-bold leading-tight mb-1.5 line-clamp-2 text-white"
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          {producto.nombre}
        </h3>
        <p className="text-[16px] font-bold mb-3" style={{ color: '#0F8B6C' }}>{fmtCLP(precio)}</p>

        <button
          onClick={() => onAdd(producto)}
          disabled={added}
          className="mt-auto w-full h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
          style={
            added
              ? { background: 'rgba(15,139,108,.18)', color: '#5EEAD4', border: '1px solid rgba(15,139,108,.4)' }
              : { background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', color: '#fff', boxShadow: '0 4px 16px rgba(15,139,108,.4)' }
          }
        >
          {added ? <><Check className="w-4 h-4" /> Agregado</> : <><Plus className="w-4 h-4" /> Agregar</>}
        </button>
      </div>
    </motion.div>
  );
}