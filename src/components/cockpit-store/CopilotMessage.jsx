import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';
import { getProductImage } from '@/utils/productImages';

// ════════════════════════════════════════════════════════════════════════
// CopilotMessage — Mensaje del copiloto IA. Puede incluir productos PEYU
// recomendados (mini-cards inline que se agregan al carrito).
// ════════════════════════════════════════════════════════════════════════
export default function CopilotMessage({ role, text, productos = [], addedIds = [], onAdd }) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''} max-w-full`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] mt-0.5"
            style={{ background: 'linear-gradient(135deg,#0F8B6C,#22D3EE)' }}>🐢</div>
        )}
        <div
          className="px-3.5 py-2.5 text-[13.5px] leading-relaxed"
          style={
            isUser
              ? { background: '#0F8B6C', color: '#fff', borderRadius: '16px 16px 4px 16px' }
              : { background: 'rgba(255,255,255,.05)', color: '#E2E8F0', border: '1px solid rgba(255,255,255,.08)', borderRadius: '16px 16px 16px 4px' }
          }
        >
          {text}
        </div>
      </div>

      {/* Productos recomendados inline */}
      {productos.length > 0 && (
        <div className="w-full pl-[38px] space-y-2 mt-0.5">
          {productos.map((p) => {
            const added = addedIds.includes(p.id);
            return (
              <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <img src={getProductImage(p)} alt={p.nombre} referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0" style={{ background: '#0B1220' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-white leading-tight truncate">{p.nombre}</p>
                  <p className="text-[13px] font-bold" style={{ color: '#0F8B6C' }}>{fmtCLP(p.precio_b2c || 9990)}</p>
                </div>
                <button
                  onClick={() => onAdd(p)}
                  disabled={added}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition active:scale-90"
                  style={added
                    ? { background: 'rgba(15,139,108,.2)', color: '#5EEAD4' }
                    : { background: '#0F8B6C', color: '#fff' }}
                >
                  {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}