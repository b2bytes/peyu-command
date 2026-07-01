import { motion } from 'framer-motion';
import { MessageCircle, FileText, Package, Clock } from 'lucide-react';

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');
const timeAgo = (iso) => {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
};

// Card de una conversación dentro del pipeline WhatsApp
export default function PipelineConvCard({ item, color, onOpen }) {
  return (
    <motion.button
      layout
      layoutId={item.conversation_id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onOpen}
      className="w-full text-left rounded-xl p-3 bg-ld-bg-elevated border border-ld-border shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-ld-fg truncate">{item.cliente_nombre}</p>
        {item.tipo !== 'Sin clasificar' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: `${color}18`, color }}>
            {item.tipo}
          </span>
        )}
      </div>
      {item.resumen && (
        <p className="text-[11px] text-ld-fg-muted mt-1 line-clamp-2 leading-snug">{item.resumen}</p>
      )}
      <div className="flex items-center gap-2.5 mt-2 text-[10px] text-ld-fg-subtle">
        <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{item.mensajes_count}</span>
        {item.numero_cotizacion && (
          <span className="inline-flex items-center gap-1 font-semibold" style={{ color }}>
            <FileText className="w-3 h-3" />{item.numero_cotizacion}
          </span>
        )}
        {item.numero_pedido && (
          <span className="inline-flex items-center gap-1 font-semibold" style={{ color }}>
            <Package className="w-3 h-3" />{item.numero_pedido}
          </span>
        )}
        {item.monto_clp > 0 && <span className="font-bold text-ld-fg">{fmtCLP(item.monto_clp)}</span>}
        <span className="ml-auto inline-flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(item.ultimo_mensaje_at)}</span>
      </div>
    </motion.button>
  );
}