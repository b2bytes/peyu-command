import { motion } from 'framer-motion';
import { MessageCircle, FileText, Package, Clock, AlertCircle, Zap } from 'lucide-react';

const fmtCLP = (n) => '$' + (n || 0).toLocaleString('es-CL');
const timeAgo = (iso) => {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

// ════════════════════════════════════════════════════════════════════════
// PipelineConvCard — Card de conversación dentro del pipeline WhatsApp.
// Destaca conversaciones escaladas (necesitan humano) con borde rojo y
// badge de urgencia. Muestra etapa, tipo, monto y tiempo en un vistazo.
// ════════════════════════════════════════════════════════════════════════
export default function PipelineConvCard({ item, color, onOpen }) {
  const isEscalated = item.etapa === 'escalado';

  return (
    <motion.button
      layout
      layoutId={item.conversation_id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onOpen}
      className="w-full text-left rounded-xl p-3 bg-ld-bg-elevated border transition-shadow hover:shadow-md"
      style={{
        borderLeft: `3px solid ${color}`,
        border: `1px solid ${isEscalated ? 'rgba(239,68,68,.3)' : 'var(--ld-border)'}`,
        borderLeftWidth: '3px',
        borderLeftColor: isEscalated ? '#EF4444' : color,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-ld-fg truncate flex items-center gap-1.5">
          {isEscalated && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
          {item.cliente_nombre || 'Cliente'}
        </p>
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
      <div className="flex items-center gap-2.5 mt-2 text-[10px] text-ld-fg-subtle flex-wrap">
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
      {isEscalated && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-2 py-1">
          <Zap className="w-3 h-3" />
          Requiere atención humana
        </div>
      )}
    </motion.button>
  );
}